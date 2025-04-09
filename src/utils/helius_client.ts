import { getSecrets } from '@/utils/secrets';
import {
  HeliusTransactionResponse,
  HeliusRpcRequest,
  HeliusRpcResponse,
  HeliusAssetResponse,
  TokenMetadata,
} from '@/types';

export class HeliusClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    const { heliusApiKey } = getSecrets();
    this.apiKey = heliusApiKey;
    this.baseUrl = 'https://mainnet.helius-rpc.com';
  }

  async getTransactionDetails(
    signature: string,
  ): Promise<HeliusTransactionResponse> {
    try {
      const requestBody: HeliusRpcRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [
          signature,
          {
            encoding: 'json',
            maxSupportedTransactionVersion: 0,
          },
        ],
      };

      const response = await fetch(`${this.baseUrl}/?api-key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Helius API Error: ${response.statusText}`);
      }

      const data: HeliusRpcResponse = await response.json();

      if (data.error) {
        throw new Error(`Helius API Error: ${data.error.message}`);
      }

      return data.result as HeliusTransactionResponse;
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      throw error;
    }
  }

  async getTokenDetails(mintAddress: string): Promise<TokenMetadata> {
    try {
      const requestBody: HeliusRpcRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'getAsset',
        params: {
          id: mintAddress,
          displayOptions: {
            showFungible: true, //return details about a fungible token
          },
        },
      };

      const response = await fetch(`${this.baseUrl}/?api-key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Helius API Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Helius API Error: ${data.error.message}`);
      }

      const result = data.result as HeliusAssetResponse;
      return {
        name: result.content.metadata.name,
        symbol: result.content.metadata.symbol,
        decimals: result.token_info.decimals,
        supply: result.token_info.supply,
        image: result.content.links?.image,
      };
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      throw error;
    }
  }
}
