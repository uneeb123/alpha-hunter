// src/app/api/embed-tweets/route.ts  (App Router)
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import pLimit from 'p-limit';
import { getSecrets } from '@/utils/secrets';

const secrets = getSecrets();
const openai = new OpenAI({ apiKey: secrets.openaiApiKey });
const pinecone = new Pinecone({ apiKey: secrets.pineconeApiKey }).Index(
  'tweets-embed',
);

const BATCH_SIZE = 100; // rows per OpenAI request
const MAX_PARALLEL = 5; // concurrent batches
const limit = pLimit(MAX_PARALLEL);

export const runtime = 'edge'; // optional: fast cold-start

interface TweetWithUser {
  id: string;
  text: string;
  userId: number;
  user: {
    username: string;
  };
  timestamp: Date;
}

/** GET  ← Vercel Cron triggers a GET request */
export async function GET() {
  try {
    const tweets = await prisma.tweet.findMany({
      where: { embeddedAt: null },
      include: { user: { select: { username: true } } },
      orderBy: { timestamp: 'asc' },
      take: BATCH_SIZE,
    });

    if (tweets.length === 0) {
      return new Response('✓ all embedded', { status: 200 });
    }

    // Process tweets in batches
    const batches = tweets.reduce<TweetWithUser[][]>(
      (acc: TweetWithUser[][], tweet: TweetWithUser, index: number) => {
        const batchIndex = Math.floor(index / BATCH_SIZE);
        if (!acc[batchIndex]) {
          acc[batchIndex] = [];
        }
        acc[batchIndex].push(tweet);
        return acc;
      },
      [],
    );

    await Promise.all(
      batches.map((batch: TweetWithUser[]) =>
        limit(async () => {
          try {
            // 1. Generate embeddings
            const { data: embeddings } = await openai.embeddings.create({
              model: 'text-embedding-3-small',
              input: batch.map((t: TweetWithUser) => t.text),
            });

            // 2. Upsert to Pinecone
            await pinecone.upsert(
              batch.map((tweet: TweetWithUser, index: number) => ({
                id: tweet.id,
                values: embeddings[index].embedding,
                metadata: {
                  userId: tweet.userId,
                  username: tweet.user.username,
                  timestamp: tweet.timestamp.toISOString(),
                },
              })),
            );

            // 3. Mark as embedded in database
            await prisma.tweet.updateMany({
              where: { id: { in: batch.map((b: TweetWithUser) => b.id) } },
              data: { embeddedAt: new Date() },
            });
          } catch (error) {
            console.error('Error processing batch:', error);
            throw error;
          }
        }),
      ),
    );

    return new Response(`Successfully embedded ${tweets.length} tweets`, {
      status: 200,
    });
  } catch (error) {
    console.error('Error in embed-tweets route:', error);
    return new Response('Error processing tweets', { status: 500 });
  }
}
