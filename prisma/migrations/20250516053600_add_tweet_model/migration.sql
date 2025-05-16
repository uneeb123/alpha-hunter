/*
  Warnings:

  - You are about to drop the column `authorId` on the `Tweet` table. All the data in the column will be lost.
  - You are about to drop the column `vectorId` on the `Tweet` table. All the data in the column will be lost.
  - You are about to drop the `UserTimeline` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `s3Key` to the `Tweet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `Tweet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Tweet` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Tweet_authorId_idx";

-- DropIndex
DROP INDEX "Tweet_createdAt_idx";

-- AlterTable
ALTER TABLE "Tweet" DROP COLUMN "authorId",
DROP COLUMN "vectorId",
ADD COLUMN     "s3Key" TEXT NOT NULL,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sinceId" TEXT;

-- DropTable
DROP TABLE "UserTimeline";

-- CreateIndex
CREATE INDEX "Tweet_userId_idx" ON "Tweet"("userId");

-- AddForeignKey
ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
