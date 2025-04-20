-- CreateTable
CREATE TABLE "CheckedToken" (
    "id" SERIAL NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckedToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CheckedToken_tokenAddress_key" ON "CheckedToken"("tokenAddress");

-- CreateIndex
CREATE INDEX "CheckedToken_tokenAddress_idx" ON "CheckedToken"("tokenAddress"); 