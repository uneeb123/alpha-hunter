import { Debugger } from '@/utils/debugger';
import { NextResponse } from 'next/server';
import { ScraperManager } from '@/workflow/scrapper/scraper_manager';
import { getSecrets } from '@/utils/secrets';

const debug = Debugger.create({
  enabled: true, // TODO: use a better debugger
  level: (process.env.DEBUG_LEVEL as 'info' | 'verbose' | 'error') || 'info',
});

// export const runtime = 'edge'; // Add edge runtime for better performance
export const dynamic = 'force-dynamic'; // Ensure the route is not cached

// Configure the route as a Vercel Cron Job
export const config = {
  maxDuration: 300, // 5 minutes timeout
};

export async function GET() {
  try {
    const secrets = getSecrets();
    const scraperManager = new ScraperManager(
      secrets.twitterApiKey,
      secrets.twitterApiSecret,
      secrets.twitterAccessToken,
      secrets.twitterAccessSecret,
    );

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
