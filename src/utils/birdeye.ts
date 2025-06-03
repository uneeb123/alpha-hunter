import axios from 'axios';
import { getSecrets } from './secrets';

let totalRequests = 0;
let first429At: number | null = null;
let firstRequestTime: number | null = null;

const FIXED_DELAY_MS = 1000; // 1 request per second

async function axiosWith429Retry(config: any, maxRetries = 5, baseDelay = 500) {
  let attempt = 0;
  while (true) {
    try {
      // Fixed delay before every request
      await new Promise((res) => setTimeout(res, FIXED_DELAY_MS));
      totalRequests++;
      if (totalRequests === 1) {
        firstRequestTime = Date.now();
      }
      console.log(
        `[Birdeye] Sending request #${totalRequests} to ${config.url} (attempt ${attempt + 1})`,
      );
      return await axios(config);
    } catch (error: any) {
      if (
        error.response &&
        error.response.status === 429 &&
        attempt < maxRetries
      ) {
        if (first429At === null) {
          first429At = totalRequests;
          const elapsed = firstRequestTime
            ? ((Date.now() - firstRequestTime) / 1000).toFixed(2)
            : 'unknown';
          console.warn(
            `[Birdeye] First 429 received after ${first429At} requests and ${elapsed} seconds.`,
          );
        }
        const delay = baseDelay * Math.pow(2, attempt); // exponential backoff
        console.warn(
          `[Birdeye] 429 received for ${config.url} (attempt ${attempt + 1}). Retrying after ${delay}ms...`,
        );
        await new Promise((res) => setTimeout(res, delay));
        attempt++;
        continue;
      }
      throw error;
    }
  }
}

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
      const response = await axiosWith429Retry({
        method: 'get',
        url,
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

export interface BirdeyeTokenListItem {
  address: string;
  decimals: number;
  price: number | null;
  lastTradeUnixTime: number;
  liquidity: number;
  logoURI: string | null;
  mc: number | null;
  name: string;
  symbol: string;
  v24hChangePercent: number | null;
  v24hUSD: number;
  chain: string;
}

export interface BirdeyeTokenListResponse {
  success: boolean;
  data: {
    updateUnixTime: number;
    updateTime: string;
    tokens: BirdeyeTokenListItem[];
    total: number;
  };
}

export type BirdeyeTokenListParams = {
  chain: 'solana' | 'base' | 'sui';
  offset?: number;
  limit?: number;
  sort_by?: 'v24hUSD' | 'mc' | 'v24hChangePercent' | 'liquidity';
  sort_type?: 'asc' | 'desc';
  min_liquidity?: number;
  max_liquidity?: number;
};

export async function getBirdeyeTokenList(
  params: BirdeyeTokenListParams,
): Promise<BirdeyeTokenListResponse> {
  const secrets = getSecrets();
  const url = 'https://public-api.birdeye.so/defi/tokenlist';
  const {
    chain,
    offset = 0,
    limit = 20,
    sort_by = 'v24hUSD',
    sort_type = 'desc',
    min_liquidity,
    max_liquidity,
  } = params;
  const query: Record<string, any> = {
    offset,
    limit,
    sort_by,
    sort_type,
  };
  if (min_liquidity !== undefined) query.min_liquidity = min_liquidity;
  if (max_liquidity !== undefined) query.max_liquidity = max_liquidity;

  const response = await axiosWith429Retry({
    method: 'get',
    url,
    headers: {
      'X-API-KEY': secrets.birdeyeApiKey,
      accept: 'application/json',
      'x-chain': chain,
    },
    params: query,
  });
  // Add chain to each token
  if (response.data?.data?.tokens) {
    response.data.data.tokens = response.data.data.tokens.map((t: any) => ({
      ...t,
      chain,
    }));
  }
  return response.data;
}

export async function getBirdeyeTokenListMultiChain(
  params: Omit<BirdeyeTokenListParams, 'chain'> & {
    chains: BirdeyeTokenListParams['chain'][];
  },
): Promise<BirdeyeTokenListResponse> {
  const { chains, ...rest } = params;
  const allTokens: BirdeyeTokenListItem[] = [];
  let updateUnixTime = 0;
  let updateTime = '';
  let total = 0;
  for (const chain of chains) {
    const resp = await getBirdeyeTokenList({ ...rest, chain });
    if (resp.success && resp.data?.tokens) {
      allTokens.push(...resp.data.tokens.map((t) => ({ ...t, chain })));
      updateUnixTime = Math.max(updateUnixTime, resp.data.updateUnixTime);
      if (!updateTime || resp.data.updateTime > updateTime)
        updateTime = resp.data.updateTime;
      total += resp.data.total;
    }
  }
  // Optionally deduplicate by address+chain
  // Optionally sort/limit here if needed
  return {
    success: true,
    data: {
      updateUnixTime,
      updateTime,
      tokens: allTokens,
      total,
    },
  };
}
