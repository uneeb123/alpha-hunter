-- CreateTable
CREATE TABLE "Token" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "lastTradeUnixTime" INTEGER NOT NULL,
    "liquidity" DOUBLE PRECISION NOT NULL,
    "logoURI" TEXT NOT NULL,
    "mc" DOUBLE PRECISION NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "v24hChangePercent" DOUBLE PRECISION NOT NULL,
    "v24hUSD" DOUBLE PRECISION NOT NULL,
    "chain" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_address_chain_key" ON "Token"("address", "chain");
