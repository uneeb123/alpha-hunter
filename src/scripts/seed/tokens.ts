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

const BATCH_SIZE = 500;

async function main() {
  try {
    debug.info('Fetching tokens from Postgres...');
    const tokens = await prisma.token.findMany({
      where: { chain: 'solana' },
      orderBy: { updatedAt: 'asc' },
      select: { address: true },
    });

    const addresses = tokens.map((t) => t.address);
    debug.info(
      `Fetched ${addresses.length} tokens. Pushing to Redis queue in batches of ${BATCH_SIZE}...`,
    );

    // Clear the queue first (optional, uncomment if you want to reset)
    // await redis.del('refresh-token:queue');

    for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
      const batch = addresses.slice(i, i + BATCH_SIZE).reverse();
      await redis.lpush('refresh-token:queue', ...batch);
      debug.info(`Pushed batch ${i / BATCH_SIZE + 1}`);
    }
    debug.info(`Seeded ${addresses.length} tokens to refresh-token:queue`);
  } catch (error) {
    debug.error(
      'Error seeding tokens to Redis:',
      error instanceof Error ? error.message : JSON.stringify(error),
    );
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
