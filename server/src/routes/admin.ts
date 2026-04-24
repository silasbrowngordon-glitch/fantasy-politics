import { Router, Response } from 'express';
import { requireAdmin, AuthRequest } from '../middleware/auth';
import { type DraftPick, type StartingLineup } from '@prisma/client';
import prisma from '../lib/prisma';
import multer from 'multer';
import { parse } from 'csv-parse/sync';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All admin routes require admin role
router.use(requireAdmin);

// ─── POLITICIANS ──────────────────────────────────────────────────────────────

router.get('/politicians', async (_req: AuthRequest, res: Response) => {
  const politicians = await prisma.politician.findMany({ orderBy: { name: 'asc' } });
  return res.json({ politicians });
});

router.post('/politicians', async (req: AuthRequest, res: Response) => {
  const { name, title, party, state, imageUrl, bio } = req.body;

  if (!name || !title || !party || !state) {
    return res.status(400).json({ error: 'Name, title, party, and state are required' });
  }

  const politician = await prisma.politician.create({
    data: { name, title, party, state, imageUrl, bio },
  });

  return res.status(201).json({ politician });
});

router.put('/politicians/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, title, party, state, imageUrl, bio, isActive } = req.body;

  const politician = await prisma.politician.update({
    where: { id },
    data: { name, title, party, state, imageUrl, bio, isActive },
  });

  return res.json({ politician });
});

router.post('/politicians/bulk-import', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'CSV file required' });

  const records = parse(req.file.buffer.toString(), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<{ name: string; title: string; party: string; state: string }>;

  const created = await prisma.$transaction(
    records.map((r) =>
      prisma.politician.create({
        data: {
          name: r.name,
          title: r.title,
          party: r.party as 'DEM' | 'REP' | 'IND' | 'OTHER',
          state: r.state,
        },
      })
    )
  );

  return res.status(201).json({ created: created.length });
});

// ─── SCORES ───────────────────────────────────────────────────────────────────

router.get('/scores/history', async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, leagueId } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  const start = new Date((startDate as string) + 'T00:00:00.000Z');
  const end = new Date((endDate as string) + 'T00:00:00.000Z');
  const resolvedLeagueId = (leagueId as string) || null;

  const scores = await prisma.dailyScore.findMany({
    where: {
      date: { gte: start, lte: end },
      leagueId: resolvedLeagueId,
    },
    include: {
      politician: { select: { id: true, name: true } },
    },
    orderBy: [{ politicianId: 'asc' }, { date: 'asc' }],
  });

  return res.json({ scores });
});

router.get('/scores', async (req: AuthRequest, res: Response) => {
  const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const date = new Date(dateStr + 'T00:00:00.000Z');
  const leagueId = (req.query.leagueId as string) || null;

  const politicians = await prisma.politician.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  const scores = await prisma.dailyScore.findMany({
    where: { date, leagueId },
  });

  const scoreMap = new Map(scores.map((s) => [s.politicianId, s]));

  const rows = politicians.map((p) => ({
    ...p,
    score: scoreMap.get(p.id) ?? null,
  }));

  return res.json({ politicians: rows, date: dateStr });
});

router.post('/scores', async (req: AuthRequest, res: Response) => {
  const { date, scores, leagueId } = req.body as {
    date: string;
    scores: Array<{ politicianId: string; points: number; note?: string }>;
    leagueId?: string;
  };

  if (!date || !Array.isArray(scores)) {
    return res.status(400).json({ error: 'Date and scores array required' });
  }

  const parsedDate = new Date(date + 'T00:00:00.000Z');
  const resolvedLeagueId = leagueId || null;

  // Use interactive transaction for findFirst + create/update pattern
  // (needed because leagueId is nullable — upsert requires a known unique constraint name)
  await prisma.$transaction(async (tx) => {
    for (const s of scores) {
      const existing = await tx.dailyScore.findFirst({
        where: {
          politicianId: s.politicianId,
          date: parsedDate,
          leagueId: resolvedLeagueId,
        },
      });

      if (existing) {
        await tx.dailyScore.update({
          where: { id: existing.id },
          data: { points: s.points, note: s.note },
        });
      } else {
        await tx.dailyScore.create({
          data: {
            politicianId: s.politicianId,
            date: parsedDate,
            points: s.points,
            note: s.note,
            leagueId: resolvedLeagueId,
          },
        });
      }
    }
  });

  // Recalculate LeagueMemberDailyTotals for this date
  await recalculateDailyTotals(parsedDate, resolvedLeagueId ?? undefined);

  return res.json({ message: 'Scores saved', count: scores.length, updatedAt: new Date() });
});

