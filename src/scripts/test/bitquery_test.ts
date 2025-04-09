import { BitQueryClient } from '@/utils/bitquery_client';

async function testBitQuery() {
  console.log('Testing BitQuery Client...');

  const client = new BitQueryClient();

  console.log('Fetching recent PumpSwap pools...');
  try {
    const tokens = await client.getRecentlyGraduatedToken();
    console.log('Recently Graduated Tokens:');
    console.log(JSON.stringify(tokens, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the tests
testBitQuery()
  .then(() => {
    console.log('\nAll tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
