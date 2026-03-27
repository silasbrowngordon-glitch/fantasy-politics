-- CreateEnum
CREATE TYPE "ScoringType" AS ENUM ('DEMOCRAT', 'REPUBLICAN', 'MEDIA_CHAOS', 'INDEPENDENT', 'INFLUENCE', 'PUNDIT_CHAOS');

-- AlterTable: Add scoringTypes to League
ALTER TABLE "League" ADD COLUMN "scoringTypes" "ScoringType"[] NOT NULL DEFAULT '{}';

-- AlterTable: Add leagueId to DailyScore
ALTER TABLE "DailyScore" ADD COLUMN "leagueId" TEXT;

-- AddForeignKey
ALTER TABLE "DailyScore" ADD CONSTRAINT "DailyScore_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropIndex: Remove old simple unique constraint
DROP INDEX "DailyScore_politicianId_date_key";

-- CreateIndex: Partial unique index for global scores (leagueId IS NULL)
CREATE UNIQUE INDEX "DailyScore_politicianId_date_null_key" ON "DailyScore"("politicianId", "date") WHERE "leagueId" IS NULL;

-- CreateIndex: Partial unique index for league-specific scores
CREATE UNIQUE INDEX "DailyScore_politicianId_date_league_key" ON "DailyScore"("politicianId", "date", "leagueId") WHERE "leagueId" IS NOT NULL;

-- CreateIndex: Performance index
CREATE INDEX "DailyScore_politicianId_date_leagueId_idx" ON "DailyScore"("politicianId", "date", "leagueId");
