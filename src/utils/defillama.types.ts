// Common response wrapper
export interface DefiLlamaResponse<T> {
  data: T;
}

// Pool types
export interface PoolData {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number;
  apyReward: number | null;
  apy: number;
  rewardTokens: string | null;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  predictions: {
    predictedClass: 'Stable/Up' | 'Down' | null;
    predictedProbability: number | null;
    binnedConfidence: number | null;
  };
  poolMeta: string | null;
  mu: number;
  sigma: number;
  count: number;
  outlier: boolean;
  underlyingTokens: string[];
  il7d: number | null;
  apyBase7d: number | null;
  apyMean30d: number;
  volumeUsd1d: number | null;
  volumeUsd7d: number | null;
  apyBaseInception: number | null;
  apyPct1D: number;
  apyPct7D: number;
  apyPct30D: number;
}

export interface PoolsResponse {
  status: string;
  data: PoolData[];
}

// Pool Chart types
export interface PoolChartData {
  timestamp: number;
  tvlUsd: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  il7d?: number;
  apyBase7d?: number;
  apyMean7d?: number;
  volumeUsd7d?: number;
}

export interface PoolChartResponse {
  status: string;
  data: PoolChartData[];
}

// Protocol types
export interface ProtocolData {
  id: string;
  name: string;
  address?: string;
  symbol: string;
  url: string;
  description: string;
  chain: string;
  logo: string;
  audits: number;
  audit_note: string;
  gecko_id: string;
  cmcId: string;
  category: string;
  chains: string[];
  module: string;
  twitter: string;
  forkedFrom?: string[];
  oracles?: string[];
  listedAt: number;
  mcap?: number;
  tvl: number;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  staking?: number;
  fdv?: number;
  tvlPrevDay: number;
  tvlPrevWeek: number;
  tvlPrevMonth: number;
}

export interface ProtocolsResponse {
  status: string;
  data: ProtocolData[];
}

// Chart protocol types
export interface TVLChartPoint {
  date: number;
  totalLiquidityUSD: number;
}

export interface ProtocolTVLChartResponse {
  status: string;
  data: TVLChartPoint[];
}
