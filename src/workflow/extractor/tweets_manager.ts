import { TwitterApi } from 'twitter-api-v2';
import * as fs from 'fs/promises';
import { Debugger } from '@/utils/debugger';
import { PrismaClient } from '@prisma/client';
import { ApiResponseError } from 'twitter-api-v2';

export class TweetsManager {
  private client: TwitterApi;
  private debug: Debugger;
  private prisma: PrismaClient;

  constructor(
    appKey: string,
    appSecret: string,
    accessToken: string,
    accessSecret: string,
  ) {
    this.debug = Debugger.getInstance();
    this.client = new TwitterApi({
      appKey,
      appSecret,
      accessToken,
      accessSecret,
    });

    this.prisma = new PrismaClient();
  }

  async postTweet(content: string): Promise<void> {
    try {
      await this.client.v2.tweet(content);
    } catch (error) {
      console.error('Error posting tweet:', error);
      throw error;
    }
  }

  async postTweetWithMedia(
    processorId: number,
    content: string,
  ): Promise<void> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 10000; // 10 seconds

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Check if file exists and log its size
        const stats = await fs.stat(`data/${processorId}/podcast.mp4`);
        console.log(
          `Video file size: ${stats.size} bytes (${(stats.size / 1024 / 1024).toFixed(2)}MB)`,
        );

        // Twitter video size limit is 512MB for most accounts
        const MAX_VIDEO_SIZE = 512 * 1024 * 1024; // 512MB in bytes
        if (stats.size > MAX_VIDEO_SIZE) {
          throw new Error(
            `Video file size (${(stats.size / 1024 / 1024).toFixed(2)}MB) exceeds Twitter's limit of 512MB`,
          );
        }

        // Upload the video file with chunked upload for larger files
        console.log(`Attempt ${attempt}: Starting media upload...`);
        const mediaId = await this.client.v1.uploadMedia(
          `data/${processorId}/podcast.mp4`,
          {
            mimeType: 'video/mp4',
            longVideo: true,
            chunkLength: 1024 * 1024 * 5, // Increased to 5MB chunks
          },
        );
        console.log('Media upload completed, mediaId:', mediaId);

        // Modified media processing check with timeout
        const MAX_PROCESSING_TIME = 5 * 60 * 1000; // 5 minutes
        const startTime = Date.now();

        while (true) {
          const status = await this.client.v1.mediaInfo(mediaId);
          const state = status.processing_info?.state;

          console.log(`Media processing status: ${state}`);

          if (state === 'succeeded') {
            break;
          }

          if (state === 'failed') {
            throw new Error('Media processing failed');
          }

          if (Date.now() - startTime > MAX_PROCESSING_TIME) {
            throw new Error('Media processing timeout');
          }

          await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        // Add a longer wait time after processing
        await new Promise((resolve) => setTimeout(resolve, 10000));

        // Post tweet with the uploaded media
        console.log('Posting tweet with media...');
        await this.client.v2.tweet({
          text: content,
          media: { media_ids: [mediaId] },
        });

        console.log('Tweet posted successfully');
        return; // Success - exit the retry loop
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, {
          error,
          message: (error as Error)?.message,
          code: (error as ApiResponseError)?.code,
          data: (error as ApiResponseError)?.data,
          stack: (error as Error)?.stack,
        });

        if (attempt === MAX_RETRIES) {
          throw error; // Rethrow on final attempt
        }

        // Wait before retrying
        console.log(`Waiting ${RETRY_DELAY / 1000} seconds before retry...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
}
