import { JOBCOIN } from '../../utils/constants';
import { MoralisClient } from '../../utils/moralis_client';
import type { MoralisTokenPair, MoralisTokenSwap } from '@/types';

async function main() {
  try {
    const moralisClient = MoralisClient.getInstance();
    const tokenToInvestigate = '8i3bdsdDn7a4MchHVVAZApLzxT4NgJhKcSdTNStUpump';

    // Fetch JOBCOIN pairs
    console.log(`Fetching pairs for JOBCOIN (${JOBCOIN})...`);
    const pairs = await moralisClient.getPairsForToken(JOBCOIN);

    console.log('\nFound pairs:');
    pairs.forEach((pair: MoralisTokenPair) => {
      console.log(`\nPair: ${pair.exchangeName}`);
      console.log(`Status: ${pair.inactivePair ? 'Inactive' : 'Active'}`);
      console.log(`Pair Label: ${pair.pairLabel}`);
      console.log(`Pair Address: ${pair.pairAddress}`);
      console.log(`Price: ${pair.usdPrice} USD`);
      console.log(`24h Change: ${pair.usdPrice24hrPercentChange.toFixed(2)}%`);
      console.log(`24h Volume: ${pair.volume24hrUsd.toFixed(2)} USD`);
      console.log(`Total Liquidity: ${pair.liquidityUsd.toFixed(2)} USD`);

      const baseToken = pair.pair[0];
      const quoteToken = pair.pair[1];

      console.log('Tokens:');
      console.log(
        `  ${baseToken.tokenSymbol}: ${baseToken.liquidityUsd.toFixed(2)} USD`,
      );
      console.log(
        `  ${quoteToken.tokenSymbol}: ${quoteToken.liquidityUsd.toFixed(2)} USD`,
      );
    });

    // Fetch and display holder stats
    console.log('\n\nFetching holder stats...');
    const stats = await moralisClient.getTokenHolderStats(tokenToInvestigate);
    console.log(JSON.stringify(stats, null, 2));

    // Fetch and display swaps
    console.log('\n\nFetching recent swaps...');
    const oneMinuteAgo = Math.floor(Date.now() / 1000 - 60).toString(); // 1 minute ago
    const swaps = await moralisClient.getSwapsByTokenAddress(
      tokenToInvestigate,
      oneMinuteAgo,
    );

    console.log(`\nFound ${swaps.length} swaps in the last minute:`);
    swaps.forEach((swap: MoralisTokenSwap) => {
      console.log(`\nTransaction: ${swap.transactionHash}`);
      console.log(`Type: ${swap.transactionType}`);
      console.log(`Category: ${swap.subCategory}`);
      console.log(`Exchange: ${swap.exchangeName}`);
      console.log(`Pair: ${swap.pairLabel}`);
      console.log(`Wallet: ${swap.walletAddress}`);
      console.log(
        `Bought: ${swap.bought.amount} ${swap.bought.symbol} ($${swap.bought.usdAmount.toFixed(2)})`,
      );
      console.log(
        `Sold: ${swap.sold.amount} ${swap.sold.symbol} ($${swap.sold.usdAmount.toFixed(2)})`,
      );
      console.log(`Total Value: $${swap.totalValueUsd.toFixed(2)}`);
    });
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

main().catch(console.error);
