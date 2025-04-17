import axios from 'axios';
import { getSecrets } from './secrets';

interface TokenInfo {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenLogo: string | null;
  tokenDecimals: string;
  pairTokenType: string;
  liquidityUsd: number;
}

interface TokenPair {
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

interface TokenPairsResponse {
  pairs: TokenPair[];
  pageSize: number;
  page: number;
  cursor: string | null;
}

interface HolderChange {
  change: number;
  changePercent: number;
}

interface HoldersByTime {
  '5min': HolderChange;
  '1h': HolderChange;
  '6h': HolderChange;
  '24h': HolderChange;
  '3d': HolderChange;
  '7d': HolderChange;
  '30d': HolderChange;
}

interface HoldersByAcquisition {
  swap: number;
  transfer: number;
  airdrop: number;
}

interface HolderDistribution {
  whales: number;
  sharks: number;
  dolphins: number;
  fish: number;
  octopus: number;
  crabs: number;
  shrimps: number;
}

interface TokenHolderStats {
  totalHolders: number;
  holdersByAcquisition: HoldersByAcquisition;
  holderChange: HoldersByTime;
  holderDistribution: HolderDistribution;
}

interface SwapToken {
  address: string;
  name: string;
  symbol: string;
  amount: number;
  usdPrice: number;
  usdAmount: number;
}

interface TokenSwap {
  transactionHash: string;
  transactionType: string;
  subCategory: string;
  blockTimestamp: string;
  exchangeName: string;
  pairLabel: string;
  walletAddress: string;
  bought: SwapToken;
  sold: SwapToken;
  totalValueUsd: number;
}

interface TokenSwapsResponse {
  cursor: string | null;
  page: number;
  pageSize: number;
  result: TokenSwap[];
}

export class MoralisClient {
  private static instance: MoralisClient;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://solana-gateway.moralis.io';

  private constructor() {
    const { moralisApiKey } = getSecrets();
    this.apiKey = moralisApiKey;
  }

  public static getInstance(): MoralisClient {
    if (!MoralisClient.instance) {
      MoralisClient.instance = new MoralisClient();
    }
    return MoralisClient.instance;
  }

  async getPairsForToken(tokenAddress: string): Promise<TokenPair[]> {
    try {
      const response = await axios.get<TokenPairsResponse>(
        `${this.baseUrl}/token/mainnet/${tokenAddress}/pairs`,
        {
          headers: {
            accept: 'application/json',
            'X-API-Key': this.apiKey,
          },
        },
      );

      return response.data.pairs;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Error Response:', error.response?.data);
        throw new Error(
          `Failed to fetch token pairs: ${error.response?.data?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  async getTokenHolderStats(tokenAddress: string): Promise<TokenHolderStats> {
    try {
      const response = await axios.get<TokenHolderStats>(
        `${this.baseUrl}/token/mainnet/holders/${tokenAddress}`,
        {
          headers: {
            accept: 'application/json',
            'X-API-Key': this.apiKey,
          },
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Error Response:', error.response?.data);
        throw new Error(
          `Failed to fetch holder stats: ${error.response?.data?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  async getSwapsByTokenAddress(
    tokenAddress: string,
    fromDate?: string,
  ): Promise<TokenSwap[]> {
    try {
      const allSwaps: TokenSwap[] = [];
      let cursor: string | null = null;
      const defaultFromDate = Math.floor(Date.now() / 1000 - 3600).toString(); // 1 hour ago
      const toDate = Math.floor(Date.now() / 1000).toString(); // current time

      do {
        const response: { data: TokenSwapsResponse } =
          await axios.get<TokenSwapsResponse>(
            `${this.baseUrl}/token/mainnet/${tokenAddress}/swaps`,
            {
              headers: {
                accept: 'application/json',
                'X-API-Key': this.apiKey,
              },
              params: {
                fromDate: fromDate || defaultFromDate,
                toDate,
                limit: 100,
                order: 'DESC',
                ...(cursor && { cursor }),
              },
            },
          );

        allSwaps.push(...response.data.result);
        cursor = response.data.cursor;
      } while (cursor);

      return allSwaps;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Error Response:', error.response?.data);
        throw new Error(
          `Failed to fetch swaps: ${error.response?.data?.message || error.message}`,
        );
      }
      throw error;
    }
  }
}

export type { TokenPair, TokenHolderStats, TokenSwap };
