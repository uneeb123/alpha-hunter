import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ElfaClient } from '@/utils/elfa';
import { TopMentionData } from '@/utils/elfa.types';

const elfaClient = new ElfaClient();

export const searchTweetsForTicker = tool(
  async (input) => {
    try {
      const response = await elfaClient.getTopMentions({
        ticker: input.token,
        timeWindow: '24h',
        pageSize: 10,
        includeAccountDetails: true,
      });

      if (response.data.data.length === 0) {
        return `no recent mentions found for ${input.token}`;
      }

      const mentions = response.data.data
        .map(
          (m: TopMentionData) =>
            `"${m.content}" - @${m.twitter_account_info?.username || 'unknown'}`,
        )
        .join('\n');
      return `recent mentions for ${input.token}:\n${mentions}`;
    } catch {
      return `sorry, couldn't get info for ${input.token}`;
    }
  },
  {
    name: 'search_tweets_for_ticker',
    description: 'Get recent social mentions for a token/ticker symbol',
    schema: z.object({
      token: z.string().describe('Token/ticker symbol to get mentions for'),
    }),
  },
);
