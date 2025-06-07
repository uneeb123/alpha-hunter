import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { MoralisClient } from '@/utils/moralis_client';
import type { MoralisTokenSwap } from '@/types';

export const getMomentum = new DynamicStructuredTool({
  name: 'getMomentum',
  description:
    'Analyze recent trading momentum for a token based on buy/sell activity',
  schema: z.object({
    tokenAddress: z.string().describe('The Solana token address to analyze'),
    timeWindowMinutes: z
      .number()
      .optional()
      .describe('Time window in minutes to analyze (default: 60)'),
  }),
  func: async ({ tokenAddress, timeWindowMinutes = 60 }) => {
    try {
      const moralisClient = MoralisClient.getInstance();
      const fromDate = Math.floor(
        Date.now() / 1000 - timeWindowMinutes * 60,
      ).toString();
      const swaps = await moralisClient.getSwapsByTokenAddress(
        tokenAddress,
        fromDate,
      );

      if (swaps.length === 0) {
        return `No trading activity found in the last ${timeWindowMinutes} minutes`;
      }

      // Analyze momentum
      let buyVolume = 0;
      let sellVolume = 0;
      let largestBuy = 0;
      let largestSell = 0;
      const uniqueBuyers = new Set();
      const uniqueSellers = new Set();

      swaps.forEach((swap: MoralisTokenSwap) => {
        const isBuy = swap.transactionType.toUpperCase() === 'BUY';
        const volume = swap.totalValueUsd;

        if (isBuy) {
          buyVolume += volume;
          largestBuy = Math.max(largestBuy, volume);
          uniqueBuyers.add(swap.walletAddress);
        } else {
          sellVolume += volume;
          largestSell = Math.max(largestSell, volume);
          uniqueSellers.add(swap.walletAddress);
        }
      });

      const buyToSellRatio = sellVolume > 0 ? buyVolume / sellVolume : Infinity;
      const momentumScore =
        buyToSellRatio > 1
          ? Math.min(buyToSellRatio, 10) / 10
          : -Math.min(1 / buyToSellRatio, 10) / 10;

      const response = {
        timeWindow: `${timeWindowMinutes} minutes`,
        totalTrades: swaps.length,
        momentum: {
          score: momentumScore.toFixed(2), // -1 to 1, where positive is bullish
          interpretation:
            momentumScore > 0.3
              ? 'Strong Buy Pressure'
              : momentumScore > 0
                ? 'Slight Buy Pressure'
                : momentumScore > -0.3
                  ? 'Slight Sell Pressure'
                  : 'Strong Sell Pressure',
        },
        volumes: {
          buyVolume: buyVolume.toFixed(2),
          sellVolume: sellVolume.toFixed(2),
          ratio: buyToSellRatio.toFixed(2),
        },
        participants: {
          uniqueBuyers: uniqueBuyers.size,
          uniqueSellers: uniqueSellers.size,
        },
        largestTrades: {
          largestBuy: largestBuy.toFixed(2),
          largestSell: largestSell.toFixed(2),
        },
      };

      return JSON.stringify(response, null, 2);
    } catch (error) {
      if (error instanceof Error) {
        return `Error analyzing momentum: ${error.message}`;
      }
      return 'An unknown error occurred while analyzing momentum';
    }
  },
});
