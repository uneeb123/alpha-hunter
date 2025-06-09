import axios from 'axios';
import { getSecrets } from './secrets';

let totalRequests = 0;
let first429At: number | null = null;
let firstRequestTime: number | null = null;

async function axiosWith429Retry(config: any, maxRetries = 5, baseDelay = 500) {
  let attempt = 0;
  while (true) {
    try {
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
  updatedAt: Date;
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

export interface BirdeyeV3TokenListItem {
  address: string;
  logo_uri: string | null;
  name: string;
  symbol: string;
  decimals: number;
  extensions?: Record<string, any>;
  market_cap: number;
  fdv: number | null;
  liquidity: number;
  last_trade_unix_time: number;
  volume_1h_usd: number;
  volume_1h_change_percent: number;
  volume_2h_usd: number;
  volume_2h_change_percent: number;
  volume_4h_usd: number;
  volume_4h_change_percent: number;
  volume_8h_usd: number;
  volume_8h_change_percent: number;
  volume_24h_usd: number;
  volume_24h_change_percent: number;
  trade_1h_count: number;
  trade_2h_count: number;
  trade_4h_count: number;
  trade_8h_count: number;
  trade_24h_count: number;
  price: number;
  price_change_1h_percent: number;
  price_change_2h_percent: number;
  price_change_4h_percent: number;
  price_change_8h_percent: number;
  price_change_24h_percent: number;
  holder: number;
  recent_listing_time: number | null;
}

export interface BirdeyeV3TokenListResponse {
  success: boolean;
  data: {
    items: BirdeyeV3TokenListItem[];
    has_next: boolean;
  };
}

/**
 * Params for Birdeye V3 Token List API
 *
 * sort_by: Required. Allowed values:
 *   'market_cap' | 'fdv' | 'liquidity' | 'last_trade_unix_time' | 'volume_1h_usd' | 'volume_1h_change_percent' | 'volume_2h_usd' | 'volume_2h_change_percent' | 'volume_4h_usd' | 'volume_4h_change_percent' | 'volume_8h_usd' | 'volume_8h_change_percent' | 'volume_24h_usd' | 'volume_24h_change_percent' | 'trade_1h_count' | 'trade_2h_count' | 'trade_4h_count' | 'trade_8h_count' | 'trade_24h_count' | 'price_change_1h_percent' | 'price_change_2h_percent' | 'price_change_4h_percent' | 'price_change_8h_percent' | 'price_change_24h_percent' | 'holder' | 'recent_listing_time'
 * sort_type: Required. 'asc' | 'desc'
 */
export interface BirdeyeV3TokenListParams {
  sort_by: string; // required
  sort_type: 'asc' | 'desc'; // required
  min_liquidity?: number;
  max_liquidity?: number;
  min_market_cap?: number;
  max_market_cap?: number;
  min_fdv?: number;
  max_fdv?: number;
  min_recent_listing_time?: number;
  max_recent_listing_time?: number;
  min_last_trade_unix_time?: number;
  max_last_trade_unix_time?: number;
  min_holder?: number;
  min_volume_1h_usd?: number;
  min_volume_2h_usd?: number;
  min_volume_4h_usd?: number;
  min_volume_8h_usd?: number;
  min_volume_24h_usd?: number;
  min_volume_1h_change_percent?: number;
  min_volume_2h_change_percent?: number;
  min_volume_4h_change_percent?: number;
  min_volume_8h_change_percent?: number;
  min_volume_24h_change_percent?: number;
  min_price_change_1h_percent?: number;
  min_price_change_2h_percent?: number;
  min_price_change_4h_percent?: number;
  min_price_change_8h_percent?: number;
  min_price_change_24h_percent?: number;
  min_trade_1h_count?: number;
  min_trade_2h_count?: number;
  min_trade_4h_count?: number;
  min_trade_8h_count?: number;
  min_trade_24h_count?: number;
  offset?: number;
  limit?: number;
  chain?: string;
}

export async function getBirdeyeV3TokenList(
  params: BirdeyeV3TokenListParams,
): Promise<BirdeyeV3TokenListResponse> {
  const secrets = getSecrets();
  const url = 'https://public-api.birdeye.so/defi/v3/token/list';
  const query: Record<string, any> = { ...params };
  if (!query.chain) query.chain = 'solana';
  const response = await axiosWith429Retry({
    method: 'get',
    url,
    headers: {
      'X-API-KEY': secrets.birdeyeApiKey,
      accept: 'application/json',
      'x-chain': query.chain,
    },
    params: query,
  });
  return response.data;
}

export async function getBirdeyeTokenOverview(address: string): Promise<any> {
  const secrets = getSecrets();
  const birdeyeApiKey = secrets.birdeyeApiKey;
  const birdeyeUrl = `https://public-api.birdeye.so/defi/token_overview?address=${address}&frames=24h`;
  const response = await axios.get(birdeyeUrl, {
    headers: {
      'X-API-KEY': birdeyeApiKey,
      accept: 'application/json',
      'x-chain': 'solana',
    },
  });
  if (!response.data?.data) {
    throw new Error('No data from Birdeye');
  }
  return response.data.data;
}

export async function getBirdeyeTokenCreationInfo(
  address: string,
): Promise<any | null> {
  const secrets = getSecrets();
  const url = 'https://public-api.birdeye.so/defi/token_creation_info';
  try {
    const response = await axiosWith429Retry({
      method: 'get',
      url,
      headers: {
        'X-API-KEY': secrets.birdeyeApiKey,
        accept: 'application/json',
        'x-chain': 'solana',
      },
      params: { address },
    });
    // If data is null, return null
    return response.data?.data || null;
  } catch {
    // Optionally log or handle error
    return null;
  }
}

/**
 * Formats a number with K, M, B suffixes (e.g., $119B, $2.5M, $800K).
 * Returns 'N/A' if input is null, undefined, or NaN.
 */
export function formatNumber(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || isNaN(n)) return 'N/A';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(digits)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(digits)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(digits)}K`;
  return `$${n.toFixed(digits)}`;
}

/**
 * Formats a Date as '9th June 2026' with ordinal suffix for the day.
 * Returns 'N/A' if input is invalid.
 */
export function formatDateWithOrdinal(
  date: Date | string | number | null | undefined,
): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  // Ordinal suffix logic
  const j = day % 10,
    k = day % 100;
  let suffix = 'th';
  if (j === 1 && k !== 11) suffix = 'st';
  else if (j === 2 && k !== 12) suffix = 'nd';
  else if (j === 3 && k !== 13) suffix = 'rd';
  return `${day}${suffix} ${month} ${year}`;
}
