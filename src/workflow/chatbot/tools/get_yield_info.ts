import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { DefiLlamaClient } from '@/utils/defillama';

export const getYieldInfo = tool(
  async () => {
    try {
      const client = new DefiLlamaClient();
      const pools = await client.getPools();

      const minTvlUsd = 1_000_000;

      const stableUpPools = pools.data.filter(
        (pool) => pool.predictions.predictedClass === 'Stable/Up',
      );
      const highTvlPools = stableUpPools.filter(
        (pool) => pool.tvlUsd >= minTvlUsd,
      );

      const topPools = highTvlPools
        .sort((a, b) => (b.apy || 0) - (a.apy || 0))
        .slice(0, 3);

      if (topPools.length === 0) {
        return 'no yield opportunities match the criteria right now.';
      }

      const response = topPools
        .map(
          (pool, i) =>
            `${i + 1}. ${pool.symbol} on ${pool.project} (${pool.chain}) - ${pool.apy?.toFixed(2)}% apy`,
        )
        .join('\n');

      return `here are the top yield opportunities:\n${response}`;
    } catch {
      return 'sorry, had trouble getting yield data right now.';
    }
  },
  {
    name: 'get_yield_info',
    description: 'Get best yield generating opportunities',
    schema: z.object({
      noOp: z.string().optional().describe('No-op parameter.'),
    }),
  },
);
