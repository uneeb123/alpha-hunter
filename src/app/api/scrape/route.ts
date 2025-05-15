/*
import { Debugger } from '@/utils/debugger';
import { NextResponse } from 'next/server';
import { ScraperManager } from '@/workflow/scrapper/scraper_manager';
import { getSecrets } from '@/utils/secrets';
// import { PrismaClient } from '@prisma/client';

const debug = Debugger.create({
  enabled: true, // TODO: use a better debugger
  level: (process.env.DEBUG_LEVEL as 'info' | 'verbose' | 'error') || 'info',
});

// export const runtime = 'edge'; // Add edge runtime for better performance
export const dynamic = 'force-dynamic'; // Ensure the route is not cached
// 5 minutes timeout
export const maxDuration = 300;

export async function GET() {
  try {
    const secrets = getSecrets();
    const scraperManager = new ScraperManager(
      secrets.twitterApiKey,
      secrets.twitterApiSecret,
      secrets.twitterAccessToken,
      secrets.twitterAccessSecret,
    );

    // Check for stale running scrapers (>5 minutes old)
    const prisma = new PrismaClient();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const staleScraper = await prisma.scraper.findFirst({
      where: {
        status: 'RUNNING',
        startTime: {
          lt: fiveMinutesAgo,
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    if (staleScraper) {
      // First delete related records in ScraperToUser
      await prisma.scraperToUser.deleteMany({
        where: {
          scraperId: staleScraper.id,
        },
      });

      // Then delete the scraper
      await prisma.scraper.delete({
        where: {
          id: staleScraper.id,
        },
      });
      debug.info(`Deleted stale scraper with ID: ${staleScraper.id}`);
    }

    await scraperManager.initScraping();
    return NextResponse.json({ success: true });
  } catch (error) {
    debug.error('Error during scraping:', error as Error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
*/
