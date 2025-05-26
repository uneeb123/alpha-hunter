-- CreateTable
CREATE TABLE "TelegramChat" (
    "id" SERIAL NOT NULL,
    "chatId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramChat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramChat_chatId_key" ON "TelegramChat"("chatId");

-- CreateIndex
CREATE INDEX "TelegramChat_chatId_idx" ON "TelegramChat"("chatId");
