import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { MoralisClient } from '@/utils/moralis_client';

export const getHolderData = new DynamicStructuredTool({
  name: 'getHolderData',
  description:
    'Get detailed holder statistics for a token including distribution, changes over time, and acquisition methods',
  schema: z.object({
    tokenAddress: z.string().describe('The Solana token address to analyze'),
  }),
  func: async ({ tokenAddress }) => {
    try {
      const moralisClient = MoralisClient.getInstance();
      const stats = await moralisClient.getTokenHolderStats(tokenAddress);

      // Format the response in a human-readable way
      const response = {
        totalHolders: stats.totalHolders,
        recentChanges: {
          lastHour: `${stats.holderChange['1h'].changePercent.toFixed(2)}% (${stats.holderChange['1h'].change} holders)`,
          last24Hours: `${stats.holderChange['24h'].changePercent.toFixed(2)}% (${stats.holderChange['24h'].change} holders)`,
          last7Days: `${stats.holderChange['7d'].changePercent.toFixed(2)}% (${stats.holderChange['7d'].change} holders)`,
        },
        distribution: {
          whales: stats.holderDistribution.whales,
          sharks: stats.holderDistribution.sharks,
          dolphins: stats.holderDistribution.dolphins,
          fish: stats.holderDistribution.fish,
          smaller:
            stats.holderDistribution.octopus +
            stats.holderDistribution.crabs +
            stats.holderDistribution.shrimps,
        },
        acquisitionMethods: {
          fromSwaps: stats.holdersByAcquisition.swap,
          fromTransfers: stats.holdersByAcquisition.transfer,
          fromAirdrops: stats.holdersByAcquisition.airdrop,
        },
      };

      return JSON.stringify(response, null, 2);
    } catch (error) {
      if (error instanceof Error) {
        return `Error fetching holder data: ${error.message}`;
      }
      return 'An unknown error occurred while fetching holder data';
    }
  },
});
