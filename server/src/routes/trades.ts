import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router({ mergeParams: true });

async function getMember(userId: string, leagueId: string) {
  return prisma.leagueMember.findUnique({
    where: { userId_leagueId: { userId, leagueId } },
  });
}

async function enrichTrade(trade: any) {
  const allIds = [...trade.offeredIds, ...trade.requestedIds];
  if (allIds.length === 0) return { ...trade, offeredPoliticians: [], requestedPoliticians: [] };
  const politicians = await prisma.politician.findMany({
    where: { id: { in: allIds } },
    select: { id: true, name: true, party: true, title: true, state: true },
  });
  const polMap = Object.fromEntries(politicians.map((p) => [p.id, p]));
  return {
    ...trade,
    offeredPoliticians: trade.offeredIds.map((id: string) => polMap[id]).filter(Boolean),
    requestedPoliticians: trade.requestedIds.map((id: string) => polMap[id]).filter(Boolean),
  };
}

// GET /api/leagues/:id/trades
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id: leagueId } = req.params;
  const member = await getMember(req.user!.id, leagueId);
  if (!member) return res.status(403).json({ error: 'Not a member of this league' });

  const trades = await prisma.trade.findMany({
    where: { leagueId },
    include: {
      proposer: { include: { user: { select: { id: true, username: true } } } },
      recipient: { include: { user: { select: { id: true, username: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const enriched = await Promise.all(trades.map(enrichTrade));
  return res.json({ trades: enriched, myMemberId: member.id });
});

// POST /api/leagues/:id/trades — propose a trade
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id: leagueId } = req.params;
  const { recipientMemberId, offeredIds, requestedIds, message } = req.body;

  if (!recipientMemberId || !Array.isArray(offeredIds) || !Array.isArray(requestedIds)) {
    return res.status(400).json({ error: 'recipientMemberId, offeredIds, and requestedIds are required' });
  }
  if (offeredIds.length === 0 || requestedIds.length === 0) {
    return res.status(400).json({ error: 'Must offer and request at least one politician' });
  }

  const member = await getMember(req.user!.id, leagueId);
  if (!member) return res.status(403).json({ error: 'Not a member of this league' });
  if (member.id === recipientMemberId) return res.status(400).json({ error: 'Cannot trade with yourself' });

  const league = await prisma.league.findUnique({ where: { id: leagueId } });
  if (!league) return res.status(404).json({ error: 'League not found' });
  if (league.draftStatus !== 'COMPLETE') {
    return res.status(400).json({ error: 'Trades are only available after the draft is complete' });
  }

  const recipient = await prisma.leagueMember.findFirst({
    where: { id: recipientMemberId, leagueId },
  });
  if (!recipient) return res.status(404).json({ error: 'Recipient not found in this league' });

  // Verify offered politicians are on proposer's roster
  const proposerPicks = await prisma.draftPick.findMany({
    where: { leagueMemberId: member.id, leagueId },
    select: { politicianId: true },
  });
  const proposerRoster = new Set(proposerPicks.map((p) => p.politicianId));
  for (const pid of offeredIds) {
    if (!proposerRoster.has(pid)) {
      return res.status(400).json({ error: 'One or more offered politicians are not on your roster' });
    }
  }

  // Verify requested politicians are on recipient's roster
  const recipientPicks = await prisma.draftPick.findMany({
    where: { leagueMemberId: recipientMemberId, leagueId },
    select: { politicianId: true },
  });
  const recipientRoster = new Set(recipientPicks.map((p) => p.politicianId));
  for (const pid of requestedIds) {
    if (!recipientRoster.has(pid)) {
      return res.status(400).json({ error: 'One or more requested politicians are not on the recipient\'s roster' });
    }
  }

  const trade = await prisma.trade.create({
    data: {
      leagueId,
      proposerId: member.id,
      recipientId: recipientMemberId,
      offeredIds,
      requestedIds,
      message: message || null,
    },
    include: {
      proposer: { include: { user: { select: { id: true, username: true } } } },
      recipient: { include: { user: { select: { id: true, username: true } } } },
    },
  });

  return res.status(201).json({ trade: await enrichTrade(trade) });
});

// POST /api/leagues/:id/trades/:tradeId/accept
router.post('/:tradeId/accept', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id: leagueId, tradeId } = req.params;
  const member = await getMember(req.user!.id, leagueId);
  if (!member) return res.status(403).json({ error: 'Not a member of this league' });

  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
  if (!trade || trade.leagueId !== leagueId) return res.status(404).json({ error: 'Trade not found' });
  if (trade.recipientId !== member.id) return res.status(403).json({ error: 'Only the recipient can accept this trade' });
  if (trade.status !== 'PENDING') return res.status(400).json({ error: 'Trade is no longer pending' });

  // Re-validate rosters before executing
  const proposerPicks = await prisma.draftPick.findMany({
    where: { leagueMemberId: trade.proposerId, leagueId },
    select: { politicianId: true },
  });
  const proposerRoster = new Set(proposerPicks.map((p) => p.politicianId));
  for (const pid of trade.offeredIds) {
    if (!proposerRoster.has(pid)) {
      return res.status(400).json({ error: 'One or more offered politicians are no longer on the proposer\'s roster' });
    }
  }

  const recipientPicks = await prisma.draftPick.findMany({
    where: { leagueMemberId: trade.recipientId, leagueId },
    select: { politicianId: true },
  });
  const recipientRoster = new Set(recipientPicks.map((p) => p.politicianId));
  for (const pid of trade.requestedIds) {
    if (!recipientRoster.has(pid)) {
      return res.status(400).json({ error: 'One or more requested politicians are no longer on your roster' });
    }
  }

  await prisma.$transaction(async (tx) => {
    // Move offered politicians: proposer → recipient
    for (const politicianId of trade.offeredIds) {
      await tx.draftPick.updateMany({
        where: { politicianId, leagueId, leagueMemberId: trade.proposerId },
        data: { leagueMemberId: trade.recipientId },
      });
      await tx.startingLineup.deleteMany({ where: { leagueMemberId: trade.proposerId, politicianId } });
      await tx.startingLineup.upsert({
        where: { leagueMemberId_politicianId: { leagueMemberId: trade.recipientId, politicianId } },
        create: { leagueMemberId: trade.recipientId, politicianId, isStarter: false },
        update: { isStarter: false },
      });
    }

    // Move requested politicians: recipient → proposer
    for (const politicianId of trade.requestedIds) {
      await tx.draftPick.updateMany({
        where: { politicianId, leagueId, leagueMemberId: trade.recipientId },
        data: { leagueMemberId: trade.proposerId },
      });
      await tx.startingLineup.deleteMany({ where: { leagueMemberId: trade.recipientId, politicianId } });
      await tx.startingLineup.upsert({
        where: { leagueMemberId_politicianId: { leagueMemberId: trade.proposerId, politicianId } },
        create: { leagueMemberId: trade.proposerId, politicianId, isStarter: false },
        update: { isStarter: false },
      });
    }

    // Mark accepted
    await tx.trade.update({ where: { id: tradeId }, data: { status: 'ACCEPTED' } });

    // Cancel other pending trades involving these politicians
    const affected = [...trade.offeredIds, ...trade.requestedIds];
    const conflicting = await tx.trade.findMany({
      where: {
        leagueId,
        id: { not: tradeId },
        status: 'PENDING',
        OR: [
          { offeredIds: { hasSome: affected } },
          { requestedIds: { hasSome: affected } },
        ],
      },
      select: { id: true },
    });
    if (conflicting.length > 0) {
      await tx.trade.updateMany({
        where: { id: { in: conflicting.map((t) => t.id) } },
        data: { status: 'CANCELLED' },
      });
    }
  });

  return res.json({ message: 'Trade accepted' });
});

