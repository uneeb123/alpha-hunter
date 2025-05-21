import { Pinecone } from '@pinecone-database/pinecone';
import { getSecrets } from '@/utils/secrets';
import { prisma } from '@/lib/prisma';
import { UMAP } from 'umap-js';
import OpenAI from 'openai';
import { HDBSCAN } from 'hdbscan-ts';

const secrets = getSecrets();
const pinecone = new Pinecone({ apiKey: secrets.pineconeApiKey }).Index(
  'tweets-embed',
);
const openai = new OpenAI({ apiKey: secrets.openaiApiKey });

export async function POST() {
  try {
    // 1. Fetch tweets from last week with pineId not null
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tweets = (
      await prisma.tweet.findMany({
        where: {
          pineId: { not: null },
          timestamp: { gte: oneWeekAgo },
        },
        include: {
          user: {
            select: {
              username: true,
              smartFollowingCount: true,
            },
          },
        },
      })
    ).filter((tweet) => tweet.text.length >= 50);

    console.log('Processing Tweets: ', tweets.length);

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

    function normalize(vec: number[]): number[] {
      const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
      return vec.map((v) => v / norm);
    }
    const vectors = tweets.map((tweet) => ({
      id: tweet.id,
      text: tweet.text,
      username: tweet.user.username,
      timestamp: tweet.timestamp,
      embedding: normalize(embeddings[tweet.pineId!]?.values || []),
    }));

    // 1. HDBSCAN clustering on original embeddings
    const minClusterSize = 3;
    const hdbscan = new HDBSCAN({ minClusterSize, minSamples: 8 });
    hdbscan.fit(vectors.map((v) => v.embedding));
    const labels = hdbscan.labels_;

    // Group indices by cluster label (ignore noise: label === -1)
    const clustersMap = new Map<number, number[]>();
    labels.forEach((label: number, idx: number) => {
      if (label === -1) return; // skip noise
      if (!clustersMap.has(label)) clustersMap.set(label, []);
      clustersMap.get(label)!.push(idx);
    });
    const filteredClusters = Array.from(clustersMap.values());

    // Compute centroids, UMAP, and radii for each cluster
    const now = new Date();
    const clusterRows = await Promise.all(
      filteredClusters.map(async (cluster: number[], i: number) => {
        const clusterEmbeddings = cluster.map(
          (idx: number) => vectors[idx].embedding,
        );
        const clusterTweets = cluster.map((idx: number) => vectors[idx]);
        // Run UMAP for this cluster to get 2D coords
        const nNeighbors = Math.max(
          2,
          Math.min(15, clusterEmbeddings.length - 1),
        );
        const umap = new UMAP({ nComponents: 2, nNeighbors, minDist: 0.1 });
        const clusterCoords = umap.fit(clusterEmbeddings);
        // Calculate centroid in UMAP space
        const centroidX =
          clusterCoords.reduce((sum, p) => sum + p[0], 0) /
          clusterCoords.length;
        const centroidY =
          clusterCoords.reduce((sum, p) => sum + p[1], 0) /
          clusterCoords.length;
        // Calculate radius in UMAP space
        const radius = Math.max(
          ...clusterCoords.map((p) =>
            Math.sqrt(
              Math.pow(p[0] - centroidX, 2) + Math.pow(p[1] - centroidY, 2),
            ),
          ),
        );
        // Find the tweet from user with highest smartFollowingCount
        const highlightTweet = clusterTweets.reduce(
          (
            highest: (typeof clusterTweets)[0],
            current: (typeof clusterTweets)[0],
          ) => {
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
          },
          clusterTweets[0],
        );
        // Truncate tweetTexts to avoid OpenAI context length error
        const maxTweets = 30;
        const maxChars = 4000;
        let tweetTexts = clusterTweets
          .slice(0, maxTweets)
          .map((t) => t.text)
          .join('\n');
        if (tweetTexts.length > maxChars) {
          tweetTexts = tweetTexts.slice(0, maxChars);
        }
        // Get topic (2-3 words)
        const topicResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
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
          model: 'gpt-4o-mini',
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
          count: clusterTweets.length,
          topic: topicResponse.choices[0].message.content?.trim() || '',
          summary: summaryResponse.choices[0].message.content?.trim() || '',
          highlightText: highlightTweet.text,
          highlightUsername: highlightTweet.username,
          highlightTimestamp: new Date(highlightTweet.timestamp),
          highlightSmartFollowingCount:
            tweets.find((t) => t.id === highlightTweet.id)?.user
              .smartFollowingCount ?? null,
          computedAt: now,
          tweetIds: clusterTweets.map((t) => t.id),
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
