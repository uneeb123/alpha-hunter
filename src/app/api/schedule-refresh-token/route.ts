import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Client } from '@upstash/qstash';
import { getSecrets } from '@/utils/secrets';

export async function GET() {
  const secrets = getSecrets();
  const qstash = new Client({ token: secrets.qstashToken });
  const redis = new Redis({
    url: secrets.upstashRedisUrl,
    token: secrets.upstashRedisToken,
  });

  const batchSize = 100;
  const addresses: string[] = [];

  for (let i = 0; i < batchSize; i++) {
    const popped = await redis.rpop<string>('refresh-token:queue');
    if (!popped) break;
    addresses.push(popped);
    await redis.lpush('refresh-token:queue', popped); // maintain rotation
  }

  if (addresses.length === 0) {
    return NextResponse.json({ error: 'queue empty' }, { status: 204 });
  }

  // Enqueue all jobs in parallel
  await Promise.all(
    addresses.map((address) =>
      qstash.publishJSON({
        url: `https://${secrets.productionUrl}/api/refresh-token`,
        body: { address },
      }),
    ),
  );

  return NextResponse.json({ enqueued: addresses });
}
