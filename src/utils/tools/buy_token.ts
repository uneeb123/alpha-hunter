import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SniperooClient } from '@/utils/sniperoo_client';

export const buyToken = tool(
  async ({
    tokenAddress,
    inputAmount,
    profitPercentage,
    stopLossPercentage,
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
      });

      const purchaseSummaries = result.purchases
        .map(
          (purchase, index) => `
Purchase ${index + 1}:
Transaction: ${purchase.txSignature}
Token Amount: ${purchase.tokenAmount}
Token Amount in USD: $${purchase.tokenAmountInUSD}
Token Price in USD: $${purchase.tokenPriceInUSD}`,
        )
        .join('\n\n');

      return `Token Purchase Summary:
SOL Price in USD: $${result.solPriceInUSD}
${purchaseSummaries}`;
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
    description: 'Buy a token using Sniperoo with specified parameters',
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
    }),
  },
);
