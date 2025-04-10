import { SniperooClient } from '@/utils/sniperoo_client';

async function main() {
  try {
    console.log('Starting Sniperoo test...');

    const client = new SniperooClient();

    // Test getWallet
    const wallet = await client.getWallet();
    console.log('\nWallet found:');
    console.log(`Name: ${wallet.name}`);
    console.log(`Address: ${wallet.address}`);
    console.log(`SOL Balance: ${wallet.solBalance}`);
    console.log(`Hidden: ${wallet.hidden ? 'Yes' : 'No'}`);

    // Test buyToken
    /*
    console.log('\nTesting buyToken...');
    const buyResponse = await client.buyToken({
      tokenAddress: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump', // FARTCOIN
      inputAmount: 0.01,
      profitPercentage: 100, // optional
      stopLossPercentage: 50, // optional
    });

    console.log('\nBuy Token Response:');
    console.log(`SOL Price in USD: $${buyResponse.solPriceInUSD}`);
    console.log('\nPurchases:');
    buyResponse.purchases.forEach((purchase, index) => {
      console.log(`\nPurchase ${index + 1}:`);
      console.log(`Transaction Signature: ${purchase.txSignature}`);
      console.log(`Token Amount: ${purchase.tokenAmount}`);
      console.log(`Token Amount in USD: $${purchase.tokenAmountInUSD}`);
      console.log(`Token Price in USD: $${purchase.tokenPriceInUSD}`);
    });
    */

    // Test sellToken
    console.log('\nTesting sellToken...');
    const results = await client.sellToken({
      tokenAddress: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
      percentage: 100, // sell 100% of each position
      prioritizationFeeInSolana: 0,
      slippageInPercentage: 1,
      jitoTipInSolana: 0.000001,
    });

    console.log('\nSell Token Response:');
    console.log(`Results:`, results);
  } catch (error) {
    console.error(
      'Error in test:',
      error instanceof Error ? error.message : String(error),
    );
  }
}

main().catch((error) =>
  console.error(
    'Unhandled error:',
    error instanceof Error ? error.message : String(error),
  ),
);
