import axios from 'axios';
import { Debugger, DebugConfig } from './debugger';
import { getSecrets } from './secrets';
import {
  TimeWindow,
  ElfaResponse,
  PingResponse,
  KeyStatusData,
  MentionsResponse,
  TopMentionsData,
  SearchMentionsResponse,
  TrendingTokensResponse,
  AccountSmartStatsData,
  MentionData,
  AccountData,
  SearchMentionData,
  TrendingToken,
} from './elfa.types';

// Re-export all types
export type {
  TimeWindow,
  ElfaResponse,
  PingResponse,
  KeyStatusData,
  MentionsResponse,
  TopMentionsData,
  SearchMentionsResponse,
  TrendingTokensResponse,
  AccountSmartStatsData,
  MentionData,
  AccountData,
  SearchMentionData,
  TrendingToken,
};

export class ElfaClient {
  private apiKey: string;
  private debug: Debugger;
  private baseUrl = 'https://api.elfa.ai/v1';

  constructor(debugConfig?: DebugConfig) {
    const secrets = getSecrets();
    this.apiKey = secrets.elfaApiKey;

    if (!this.apiKey) {
      throw new Error('Elfa API key is not available in secrets');
    }

    const defaultDebugConfig: DebugConfig = debugConfig || {
      enabled: true,
      level: 'info',
    };

    this.debug = Debugger.create(defaultDebugConfig);
  }

  public async pingApi(): Promise<ElfaResponse<PingResponse>> {
    try {
      const response = await axios.get<ElfaResponse<PingResponse>>(
        `${this.baseUrl}/ping`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.debug.error('Error pinging Elfa API:', error as Error);
      throw error;
    }
  }

  public async getKeyStatus(): Promise<ElfaResponse<KeyStatusData>> {
    try {
      const response = await axios.get<ElfaResponse<KeyStatusData>>(
        `${this.baseUrl}/key-status`,
        {
          headers: {
            accept: 'application/json',
            'x-elfa-api-key': this.apiKey,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.debug.error(
        'Error getting key status from Elfa API:',
        error as Error,
      );
      throw error;
    }
  }

  public async getMentions({
    limit = 100,
    offset = 0,
  }: {
    limit?: number;
    offset?: number;
  } = {}): Promise<ElfaResponse<MentionsResponse>> {
    try {
      const response = await axios.get<ElfaResponse<MentionsResponse>>(
        `${this.baseUrl}/mentions`,
        {
          headers: {
            accept: 'application/json',
            'x-elfa-api-key': this.apiKey,
          },
          params: {
            limit,
            offset,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.debug.error('Error getting mentions from Elfa API:', error as Error);
      throw error;
    }
  }

  public async getTopMentions({
    ticker,
    timeWindow = '24h',
    page = 1,
    pageSize = 10,
    includeAccountDetails = false,
  }: {
    ticker: string;
    timeWindow?: TimeWindow;
    page?: number;
    pageSize?: number;
    includeAccountDetails?: boolean;
  }): Promise<ElfaResponse<TopMentionsData>> {
    try {
      const response = await axios.get<ElfaResponse<TopMentionsData>>(
        `${this.baseUrl}/top-mentions`,
        {
          headers: {
            accept: 'application/json',
            'x-elfa-api-key': this.apiKey,
          },
          params: {
            ticker,
            timeWindow,
            page,
            pageSize,
            includeAccountDetails,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.debug.error(
        'Error getting top mentions from Elfa API:',
        error as Error,
      );
      throw error;
    }
  }

  public async searchMentions({
    keywords,
    from = Math.floor(Date.now() / 1000) - 86400,
    to = Math.floor(Date.now() / 1000),
    limit = 20,
    page = 1,
  }: {
    keywords: string;
    from?: number;
    to?: number;
    limit?: number;
    page?: number;
  }): Promise<ElfaResponse<SearchMentionsResponse>> {
    try {
      const response = await axios.get<ElfaResponse<SearchMentionsResponse>>(
        `${this.baseUrl}/mentions/search`,
        {
          headers: {
            accept: 'application/json',
            'x-elfa-api-key': this.apiKey,
          },
          params: {
            keywords: encodeURIComponent(keywords),
            from,
            to,
            limit,
            page,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.debug.error(
        'Error searching mentions from Elfa API:',
        error as Error,
      );
      throw error;
    }
  }

  public async getTrendingTokens(): Promise<
    ElfaResponse<TrendingTokensResponse>
  > {
    // Set default parameters
    const requestParams = {
      timeWindow: '24h',
      page: 1,
      pageSize: 50,
      minMentions: 5,
    };

    try {
      const response = await axios.get<ElfaResponse<TrendingTokensResponse>>(
        `${this.baseUrl}/trending-tokens`,
        {
          headers: {
            accept: 'application/json',
            'x-elfa-api-key': this.apiKey,
          },
          params: requestParams,
        },
      );
      return response.data;
    } catch (error) {
      this.debug.error(
        'Error getting trending tokens from Elfa API:',
        error as Error,
      );
      throw error;
    }
  }

  public async getAccountSmartStats(
    username: string,
  ): Promise<ElfaResponse<AccountSmartStatsData>> {
    try {
      const response = await axios.get<ElfaResponse<AccountSmartStatsData>>(
        `${this.baseUrl}/account/smart-stats`,
        {
          headers: {
            accept: 'application/json',
            'x-elfa-api-key': this.apiKey,
          },
          params: {
            username,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.debug.error(
        'Error getting account smart stats from Elfa API:',
        error as Error,
      );
      throw error;
    }
  }
}
