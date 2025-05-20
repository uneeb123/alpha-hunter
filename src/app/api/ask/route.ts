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

    // 2. Query Pinecone for top 10 most similar tweets
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

    // 4. Format tweets for context
    const tweetMap = new Map(tweets.map((t) => [t.id, t]));
    const relevantTweets = tweetIds
      .map((id) => tweetMap.get(id))
      .filter((t): t is (typeof tweets)[number] => Boolean(t))
      .map((t) => ({
        text: t.text,
        username: t.user.username,
        timestamp: t.timestamp,
      }));

    // 5. Format context from relevant tweets
    const context = relevantTweets
      .map(
        (t) =>
          `Tweet by @${t.username} (${new Date(t.timestamp).toLocaleDateString()}): ${t.text}`,
      )
      .join('\n\n');

    // 6. Generate response using RAG
    const ragResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that specializes in cryptocurrency and blockchain technology. 
          Use the provided context from relevant tweets to answer questions accurately and concisely.
          If the context doesn't contain enough information to answer the question, say so.
          Always cite the sources (usernames) when referencing specific information from tweets.`,
        },
        {
          role: 'user',
          content: `Context from relevant tweets:\n\n${context}\n\nQuestion: ${message}`,
        },
      ],
      temperature: 0,
      max_tokens: 500,
    });

    return NextResponse.json({
      response: ragResponse.choices[0].message.content,
      sources: relevantTweets.map((t) => ({
        username: t.username,
        text: t.text,
        timestamp: t.timestamp,
      })),
    });
  } catch (err: any) {
    console.error('Error in /api/ask:', err);
    return NextResponse.json(
      { error: 'Failed to process semantic search: ' + (err?.message || err) },
      { status: 500 },
    );
  }
}
