/**
 * sync-politicians.ts
 *
 * Exports all politicians from the local database and upserts any missing ones
 * into the Railway production database, matching by name to skip duplicates.
 *
 * Usage:
 *   PROD_DATABASE_URL="postgresql://..." ts-node --transpile-only scripts/sync-politicians.ts
 *
 * The local database is read from the DATABASE_URL in your .env file.
 * Pass the Railway DATABASE_URL as PROD_DATABASE_URL env var.
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const localUrl = process.env.DATABASE_URL;
const prodUrl = process.env.PROD_DATABASE_URL;

if (!localUrl) {
  console.error('ERROR: DATABASE_URL is not set (local database)');
  process.exit(1);
}
if (!prodUrl) {
  console.error('ERROR: PROD_DATABASE_URL is not set (Railway database)');
  console.error('Usage: PROD_DATABASE_URL="postgresql://..." ts-node --transpile-only scripts/sync-politicians.ts');
  process.exit(1);
}

const localDb = new PrismaClient({ datasources: { db: { url: localUrl } } });
const prodDb  = new PrismaClient({ datasources: { db: { url: prodUrl } } });

async function main() {
  console.log('Connecting to local database...');
  const localPoliticians = await localDb.politician.findMany({
    orderBy: { name: 'asc' },
  });
  console.log(`  Found ${localPoliticians.length} politicians locally.\n`);

  console.log('Connecting to production database...');
  const prodPoliticians = await prodDb.politician.findMany();
  const prodNames = new Set(prodPoliticians.map((p) => p.name.trim().toLowerCase()));
  console.log(`  Found ${prodPoliticians.length} politicians in production.\n`);

  const toInsert = localPoliticians.filter(
    (p) => !prodNames.has(p.name.trim().toLowerCase())
  );

  if (toInsert.length === 0) {
    console.log('Production database is already up to date. Nothing to import.');
    return;
  }

  console.log(`Importing ${toInsert.length} missing politicians into production...`);

  let inserted = 0;
  let failed = 0;

  for (const pol of toInsert) {
    try {
      await prodDb.politician.create({
        data: {
          // Preserve the original ID so any future references stay consistent.
          // If there's an ID collision (very unlikely with cuid), we fall back
          // to letting Prisma generate a new one.
          id:        pol.id,
          name:      pol.name,
          title:     pol.title,
          party:     pol.party,
          state:     pol.state,
          imageUrl:  pol.imageUrl ?? undefined,
          bio:       pol.bio ?? undefined,
          isActive:  pol.isActive,
          createdAt: pol.createdAt,
        },
      });
      inserted++;
      process.stdout.write(`  [${inserted}/${toInsert.length}] ${pol.name}\n`);
    } catch (err: any) {
      // P2002 = unique constraint violation (ID or name collision)
      if (err.code === 'P2002') {
        // ID collision — retry without the explicit ID so Prisma generates a new one
        try {
          await prodDb.politician.create({
            data: {
              name:      pol.name,
              title:     pol.title,
              party:     pol.party,
              state:     pol.state,
              imageUrl:  pol.imageUrl ?? undefined,
              bio:       pol.bio ?? undefined,
              isActive:  pol.isActive,
              createdAt: pol.createdAt,
            },
          });
          inserted++;
          process.stdout.write(`  [${inserted}/${toInsert.length}] ${pol.name} (new ID assigned)\n`);
        } catch (retryErr: any) {
          console.error(`  FAILED: ${pol.name} — ${retryErr.message}`);
          failed++;
        }
      } else {
        console.error(`  FAILED: ${pol.name} — ${err.message}`);
        failed++;
      }
    }
  }

  console.log('\n--- Summary ---');
  console.log(`  Already in production (skipped): ${localPoliticians.length - toInsert.length}`);
  console.log(`  Imported:                        ${inserted}`);
  if (failed > 0) console.log(`  Failed:                          ${failed}`);
  console.log(`  Production total:                ${prodPoliticians.length + inserted}`);
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await localDb.$disconnect();
    await prodDb.$disconnect();
  });
