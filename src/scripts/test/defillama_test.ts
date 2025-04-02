import { DefiLlamaClient } from '../../utils/defillama';

async function main() {
  try {
    console.log('Testing DeFi Llama API client...');

    const client = new DefiLlamaClient();

    // Get all pools
    console.log('Fetching pools...');
    const pools = await client.getPools();
    console.log(`Retrieved ${pools.data.length} pools`);
    console.log('Sample pool:', pools.data[0]);

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

    console.log('\nDeFi Llama API client test completed successfully!');
  } catch (error) {
    console.error('Error in DeFi Llama API test:', error);
  }
}

main();
