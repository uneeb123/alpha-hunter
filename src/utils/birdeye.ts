import axios from 'axios';
import { getSecrets } from './secrets';

export interface BirdeyeTokenInfo {
  name: string;
  symbol: string;
  chain: string;
  price: number;
  marketcap: number;
  price24hChangePercent: number | null;
  address: string;
}

export async function getTrendingMemecoins(): Promise<BirdeyeTokenInfo[]> {
  const url = 'https://public-api.birdeye.so/defi/token_trending';
  const chains = ['solana', 'base'];
  let allTokens: BirdeyeTokenInfo[] = [];
  const secrets = getSecrets();

  for (const chain of chains) {
    try {
      const response = await axios.get(url, {
        headers: {
          'X-API-KEY': secrets.birdeyeApiKey,
          accept: 'application/json',
          'x-chain': chain,
        },
        params: {
          sort_by: 'rank',
          sort_type: 'asc',
          offset: 0,
          limit: 20,
        },
      });
      const { data } = response.data;
      const tokens: BirdeyeTokenInfo[] = data.tokens.map((token: any) => ({
        name: token.name,
        symbol: token.symbol,
        chain,
        price: token.price,
        marketcap: token.marketcap,
        price24hChangePercent: token.price24hChangePercent ?? null,
        address: token.address,
      }));
      // Filter for likely memecoins (marketcap < 1B)
      const memecoins = tokens.filter((token: BirdeyeTokenInfo) => {
        const marketcap = token.marketcap || 0;
        return marketcap < 1_000_000_000;
      });
      allTokens = allTokens.concat(memecoins);
    } catch {
      // Optionally log or handle error
    }
  }

  // Sort by price24hChangePercent descending, handle nulls as lowest
  allTokens.sort((a, b) => {
    const aChange = a.price24hChangePercent ?? -Infinity;
    const bChange = b.price24hChangePercent ?? -Infinity;
    return bChange - aChange;
  });

  return allTokens.slice(0, 10);
}
