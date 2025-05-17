-- CreateTable
CREATE TABLE "BotResponse" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BotResponse_name_key" ON "BotResponse"("name");

-- CreateIndex
CREATE INDEX "BotResponse_name_idx" ON "BotResponse"("name");
