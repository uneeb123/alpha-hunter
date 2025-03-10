import { ParsedData } from '@/types';
import { Debugger } from '@/utils/debugger';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { TweetsParser } from './tweets_parser';
import { getSecrets } from '@/utils/secrets';

export class TweetsCompiler {
  private debug: Debugger;
  private prisma: PrismaClient;
  private s3Client: S3Client;
  private secrets = getSecrets();

  constructor() {
    this.debug = Debugger.getInstance();
    this.prisma = new PrismaClient();
    this.s3Client = new S3Client({ region: this.secrets.awsRegion });
  }

  async getTweetContents(
    alpha: {
      id: number;
      name: string;
      users: Array<{
        id: number;
        twitterId: string;
        twitterName: string;
        twitterUser: string;
      }>;
    },
    processor: { id: number },
    cutoffTime: Date,
  ) {
    const allUserResults: ParsedData = [];
    for (const user of alpha.users) {
      this.debug.info(`Processing user: @${user.twitterUser} (ID: ${user.id})`);
      this.debug.verbose(
        `Finding earliest tweet time before ${cutoffTime} for user ${user.id}`,
      );
      const latestTweet = await this.prisma.scraperToUser.findFirst({
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
        this.debug.verbose(
          `Found earliest tweet time ${latestTweet.earliestTweetTime} for user ${user.id}`,
        );
      } else {
        this.debug.info(
          `No previous tweets found for user ${user.id}, will process from beginning`,
        );
      }
      const newerTweets = await this.prisma.scraperToUser.findMany({
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
        this.debug.verbose(
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

    this.debug.info(`Processed tweets for ${allUserResults.length} users`);
    this.debug.verbose(
      'All user results:',
      JSON.stringify(allUserResults, null, 2),
    );

    const parsedTweetsPath = `extractor/${processor.id}_parsed.json`;
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.secrets.awsBucketName,
        Key: parsedTweetsPath,
        Body: JSON.stringify(allUserResults, null, 2),
        ContentType: 'application/json',
      }),
    );
    this.debug.info(`Uploaded parsed results to S3: ${parsedTweetsPath}`);

    // Update processor with parsed tweets path
    await this.prisma.processor.update({
      where: { id: processor.id },
      data: { parsedTweetsPath },
    });
    this.debug.info('Updated processor with parsed tweets path');

    return this.compile(allUserResults);
  }

  compile(parsedData: ParsedData) {
    let formattedText = '';

    for (const userTweets of parsedData) {
      for (const tweet of userTweets.tweets) {
        formattedText += `${userTweets.user.data.name} wrote at ${tweet.created_at} (${tweet.view_count} views)\n\n`;

        if (tweet.text.length === 1) {
          formattedText += `${tweet.text[0]}\n\n`;
        } else {
          tweet.text.forEach((text: string, index: number) => {
            formattedText += `${index + 1}. ${text}\n\n`;
          });
        }

        // Add source URL for the tweet
        formattedText += `Source: https://x.com/${userTweets.user.data.username}/status/${tweet.id}\n\n`;

        formattedText += '---\n\n';
      }
    }

    this.debug.verbose(formattedText);

    return formattedText;
  }
}
