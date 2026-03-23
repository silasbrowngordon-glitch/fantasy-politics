import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/politicians
router.get('/', async (req: Request, res: Response) => {
  const { search, party, state } = req.query;

  const where: Prisma.PoliticianWhereInput = { isActive: true };

  if (search) {
    where.name = { contains: search as string, mode: 'insensitive' };
  }
  if (party) {
    where.party = party as 'DEM' | 'REP' | 'IND' | 'OTHER';
  }
  if (state) {
    where.state = { equals: state as string, mode: 'insensitive' };
  }

  const politicians = await prisma.politician.findMany({
    where,
    include: {
      dailyScores: true,
    },
    orderBy: { name: 'asc' },
  });

  const withTotals = politicians.map((p) => ({
    ...p,
    seasonTotal: p.dailyScores.reduce((sum, ds) => sum + ds.points, 0),
    lastScore: p.dailyScores.sort((a, b) => b.date.getTime() - a.date.getTime())[0] ?? null,
  }));

  return res.json({ politicians: withTotals });
});

// GET /api/politicians/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const politician = await prisma.politician.findUnique({
    where: { id },
    include: {
      dailyScores: { orderBy: { date: 'desc' } },
      draftPicks: {
        include: {
          leagueMember: {
            include: {
              user: { select: { username: true } },
              league: { select: { name: true, id: true } },
            },
          },
        },
      },
    },
  });

  if (!politician) return res.status(404).json({ error: 'Politician not found' });

  const seasonTotal = politician.dailyScores.reduce((sum, ds) => sum + ds.points, 0);

  return res.json({ politician: { ...politician, seasonTotal } });
});

export default router;
