import { getSecrets } from './secrets';
import { Debugger } from '@/utils/debugger';
import {
  Wallet,
  Position,
  BuyTokenParams,
  BuyTokenResponse,
  SellTokenParams,
  SellTokenResponse,
} from '@/types';

export class SniperooClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private debug: Debugger;

  constructor() {
    const { sniperooApiKey } = getSecrets();
    this.debug = Debugger.create();
    this.apiKey = sniperooApiKey;
    this.baseUrl = 'https://api.sniperoo.app';
  }

  async getWallet(): Promise<Wallet> {
    try {
      const response = await fetch(`${this.baseUrl}/user/wallets`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Sniperoo API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data[0]; // currently let's just return first one
    } catch (error) {
      console.error('Error fetching wallets:', error);
      throw error;
    }
  }

  async buyToken(params: BuyTokenParams): Promise<BuyTokenResponse> {
    try {
      const wallet = await this.getWallet();

      const requestBody = {
        walletAddresses: [wallet.address],
        tokenAddress: params.tokenAddress,
        inputAmount: params.inputAmount,
        ...(params.profitPercentage && params.stopLossPercentage
          ? {
              autoSell: {
                enabled: true,
                strategy: {
                  strategyName: 'simple',
                  profitPercentage: params.profitPercentage,
                  stopLossPercentage: params.stopLossPercentage,
                },
              },
            }
          : {}),
      };

      const response = await fetch(
        `${this.baseUrl}/trading/buy-token?toastFrontendId=0`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        throw new Error(`Sniperoo API Error: ${response.statusText}`);
      }

      const data: BuyTokenResponse = await response.json();
      return data;
    } catch (error) {
      this.debug.error('Error buying token:', error as Error);
      throw error;
    }
  }

  async sellToken(params: SellTokenParams): Promise<SellTokenResponse[]> {
    try {
      // First get all positions
      const positions = await this.getPositions();

      // Filter positions that match the token address and are open
      const matchingPositions = positions.filter(
        (position) =>
          position.tokenAddress === params.tokenAddress && position.isOpen,
      );

      if (matchingPositions.length === 0) {
        throw new Error(
          `No open positions found for token address: ${params.tokenAddress}`,
        );
      }

      // Sell tokens for each matching position
      const sellPromises = matchingPositions.map(async (position) => {
        const response = await fetch(
          `${this.baseUrl}/trading/sell-percentage-from-position`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              positionId: position.id,
              percentage: params.percentage || 100,
              prioritizationFeeInSolana: params.prioritizationFeeInSolana || 0,
              slippageInPercentage: params.slippageInPercentage || 1,
              jitoTipInSolana: params.jitoTipInSolana || 0,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(
            `Sniperoo API Error for position ${position.id}: ${response.statusText}`,
          );
        }

        const data: SellTokenResponse = await response.json();
        return data;
      });

      // Wait for all sell operations to complete
      const results = await Promise.all(sellPromises);
      return results;
    } catch (error) {
      this.debug.error('Error selling token:', error as Error);
      throw error;
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      const response = await fetch(`${this.baseUrl}/positions/all`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Sniperoo API Error: ${response.statusText}`);
      }

      const data: Position[] = await response.json();
      return data;
    } catch (error) {
      this.debug.error('Error fetching positions:', error as Error);
      throw error;
    }
  }
}
