import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Client } from '@upstash/qstash';
import { getSecrets } from '@/utils/secrets';

export async function GET(_req: NextRequest) {
  const secrets = getSecrets();
  const qstash = new Client({ token: secrets.qstashToken });
  const redis = new Redis({
    url: secrets.upstashRedisUrl,
    token: secrets.upstashRedisToken,
  });

  // ➊ Rotate queue head to tail (non-atomic)
  const popped = await redis.rpop<string>('tweet:queue');
  if (!popped)
    return NextResponse.json({ error: 'queue empty' }, { status: 204 });
  await redis.lpush('tweet:queue', popped);
  const userId = popped;

  // ➋ Publish a job to QStash
  await qstash.publishJSON({
    url: '/api/fetchTweets', // absolute if not same domain
    body: { userId }, // { "userId": "123" }
    // QStash will retry (exp back-off) on any non-2xx
  });

  return NextResponse.json({ enqueued: userId });
}
