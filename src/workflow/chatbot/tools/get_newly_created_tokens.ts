import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { BitQueryClient } from '@/utils/bitquery_client';
import { HeliusClient } from '@/utils/helius_client';
import { PumpSwapPool, TokenMetadata } from '@/types';

interface EnrichedToken {
  contractAddress: string;
  name: string;
  symbol: string;
  creationTime: string;
  creator: string;
  description?: string;
  supply?: number;
  decimals?: number;
  image?: string;
}

export const getNewlyCreatedTokens = tool(
  async () => {
    try {
      // Initialize clients
      const bitquery = new BitQueryClient();
      const helius = new HeliusClient();

      // Get recently graduated tokens from BitQuery
      const pools = await bitquery.getRecentPumpSwapPools(10);

      if (!pools || pools.length === 0) {
        return 'no newly created tokens found.';
      }

      // Extract token information and enrich with Helius data
      const enrichedTokens = await Promise.all(
        pools.map(async (pool: PumpSwapPool) => {
          // Find the mint token argument from the pool creation instruction
          const mintArg = pool.Instruction.Program.Arguments.find(
            (arg) => arg.Name === 'mint_token',
          );

          if (!mintArg?.Value?.address) {
            return null;
          }

          try {
            // Get detailed token information from Helius
            const tokenDetails: TokenMetadata = await helius.getTokenDetails(
              mintArg.Value.address,
            );

            const enrichedToken: EnrichedToken = {
              contractAddress: mintArg.Value.address,
              name: tokenDetails.name || 'Unknown',
              symbol: tokenDetails.symbol || 'Unknown',
              creationTime: pool.Block.Time,
              creator: pool.Transaction.Signer,
              supply: tokenDetails.supply,
              decimals: tokenDetails.decimals,
              image: tokenDetails.image,
            };

            return enrichedToken;
          } catch {
            return null;
          }
        }),
      );

      // Filter out null values and format response
      const validTokens = enrichedTokens.filter(
        (token): token is EnrichedToken => token !== null,
      );

      if (validTokens.length === 0) {
        return 'no valid token information found.';
      }

      const response = validTokens
        .map(
          (token, i) =>
            `${i + 1}. ${token.name} (${token.symbol})\n` +
            `   Contract Address (CA): ${token.contractAddress}\n` +
            `   Created: ${new Date(token.creationTime).toLocaleString()}\n`,
        )
        .join('\n\n');

      return `Here are the recently created tokens:\n\n${response}`;
    } catch (error) {
      console.error('Error in getNewlyCreatedTokens:', error);
      return 'sorry, had trouble fetching new token information.';
    }
  },
  {
    name: 'get_newly_created_tokens',
    description: 'Get information about newly created tokens on Solana',
    schema: z.object({
      noOp: z.string().optional().describe('No-op parameter.'),
    }),
  },
);
