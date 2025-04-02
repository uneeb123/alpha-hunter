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
  apyBase?: number;
  apyReward?: number;
  apy: number;
  rewardTokens?: string[];
  underlyingTokens?: string[];
  il7d?: number;
  apyBase7d?: number;
  apyMean7d?: number;
  volumeUsd7d?: number;
  apyBaseInception?: number;
  apyIncludingLsdApy?: number;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  predictions?: {
    predictedClass: string;
    predictedProbability: number;
    binnedConfidence: number;
  };
  poolMeta?: string;
  mu?: number;
  sigma?: number;
  count?: number;
  outlier?: boolean;
  underlyingIcons?: string[];
  aprOptimizer?: boolean;
  ltv?: number;
  borrowable?: boolean;
  borrowUsd?: number;
  totalSupplyUsd?: number;
  totalBorrowUsd?: number;
  url?: string;
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
