import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ElfaClient } from '@/utils/elfa';
import { TrendingToken } from '@/utils/elfa.types';

const elfaClient = new ElfaClient();

export const getTrendingTokens = tool(
  async () => {
    try {
      const response = await elfaClient.getTrendingTokens();

      if (response.data.data.length === 0) {
        return 'no trending tokens found';
      }

      const tokens = response.data.data
        .map(
          (t: TrendingToken) =>
            `${t.token}: ${t.current_count} mentions (${
              t.change_percent >= 0 ? '+' : ''
            }${t.change_percent.toFixed(1)}% change)`,
        )
        .join('\n');
      return `trending tokens in the last 24h:\n${tokens}`;
    } catch {
      return "sorry, couldn't fetch trending tokens";
    }
  },
  {
    name: 'get_trending_tokens',
    description:
      'Get the trending tokens/tickers on social media in the last 24 hours',
    schema: z.object({}), // No parameters needed as the API defaults are sufficient
  },
);
