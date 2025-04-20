-- CreateTable
CREATE TABLE "TokenMonitor" (
    "id" SERIAL NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "isMonitoring" BOOLEAN NOT NULL DEFAULT false,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenMonitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecentToken" (
    "id" SERIAL NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "creationTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecentToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenMonitor_tokenAddress_key" ON "TokenMonitor"("tokenAddress");

-- CreateIndex
CREATE INDEX "TokenMonitor_isMonitoring_idx" ON "TokenMonitor"("isMonitoring");

-- CreateIndex
CREATE UNIQUE INDEX "RecentToken_tokenAddress_key" ON "RecentToken"("tokenAddress");

-- CreateIndex
CREATE INDEX "RecentToken_tokenAddress_idx" ON "RecentToken"("tokenAddress");

-- CreateIndex
CREATE INDEX "RecentToken_isProcessed_idx" ON "RecentToken"("isProcessed");
