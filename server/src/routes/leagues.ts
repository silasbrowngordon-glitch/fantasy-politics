import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { Prisma, type DraftPick, type LeagueMember, type LeagueMemberDailyTotal, type StartingLineup, type DailyScore, type Politician } from '@prisma/client';
import prisma from '../lib/prisma';
import { randomBytes } from 'crypto';

const router = Router();

function generateInviteCode(): string {
  return randomBytes(3).toString('hex').toUpperCase();
}

// GET /api/leagues — user's leagues
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const memberships = await prisma.leagueMember.findMany({
    where: { userId: req.user!.id },
    include: {
      league: {
        include: {
          members: { include: { user: { select: { username: true } } } },
        },
      },
    },
  });
  return res.json({ leagues: memberships });
});

// POST /api/leagues — create league
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, teamName, maxMembers } = req.body;

  if (!name || !teamName) {
    return res.status(400).json({ error: 'League name and team name are required' });
  }

  let inviteCode = generateInviteCode();
  // ensure uniqueness
  while (await prisma.league.findUnique({ where: { inviteCode } })) {
    inviteCode = generateInviteCode();
  }

  const league = await prisma.league.create({
    data: {
      name,
      inviteCode,
      maxMembers: maxMembers || 10,
      members: {
        create: {
          userId: req.user!.id,
          teamName,
          isCommissioner: true,
        },
      },
    },
    include: { members: true },
  });

  return res.status(201).json({ league });
});

// POST /api/leagues/join
router.post('/join', requireAuth, async (req: AuthRequest, res: Response) => {
  const { inviteCode, teamName } = req.body;

  if (!inviteCode || !teamName) {
    return res.status(400).json({ error: 'Invite code and team name are required' });
  }

  const league = await prisma.league.findUnique({
    where: { inviteCode },
    include: { members: true },
  });

  if (!league || !league.isActive) {
    return res.status(404).json({ error: 'League not found' });
  }

  if (league.members.length >= league.maxMembers) {
    return res.status(400).json({ error: 'League is full' });
  }

  const alreadyMember = league.members.find((m: LeagueMember) => m.userId === req.user!.id);
  if (alreadyMember) {
    return res.status(409).json({ error: 'You are already in this league' });
  }

  if (league.draftStatus !== 'PREDRAFT') {
    return res.status(400).json({ error: 'League draft has already started' });
  }

  const member = await prisma.leagueMember.create({
    data: {
      userId: req.user!.id,
      leagueId: league.id,
      teamName,
    },
  });

  return res.status(201).json({ member });
});

// GET /api/leagues/:id
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { username: true, id: true } },
          dailyTotals: true,
        },
      },
    },
  });

  if (!league) return res.status(404).json({ error: 'League not found' });

  // Calculate season totals
  const standings = league.members.map((member: LeagueMember & { dailyTotals: LeagueMemberDailyTotal[] }) => {
    const seasonTotal = member.dailyTotals.reduce((sum: number, dt: LeagueMemberDailyTotal) => sum + dt.totalPoints, 0);
    const today = new Date().toISOString().split('T')[0];
    const todayTotal = member.dailyTotals.find(
      (dt: LeagueMemberDailyTotal) => dt.date.toISOString().split('T')[0] === today
    )?.totalPoints ?? 0;
    return {
      ...member,
      seasonTotal,
      todayTotal,
    };
  }).sort((a: { seasonTotal: number }, b: { seasonTotal: number }) => b.seasonTotal - a.seasonTotal);

  return res.json({ league: { ...league, members: standings } });
});

// GET /api/leagues/:id/draft
router.get('/:id/draft', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { username: true } },
          draftPicks: { include: { politician: true } },
        },
        orderBy: { draftOrder: 'asc' },
      },
      draftPicks: {
        include: { politician: true, leagueMember: { include: { user: { select: { username: true } } } } },
        orderBy: { draftOrder: 'asc' },
      },
    },
  });

  if (!league) return res.status(404).json({ error: 'League not found' });

  const totalPicks = league.members.length * league.rosterSize;
  const pickedIds = league.draftPicks.map((dp: DraftPick) => dp.politicianId);
  const currentPickNumber = league.draftPicks.length + 1;

  let currentPickMemberId: string | null = null;
  if (league.draftStatus === 'DRAFTING' && currentPickNumber <= totalPicks) {
    const round = Math.ceil(currentPickNumber / league.members.length);
    const pickInRound = currentPickNumber - (round - 1) * league.members.length;
    const memberIndex = round % 2 === 0
      ? league.members.length - pickInRound
      : pickInRound - 1;
    const sortedMembers = [...league.members].sort((a, b) => (a.draftOrder ?? 0) - (b.draftOrder ?? 0));
    currentPickMemberId = sortedMembers[memberIndex]?.id ?? null;
  }

  return res.json({
    league,
    pickedIds,
    currentPickNumber,
    totalPicks,
    currentPickMemberId,
  });
});