// POST /api/leagues/:id/trades/:tradeId/reject
router.post('/:tradeId/reject', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id: leagueId, tradeId } = req.params;
  const member = await getMember(req.user!.id, leagueId);
  if (!member) return res.status(403).json({ error: 'Not a member of this league' });

  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
  if (!trade || trade.leagueId !== leagueId) return res.status(404).json({ error: 'Trade not found' });
  if (trade.recipientId !== member.id) return res.status(403).json({ error: 'Only the recipient can reject this trade' });
  if (trade.status !== 'PENDING') return res.status(400).json({ error: 'Trade is no longer pending' });

  await prisma.trade.update({ where: { id: tradeId }, data: { status: 'REJECTED' } });
  return res.json({ message: 'Trade rejected' });
});

// DELETE /api/leagues/:id/trades/:tradeId — cancel
router.delete('/:tradeId', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id: leagueId, tradeId } = req.params;
  const member = await getMember(req.user!.id, leagueId);
  if (!member) return res.status(403).json({ error: 'Not a member of this league' });

  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
  if (!trade || trade.leagueId !== leagueId) return res.status(404).json({ error: 'Trade not found' });
  if (trade.proposerId !== member.id) return res.status(403).json({ error: 'Only the proposer can cancel this trade' });
  if (trade.status !== 'PENDING') return res.status(400).json({ error: 'Trade is no longer pending' });

  await prisma.trade.update({ where: { id: tradeId }, data: { status: 'CANCELLED' } });
  return res.json({ message: 'Trade cancelled' });
});

export default router;
