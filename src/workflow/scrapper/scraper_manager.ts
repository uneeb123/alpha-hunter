/*
import { TwitterApi } from 'twitter-api-v2';
import { ScraperService } from './scraper_service';
import { Debugger } from '@/utils/debugger';
import { PrismaClient } from '@prisma/client';
import { ApiResponseError } from 'twitter-api-v2';
import { Database } from '@/utils/database';

export class ScraperManager {
  private maxResults: number = 100;
  private defaultDuration: number = 24 * 60 * 60; // 1 day
  public scraper: ScraperService;

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

    this.scraper = new ScraperService(this.client);
    this.prisma = Database.getInstance().createClient();
  }

  async initScraping() {
    // Check for the last scraper regardless of status
    const lastScraper = await this.prisma.scraper.findFirst({
      where: {},
      orderBy: {
        endTime: 'desc',
      },
    });
    this.debug.verbose(`LastScraper: `, lastScraper);

    let activeScraper;
    if (
      lastScraper &&
      lastScraper.status === 'PAUSED' &&
      lastScraper.resumeTime
    ) {
      const currentTime = new Date();
      if (currentTime < lastScraper.resumeTime) {
        this.debug.info(
          'Scraper is paused and resume time has not been reached. Exiting...',
        );
        return;
      }
      // Resume the workflow by updating status back to RUNNING
      activeScraper = await this.prisma.scraper.update({
        where: { id: lastScraper.id },
        data: { status: 'RUNNING', resumeTime: null },
      });
      this.debug.info('Resuming paused scraper workflow...');
    } else if (lastScraper?.status === 'RUNNING') {
      this.debug.info('A scraper is already running. Exiting...');
      return;
    } else {
      // Create new scraper only if we're not resuming
      activeScraper = await this.prisma.scraper.create({
        data: {
          status: 'RUNNING',
          startTime: new Date(),
        },
      });
      this.debug.info(`Started scraping with workflow ID: ${activeScraper.id}`);
      this.debug.verbose(`newScraper: `, activeScraper);
    }

    try {
      const users = await this.prisma.user.findMany();
      const lastFinishedScraper = await this.prisma.scraper.findFirst({
        where: {
          status: 'FINISHED',
        },
        orderBy: {
          endTime: 'desc',
        },
      });
      for (const user of users) {
        await this.initScrapingForUser(
          activeScraper.id,
          user.id,
          lastFinishedScraper?.id,
        );
      }
    } catch (error) {
      if (error instanceof ApiResponseError) {
        // Handle rate limits
        if (error.rateLimitError && error.rateLimit) {
          const rateLimit = error.rateLimit;
          this.debug.error(`Rate limit exceeded`);

          // Pause the workflow and save the reset timestamp
          await this.prisma.scraper.update({
            where: { id: activeScraper.id },
            data: {
              status: 'PAUSED',
              resumeTime: new Date(rateLimit.reset * 1000),
            },
          });

          this.debug.info(
            `Workflow paused due to rate limit. Will reset at: ${new Date(rateLimit.reset * 1000)}`,
          );
          return;
        }
      } else {
        this.debug.error(
          `Workflow ${activeScraper.id} failed:`,
          error as Error,
        );

        // Mark the scraper as failed
        await this.prisma.scraper.update({
          where: { id: activeScraper.id },
          data: {
            status: 'FAILED',
            endTime: new Date(),
          },
        });
      }
    } finally {
      // Check if all users have a record in ScraperToUser and either have filePath or are skipped
      const allUsers = await this.prisma.user.count();
      const processedUsers = await this.prisma.scraperToUser.count({
        where: {
          scraperId: activeScraper.id,
          OR: [{ filePath: { not: null } }, { skipped: true }],
        },
      });

      if (allUsers === processedUsers) {
        // Mark the scraper as finished when all users are processed
        const lastFinishedScraper = await this.prisma.scraper.findFirst({
          where: {
            status: 'FINISHED',
          },
          orderBy: {
            endTime: 'desc',
          },
        });
        await this.prisma.scraper.update({
          where: { id: activeScraper.id },
          data: {
            status: 'FINISHED',
            endTime: new Date(),
            previousId: lastFinishedScraper?.id,
          },
        });

        this.debug.info(`Done scraping with workflow ID: ${activeScraper.id}`);
      } else {
        this.debug.info(
          `Workflow ID: ${activeScraper.id} has processed ${processedUsers}/${allUsers} users`,
        );
      }
    }
  }

  async initScrapingForUser(
    workflowId: number,
    userId: number,
    prevWorkflowId?: number,
  ) {
    // Check if ScraperToUser already exists
    const existingRecord = await this.prisma.scraperToUser.findUnique({
      where: {
        userId_scraperId: {
          userId: userId,
          scraperId: workflowId,
        },
      },
    });

    if (existingRecord) {
      this.debug.info(
        `Skipping user ${userId} as it's already been processed in workflow ${workflowId}`,
      );
      return;
    }

    let sinceId: string | undefined;
    if (prevWorkflowId) {
      sinceId = await this.findLastValidScraperForUser(userId, prevWorkflowId);
      if (sinceId) {
        this.debug.info(`User ID: ${userId} has last tweet: ${sinceId}`);
      }
    }

    this.debug.info(
      `Started scraping for workflow ID: ${workflowId} user ID: ${userId}`,
    );
    await this.scraper.getRecentTweets(workflowId, userId, {
      sinceId,
      maxResults: this.maxResults,
      duration: this.defaultDuration,
    });
  }

  async findLastValidScraperForUser(
    userId: number,
    currentWorkflowId: number,
  ): Promise<string | undefined> {
    const scraperData = await this.prisma.scraperToUser.findFirst({
      where: {
        userId: userId,
        scraperId: currentWorkflowId,
      },
    });

    if (!scraperData) return undefined;

    if (!scraperData.skipped && scraperData.lastFetchedTweetId) {
      return scraperData.lastFetchedTweetId;
    }

    // Get the previous scraper in the chain
    const previousScraper = await this.prisma.scraper.findUnique({
      where: { id: currentWorkflowId },
      select: { previousId: true },
    });

    if (previousScraper?.previousId) {
      return this.findLastValidScraperForUser(
        userId,
        previousScraper.previousId,
      );
    }

    return undefined;
  }
}
*/
