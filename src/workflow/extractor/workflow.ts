import { TweetsManager } from '@/workflow/extractor/tweets_manager';
import { generateSummary } from '@/workflow/extractor/summary_client';
import { generatePodcastScript } from '@/workflow/extractor/podcast_script_client';
import {
  generatePodcastAudio,
  generatePodcastVideo,
} from '@/workflow/extractor/podcast_client';
import { Debugger } from '@/utils/debugger';
import { getSecrets } from '@/utils/secrets';
import { TweetsParser } from './tweets_parser';
import { PrismaClient } from '@prisma/client';
import { ParsedData } from '@/types';
import { TweetsCompiler } from './tweets_compiler';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// import { generateAudio } from './voice_client';

export async function processWorkflow(
  alphaId: number,
  dryRun: boolean,
  hours: number,
): Promise<void> {
  const debug = Debugger.getInstance();
  const secrets = getSecrets();
  const prisma = new PrismaClient();

  const alpha = await prisma.alpha.findUnique({
    where: { id: alphaId },
    include: { users: true },
  });

  if (!alpha) {
    throw new Error(`Alpha with ID ${alphaId} not found`);
  }

  debug.info(`Found ${alpha.users.length} users for Alpha: ${alpha.name}`);

  const processor = await prisma.processor.create({
    data: {
      alphaId: alphaId,
    },
  });
  debug.info('Created processor record:', processor.id);

  // Get the cutoff time based on current time minus specified hours
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  const allUserResults: ParsedData = [];
  for (const user of alpha.users) {
    debug.info(`Processing user: @${user.twitterUser} (ID: ${user.id})`);
    debug.verbose(
      `Finding earliest tweet time before ${cutoffTime} for user ${user.id}`,
    );
    const latestTweet = await prisma.scraperToUser.findFirst({
      where: {
        userId: user.id,
        earliestTweetTime: {
          lt: cutoffTime,
        },
      },
      orderBy: {
        earliestTweetTime: 'desc',
      },
    });
    if (latestTweet?.earliestTweetTime) {
      debug.info(
        `Found earliest tweet time ${latestTweet.earliestTweetTime} for user ${user.id}`,
      );
    } else {
      debug.info(
        `No previous tweets found for user ${user.id}, will process from beginning`,
      );
    }
    const newerTweets = await prisma.scraperToUser.findMany({
      where: {
        userId: user.id,
        earliestTweetTime: {
          gte: latestTweet?.earliestTweetTime ?? new Date(0),
        },
        filePath: {
          not: null,
        },
      },
      select: {
        filePath: true,
      },
      orderBy: {
        earliestTweetTime: 'asc',
      },
    });

    // Create batchesToProcess array with latestTweet (if exists) plus all newerTweets
    const batchesToProcess = [
      ...(latestTweet?.filePath ? [latestTweet.filePath] : []),
      ...newerTweets.map((tweet) => tweet.filePath),
    ].filter((filePath): filePath is string => filePath != null);

    if (batchesToProcess.length > 0) {
      debug.info(
        `Will process ${batchesToProcess.length} batches for user ${user.id}:`,
        batchesToProcess,
      );

      // Process all batches and combine results
      const parser = new TweetsParser();
      const results = await Promise.all(
        batchesToProcess.map((batch) => parser.run(batch)),
      );
      const combinedResults = results.flat();

      // Add user's combined results to overall results
      allUserResults.push({
        user: {
          data: {
            id: user.twitterId,
            name: user.twitterName,
            username: user.twitterUser,
          },
        },
        tweets: combinedResults,
      });
    }
  }

  debug.info(`Processed tweets for ${allUserResults.length} users`);
  debug.verbose('All user results:', allUserResults);

  const s3Client = new S3Client({ region: secrets.awsRegion });
  const parsedTweetsPath = `extractor/${processor.id}_parsed.json`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: secrets.awsBucketName,
      Key: parsedTweetsPath,
      Body: JSON.stringify(allUserResults, null, 2),
      ContentType: 'application/json',
    }),
  );
  debug.info(`Uploaded parsed results to S3: ${parsedTweetsPath}`);

  // Update processor with parsed tweets path
  await prisma.processor.update({
    where: { id: processor.id },
    data: { parsedTweetsPath },
  });
  debug.info('Updated processor with parsed tweets path');

  const contents = new TweetsCompiler().run(allUserResults);

  const summary = await generateSummary(
    secrets.anthropicApiKey,
    contents,
    alpha.name,
  );
  debug.info('Generated summary');
  debug.verbose(summary);

  await prisma.processor.update({
    where: { id: processor.id },
    data: { summary },
  });
  debug.info('Updated processor with summary');

  const script = await generatePodcastScript(
    secrets.anthropicApiKey,
    contents,
    alpha.name,
  );
  debug.info('Generated podcast script');
  debug.verbose(script);

  await prisma.processor.update({
    where: { id: processor.id },
    data: { generatedScript: script },
  });
  debug.info('Updated processor with generated script');

  const lines = await generatePodcastAudio(
    secrets.elevenLabsApiKey,
    script,
    processor.id,
  );
  debug.info('Generated podcast audio');
  debug.verbose(lines);

  await generatePodcastVideo(processor.id, lines);
  debug.info('Generated podcast video');

  if (!dryRun) {
    debug.info('Posting to Twitter');
    const tweetsManager = new TweetsManager(
      secrets.twitterApiKey,
      secrets.twitterApiSecret,
      secrets.twitterAccessToken,
      secrets.twitterAccessSecret,
    );
    await tweetsManager.postTweetWithMedia(processor.id, summary);
  } else {
    debug.info('Skipping Twitter post (dry run)');
  }
}
