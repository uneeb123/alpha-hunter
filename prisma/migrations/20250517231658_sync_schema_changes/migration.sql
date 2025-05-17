/*
  Warnings:

  - A unique constraint covering the columns `[pineId]` on the table `Tweet` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Tweet" ADD COLUMN     "embeddedAt" TIMESTAMP(3),
ADD COLUMN     "pineId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tweet_pineId_key" ON "Tweet"("pineId");
