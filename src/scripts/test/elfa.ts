/*
import * as dotenv from 'dotenv';
import axios from 'axios';
import { Debugger, DebugConfig } from '@/utils/debugger';
import { getSecrets } from '@/utils/secrets';

// Load environment variables
dotenv.config();

const debugConfig: DebugConfig = {
  enabled: true,
  level: 'info',
};

const debug = Debugger.create(debugConfig);

export async function pingElfaApi() {
  const secrets = getSecrets();
  const apiKey = secrets.elfaApiKey;

  if (!apiKey) {
    throw new Error('Elfa API key is not available in secrets');
  }

  try {
    const response = await axios.get('https://api.elfa.ai/v1/ping', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error pinging Elfa API:', error);
    throw error;
  }
}

export async function getKeyStatus() {
  const secrets = getSecrets();
  const apiKey = secrets.elfaApiKey;

  if (!apiKey) {
    throw new Error('Elfa API key is not available in secrets');
  }

  try {
    const response = await axios.get('https://api.elfa.ai/v1/key-status', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting key status from Elfa API:', error);
    throw error;
  }
}

export async function getMentions(params?: any) {
  const secrets = getSecrets();
  const apiKey = secrets.elfaApiKey;

  if (!apiKey) {
    throw new Error('Elfa API key is not available in secrets');
  }

  try {
    const response = await axios.get('https://api.elfa.ai/v1/mentions', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting mentions from Elfa API:', error);
    throw error;
  }
}

export async function getTopMentions(params?: any) {
  const secrets = getSecrets();
  const apiKey = secrets.elfaApiKey;

  if (!apiKey) {
    throw new Error('Elfa API key is not available in secrets');
  }

  try {
    const response = await axios.get('https://api.elfa.ai/v1/top-mentions', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting top mentions from Elfa API:', error);
    throw error;
  }
}

export async function searchMentions(searchParams: any) {
  const secrets = getSecrets();
  const apiKey = secrets.elfaApiKey;

  if (!apiKey) {
    throw new Error('Elfa API key is not available in secrets');
  }

  try {
    const response = await axios.get('https://api.elfa.ai/v1/mentions/search', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params: searchParams,
    });
    return response.data;
  } catch (error) {
    console.error('Error searching mentions from Elfa API:', error);
    throw error;
  }
}

export async function getTrendingTokens(params?: any) {
  const secrets = getSecrets();
  const apiKey = secrets.elfaApiKey;

  if (!apiKey) {
    throw new Error('Elfa API key is not available in secrets');
  }

  try {
    const response = await axios.get('https://api.elfa.ai/v1/trending-tokens', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting trending tokens from Elfa API:', error);
    throw error;
  }
}

export async function getAccountSmartStats(params?: any) {
  const secrets = getSecrets();
  const apiKey = secrets.elfaApiKey;

  if (!apiKey) {
    throw new Error('Elfa API key is not available in secrets');
  }

  try {
    const response = await axios.get(
      'https://api.elfa.ai/v1/account/smart-stats',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        params,
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error getting account smart stats from Elfa API:', error);
    throw error;
  }
}

const main = async (): Promise<void> => {
  try {
    debug.info('Starting Elfa API test');

    // Test ping endpoint
    const pingResponse = await pingElfaApi();
    debug.info('Ping response:', pingResponse);

    // Test key-status endpoint
    // const keyStatusResponse = await getKeyStatus();
    // debug.info('Key status response:', keyStatusResponse);

    // Test other endpoints as needed
    // Uncomment the following lines to test other endpoints

    // const mentionsResponse = await getMentions();
    // debug.info('Mentions response:', mentionsResponse);

    const topMentionsResponse = await getTopMentions();
    debug.info('Top mentions response:', topMentionsResponse);
    
    const searchResponse = await searchMentions({ query: 'example' });
    debug.info('Search mentions response:', searchResponse);
    
    const trendingTokensResponse = await getTrendingTokens();
    debug.info('Trending tokens response:', trendingTokensResponse);
    
    const smartStatsResponse = await getAccountSmartStats();
    debug.info('Account smart stats response:', smartStatsResponse);

    debug.info('Elfa API test completed successfully');
  } catch (error) {
    debug.error('Failed to test Elfa API:', error as Error);
    process.exit(1);
  }
};

// Run the main function
main().catch((error) => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});
*/
