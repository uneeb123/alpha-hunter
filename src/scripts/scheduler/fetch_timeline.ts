import { getSecrets } from '@/utils/secrets';
import { TwitterApi } from 'twitter-api-v2';
import * as fs from 'fs/promises';

const userId = '376457303'; // Replace with your user ID
const outputPath = `tweets_${userId}.json`;

async function fetchTweetsForUser(userId: string) {
  const {
    twitterApiKey,
    twitterApiSecret,
    twitterAccessToken,
    twitterAccessSecret,
  } = getSecrets();

  const client = new TwitterApi({
    appKey: twitterApiKey,
    appSecret: twitterApiSecret,
    accessToken: twitterAccessToken,
    accessSecret: twitterAccessSecret,
  });

  const roClient = client.readOnly;

  const allTweets: any[] = [];
  let paginationToken: string | undefined = undefined;

  do {
    const resp = await roClient.v2.userTimeline(userId, {
      max_results: 100,
      pagination_token: paginationToken,
      'tweet.fields': ['id', 'text', 'created_at', 'public_metrics'],
      exclude: ['replies', 'retweets'], // optional: exclude replies/retweets
    });

    if (resp.data?.data) {
      allTweets.push(...resp.data.data);
    }

    paginationToken = resp.data?.meta?.next_token;
  } while (paginationToken);

  return allTweets;
}

async function main() {
  try {
    const tweets = await fetchTweetsForUser(userId);
    await fs.writeFile(outputPath, JSON.stringify(tweets, null, 2), 'utf-8');
    console.log(
      `Fetched ${tweets.length} tweets for user ${userId} and wrote to ${outputPath}`,
    );
  } catch (error) {
    console.error('Error fetching tweets:', error);
  }
}

main();
