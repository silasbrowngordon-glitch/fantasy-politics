import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  // Find all politicians grouped by name
  const politicians = await prisma.politician.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const byName = new Map<string, typeof politicians>();
  for (const p of politicians) {
    const key = p.name.trim().toLowerCase();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(p);
  }

  const duplicateGroups = [...byName.values()].filter((g) => g.length > 1);

  if (duplicateGroups.length === 0) {
    console.log('No duplicates found.');
    return;
  }

  console.log(`Found ${duplicateGroups.length} name(s) with duplicates:\n`);

  let totalDeleted = 0;

  for (const group of duplicateGroups) {
    const [keep, ...remove] = group; // keep the earliest-created record
    console.log(`  "${keep.name}" — keeping id=${keep.id}, removing ${remove.length} duplicate(s)`);

    const removeIds = remove.map((p) => p.id);

    // Reassign any DraftPick, DailyScore references to the kept politician
    await prisma.draftPick.updateMany({
      where: { politicianId: { in: removeIds } },
      data: { politicianId: keep.id },
    });

    // DailyScore has a unique constraint on (politicianId, date).
    // Reassign only rows whose (keepId, date) doesn't already exist.
    for (const dupId of removeIds) {
      const dupScores = await prisma.dailyScore.findMany({ where: { politicianId: dupId } });
      for (const score of dupScores) {
        const exists = await prisma.dailyScore.findUnique({
          where: { politicianId_date: { politicianId: keep.id, date: score.date } },
        });
        if (exists) {
          await prisma.dailyScore.delete({ where: { id: score.id } });
        } else {
          await prisma.dailyScore.update({
            where: { id: score.id },
            data: { politicianId: keep.id },
          });
        }
      }
    }

    await prisma.politician.deleteMany({ where: { id: { in: removeIds } } });
    totalDeleted += removeIds.length;
  }

  console.log(`\nDone. Deleted ${totalDeleted} duplicate politician record(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
