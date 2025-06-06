import { EthClient } from '@/utils/eth_client';
import { USDC } from '@/utils/constants';
import { formatUnits } from 'viem';

async function main() {
  const client = new EthClient();

  // Get and display ETH balance
  const ethBalance = await client.getEthBalance();
  console.log('ETH Balance:', ethBalance);

  // Get and display all token balances
  /*
  const tokenBalances = await client.getTokenBalances();
  console.log('\nToken Balances:');
  tokenBalances.forEach((token) => {
    const formattedBalance = formatUnits(BigInt(token.balance), token.decimals);
    console.log(`${token.name} (${token.symbol}): ${formattedBalance}`);
  });
  */

  // Test buying USDC
  console.log('\nTesting USDC Buy...');
  let buyResult;
  try {
    console.log('Attempting to buy USDC with 0.001 WETH');

    buyResult = await client.buy(USDC, '0.001');
    console.log('Buy successful!');
    console.log('Transaction hash:', buyResult.swapHash);
    console.log('Buy amount: ', buyResult.amountOut);
  } catch (error) {
    console.error('Buy failed:', error);
    process.exit(1);
  }

  // Wait a bit for transaction to be indexed
  console.log('\nWaiting for transaction to be indexed...');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Test selling USDC
  console.log('\nTesting USDC Sell...');
  try {
    console.log('Attempting to sell 1 USDC');

    const sellResult = await client.sell(USDC, '1');
    console.log('Sell successful!');
    console.log('Transaction hash:', sellResult.swapHash);
    console.log('Sell amount: ', sellResult.amountOut);
  } catch (error) {
    console.error('Sell failed:', error);
  }

  // Final balance check
  const finalEthBalance = await client.getEthBalance();
  const finalTokenBalances = await client.getTokenBalances();

  console.log('\nFinal Balances:');
  console.log('ETH Balance:', finalEthBalance);

  const usdcBalance = finalTokenBalances.find(
    (token) => token.token_address.toLowerCase() === USDC.toLowerCase(),
  );
  if (usdcBalance) {
    const formattedBalance = formatUnits(
      BigInt(usdcBalance.balance),
      usdcBalance.decimals,
    );
    console.log(`USDC Balance: ${formattedBalance}`);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
