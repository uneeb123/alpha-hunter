import { TwitterApi } from 'twitter-api-v2';
import { Debugger } from '@/utils/debugger';
import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSecrets } from '@/utils/secrets';

// TODO: Current implementation does not handle reasoning about images and articles.
// Need to add support for:
// - Image content analysis and understanding
// - Article content extraction and summarization
export class ScraperService {
  private client: TwitterApi;
  private debug: Debugger;
  private prisma: PrismaClient;
  private s3Client: S3Client;

  constructor(client: TwitterApi) {
    this.client = client;
    this.debug = Debugger.getInstance();
    this.prisma = new PrismaClient();

    const secrets = getSecrets();
    this.s3Client = new S3Client({ region: secrets.awsRegion });
  }

  async getRecentTweets(
    workflowId: number,
    userId: number,
    options: {
      sinceId?: string;
      maxResults: number;
      duration: number;
    },
  ) {
    // Get the Twitter user ID from the database
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twitterId: true },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const startTime = new Date(Date.now() - options.duration * 1000);
    this.debug.info('Fetching tweets since: ', new Date(startTime));

    //  5 requests / 15 mins
    const tweets = await this.client.v2.userTimeline(user.twitterId, {
      max_results: options?.maxResults,
      exclude: ['retweets', 'replies'],
      'tweet.fields': [
        'created_at',
        'text',
        'author_id',
        'public_metrics',
        'attachments',
        'conversation_id',
        'referenced_tweets',
        'entities',
        'note_tweet',
        'context_annotations',
      ],
      'user.fields': ['id', 'name', 'profile_image_url', 'url', 'username'],
      'media.fields': [
        'url',
        'preview_image_url',
        'variants',
        'type',
        'width',
        'height',
        'alt_text',
        'duration_ms',
      ],
      expansions: [
        'attachments.media_keys',
        'referenced_tweets.id',
        'referenced_tweets.id.author_id',
        'entities.mentions.username',
      ],
      start_time: startTime.toISOString(),
      ...(options?.sinceId && { since_id: options.sinceId }),
    });
    this.debug.verbose(`tweets: `, tweets);

    // Add null checks for the tweets response
    if (tweets?.data?.data && tweets.data.data.length > 0) {
      // Get the latest tweet ID from the response
      const latestTweetId = tweets.data.data[0].id;

      // Find the earliest tweet time
      const earliestTweet = tweets.data.data.reduce<Date | null>(
        (earliest, tweet) => {
          if (!tweet.created_at) return earliest;
          const tweetDate = new Date(tweet.created_at);
          return earliest && earliest < tweetDate ? earliest : tweetDate;
        },
        null,
      );

      // Generate S3 key
      const s3Key = `scraper/${workflowId}_${userId}.json`;

      // Save tweets response to S3
      const secrets = getSecrets();
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: secrets.awsBucketName,
          Key: s3Key,
          Body: JSON.stringify(tweets, null, 2),
          ContentType: 'application/json',
        }),
      );

      // Create or update the ScraperToUser record
      const scraperToUser = await this.prisma.scraperToUser.upsert({
        where: {
          userId_scraperId: {
            userId: userId,
            scraperId: workflowId,
          },
        },
        update: {
          filePath: s3Key,
          lastFetchedTweetId: latestTweetId,
          earliestTweetTime: earliestTweet,
        },
        create: {
          userId: userId,
          scraperId: workflowId,
          filePath: s3Key,
          lastFetchedTweetId: latestTweetId,
          earliestTweetTime: earliestTweet,
          skipped: false,
        },
      });
      this.debug.info(
        `Scraped successful for ${userId}, workflow ${workflowId}`,
      );
      this.debug.verbose(scraperToUser);
    } else {
      // When no tweets are found, create/update record with skipped=true
      const scraperToUser = await this.prisma.scraperToUser.upsert({
        where: {
          userId_scraperId: {
            userId: userId,
            scraperId: workflowId,
          },
        },
        update: {
          skipped: true,
        },
        create: {
          userId: userId,
          scraperId: workflowId,
          skipped: true,
        },
      });
      this.debug.info(`No new tweets found for user: ${userId}`);
      this.debug.verbose(scraperToUser);
    }
  }
}
