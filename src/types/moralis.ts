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
