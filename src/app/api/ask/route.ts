import { NextResponse } from 'next/server';
import { getSecrets } from '@/utils/secrets';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const secrets = getSecrets();
const openai = new OpenAI({ apiKey: secrets.openaiApiKey });
const pinecone = new Pinecone({ apiKey: secrets.pineconeApiKey }).Index(
  'tweets-embed',
);

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid message' },
        { status: 400 },
      );
    }

    // 1. Generate embedding for the user query
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: message,
    });
    const embedding = embeddingRes.data[0]?.embedding;
    if (!embedding) {
      return NextResponse.json(
        { error: 'Failed to generate embedding' },
        { status: 500 },
      );
    }

    // 2. Query Pinecone for top 5 most similar tweets
    const queryResult = await pinecone.query({
      vector: embedding,
      topK: 10,
      includeMetadata: true,
      includeValues: false,
    });
    const matches = queryResult.matches || [];
    const tweetIds = matches.map((m: any) => m.id).filter(Boolean);
    if (!tweetIds.length) {
      return NextResponse.json({ response: [] });
    }

    // 3. Fetch tweets from DB (with username)
    const tweets = await prisma.tweet.findMany({
      where: { id: { in: tweetIds } },
      include: { user: { select: { username: true } } },
    });

    // 4. Format and return results in the same order as Pinecone
    const tweetMap = new Map(tweets.map((t) => [t.id, t]));
    const response = tweetIds
      .map((id) => tweetMap.get(id))
      .filter((t): t is (typeof tweets)[number] => Boolean(t))
      .map((t) => ({
        id: t.id,
        text: t.text,
        username: t.user.username,
        timestamp: t.timestamp,
      }));

    return NextResponse.json({ response });
  } catch (err: any) {
    console.error('Error in /api/ask:', err);
    return NextResponse.json(
      { error: 'Failed to process semantic search: ' + (err?.message || err) },
      { status: 500 },
    );
  }
}
