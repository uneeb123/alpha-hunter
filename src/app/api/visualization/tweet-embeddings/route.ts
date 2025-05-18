import { Pinecone } from '@pinecone-database/pinecone';
import { getSecrets } from '@/utils/secrets';
import { prisma } from '@/lib/prisma';

const secrets = getSecrets();
const pinecone = new Pinecone({ apiKey: secrets.pineconeApiKey }).Index(
  'tweets-embed',
);

// Supports ?numBatches=3 (default 1, max 10). Each batch is 100 vectors.
export async function GET(req: Request) {
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

    // 3. Combine and return
    const result = tweets.map((tweet) => ({
      id: tweet.id,
      text: tweet.text,
      username: tweet.user.username,
      timestamp: tweet.timestamp,
      embedding: embeddings[tweet.pineId!]?.values || [],
    }));

    return Response.json(result);
  } catch (error) {
    console.error('Error fetching tweet embeddings:', error);
    return new Response('Error fetching tweet embeddings', { status: 500 });
  }
}
