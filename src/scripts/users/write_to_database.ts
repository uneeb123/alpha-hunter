import { Database } from '@/utils/database';
import * as fs from 'fs/promises';
import path from 'path';
import { Debugger } from '@/utils/debugger';

const USERS_PATH = path.join(__dirname, 'users_from_lists.json');

async function main() {
  const debug = Debugger.getInstance();
  const prisma = Database.getInstance().createClient();
  let users;
  try {
    const raw = await fs.readFile(USERS_PATH, 'utf-8');
    users = JSON.parse(raw);
  } catch (err) {
    debug.error(
      'Failed to load users_from_lists.json:',
      err instanceof Error ? err.message : JSON.stringify(err),
    );
    process.exit(1);
  }

  let inserted = 0,
    updated = 0,
    skipped = 0;
  for (const user of users) {
    if (!user.id || !user.name || !user.username) {
      debug.info(
        `Skipping user with missing id/name/username: ${JSON.stringify(user)}`,
      );
      skipped++;
      continue;
    }
    if (!user.smart_stats) {
      debug.info(
        `Skipping user with null smart_stats: ${user.username} (${user.id})`,
      );
      skipped++;
      continue;
    }
    try {
      const result = await prisma.user.upsert({
        where: { twitterId: user.id.toString() },
        update: {
          name: user.name,
          username: user.username,
          description: user.description ?? null,
          profileImageUrl: user.profile_image_url ?? null,
          followersCount: user.public_metrics?.followers_count ?? null,
          followingCount: user.public_metrics?.following_count ?? null,
          tweetCount: user.public_metrics?.tweet_count ?? null,
          listedCount: user.public_metrics?.listed_count ?? null,
          likeCount: user.public_metrics?.like_count ?? null,
          mediaCount: user.public_metrics?.media_count ?? null,
          smartFollowingCount: user.smart_stats?.smartFollowingCount ?? null,
          averageEngagement: user.smart_stats?.averageEngagement ?? null,
          followerEngagementRatio:
            user.smart_stats?.followerEngagementRatio ?? null,
        },
        create: {
          twitterId: user.id.toString(),
          name: user.name,
          username: user.username,
          description: user.description ?? null,
          profileImageUrl: user.profile_image_url ?? null,
          followersCount: user.public_metrics?.followers_count ?? null,
          followingCount: user.public_metrics?.following_count ?? null,
          tweetCount: user.public_metrics?.tweet_count ?? null,
          listedCount: user.public_metrics?.listed_count ?? null,
          likeCount: user.public_metrics?.like_count ?? null,
          mediaCount: user.public_metrics?.media_count ?? null,
          smartFollowingCount: user.smart_stats?.smartFollowingCount ?? null,
          averageEngagement: user.smart_stats?.averageEngagement ?? null,
          followerEngagementRatio:
            user.smart_stats?.followerEngagementRatio ?? null,
        },
      });
      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        inserted++;
      } else {
        updated++;
      }
    } catch (err) {
      debug.error(
        `Failed to upsert user ${user.username} (${user.id}):`,
        err instanceof Error ? err.message : JSON.stringify(err),
      );
      skipped++;
    }
  }
  debug.info(
    `Done. Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`,
  );
  await prisma.$disconnect();
}

main();
