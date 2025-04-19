interface MoralisTokenInfo {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenLogo: string | null;
  tokenDecimals: string;
  pairTokenType: string;
  liquidityUsd: number;
}

export interface MoralisTokenPair {
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
  pair: [MoralisTokenInfo, MoralisTokenInfo];
}

export interface MoralisTokenPairsResponse {
  pairs: MoralisTokenPair[];
  pageSize: number;
  page: number;
  cursor: string | null;
}

export interface MoralisHolderChange {
  change: number;
  changePercent: number;
}

export interface MoralisHoldersByTime {
  '5min': MoralisHolderChange;
  '1h': MoralisHolderChange;
  '6h': MoralisHolderChange;
  '24h': MoralisHolderChange;
  '3d': MoralisHolderChange;
  '7d': MoralisHolderChange;
  '30d': MoralisHolderChange;
}

export interface MoralisHoldersByAcquisition {
  swap: number;
  transfer: number;
  airdrop: number;
}

export interface MoralisHolderDistribution {
  whales: number;
  sharks: number;
  dolphins: number;
  fish: number;
  octopus: number;
  crabs: number;
  shrimps: number;
}

export interface MoralisTokenHolderStats {
  totalHolders: number;
  holdersByAcquisition: MoralisHoldersByAcquisition;
  holderChange: MoralisHoldersByTime;
  holderDistribution: MoralisHolderDistribution;
}

interface MoralisSwapToken {
  address: string;
  name: string;
  symbol: string;
  amount: number;
  usdPrice: number;
  usdAmount: number;
}

export interface MoralisTokenSwap {
  transactionHash: string;
  transactionType: string;
  blockNumber: number;
  subCategory: string;
  blockTimestamp: string;
  exchangeName: string;
  pairAddress: string;
  walletAddress: string;
  baseToken: string;
  quoteToken: string;
  bought: MoralisSwapToken;
  sold: MoralisSwapToken;
  totalValueUsd: number;
}

export interface MoralisTokenSwapsResponse {
  cursor: string | null;
  page: number;
  pageSize: number;
  result: MoralisTokenSwap[];
}
