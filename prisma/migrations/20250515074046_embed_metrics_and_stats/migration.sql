/*
  Warnings:

  - You are about to drop the column `twitterName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `twitterUser` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Alpha` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Processor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Scraper` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScraperToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AlphaToUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Processor" DROP CONSTRAINT "Processor_alphaId_fkey";

-- DropForeignKey
ALTER TABLE "Scraper" DROP CONSTRAINT "Scraper_previousId_fkey";

-- DropForeignKey
ALTER TABLE "ScraperToUser" DROP CONSTRAINT "ScraperToUser_scraperId_fkey";

-- DropForeignKey
ALTER TABLE "ScraperToUser" DROP CONSTRAINT "ScraperToUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "_AlphaToUser" DROP CONSTRAINT "_AlphaToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_AlphaToUser" DROP CONSTRAINT "_AlphaToUser_B_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "twitterName",
DROP COLUMN "twitterUser",
ADD COLUMN     "averageEngagement" DOUBLE PRECISION,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "followerEngagementRatio" DOUBLE PRECISION,
ADD COLUMN     "followersCount" INTEGER,
ADD COLUMN     "followingCount" INTEGER,
ADD COLUMN     "likeCount" INTEGER,
ADD COLUMN     "listedCount" INTEGER,
ADD COLUMN     "mediaCount" INTEGER,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "profileImageUrl" TEXT,
ADD COLUMN     "smartFollowingCount" INTEGER,
ADD COLUMN     "tweetCount" INTEGER,
ADD COLUMN     "username" TEXT NOT NULL;

-- DropTable
DROP TABLE "Alpha";

-- DropTable
DROP TABLE "Processor";

-- DropTable
DROP TABLE "Scraper";

-- DropTable
DROP TABLE "ScraperToUser";

-- DropTable
DROP TABLE "_AlphaToUser";

-- DropEnum
DROP TYPE "ScraperStatus";

-- CreateTable
CREATE TABLE "Tweet" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "vectorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tweet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTimeline" (
    "id" SERIAL NOT NULL,
    "twitterId" TEXT NOT NULL,
    "lastTweetId" TEXT,
    "lastSynced" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "rateLimitReset" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tweet_authorId_idx" ON "Tweet"("authorId");

-- CreateIndex
CREATE INDEX "Tweet_createdAt_idx" ON "Tweet"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserTimeline_twitterId_key" ON "UserTimeline"("twitterId");

-- CreateIndex
CREATE INDEX "UserTimeline_nextRun_idx" ON "UserTimeline"("nextRun");
