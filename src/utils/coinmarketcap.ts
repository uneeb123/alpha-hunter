import axios from 'axios';
import { getSecrets } from './secrets';

export interface PriceInfo {
  symbol: string;
  price: number;
  change: number; // percent change
}

export async function getPrices(symbols: string[]): Promise<PriceInfo[]> {
  const url =
    'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
  try {
    const response = await axios.get(url, {
      headers: {
        'X-CMC_PRO_API_KEY': getSecrets().cmcApiKey,
      },
      params: {
        symbol: symbols.join(','),
        convert: 'USD',
      },
    });
    const data = response.data.data;
    return symbols.map((symbol) => {
      const price = data[symbol].quote.USD.price;
      const percentChange = data[symbol].quote.USD.percent_change_24h;
      return {
        symbol,
        price: Number(price.toFixed(2)),
        change: Number(percentChange.toFixed(2)),
      };
    });
  } catch (error) {
    throw error;
  }
}
