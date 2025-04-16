import { MoralisClient } from '../../utils/moralis_client';
import { JOBCOIN } from '../../utils/constants';
import { TokenPair } from '../../types/moralis';

async function main() {
  try {
    const moralisClient = MoralisClient.getInstance();
    console.log(`Fetching pairs for JOBCOIN (${JOBCOIN})...`);

    const pairs: TokenPair[] = await moralisClient.getPairsForToken(JOBCOIN);

    console.log('\nFound pairs:');
    pairs.forEach((pair, index) => {
      console.log(`\nPair ${index + 1}: ${pair.exchangeName}`);
      console.log(`Status: ${pair.inactivePair ? 'Inactive' : 'Active'}`);
      console.log(`Pair Label: ${pair.pairLabel}`);
      console.log(`Pair Address: ${pair.pairAddress}`);
      console.log(`Price: ${pair.usdPrice} USD`);
      console.log(`24h Change: ${pair.usdPrice24hrPercentChange.toFixed(2)}%`);
      console.log(`24h Volume: ${pair.volume24hrUsd.toFixed(2)} USD`);
      console.log(`Total Liquidity: ${pair.liquidityUsd.toFixed(2)} USD`);

      const baseToken = pair.pair.find((t) => t.pairTokenType === 'token0')!;
      const quoteToken = pair.pair.find((t) => t.pairTokenType === 'token1')!;

      console.log('Tokens:');
      console.log(
        `  ${baseToken.tokenSymbol}: ${baseToken.liquidityUsd.toFixed(2)} USD`,
      );
      console.log(
        `  ${quoteToken.tokenSymbol}: ${quoteToken.liquidityUsd.toFixed(2)} USD`,
      );
    });
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
