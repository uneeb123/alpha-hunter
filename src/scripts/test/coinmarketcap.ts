import { getPrices, PriceInfo } from '../../utils/coinmarketcap';

async function main() {
  try {
    const symbols = ['BTC', 'ETH', 'SOL'];
    const prices = await getPrices(symbols);
    prices.forEach(({ symbol, price, change }: PriceInfo) => {
      console.log(`${symbol}: $${price} (${change}% 24h)`);
    });
  } catch (error) {
    console.error('Error fetching prices:', error);
  }
}

main();
