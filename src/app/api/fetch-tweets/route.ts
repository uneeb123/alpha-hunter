import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
// import { Debugger } from '@/utils/debugger';
import { getSecrets } from '@/utils/secrets';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import axios from 'axios';

const prisma = new PrismaClient();
const secrets = getSecrets();

const s3 = new S3Client({ region: secrets.awsRegion });

// const debug = Debugger.getInstance();

export async function POST(req: NextRequest) {
  try {
    const { userId } = (await req.json()) as { userId: string };
    if (!userId)
      return NextResponse.json({ error: 'no userId' }, { status: 400 });

    // ➊ pull since-id (optional)
    const user = await prisma.user.findUnique({
      where: { twitterId: String(userId) },
    });
    if (!user) return NextResponse.json({ error: 'no user' }, { status: 400 });

    // ➋ Direct X API call using axios
    const params = {
      max_results: 100,
      exclude: 'retweets,replies',
      ...(user.sinceId && { since_id: user.sinceId }),
      'tweet.fields':
        'created_at,text,author_id,public_metrics,attachments,conversation_id,referenced_tweets,entities,note_tweet,context_annotations',
      'user.fields': 'id,name,profile_image_url,url,username',
      'media.fields':
        'url,preview_image_url,variants,type,width,height,alt_text,duration_ms',
      expansions:
        'attachments.media_keys,referenced_tweets.id,referenced_tweets.id.author_id,entities.mentions.username',
    };

    let response;
    try {
      response = await axios.get(
        `https://api.twitter.com/2/users/${userId}/tweets`,
        {
          headers: {
            Authorization: `Bearer ${secrets.twitterBearerToken}`,
          },
          params,
        },
      );
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 429) {
          console.error('X API rate limit error:', error.response.data);
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 },
          );
        }
        console.error('X API error:', error.response.data);
        return NextResponse.json(
          { error: 'X API error', details: error.response.data },
          { status: error.response.status },
        );
      }
      console.error('Unknown error during X API call:', error);
      return NextResponse.json(
        { error: 'Unknown error during X API call' },
        { status: 500 },
      );
    }
    const timeline = response;

    //   const jsonObj = timeline as any; // full response object

    // ➌ store tweets (flat slice) — keep only hot fields
    const tweets = (timeline.data?.data ?? []).map((t: any) => ({
      id: t.id,
      userId: user.id,
      text: t.text,
      timestamp: new Date(t.created_at || new Date()),
      s3Key: '', // fill later
      likeCount: t.public_metrics?.like_count ?? 0,
      retweetCount: t.public_metrics?.retweet_count ?? 0,
      replyCount: t.public_metrics?.reply_count ?? 0,
      quoteCount: t.public_metrics?.quote_count ?? 0,
      impressionCount: t.public_metrics?.impression_count ?? 0,
    }));

    // avoid duplicate crashes on retries
    let s3Key: string | undefined = undefined;
    if (tweets.length) {
      await prisma.tweet.createMany({ data: tweets, skipDuplicates: true });

      // update incremental cursor to newest tweet id
      await prisma.user.update({
        where: { id: user.id },
        data: { sinceId: tweets[0].id },
      });

      // ➍ gzip + upload raw payload
      s3Key = `raw/${userId}/${new Date()
        .toISOString()
        .replace(/[:.]/g, '-')}-${crypto.randomUUID()}.json`;

      await s3.send(
        new PutObjectCommand({
          Bucket: secrets.awsBucketName,
          Key: s3Key,
          Body: JSON.stringify(timeline.data, null, 2),
          ContentType: 'application/json',
        }),
      );

      // ➎ patch tweets with the s3Key in one fast query
      await prisma.$executeRawUnsafe(
        `UPDATE "Tweet" SET "s3Key"=$1 WHERE "userId"=$2 AND "s3Key"=''`,
        s3Key,
        user.id,
      );
    }

    return NextResponse.json({ saved: tweets.length, s3Key });
  } catch (err) {
    console.error('Unexpected error in /api/fetch-tweets:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
