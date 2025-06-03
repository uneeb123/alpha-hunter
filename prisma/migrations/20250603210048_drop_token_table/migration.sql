/*
  Warnings:

  - Added the required column `holderCount` to the `Token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trade24hCount` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- Drop and recreate the Token table with the new schema
DROP TABLE IF EXISTS "Token";

CREATE TABLE "Token" (
  "id" SERIAL PRIMARY KEY,
  "address" TEXT NOT NULL,
  "decimals" INTEGER NOT NULL,
  "price" DOUBLE PRECISION,
  "lastTradeUnixTime" INTEGER NOT NULL,
  "liquidity" DOUBLE PRECISION NOT NULL,
  "logoURI" TEXT,
  "mc" DOUBLE PRECISION,
  "name" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "v24hChangePercent" DOUBLE PRECISION,
  "v24hUSD" DOUBLE PRECISION NOT NULL,
  "chain" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "trade24hCount" INTEGER NOT NULL,
  "holderCount" INTEGER NOT NULL,
  "fullyDilutedValuation" DOUBLE PRECISION,
  CONSTRAINT "Token_address_chain_key" UNIQUE ("address", "chain")
);
