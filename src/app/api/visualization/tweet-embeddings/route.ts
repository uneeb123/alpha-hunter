import { Pinecone } from '@pinecone-database/pinecone';
import { getSecrets } from '@/utils/secrets';
import { prisma } from '@/lib/prisma';
import { UMAP } from 'umap-js';
import { kmeans } from 'ml-kmeans';

const secrets = getSecrets();
const pinecone = new Pinecone({ apiKey: secrets.pineconeApiKey }).Index(
  'tweets-embed',
);

// Supports ?numBatches=3 (default 1, max 10). Each batch is 100 vectors.
export async function GET() {
  try {
    // 1. Fetch 100 tweets with pineId not null
    const tweets = await prisma.tweet.findMany({
      where: { pineId: { not: null } },
      include: { user: { select: { username: true } } },
      take: 100,
    });

    if (!tweets.length) {
      return Response.json([]);
    }

    // 2. Fetch embeddings from Pinecone
    const pineIds = tweets.map((tweet) => tweet.pineId!);
    const embeddingsResult = await pinecone.fetch(pineIds);
    const embeddings = embeddingsResult.records || {};

    // Get embeddings array for processing
    const vectors = tweets.map((tweet) => ({
      id: tweet.id,
      text: tweet.text,
      username: tweet.user.username,
      timestamp: tweet.timestamp,
      embedding: embeddings[tweet.pineId!]?.values || [],
    }));

    // 1. UMAP to 2D
    const umap = new UMAP({
      nComponents: 2, // Reduces data to 2 dimensions for visualization
      nNeighbors: 15, // Number of neighboring points to consider when building the local structure
      minDist: 0.1, // Minimum distance between points in the embedding
    });
    const coords = umap.fit(vectors.map((v) => v.embedding));

    // 2. KMeans clustering
    const k = Math.max(
      2,
      Math.min(10, Math.round(Math.sqrt(vectors.length / 2))),
    );
    const kmeansResult = kmeans(coords, k, {});

    // Compute centroids and radii for each cluster
    const clusterData = Array.from({ length: k }, (_, i) => {
      const clusterPoints = coords.filter(
        (_, idx) => kmeansResult.clusters[idx] === i,
      );

      // Calculate centroid (mean of all points in cluster)
      const centroid = {
        x:
          clusterPoints.reduce((sum, p) => sum + p[0], 0) /
          clusterPoints.length,
        y:
          clusterPoints.reduce((sum, p) => sum + p[1], 0) /
          clusterPoints.length,
      };

      // Calculate radius (max distance from centroid to any point in cluster)
      const radius = Math.max(
        ...clusterPoints.map((p) =>
          Math.sqrt(
            Math.pow(p[0] - centroid.x, 2) + Math.pow(p[1] - centroid.y, 2),
          ),
        ),
      );

      return {
        cluster: i,
        centroid,
        radius,
        count: clusterPoints.length,
      };
    });

    return Response.json(clusterData);
  } catch (error) {
    console.error('Error processing tweet embeddings:', error);
    return new Response('Error processing tweet embeddings', { status: 500 });
  }
}
