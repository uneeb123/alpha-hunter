import axios from 'axios';
import { getSecrets } from './secrets';
import type {
  MoralisTokenPair,
  MoralisTokenHolderStats,
  MoralisTokenSwap,
  MoralisTokenPairsResponse,
  MoralisTokenSwapsResponse,
} from '@/types';

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

  async getPairsForToken(tokenAddress: string): Promise<MoralisTokenPair[]> {
    try {
      const response = await axios.get<MoralisTokenPairsResponse>(
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

  async getTokenHolderStats(
    tokenAddress: string,
  ): Promise<MoralisTokenHolderStats> {
    try {
      const response = await axios.get<MoralisTokenHolderStats>(
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
  ): Promise<MoralisTokenSwap[]> {
    try {
      const allSwaps: MoralisTokenSwap[] = [];
      let cursor: string | null = null;
      const defaultFromDate = Math.floor(Date.now() / 1000 - 3600).toString(); // 1 hour ago
      const toDate = Math.floor(Date.now() / 1000).toString(); // current time

      do {
        const response: { data: MoralisTokenSwapsResponse } =
          await axios.get<MoralisTokenSwapsResponse>(
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
