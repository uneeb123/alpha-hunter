import * as dotenv from 'dotenv';
import { Debugger, DebugConfig } from '@/utils/debugger';
import { ElfaClient } from '@/utils/elfa';

// Load environment variables
dotenv.config();

const debugConfig: DebugConfig = {
  enabled: true,
  level: 'info',
};

const debug = Debugger.create(debugConfig);

const main = async (): Promise<void> => {
  try {
    debug.info('Starting Elfa API test');

    // Create a new Elfa client instance
    const elfaClient = new ElfaClient(debugConfig);

    // Test ping endpoint
    // debug.info('Testing ping endpoint...');
    // const pingResponse = await elfaClient.pingApi();
    // debug.info('Ping response:', pingResponse);

    // // Test key-status endpoint
    // debug.info('Testing key-status endpoint...');
    // const keyStatusResponse = await elfaClient.getKeyStatus();
    // debug.info('Key status response:', keyStatusResponse);

    // // Test mentions endpoint
    // debug.info('Testing mentions endpoint...');
    const mentionsResponse = await elfaClient.getMentions();
    debug.info('Mentions response:', mentionsResponse);

    // // Test top-mentions endpoint
    // debug.info('Testing top-mentions endpoint...');
    // const topMentionsResponse = await elfaClient.getTopMentions({
    //   ticker: 'BTC',
    // });
    // debug.info('Top mentions response:', topMentionsResponse);

    // // Test search-mentions endpoint
    // debug.info('Testing search-mentions endpoint...');
    // const searchResponse = await elfaClient.searchMentions({
    // keywords: 'World Liberty Financial',
    // });
    // debug.info('Search mentions response:', searchResponse);

    // // Test trending-tokens endpoint
    // debug.info('Testing trending-tokens endpoint...');
    // const trendingTokensResponse = await elfaClient.getTrendingTokens();
    // debug.info('Trending tokens response:', trendingTokensResponse);

    // // Test account-smart-stats endpoint
    // debug.info('Testing account-smart-stats endpoint...');
    // const smartStatsResponse =
    //   await elfaClient.getAccountSmartStats('loomdart');
    // debug.info('Account smart stats response:', smartStatsResponse);

    debug.info('Elfa API test completed successfully');
  } catch (error) {
    debug.error('Failed to test Elfa API:', error as Error);
    process.exit(1);
  }
};

// Run the main function
main().catch((error) => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});
