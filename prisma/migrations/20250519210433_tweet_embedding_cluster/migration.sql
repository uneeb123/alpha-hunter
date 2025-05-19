-- CreateTable
CREATE TABLE "TweetEmbeddingCluster" (
    "id" SERIAL NOT NULL,
    "cluster" INTEGER NOT NULL,
    "centroidX" DOUBLE PRECISION NOT NULL,
    "centroidY" DOUBLE PRECISION NOT NULL,
    "radius" DOUBLE PRECISION NOT NULL,
    "count" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "highlightText" TEXT NOT NULL,
    "highlightUsername" TEXT NOT NULL,
    "highlightTimestamp" TIMESTAMP(3) NOT NULL,
    "highlightSmartFollowingCount" INTEGER,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TweetEmbeddingCluster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TweetEmbeddingCluster_computedAt_idx" ON "TweetEmbeddingCluster"("computedAt");
