import { DefiLlamaClient, PoolData } from '../utils/defillama';
import { Command } from 'commander';
import { Debugger, DebugConfig } from '../utils/debugger';
import * as projectUrls from '../utils/yield_pools.json';
import { TelegramClient } from '../utils/telegram_client';
import { getSecrets } from '../utils/secrets';

const program = new Command();

program
  .option('-d, --debug [level]', 'Debug level (info or verbose)', 'info')
  .option('-t, --tvl <number>', 'Minimum TVL in USD', '1000000')
  .option('-l, --limit <number>', 'Number of pools to display', '1')
  .parse(process.argv);

const options = program.opts();

const debugConfig: DebugConfig = {
  enabled: true,
  level: options.debug === 'verbose' ? 'verbose' : 'info',
};

const debug = Debugger.create(debugConfig);

function formatPool(pool: PoolData): string {
  const projectUrl = projectUrls[pool.project as keyof typeof projectUrls];
  // Format for Telegram - using HTML formatting with link
  return `${pool.symbol} on <a href="${projectUrl}">${pool.project}</a> (${pool.chain}) has a ${pool.apy?.toFixed(2)}% APY`;
}

export const main = async (): Promise<void> => {
  debug.info(`Debug level: ${options.debug}`);
  debug.info(`Minimum TVL: $${parseInt(options.tvl).toLocaleString()}`);
  debug.info(`Display limit: ${options.limit}`);

  try {
    const client = new DefiLlamaClient();
    debug.info('Fetching pools from DeFi Llama...');

    const pools = await client.getPools();
    debug.info(`Found ${pools.data.length.toLocaleString()} total pools`);

    const minTvlUsd = 1_000_000;

    // Debug filtering steps
    const stableUpPools = pools.data.filter(
      (pool) => pool.predictions.predictedClass === 'Stable/Up',
    );
    const highTvlPools = stableUpPools.filter(
      (pool) => pool.tvlUsd >= minTvlUsd,
    );

    debug.info(`Stable/Up pools: ${stableUpPools.length}`);
    debug.info(
      `After TVL filter (≥$${minTvlUsd.toLocaleString()}): ${highTvlPools.length}`,
    );

    const filteredPools = highTvlPools.sort(
      (a, b) => (b.apy || 0) - (a.apy || 0),
    ); // Sort by total APY descending

    if (filteredPools.length > 0) {
      let output = '<b>Highest Yield Generating Opportunities Today:</b>';

      for (const [index, pool] of filteredPools.slice(0, 3).entries()) {
        output += `\n\n#${index + 1}:`;
        output += `\n${formatPool(pool)}`;
      }

      // Send to console (without HTML tags for cleaner console output)
      debug.info(output.replace(/<[^>]*>/g, ''));

      // Send to Telegram only if we have pools to report
      try {
        const secrets = getSecrets();
        const telegramClient = new TelegramClient(secrets.telegramBotToken);
        await telegramClient.sendSummary(output);
        debug.info('Successfully sent yield opportunities to Telegram');
      } catch (error) {
        debug.error('Failed to send to Telegram:', error as Error);
      }
    } else {
      // Just log to console, don't send to Telegram
      debug.info('\nNo pools match the criteria.');
    }
  } catch (error) {
    debug.error(`Failed to fetch yield data: ${error}`);
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
