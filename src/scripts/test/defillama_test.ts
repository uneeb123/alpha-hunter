import { DefiLlamaClient, PoolData } from '../../utils/defillama';

function printPool(pool: PoolData) {
  // const poolInfo = {
  //   chain: pool.chain,
  //   symbol: pool.symbol,
  //   pool: pool.pool,
  //   underlyingTokens: pool.underlyingTokens,
  //   project: pool.project,
  //   tvl: pool.tvlUsd,
  //   apy: {
  //     '1d': pool.apyPct1D,
  //     '7d': pool.apyPct7D,
  //     '30d': pool.apyPct30D,
  //   },
  // };
  console.log(JSON.stringify(pool, null, 2));
}

async function main() {
  try {
    console.log('Testing DeFi Llama API client...');

    const client = new DefiLlamaClient();

    // Get all pools
    console.log('Fetching pools from DeFi Llama...');
    const pools = await client.getPools();
    console.log(`Found ${pools.data.length.toLocaleString()} total pools`);

    // Get unique prediction classes and their counts
    const predictionStats = pools.data.reduce(
      (acc, pool) => {
        const predClass = pool.predictions.predictedClass || 'null';
        acc[predClass] = (acc[predClass] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get unique projects and their counts
    const projectStats = pools.data.reduce(
      (acc, pool) => {
        const project = pool.project || 'null';
        acc[project] = (acc[project] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log('\nPrediction Class Distribution:');
    Object.entries(predictionStats)
      .sort(([, a], [, b]) => b - a) // Sort by count (descending)
      .forEach(([predClass, count]) => {
        const percentage = ((count / pools.data.length) * 100).toFixed(2);
        console.log(`${predClass}: ${count} pools (${percentage}%)`);
      });

    console.log('\nProject Distribution:');
    Object.entries(projectStats)
      .sort(([, a], [, b]) => b - a) // Sort by count (descending)
      .forEach(([project, count]) => {
        const percentage = ((count / pools.data.length) * 100).toFixed(2);
        console.log(`${project}: ${count} pools (${percentage}%)`);
      });

    const minTvlUsd = 1_000_000;

    // Debug filtering steps
    const stableUpPools = pools.data.filter(
      (pool) => pool.predictions.predictedClass === 'Stable/Up',
    );
    const highTvlPools = stableUpPools.filter(
      (pool) => pool.tvlUsd >= minTvlUsd,
    );

    console.log('\nFiltering steps:');
    console.log(`Stable/Up pools: ${stableUpPools.length}`);
    console.log(
      `After TVL filter (≥$${minTvlUsd.toLocaleString()}): ${highTvlPools.length}`,
    );

    const filteredPools = highTvlPools.sort(
      (a, b) => (b.apy || 0) - (a.apy || 0),
    ); // Sort by total APY descending

    if (filteredPools.length > 0) {
      console.log('\nTop 3 highest APY matching pools:');

      for (const [index, pool] of filteredPools.slice(0, 3).entries()) {
        console.log(`\n#${index + 1}:`);
        printPool(pool);
      }
    } else {
      console.log('\nNo pools match the criteria.');
    }

    // Get chart data for the first pool
    /*
    if (pools.data.length > 0) {
      const poolId = pools.data[0].pool;
      console.log(`\nFetching chart data for pool: ${poolId}`);
      const poolChart = await client.getPoolChart(poolId);
      console.log(`Retrieved ${poolChart.data.length} chart data points`);
      console.log('Sample chart data point:', poolChart.data[0]);
    }
    */
  } catch (error) {
    console.error('Error in DeFi Llama API test:', error);
  }
}

main();
