import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { BitQueryClient } from '@/utils/bitquery_client';
import { HeliusClient } from '@/utils/helius_client';
import { GraduatedToken, TokenMetadata } from '@/types';

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
      const bitquery = new BitQueryClient();
      const helius = new HeliusClient();

      const tokens = await bitquery.getRecentlyGraduatedToken();

      if (!tokens || tokens.length === 0) {
        return 'no newly created tokens found.';
      }

      const enrichedTokens = await Promise.all(
        tokens.map(async (token: GraduatedToken) => {
          try {
            const tokenDetails: TokenMetadata = await helius.getTokenDetails(
              token.pump_token,
            );

            const enrichedToken: EnrichedToken = {
              contractAddress: token.pump_token,
              name: tokenDetails.name || 'Unknown',
              symbol: tokenDetails.symbol || 'Unknown',
              creationTime: token.creation_time,
              creator: token.creator,
              supply: tokenDetails.supply,
              decimals: tokenDetails.decimals,
              image: tokenDetails.image,
            };

            return enrichedToken;
          } catch (error) {
            console.error(
              `Error fetching token details:`,
              error instanceof Error ? error.message : String(error),
            );
            return null;
          }
        }),
      );

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
      console.error(
        'Error in getNewlyCreatedTokens:',
        error instanceof Error ? error.message : String(error),
      );
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