// POST /api/leagues/:id/draft/start
router.post('/:id/draft/start', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const league = await prisma.league.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!league) return res.status(404).json({ error: 'League not found' });

  const member = league.members.find((m: LeagueMember) => m.userId === req.user!.id);
  if (!member?.isCommissioner) {
    return res.status(403).json({ error: 'Only the commissioner can start the draft' });
  }

  if (league.draftStatus !== 'PREDRAFT') {
    return res.status(400).json({ error: 'Draft already started' });
  }

  if (league.members.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 members to start the draft' });
  }

  // Randomize draft order
  const shuffled = [...league.members].sort(() => Math.random() - 0.5);

  await prisma.$transaction([
    ...shuffled.map((m, i) =>
      prisma.leagueMember.update({
        where: { id: m.id },
        data: { draftOrder: i + 1 },
      })
    ),
    prisma.league.update({
      where: { id },
      data: { draftStatus: 'DRAFTING' },
    }),
  ]);

  return res.json({ message: 'Draft started' });
});

// POST /api/leagues/:id/draft/pick
router.post('/:id/draft/pick', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { politicianId } = req.body;

  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      members: { orderBy: { draftOrder: 'asc' } },
      draftPicks: true,
    },
  });

  if (!league || league.draftStatus !== 'DRAFTING') {
    return res.status(400).json({ error: 'Draft is not active' });
  }

  const member = league.members.find((m: LeagueMember) => m.userId === req.user!.id);
  if (!member) return res.status(403).json({ error: 'Not a member of this league' });

  const totalPicks = league.members.length * league.rosterSize;
  const currentPickNumber = league.draftPicks.length + 1;

  if (currentPickNumber > totalPicks) {
    return res.status(400).json({ error: 'Draft is complete' });
  }

  const round = Math.ceil(currentPickNumber / league.members.length);
  const pickInRound = currentPickNumber - (round - 1) * league.members.length;
  const memberIndex = round % 2 === 0
    ? league.members.length - pickInRound
    : pickInRound - 1;
  const currentPicker = league.members[memberIndex];

  if (currentPicker.id !== member.id) {
    return res.status(400).json({ error: 'It is not your turn to pick' });
  }

  // Check if politician already picked
  const alreadyPicked = league.draftPicks.find((dp: DraftPick) => dp.politicianId === politicianId);
  if (alreadyPicked) {
    return res.status(409).json({ error: 'Politician already drafted in this league' });
  }

  const politician = await prisma.politician.findUnique({ where: { id: politicianId, isActive: true } });
  if (!politician) return res.status(404).json({ error: 'Politician not found' });

  const memberPicks = league.draftPicks.filter((dp: DraftPick) => dp.leagueMemberId === member.id);
  if (memberPicks.length >= league.rosterSize) {
    return res.status(400).json({ error: 'Roster is full' });
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const pick = await tx.draftPick.create({
      data: {
        leagueMemberId: member.id,
        politicianId,
        leagueId: id,
        draftOrder: currentPickNumber,
      },
    });

    // Auto-set as starter if under starterSize
    if (memberPicks.length < league.starterSize) {
      await tx.startingLineup.upsert({
        where: { leagueMemberId_politicianId: { leagueMemberId: member.id, politicianId } },
        create: { leagueMemberId: member.id, politicianId, isStarter: true },
        update: { isStarter: true },
      });
    } else {
      await tx.startingLineup.upsert({
        where: { leagueMemberId_politicianId: { leagueMemberId: member.id, politicianId } },
        create: { leagueMemberId: member.id, politicianId, isStarter: false },
        update: { isStarter: false },
      });
    }

    // Check if draft complete
    const newPickCount = currentPickNumber;
    if (newPickCount >= totalPicks) {
      await tx.league.update({ where: { id }, data: { draftStatus: 'COMPLETE' } });
    }

    return pick;
  });

  return res.json({ message: 'Pick recorded' });
});

