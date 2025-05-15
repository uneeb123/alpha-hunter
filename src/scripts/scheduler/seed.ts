import { Database } from '@/utils/database';
import { getSecrets } from '@/utils/secrets';
import { Redis } from '@upstash/redis';
import { Debugger } from '@/utils/debugger';

const debug = Debugger.getInstance();
const prisma = Database.getInstance().createClient();

const secrets = getSecrets();
const redis = new Redis({
  url: secrets.upstashRedisUrl,
  token: secrets.upstashRedisToken,
});

async function main() {
  try {
    debug.info('Fetching users from Postgres...');
    const users = await prisma.user.findMany({
      where: {
        followersCount: { gte: 5000 },
        followingCount: { gte: 250 },
        smartFollowingCount: { gte: 100 },
      },
      orderBy: { tweetCount: 'desc' },
    });

    const ids = users.map((u) => u.twitterId);
    debug.info(`Fetched ${ids.length} users. Pushing to Redis queue...`);

    if (ids.length > 0) {
      await redis.lpush('tweet:queue', ...ids.slice().reverse());
    }
    debug.info(`Seeded ${ids.length} users to tweet:queue`);
  } catch (error) {
    debug.error(
      'Error seeding users to Redis:',
      error instanceof Error ? error.message : JSON.stringify(error),
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
