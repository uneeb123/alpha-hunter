import { getSecrets } from '@/utils/secrets';
import { TwitterApi, TweetSearchRecentV2Paginator } from 'twitter-api-v2';

/**
 * Fetches recent search counts from Twitter/X API
 * @param query - Search query string
 * @param options - Additional search parameters
 * @returns Promise with search count data
 */
export async function search(
  query: string,
  options?: {
    startTime?: string;
    endTime?: string;
  },
): Promise<TweetSearchRecentV2Paginator> {
  const secrets = getSecrets();

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
    const response = await client.v2.search(query, {
      start_time: options?.startTime,
      end_time: options?.endTime,
    });

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Twitter API error: ${error.message}`);
    }
    throw error;
  }
}
