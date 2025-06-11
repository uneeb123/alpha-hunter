-- CreateTable
CREATE TABLE "TokenAlertMemory" (
    "id" SERIAL NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "marketCap" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extra" JSONB,

    CONSTRAINT "TokenAlertMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TokenAlertMemory_tokenAddress_idx" ON "TokenAlertMemory"("tokenAddress");

-- CreateIndex
CREATE INDEX "TokenAlertMemory_createdAt_idx" ON "TokenAlertMemory"("createdAt");
