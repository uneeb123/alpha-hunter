import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SniperooClient } from '@/utils/sniperoo_client';

export const buyToken = tool(
  async ({
    tokenAddress,
    inputAmount,
    profitPercentage,
    stopLossPercentage,
    slippageInPercentage,
    prioritizationFeeInSolana,
    jitoTipInSolana,
  }) => {
    try {
      const sniperoo = new SniperooClient();
      const result = await sniperoo.buyToken({
        tokenAddress,
        inputAmount: parseFloat(inputAmount),
        profitPercentage: profitPercentage
          ? parseFloat(profitPercentage)
          : undefined,
        stopLossPercentage: stopLossPercentage
          ? parseFloat(stopLossPercentage)
          : undefined,
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

      return `Token Purchase Summary:
Transaction ID: ${result.transactionId}
Token Address: ${result.tokenAddress}
SOL Amount: ${result.solAmount}
Token Amount: ${result.tokenAmount}
Date: ${new Date(result.transactionDate).toLocaleString()}
Status: ${result.status}`;
    } catch (error) {
      console.error(
        'Error in buyToken:',
        error instanceof Error ? error.message : String(error),
      );
      return 'Sorry, had trouble executing the token purchase.';
    }
  },
  {
    name: 'buy_token',
    description: 'Buy token',
    schema: z.object({
      tokenAddress: z.string().describe('The address of the token to buy'),
      inputAmount: z.string().describe('The amount of SOL to spend'),
      profitPercentage: z
        .string()
        .optional()
        .describe('Target profit percentage'),
      stopLossPercentage: z
        .string()
        .optional()
        .describe('Stop loss percentage'),
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
