import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/scores?date=YYYY-MM-DD
router.get('/', async (req: Request, res: Response) => {
  const dateStr = req.query.date as string || new Date().toISOString().split('T')[0];
  const date = new Date(dateStr + 'T00:00:00.000Z');

  const scores = await prisma.dailyScore.findMany({
    where: { date },
    include: { politician: { select: { id: true, name: true, party: true, state: true, title: true } } },
    orderBy: { points: 'desc' },
  });

  return res.json({ scores, date: dateStr });
});

export default router;
