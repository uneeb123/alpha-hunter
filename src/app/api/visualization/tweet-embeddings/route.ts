import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch the most recent computed clusters
    const latestBatch = await prisma.tweetEmbeddingCluster.findMany({
      orderBy: { computedAt: 'desc' },
      take: 1,
    });
    if (!latestBatch.length) {
      return Response.json([]);
    }
    // Get the computedAt timestamp of the latest batch
    const latestComputedAt = latestBatch[0].computedAt;
    // Fetch all clusters from the latest computation
    const clusters = await prisma.tweetEmbeddingCluster.findMany({
      where: { computedAt: latestComputedAt },
      orderBy: { cluster: 'asc' },
      select: {
        cluster: true,
        centroidX: true,
        centroidY: true,
        radius: true,
        count: true,
        topic: true,
        summary: true,
        highlightText: true,
        highlightUsername: true,
        highlightTimestamp: true,
        highlightSmartFollowingCount: true,
        tweetIds: true,
      },
    });
    // Map to frontend structure
    const mapped = clusters.map((c) => ({
      cluster: c.cluster,
      centroid: { x: c.centroidX, y: c.centroidY },
      radius: c.radius,
      count: c.count,
      topic: c.topic,
      summary: c.summary,
      highlight: {
        text: c.highlightText,
        username: c.highlightUsername,
        timestamp: c.highlightTimestamp,
        smartFollowingCount: c.highlightSmartFollowingCount,
      },
      tweetIds: c.tweetIds,
    }));
    return Response.json(mapped);
  } catch (error) {
    console.error('Error fetching tweet embedding clusters:', error);
    return new Response('Error fetching tweet embedding clusters', {
      status: 500,
    });
  }
}
