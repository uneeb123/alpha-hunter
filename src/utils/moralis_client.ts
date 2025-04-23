import axios from 'axios';
import { getSecrets } from './secrets';
import type {
  MoralisTokenPair,
  MoralisTokenHolderStats,
  MoralisTokenSwap,
  MoralisTokenPairsResponse,
  MoralisTokenSwapsResponse,
  MoralisTokenBalance,
} from '@/types';

export class MoralisClient {
  private static instance: MoralisClient;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://solana-gateway.moralis.io';
  private readonly evmBaseUrl = 'https://deep-index.moralis.io/api/v2.2';

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

  /**
   * Get ERC20 token balances for an address
   * @param address The wallet address to check balances for
   * @param chain The chain to query (defaults to 'base')
   * @returns Array of token balances with metadata
   */
  async getERC20Balances(
    address: string,
    chain: string = 'base',
  ): Promise<MoralisTokenBalance[]> {
    try {
      const url = `${this.evmBaseUrl}/${address}/erc20?chain=${chain}`;

      const response = await axios.get<MoralisTokenBalance[]>(url, {
        headers: {
          accept: 'application/json',
          'X-API-Key': this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Error Response:', error.response?.data);
        throw new Error(
          `Failed to fetch ERC20 balances: ${error.response?.data?.message || error.message}`,
        );
      }
      throw error;
    }
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
