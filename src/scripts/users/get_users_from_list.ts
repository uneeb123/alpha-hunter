import { getSecrets } from '@/utils/secrets';
import { TwitterApi } from 'twitter-api-v2';
import { Debugger } from '@/utils/debugger';
import * as fs from 'fs/promises';
import path from 'path';
import { ElfaClient } from '@/utils/elfa';

// TODO: fix the bug where ELFA API returns 429

const LIST_IDS = [
  '1914739622908977423', // Web3
  '1912427645058359799', // Crypto VC
  '1654276583606177793', // Memecoins
  '1917931785943404976', // BadAss KOLs.
];
const CURATED_FOLLOWING_PATH = path.join(__dirname, 'curated_following.json');
const OUTPUT_PATH = path.join(__dirname, 'users_from_lists.json');

async function fetchAllListMembers(
  listId: string,
  client: TwitterApi,
  debug: Debugger,
) {
  const members: any[] = [];
  const params = {
    max_results: 100,
    'user.fields':
      'id,name,username,description,profile_image_url,public_metrics',
  };
  try {
    const paginator = await client.v2.listMembers(listId, params);
    for await (const user of paginator) {
      members.push(user);
    }
    debug.verbose(`Fetched ${members.length} members for list ${listId}`);
  } catch (error) {
    debug.error(
      `Error in fetchAllListMembers for list ${listId}:`,
      error instanceof Error ? error.message : JSON.stringify(error),
    );
    throw error;
  }
  return members;
}

async function fetchUsersByIds(
  ids: string[],
  client: TwitterApi,
  debug: Debugger,
) {
  const users: any[] = [];
  const BATCH_SIZE = 100;
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    debug.info(
      `Fetching user info for batch ${i / BATCH_SIZE + 1} (${batch.length} users)`,
    );
    const resp = await client.v2.get('users', {
      ids: batch.join(','),
      'user.fields':
        'id,name,username,description,profile_image_url,public_metrics',
    });
    if (resp.data) {
      users.push(...resp.data);
    }
  }
  return users;
}

async function main() {
  const secrets = getSecrets();
  const debug = Debugger.getInstance();
  const client = new TwitterApi({
    appKey: secrets.twitterApiKey,
    appSecret: secrets.twitterApiSecret,
    accessToken: secrets.twitterAccessToken,
    accessSecret: secrets.twitterAccessSecret,
  });
  const elfa = new ElfaClient({ enabled: true, level: 'info' });

  // 1. Fetch all users from the lists
  const allUserObjs: any[] = [];
  for (const listId of LIST_IDS) {
    debug.info(`Fetching all users for list: ${listId}`);
    try {
      const members = await fetchAllListMembers(listId, client, debug);
      allUserObjs.push(...members);
    } catch (error) {
      debug.error(
        `Error fetching members for list ${listId}:`,
        error instanceof Error ? error.message : JSON.stringify(error),
      );
      process.exit(1);
    }
  }

  // 2. Read curated_following.json and extract IDs
  debug.info(`Reading curated following from ${CURATED_FOLLOWING_PATH}`);
  const curatedRaw = await fs.readFile(CURATED_FOLLOWING_PATH, 'utf-8');
  const curatedArr = JSON.parse(curatedRaw);
  const curatedIds = curatedArr.map((entry: any) => entry.following.accountId);
  debug.info(`Found ${curatedIds.length} curated following IDs`);

  // 3. Fetch user info for curated IDs
  let curatedUsers: any[] = [];
  try {
    curatedUsers = await fetchUsersByIds(curatedIds, client, debug);
    allUserObjs.push(...curatedUsers);
  } catch (error) {
    debug.error(
      'Error fetching curated user info (possibly rate limit):',
      error instanceof Error ? error.message : JSON.stringify(error),
    );
    // Proceed with whatever users we have so far
    // ...
  }

  // 4. Deduplicate by id
  const userMap = new Map();
  for (const user of allUserObjs) {
    if (user && user.id) {
      userMap.set(user.id, {
        id: user.id,
        name: user.name,
        username: user.username,
        description: user.description,
        profile_image_url: user.profile_image_url,
        public_metrics: user.public_metrics,
      });
    }
  }
  const dedupedUsers = Array.from(userMap.values());
  debug.info(`Total unique users: ${dedupedUsers.length}`);

  // 5. Fetch smart account stats for each user
  for (let i = 0; i < dedupedUsers.length; i++) {
    const user = dedupedUsers[i];
    if (!user.username) continue;
    try {
      debug.info(
        `Fetching smart stats for @${user.username} (${i + 1}/${dedupedUsers.length})`,
      );
      const statsResp = await elfa.getAccountSmartStats(user.username);
      user.smart_stats = statsResp?.data ?? null;
    } catch (err) {
      debug.error(
        `Failed to fetch smart stats for @${user.username}:`,
        err instanceof Error ? err.message : JSON.stringify(err),
      );
      user.smart_stats = null;
    }
  }

  // 6. Save to JSON file
  try {
    await fs.writeFile(
      OUTPUT_PATH,
      JSON.stringify(dedupedUsers, null, 2),
      'utf-8',
    );
    debug.info(`Saved all users to ${OUTPUT_PATH}`);
  } catch (err) {
    debug.error(
      'Failed to write output file:',
      err instanceof Error ? err.message : JSON.stringify(err),
    );
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
