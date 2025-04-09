import { HeliusClient } from '@/utils/helius_client';

async function testHeliusClient() {
  console.log('Starting Helius client test...');

  const client = new HeliusClient();

  // Test transaction details fetch
  // Using a known Solana transaction as an example
  const testSignature =
    '5QKMaatK5NHE5j2DT8Nieo9PAQRmhuKwyULmSUtBqh3ULUQJBDq7vGAHEmyaM5JFBEsLJt3kWmtAyu5viw5opZbT';

  try {
    console.log(`Fetching transaction details for signature: ${testSignature}`);
    await client.getTransactionDetails(testSignature);
  } catch (error) {
    console.error('\nError during test:', error);
    process.exit(1);
  }

  const testToken = 'DssqfPeoHPWf3o14mXb6vvgJsw3uW6WLNZHDRnUJpump';

  const tokenDetails = await client.getTokenDetails(testToken);
  console.log(tokenDetails);
}

// Run the test
testHeliusClient().catch(console.error);