// GET /api/leagues/:id/roster
router.get('/:id/roster', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const member = await prisma.leagueMember.findFirst({
    where: { leagueId: id, userId: req.user!.id },
    include: {
      draftPicks: {
        include: {
          politician: {
            include: {
              dailyScores: { orderBy: { date: 'desc' }, take: 30 },
            },
          },
        },
      },
      startingLineup: true,
    },
  });

  if (!member) return res.status(404).json({ error: 'Not a member of this league' });

  const roster = member.draftPicks.map((dp: DraftPick & { politician: Politician & { dailyScores: DailyScore[] } }) => {
    const isStarter = member.startingLineup.find(
      (sl: StartingLineup) => sl.politicianId === dp.politicianId
    )?.isStarter ?? false;
    const seasonTotal = dp.politician.dailyScores.reduce((sum: number, ds: DailyScore) => sum + ds.points, 0);
    return { ...dp.politician, isStarter, seasonTotal, draftOrder: dp.draftOrder };
  });

  return res.json({ member, roster });
});

// PUT /api/leagues/:id/lineup
router.put('/:id/lineup', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { starterIds } = req.body; // array of politicianIds

  const league = await prisma.league.findUnique({ where: { id } });
  if (!league) return res.status(404).json({ error: 'League not found' });

  if (!Array.isArray(starterIds) || starterIds.length > league.starterSize) {
    return res.status(400).json({ error: `Can have at most ${league.starterSize} starters` });
  }

  const member = await prisma.leagueMember.findFirst({
    where: { leagueId: id, userId: req.user!.id },
    include: { draftPicks: true },
  });

  if (!member) return res.status(404).json({ error: 'Not a member of this league' });

  const rosterIds = member.draftPicks.map((dp: DraftPick) => dp.politicianId);
  for (const sid of starterIds) {
    if (!rosterIds.includes(sid)) {
      return res.status(400).json({ error: 'Politician not on your roster' });
    }
  }

  await prisma.$transaction(
    rosterIds.map((pid: string) =>
      prisma.startingLineup.upsert({
        where: { leagueMemberId_politicianId: { leagueMemberId: member.id, politicianId: pid } },
        create: { leagueMemberId: member.id, politicianId: pid, isStarter: starterIds.includes(pid) },
        update: { isStarter: starterIds.includes(pid) },
      })
    )
  );

  return res.json({ message: 'Lineup updated' });
});

// POST /api/leagues/:id/waiver
router.post('/:id/waiver', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { dropId, pickupId } = req.body;

  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      draftPicks: true,
    },
  });
  if (!league || league.draftStatus !== 'COMPLETE') {
    return res.status(400).json({ error: 'Waivers only available after draft' });
  }

  const member = await prisma.leagueMember.findFirst({
    where: { leagueId: id, userId: req.user!.id },
    include: { draftPicks: true, startingLineup: true },
  });

  if (!member) return res.status(404).json({ error: 'Not a member of this league' });

  const dropping = member.draftPicks.find((dp: DraftPick) => dp.politicianId === dropId);
  if (!dropping) return res.status(400).json({ error: 'Politician not on your roster' });

  const alreadyOwned = league.draftPicks.find((dp: DraftPick) => dp.politicianId === pickupId);
  if (alreadyOwned) return res.status(409).json({ error: 'Politician already on a roster' });

  const politician = await prisma.politician.findUnique({ where: { id: pickupId, isActive: true } });
  if (!politician) return res.status(404).json({ error: 'Politician not found' });

  await prisma.$transaction([
    prisma.draftPick.delete({ where: { id: dropping.id } }),
    prisma.startingLineup.deleteMany({ where: { leagueMemberId: member.id, politicianId: dropId } }),
    prisma.draftPick.create({
      data: {
        leagueMemberId: member.id,
        politicianId: pickupId,
        leagueId: id,
        draftOrder: 999,
      },
    }),
  ]);

  return res.json({ message: 'Waiver processed' });
});

// GET /api/leagues/:id/roster/:memberId — view another member's roster
router.get('/:id/roster/:memberId', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id, memberId } = req.params;

  const member = await prisma.leagueMember.findFirst({
    where: { id: memberId, leagueId: id },
    include: {
      user: { select: { username: true } },
      draftPicks: {
        include: {
          politician: {
            include: { dailyScores: { orderBy: { date: 'desc' }, take: 30 } },
          },
        },
      },
      startingLineup: true,
    },
  });

  if (!member) return res.status(404).json({ error: 'Member not found' });

  const roster = member.draftPicks.map((dp: DraftPick & { politician: Politician & { dailyScores: DailyScore[] } }) => {
    const isStarter = member.startingLineup.find(
      (sl: StartingLineup) => sl.politicianId === dp.politicianId
    )?.isStarter ?? false;
    const seasonTotal = dp.politician.dailyScores.reduce((sum: number, ds: DailyScore) => sum + ds.points, 0);
    return { ...dp.politician, isStarter, seasonTotal };
  });

  return res.json({ member, roster });
});

export default router;