async function recalculateDailyTotals(date: Date, targetLeagueId?: string) {
  const leagues = await prisma.league.findMany({
    where: {
      draftStatus: 'COMPLETE',
      ...(targetLeagueId ? { id: targetLeagueId } : {}),
    },
    include: {
      members: {
        include: {
          draftPicks: true,
          startingLineup: { where: { isStarter: true } },
        },
      },
    },
  });

  for (const league of leagues) {
    // Include global scores (leagueId IS NULL) and league-specific scores
    const scores = await prisma.dailyScore.findMany({
      where: {
        date,
        OR: [{ leagueId: null }, { leagueId: league.id }],
      },
    });

    // Sum scores per politician (global + league-specific stack)
    const scoreMap = new Map<string, number>();
    for (const s of scores) {
      scoreMap.set(s.politicianId, (scoreMap.get(s.politicianId) ?? 0) + s.points);
    }

    const upserts = [];
    for (const member of league.members) {
      const starterIds = new Set(member.startingLineup.map((sl: StartingLineup) => sl.politicianId));
      const rosterIds = member.draftPicks.map((dp: DraftPick) => dp.politicianId);
      const activeStarters = rosterIds.filter((id: string) => starterIds.has(id));
      const total = activeStarters.reduce((sum: number, pid: string) => sum + (scoreMap.get(pid) ?? 0), 0);

      upserts.push(
        prisma.leagueMemberDailyTotal.upsert({
          where: { leagueMemberId_date: { leagueMemberId: member.id, date } },
          create: { leagueMemberId: member.id, date, totalPoints: total },
          update: { totalPoints: total },
        })
      );
    }

    await prisma.$transaction(upserts);
  }
}

// ─── LEAGUES ──────────────────────────────────────────────────────────────────

router.get('/leagues', async (_req: AuthRequest, res: Response) => {
  const leagues = await prisma.league.findMany({
    include: {
      members: {
        include: { user: { select: { username: true } } },
      },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ leagues });
});

router.put('/leagues/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { draftStatus, isActive } = req.body;

  const league = await prisma.league.update({
    where: { id },
    data: { draftStatus, isActive },
  });

  return res.json({ league });
});

router.post('/leagues/:id/reset', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await prisma.$transaction([
    prisma.leagueMemberDailyTotal.deleteMany({
      where: { leagueMember: { leagueId: id } },
    }),
    prisma.startingLineup.deleteMany({
      where: { leagueMember: { leagueId: id } },
    }),
    prisma.draftPick.deleteMany({ where: { leagueId: id } }),
    prisma.leagueMember.updateMany({
      where: { leagueId: id },
      data: { draftOrder: null },
    }),
    prisma.league.update({
      where: { id },
      data: { draftStatus: 'PREDRAFT' },
    }),
  ]);

  return res.json({ message: 'League reset to PREDRAFT' });
});

// ─── USERS ────────────────────────────────────────────────────────────────────

router.get('/users', async (_req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, username: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ users });
});

router.put('/users/:id/role', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['PLAYER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, email: true, username: true, role: true },
  });

  return res.json({ user });
});

router.put('/users/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: { id: true, email: true, username: true, role: true, isActive: true },
  });

  return res.json({ user });
});

export default router;
