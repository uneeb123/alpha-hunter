import { TwitterApi } from 'twitter-api-v2';
import { PrismaClient } from '@prisma/client';
import { getSecrets } from '@/utils/secrets';
import { ApiResponseError } from 'twitter-api-v2';

const prisma = new PrismaClient();

async function getUsersFromDatabase() {
  try {
    // Query Prisma for users with Twitter IDs
    const dbUsers = await prisma.user.findMany({
      select: {
        twitterId: true,
      },
    });

    const twitterIds = dbUsers.map((user) => user.twitterId);
    return twitterIds;
  } catch (error) {
    console.error('Error fetching users from database:', error);
    throw error;
  }
}

async function getUserTimeline(
  userTwitterId: string,
  options: {
    sinceId?: string;
    maxResults: number;
    duration: number;
  },
) {
  const secrets = getSecrets();
  const client = new TwitterApi({
    appKey: secrets.twitterApiKey,
    appSecret: secrets.twitterApiSecret,
    accessToken: secrets.twitterAccessToken,
    accessSecret: secrets.twitterAccessSecret,
  });

  const startTime = new Date(Date.now() - options.duration * 1000);

  try {
    const tweets = await client.v2.userTimeline(userTwitterId, {
      max_results: options?.maxResults,
      exclude: ['retweets', 'replies'],
      'tweet.fields': [
        'created_at',
        'text',
        'author_id',
        'public_metrics',
        'attachments',
        'conversation_id',
        'referenced_tweets',
        'entities',
        'note_tweet',
        'context_annotations',
      ],
      'user.fields': ['id', 'name', 'profile_image_url', 'url', 'username'],
      'media.fields': [
        'url',
        'preview_image_url',
        'variants',
        'type',
        'width',
        'height',
        'alt_text',
        'duration_ms',
      ],
      expansions: [
        'attachments.media_keys',
        'referenced_tweets.id',
        'referenced_tweets.id.author_id',
        'entities.mentions.username',
      ],
      start_time: startTime.toISOString(),
      ...(options?.sinceId && { since_id: options.sinceId }),
    });

    return tweets;
  } catch (error) {
    if (error instanceof ApiResponseError) {
      // Handle rate limits
      if (error.rateLimitError && error.rateLimit) {
        const rateLimit = error.rateLimit;
        console.error(
          `Rate limit exceeded for user ${userTwitterId}. Reset at: ${new Date(rateLimit.reset * 1000)}`,
          `\nRemaining requests: ${rateLimit.remaining}/${rateLimit.limit}`,
        );
      }
    }
    console.error(`Error fetching timeline for user ${userTwitterId}:`, error);
    throw error;
  }
}

async function main() {
  try {
    // Get all Twitter IDs from database
    const userIds = await getUsersFromDatabase();

    // For each user, fetch their timeline
    for (const userId of userIds) {
      const timeline = await getUserTimeline(userId, {
        maxResults: 100, // Fetch up to 100 tweets
        duration: 86400, // Last 24 hours (in seconds)
      });

      console.log(
        `Fetched ${timeline.data.data.length} tweets for user ${userId}`,
      );
    }
  } catch (error) {
    console.error('Error in main function:', error);
    throw error;
  }
}

// Execute the main function
main().catch((error) => {
  console.error('Application error:', error);
  process.exit(1);
});
