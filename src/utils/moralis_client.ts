import axios from 'axios';
import { getSecrets } from './secrets';
import { TokenPair, TokenPairsResponse } from '../types';

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
}
