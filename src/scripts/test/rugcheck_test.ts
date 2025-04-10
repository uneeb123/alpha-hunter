import { RugcheckClient } from '../../utils/rugcheck_client';

async function main() {
  try {
    console.log('Testing Rugcheck Client...');

    const client = RugcheckClient.getInstance();
    console.log('Attempting to login...');

    const jwt = await client.login();
    console.log('Successfully logged in!');
    console.log('JWT:', jwt.substring(0, 20) + '...');

    // Test token report
    // Using BONK token address as an example
    const tokenAddress = 'B2hahF8hVBSFmffCSMaKPs2r8BkkggGYAbzR3Mrdpump';
    console.log(`\nFetching token report for ${tokenAddress}...`);

    const report = await client.getTokenReport(tokenAddress);
    console.log('Token report received:', JSON.stringify(report, null, 2));
  } catch (error) {
    console.error('Error testing Rugcheck client:', error);
    process.exit(1);
  }
}

main();
