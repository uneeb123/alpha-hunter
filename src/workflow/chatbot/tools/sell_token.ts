import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SniperooClient } from '@/utils/sniperoo_client';

export const sellToken = tool(
  async ({
    tokenAddress,
    percentage,
    slippageInPercentage,
    prioritizationFeeInSolana,
    jitoTipInSolana,
  }) => {
    try {
      const sniperoo = new SniperooClient();
      const results = await sniperoo.sellToken({
        tokenAddress,
        percentage: percentage ? parseFloat(percentage) : undefined,
        slippageInPercentage: slippageInPercentage
          ? parseFloat(slippageInPercentage)
          : undefined,
        prioritizationFeeInSolana: prioritizationFeeInSolana
          ? parseFloat(prioritizationFeeInSolana)
          : undefined,
        jitoTipInSolana: jitoTipInSolana
          ? parseFloat(jitoTipInSolana)
          : undefined,
      });

      const summaries = results
        .map(
          (result, index) => `
Sale ${index + 1}:
Transaction ID: ${result.transactionId}
Token Address: ${result.tokenAddress}
SOL Amount: ${result.solAmount}
Token Amount: ${result.tokenAmount}
Date: ${new Date(result.transactionDate).toLocaleString()}
Status: ${result.status}`,
        )
        .join('\n');

      return `Token Sale Summary:${summaries}`;
    } catch (error) {
      console.error(
        'Error in sellToken:',
        error instanceof Error ? error.message : String(error),
      );
      return 'Sorry, had trouble executing the token sale.';
    }
  },
  {
    name: 'sell_token',
    description: 'Sell token',
    schema: z.object({
      tokenAddress: z.string().describe('The address of the token to sell'),
      percentage: z
        .string()
        .optional()
        .describe('Percentage of tokens to sell (default: 100)'),
      slippageInPercentage: z
        .string()
        .optional()
        .describe('Slippage tolerance percentage'),
      prioritizationFeeInSolana: z
        .string()
        .optional()
        .describe('Priority fee in SOL'),
      jitoTipInSolana: z.string().optional().describe('Jito tip amount in SOL'),
    }),
  },
);
