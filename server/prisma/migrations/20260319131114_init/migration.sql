-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PLAYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Party" AS ENUM ('DEM', 'REP', 'IND', 'OTHER');

-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('PREDRAFT', 'DRAFTING', 'COMPLETE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "maxMembers" INTEGER NOT NULL DEFAULT 10,
    "rosterSize" INTEGER NOT NULL DEFAULT 10,
    "starterSize" INTEGER NOT NULL DEFAULT 8,
    "draftStatus" "DraftStatus" NOT NULL DEFAULT 'PREDRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "draftOrder" INTEGER,
    "isCommissioner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Politician" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "party" "Party" NOT NULL,
    "state" TEXT NOT NULL,
    "imageUrl" TEXT,
    "bio" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Politician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DraftPick" (
    "id" TEXT NOT NULL,
    "leagueMemberId" TEXT NOT NULL,
    "politicianId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "draftOrder" INTEGER NOT NULL,
    "draftedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DraftPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StartingLineup" (
    "id" TEXT NOT NULL,
    "leagueMemberId" TEXT NOT NULL,
    "politicianId" TEXT NOT NULL,
    "isStarter" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StartingLineup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyScore" (
    "id" TEXT NOT NULL,
    "politicianId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueMemberDailyTotal" (
    "id" TEXT NOT NULL,
    "leagueMemberId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalPoints" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "LeagueMemberDailyTotal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "League_inviteCode_key" ON "League"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMember_userId_leagueId_key" ON "LeagueMember"("userId", "leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "DraftPick_politicianId_leagueId_key" ON "DraftPick"("politicianId", "leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "StartingLineup_leagueMemberId_politicianId_key" ON "StartingLineup"("leagueMemberId", "politicianId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyScore_politicianId_date_key" ON "DailyScore"("politicianId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMemberDailyTotal_leagueMemberId_date_key" ON "LeagueMemberDailyTotal"("leagueMemberId", "date");

-- AddForeignKey
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_leagueMemberId_fkey" FOREIGN KEY ("leagueMemberId") REFERENCES "LeagueMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_politicianId_fkey" FOREIGN KEY ("politicianId") REFERENCES "Politician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StartingLineup" ADD CONSTRAINT "StartingLineup_leagueMemberId_fkey" FOREIGN KEY ("leagueMemberId") REFERENCES "LeagueMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyScore" ADD CONSTRAINT "DailyScore_politicianId_fkey" FOREIGN KEY ("politicianId") REFERENCES "Politician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMemberDailyTotal" ADD CONSTRAINT "LeagueMemberDailyTotal_leagueMemberId_fkey" FOREIGN KEY ("leagueMemberId") REFERENCES "LeagueMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
