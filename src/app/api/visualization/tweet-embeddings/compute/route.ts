import { Pinecone } from '@pinecone-database/pinecone';
import { getSecrets } from '@/utils/secrets';
import { prisma } from '@/lib/prisma';
import { UMAP } from 'umap-js';
import { kmeans } from 'ml-kmeans';
import OpenAI from 'openai';

const secrets = getSecrets();
const pinecone = new Pinecone({ apiKey: secrets.pineconeApiKey }).Index(
  'tweets-embed',
);
const openai = new OpenAI({ apiKey: secrets.openaiApiKey });

export async function POST() {
  try {
    // 1. Fetch 1000 tweets with pineId not null
    const tweets = await prisma.tweet.findMany({
      where: { pineId: { not: null } },
      include: {
        user: {
          select: {
            username: true,
            smartFollowingCount: true,
          },
        },
      },
      take: 1000,
    });

    if (!tweets.length) {
      return Response.json({ message: 'No tweets found to compute.' });
    }

    // 2. Fetch embeddings from Pinecone in batches of 100
    const pineIds = tweets.map((tweet) => tweet.pineId!);
    const batchSize = 100;
    const embeddingsResults = [];
    for (let i = 0; i < pineIds.length; i += batchSize) {
      const batchIds = pineIds.slice(i, i + batchSize);
      const result = await pinecone.fetch(batchIds);
      embeddingsResults.push(result.records || {});
    }
    // Merge all batch results into a single object
    const embeddings = Object.assign({}, ...embeddingsResults);

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
      nComponents: 2,
      nNeighbors: 15,
      minDist: 0.1,
    });
    const coords = umap.fit(vectors.map((v) => v.embedding));

    // 2. KMeans clustering
    const k = Math.max(
      2,
      Math.min(10, Math.round(Math.sqrt(vectors.length / 2))),
    );
    const kmeansResult = kmeans(coords, k, {});

    // Compute centroids and radii for each cluster
    const now = new Date();
    const clusterRows = await Promise.all(
      Array.from({ length: k }, async (_, i) => {
        const clusterPoints = coords.filter(
          (_, idx) => kmeansResult.clusters[idx] === i,
        );
        const clusterTweets = vectors.filter(
          (_, idx) => kmeansResult.clusters[idx] === i,
        );

        // Find the tweet from user with highest smartFollowingCount
        const highlightTweet = clusterTweets.reduce((highest, current) => {
          const currentUser = tweets.find((t) => t.id === current.id)?.user;
          const highestUser = tweets.find((t) => t.id === highest.id)?.user;
          if (
            !currentUser?.smartFollowingCount ||
            !highestUser?.smartFollowingCount
          ) {
            return highest;
          }
          return currentUser.smartFollowingCount >
            highestUser.smartFollowingCount
            ? current
            : highest;
        }, clusterTweets[0]);

        // Calculate centroid
        const centroidX =
          clusterPoints.reduce((sum, p) => sum + p[0], 0) /
          clusterPoints.length;
        const centroidY =
          clusterPoints.reduce((sum, p) => sum + p[1], 0) /
          clusterPoints.length;
        // Calculate radius
        const radius = Math.max(
          ...clusterPoints.map((p) =>
            Math.sqrt(
              Math.pow(p[0] - centroidX, 2) + Math.pow(p[1] - centroidY, 2),
            ),
          ),
        );
        // Extract topic using OpenAI
        const tweetTexts = clusterTweets.map((t) => t.text).join('\n');
        // Get topic (2-3 words)
        const topicResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are a research assistant that specialized in Cryptocurrency and Blockchain Technology.',
            },
            {
              role: 'user',
              content: `\
What is the main topic of these tweets?\n
- Respond with a single, concise topic (2-3 words).\n
- Be specific. Avoid generic topics\n
- Bad examples: Web3 Technology, Various Emotions, AI Technology\n
- Good examples: Sui, Suilend, dydx, OpenSea, Macro, Hack, Web3 gaming\n\n${tweetTexts}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 10,
        });
        // Get summary (2-3 sentences)
        const summaryResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are a research assistant that specialized in Cryptocurrency and Blockchain Technology. Only deliver novel insights.',
            },
            {
              role: 'user',
              content: `Please summarize the tweets in 2-3 sentences. Just get directly to the point. No filler words. Respond in bullet points.\n\n${tweetTexts}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 100,
        });
        // Prepare row for DB
        return {
          cluster: i,
          centroidX,
          centroidY,
          radius,
          count: clusterPoints.length,
          topic: topicResponse.choices[0].message.content?.trim() || '',
          summary: summaryResponse.choices[0].message.content?.trim() || '',
          highlightText: highlightTweet.text,
          highlightUsername: highlightTweet.username,
          highlightTimestamp: new Date(highlightTweet.timestamp),
          highlightSmartFollowingCount:
            tweets.find((t) => t.id === highlightTweet.id)?.user
              .smartFollowingCount ?? null,
          computedAt: now,
        };
      }),
    );

    // Store all clusters in DB
    await prisma.tweetEmbeddingCluster.createMany({ data: clusterRows });

    return Response.json({
      message: 'Computation complete',
      clusters: clusterRows.length,
      computedAt: now,
    });
  } catch (error) {
    console.error('Error computing tweet embedding clusters:', error);
    return new Response('Error computing tweet embedding clusters', {
      status: 500,
    });
  }
}
