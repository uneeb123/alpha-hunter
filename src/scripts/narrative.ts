import * as dotenv from 'dotenv';
import { Command } from 'commander';
import { Debugger, DebugConfig } from '@/utils/debugger';
import { ElfaExtractor } from '@/workflow/narrative/elfa_extractor';

dotenv.config();

const program = new Command();

program
  .option('-l, --limit <number>', 'Number of tweets to retrieve', '100')
  .option('-d, --debug [level]', 'Debug level (info or verbose)', 'info')
  .parse(process.argv);

const options = program.opts();

const debugConfig: DebugConfig = {
  enabled: true,
  level: options.debug === 'verbose' ? 'verbose' : 'info',
};

const debug = Debugger.create(debugConfig);

export const main = async (): Promise<void> => {
  debug.info(`Retrieving and analyzing crypto tweets...`);
  debug.info(`Limit: ${options.limit}`);
  debug.info(`Additional filters: ${options.filter || 'None'}`);
  debug.info(`Debug level: ${options.debug}`);

  try {
    // Validate limit
    const limit = parseInt(options.limit, 10);
    if (limit > 100) {
      debug.error(`Limit exceeds maximum allowed (100). Setting limit to 100.`);
    }

    // Initialize ElfaExtractor with options
    const elfaExtractor = new ElfaExtractor({
      limit: Math.min(limit, 100),
      debugConfig,
    });

    // Run the extraction process
    const insights = await elfaExtractor.run();

    // Print insights to console
    console.log(insights);
  } catch (error) {
    debug.error(`Failed to complete workflow: ${error}`);
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
