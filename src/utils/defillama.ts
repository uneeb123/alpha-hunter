import axios from 'axios';
import { Debugger, DebugConfig } from './debugger';
import {
  DefiLlamaResponse,
  PoolsResponse,
  PoolChartResponse,
  ProtocolsResponse,
  ProtocolTVLChartResponse,
} from './defillama.types';

// Re-export all types
export type {
  DefiLlamaResponse,
  PoolsResponse,
  PoolChartResponse,
  ProtocolsResponse,
  ProtocolTVLChartResponse,
};

export class DefiLlamaClient {
  private debug: Debugger;
  private baseUrl = 'https://yields.llama.fi';
  private protocolsBaseUrl = 'https://api.llama.fi';

  constructor(debugConfig?: DebugConfig) {
    const defaultDebugConfig: DebugConfig = debugConfig || {
      enabled: true,
      level: 'info',
    };

    this.debug = Debugger.create(defaultDebugConfig);
  }

  /**
   * Get all yield pools from DeFi Llama
   */
  public async getPools(): Promise<PoolsResponse> {
    try {
      const response = await axios.get<PoolsResponse>(`${this.baseUrl}/pools`);
      return response.data;
    } catch (error) {
      this.debug.error(
        'Error getting pools from DeFi Llama API:',
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Get historical data for a specific pool
   * @param poolId The pool ID to get chart data for
   */
  public async getPoolChart(poolId: string): Promise<PoolChartResponse> {
    try {
      const response = await axios.get<PoolChartResponse>(
        `${this.baseUrl}/chart/${poolId}`,
      );
      return response.data;
    } catch (error) {
      this.debug.error(
        'Error getting pool chart from DeFi Llama API:',
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Get all protocols from DeFi Llama
   */
  public async getProtocols(): Promise<ProtocolsResponse> {
    try {
      const response = await axios.get<ProtocolsResponse>(
        `${this.protocolsBaseUrl}/protocols`,
      );
      return response.data;
    } catch (error) {
      this.debug.error(
        'Error getting protocols from DeFi Llama API:',
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Get TVL chart data for a specific protocol
   * @param protocolId The protocol ID to get chart data for
   */
  public async getProtocolTVLChart(
    protocolId: string,
  ): Promise<ProtocolTVLChartResponse> {
    try {
      const response = await axios.get<ProtocolTVLChartResponse>(
        `${this.protocolsBaseUrl}/protocol/${protocolId}`,
      );
      return response.data;
    } catch (error) {
      this.debug.error(
        'Error getting protocol TVL chart from DeFi Llama API:',
        error as Error,
      );
      throw error;
    }
  }
}
