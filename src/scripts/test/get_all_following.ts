import { TwitterApi, UserV2, UserV2Result } from 'twitter-api-v2';
import { getSecrets } from '@/utils/secrets';
import * as fs from 'fs';

async function getAllFollowing(userName: string) {
  const secrets = getSecrets();
  const client = new TwitterApi({
    appKey: secrets.twitterApiKey,
    appSecret: secrets.twitterApiSecret,
    accessToken: secrets.twitterAccessToken,
    accessSecret: secrets.twitterAccessSecret,
  });

  try {
    // Get user ID from username
    const user: UserV2Result = await client.v2.userByUsername(userName);
    if (!user?.data?.id) {
      console.error(`Could not find user with username: ${userName}`);
      return;
    }
    const userId = user.data.id;
    const following: string[] = [];
    let paginationToken: string | undefined = undefined;
    do {
      // TODO: Replace 'any' with the correct type for the response when known
      const res: any = await client.v2.following(userId, {
        asPaginator: true,
        pagination_token: paginationToken,
        'user.fields': ['username'],
        max_results: 1000,
      });
      if (res?.data?.length) {
        following.push(...res.data.map((u: UserV2) => u.username!));
      }
      paginationToken = res.meta?.next_token;
    } while (paginationToken);

    // Save to following.json
    fs.writeFileSync('following.json', JSON.stringify(following, null, 2));
    console.log(`Saved ${following.length} usernames to following.json`);
  } catch (error) {
    console.error('Error fetching following list:', error);
    throw error;
  }
}

async function main() {
  const username = '0xasdf_eth';
  await getAllFollowing(username);
}

main().catch((error) => {
  console.error('Application error:', error);
  process.exit(1);
});
