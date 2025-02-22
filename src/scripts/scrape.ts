import * as dotenv from 'dotenv';
import { Command } from 'commander';
import { Debugger, DebugConfig } from '@/utils/debugger';
import { ScraperManager } from '@/workflow/scrapper/scraper_manager';
import { getSecrets } from '@/utils/secrets';

dotenv.config();

const program = new Command();

program
  .option('-d, --debug [level]', 'Debug level (info or verbose)', 'info')
  .option('-l, --loop', 'Run continuously with 5-minute intervals', false)
  .parse(process.argv);

const options = program.opts();

const debugConfig: DebugConfig = {
  enabled: true,
  level: options.debug === 'verbose' ? 'verbose' : 'info',
};

const debug = Debugger.create(debugConfig);

export const main = async (): Promise<void> => {
  debug.info(`Debug level: ${options.debug}`);
  debug.info(`Loop mode: ${options.loop}`);

  const runScraper = async () => {
    try {
      const secrets = getSecrets();
      const scraperManager = new ScraperManager(
        secrets.twitterApiKey,
        secrets.twitterApiSecret,
        secrets.twitterAccessToken,
        secrets.twitterAccessSecret,
      );

      await scraperManager.initScraping();
    } catch (error) {
      debug.error(`Failed to complete workflow: ${error}`);
      throw error;
    }
  };

  if (options.loop) {
    try {
      while (true) {
        await runScraper();
        debug.info('Waiting 5 minutes before next run...');
        await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000));
      }
    } catch (error) {
      debug.error('Error in loop mode, stopping execution');
      throw error;
    }
  } else {
    await runScraper();
  }
};

process.on('SIGINT', () => {
  debug.error('Received SIGINT signal (Ctrl+C). Shutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Error running main:', error);
  process.exit(1);
});
