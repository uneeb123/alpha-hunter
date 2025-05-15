/*
import { getSecrets } from '@/utils/secrets';
import { TwitterApi, TweetSearchRecentV2Paginator } from 'twitter-api-v2';
import { PrismaClient } from '@prisma/client';
import { Debugger } from '@/utils/debugger';

export async function search(
  query: string,
  options?: {
    startTime?: string;
    endTime?: string;
  },
): Promise<TweetSearchRecentV2Paginator> {
  const secrets = getSecrets();
  const debug = Debugger.getInstance();

  if (
    !secrets.twitterApiKey ||
    !secrets.twitterApiSecret ||
    !secrets.twitterAccessToken ||
    !secrets.twitterAccessSecret
  ) {
    throw new Error('Twitter API credentials are not configured');
  }

  // Create TwitterApi client using the same authentication as TweetsManager
  const client = new TwitterApi({
    appKey: secrets.twitterApiKey,
    appSecret: secrets.twitterApiSecret,
    accessToken: secrets.twitterAccessToken,
    accessSecret: secrets.twitterAccessSecret,
  });

  const params: Record<string, string> = {
    query,
  };

  if (options?.startTime) params.start_time = options.startTime;
  if (options?.endTime) params.end_time = options.endTime;

  try {
    // Use client.v2.search instead of manual endpoint call
    debug.info(`Calling Twitter API search with query: ${query}`);
    const response = await client.v2.search(query, {
      start_time: options?.startTime,
      end_time: options?.endTime,
    });

    debug.verbose('Twitter API search response:', response);
    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Twitter API error: ${error.message}`);
    }
    throw error;
  }
}

// 100 requests / 24 hours
export async function getUsernameById(userId: string): Promise<string> {
  const prisma = new PrismaClient();
  const debug = Debugger.getInstance();

  try {
    // First try to get the user from our database
    debug.info(`Looking up user with Twitter ID: ${userId} in database`);
    const user = await prisma.user.findUnique({
      where: {
        twitterId: userId,
      },
    });

    // If user exists in our database, return the username
    if (user) {
      debug.verbose('User found in database:', user);
      await prisma.$disconnect();
      return user.twitterUser;
    }

    // If not in database, fetch from Twitter API
    const secrets = getSecrets();

    if (
      !secrets.twitterApiKey ||
      !secrets.twitterApiSecret ||
      !secrets.twitterAccessToken ||
      !secrets.twitterAccessSecret
    ) {
      throw new Error('Twitter API credentials are not configured');
    }

    // Create TwitterApi client
    const client = new TwitterApi({
      appKey: secrets.twitterApiKey,
      appSecret: secrets.twitterApiSecret,
      accessToken: secrets.twitterAccessToken,
      accessSecret: secrets.twitterAccessSecret,
    });

    // Fetch user data from Twitter API
    debug.info(`Fetching user data from Twitter API for ID: ${userId}`);
    const userData = await client.v2.user(userId);

    debug.verbose('Twitter API user response:', userData);

    if (!userData.data) {
      throw new Error(`User with ID ${userId} not found on Twitter`);
    }

    // Store the user in our database for future queries
    await prisma.user.create({
      data: {
        twitterId: userId,
        twitterName: userData.data.name,
        twitterUser: userData.data.username,
      },
    });

    await prisma.$disconnect();
    return userData.data.username;
  } catch (error) {
    await prisma.$disconnect();
    if (error instanceof Error) {
      throw new Error(`Error fetching username: ${error.message}`);
    }
    throw error;
  }
}
*/
