export interface TokenInfo {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenLogo: string | null;
  tokenDecimals: string;
  pairTokenType: string;
  liquidityUsd: number;
}

export interface TokenPair {
  exchangeAddress: string;
  exchangeName: string;
  exchangeLogo: string;
  pairAddress: string;
  pairLabel: string;
  usdPrice: number;
  usdPrice24hrPercentChange: number;
  usdPrice24hrUsdChange: number;
  volume24hrNative: number;
  volume24hrUsd: number;
  liquidityUsd: number;
  baseToken: string;
  quoteToken: string;
  inactivePair: boolean;
  pair: [TokenInfo, TokenInfo];
}

export interface TokenPairsResponse {
  pairs: TokenPair[];
  pageSize: number;
  page: number;
  cursor: string | null;
}

export interface HolderChange {
  change: number;
  changePercent: number;
}

export interface HoldersByTime {
  '5min': HolderChange;
  '1h': HolderChange;
  '6h': HolderChange;
  '24h': HolderChange;
  '3d': HolderChange;
  '7d': HolderChange;
  '30d': HolderChange;
}

export interface HoldersByAcquisition {
  swap: number;
  transfer: number;
  airdrop: number;
}

export interface HolderDistribution {
  whales: number;
  sharks: number;
  dolphins: number;
  fish: number;
  octopus: number;
  crabs: number;
  shrimps: number;
}

export interface TokenHolderStats {
  totalHolders: number;
  holdersByAcquisition: HoldersByAcquisition;
  holderChange: HoldersByTime;
  holderDistribution: HolderDistribution;
}
