-- CreateEnum
CREATE TYPE "ScraperStatus" AS ENUM ('RUNNING', 'PAUSED', 'FINISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BUY', 'SELL');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "twitterId" TEXT NOT NULL,
    "twitterName" TEXT NOT NULL,
    "twitterUser" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alpha" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alpha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scraper" (
    "id" SERIAL NOT NULL,
    "status" "ScraperStatus" NOT NULL DEFAULT 'RUNNING',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "resumeTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "previousId" INTEGER,

    CONSTRAINT "Scraper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScraperToUser" (
    "userId" INTEGER NOT NULL,
    "scraperId" INTEGER NOT NULL,
    "filePath" TEXT,
    "lastFetchedTweetId" TEXT,
    "earliestTweetTime" TIMESTAMP(3),
    "skipped" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScraperToUser_pkey" PRIMARY KEY ("userId","scraperId")
);

-- CreateTable
CREATE TABLE "Processor" (
    "id" SERIAL NOT NULL,
    "alphaId" INTEGER NOT NULL,
    "generatedScript" TEXT,
    "summary" TEXT,
    "tweetUrl" TEXT,
    "parsedTweetsPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Processor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Swap" (
    "id" SERIAL NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "blockTimestamp" TIMESTAMP(3) NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "pairAddress" TEXT NOT NULL,
    "exchangeName" TEXT NOT NULL,
    "baseToken" TEXT NOT NULL,
    "quoteToken" TEXT NOT NULL,
    "baseAmount" DECIMAL(65,30) NOT NULL,
    "baseAmountUsd" DECIMAL(65,30) NOT NULL,
    "quoteAmount" DECIMAL(65,30) NOT NULL,
    "quoteAmountUsd" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Swap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AlphaToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AlphaToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_twitterId_key" ON "User"("twitterId");

-- CreateIndex
CREATE UNIQUE INDEX "Alpha_name_key" ON "Alpha"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Scraper_previousId_key" ON "Scraper"("previousId");

-- CreateIndex
CREATE UNIQUE INDEX "Swap_transactionHash_key" ON "Swap"("transactionHash");

-- CreateIndex
CREATE INDEX "Swap_transactionHash_idx" ON "Swap"("transactionHash");

-- CreateIndex
CREATE INDEX "Swap_baseToken_idx" ON "Swap"("baseToken");

-- CreateIndex
CREATE INDEX "Swap_blockTimestamp_idx" ON "Swap"("blockTimestamp");

-- CreateIndex
CREATE INDEX "_AlphaToUser_B_index" ON "_AlphaToUser"("B");

-- AddForeignKey
ALTER TABLE "Scraper" ADD CONSTRAINT "Scraper_previousId_fkey" FOREIGN KEY ("previousId") REFERENCES "Scraper"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScraperToUser" ADD CONSTRAINT "ScraperToUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScraperToUser" ADD CONSTRAINT "ScraperToUser_scraperId_fkey" FOREIGN KEY ("scraperId") REFERENCES "Scraper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Processor" ADD CONSTRAINT "Processor_alphaId_fkey" FOREIGN KEY ("alphaId") REFERENCES "Alpha"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlphaToUser" ADD CONSTRAINT "_AlphaToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Alpha"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlphaToUser" ADD CONSTRAINT "_AlphaToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
