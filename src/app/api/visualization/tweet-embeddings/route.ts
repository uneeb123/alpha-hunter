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

    // 3. Combine all data
    const result = coords.map(([x, y], i) => ({
      x,
      y,
      cluster: kmeansResult.clusters[i],
      text: vectors[i].text,
      username: vectors[i].username,
      timestamp: vectors[i].timestamp,
    }));

    return Response.json(result);
  } catch (error) {
    console.error('Error processing tweet embeddings:', error);
    return new Response('Error processing tweet embeddings', { status: 500 });
  }
}
