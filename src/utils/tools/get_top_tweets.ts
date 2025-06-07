import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ElfaClient } from '@/utils/elfa';
import { MentionData } from '@/utils/elfa.types';

const elfaClient = new ElfaClient();

export const getTopTweets = tool(
  async ({ limit = 5 } = {}) => {
    try {
      const response = await elfaClient.getMentions({
        limit,
        offset: 0,
      });

      if (response.data.length === 0) {
        return 'no recent mentions found';
      }

      const mentions = response.data
        .map(
          (m: MentionData) =>
            `"${m.content}" - @${m.account.username || 'unknown'}`,
        )
        .join('\n');
      return `recent top mentions:\n${mentions}`;
    } catch {
      return "sorry, couldn't fetch recent mentions";
    }
  },
  {
    name: 'get_top_tweets',
    description: 'Get the hottest topics on social media such as X or Twitter',
    schema: z.object({
      limit: z
        .number()
        .optional()
        .describe('Number of mentions to return (default: 5)'),
    }),
  },
);
