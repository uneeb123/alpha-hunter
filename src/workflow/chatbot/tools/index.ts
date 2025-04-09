import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { searchTweetsForTicker } from './search_tweets_for_ticker';
import { getYieldInfo } from './get_yield_info';
import { getTopTweets } from './get_top_tweets';
import { getTrendingTokens } from './get_trending_tokens';
import { getNewlyCreatedTokens } from './get_newly_created_tokens';

export const tools = [
  new TavilySearchResults({ maxResults: 3 }),
  getYieldInfo,
  searchTweetsForTicker,
  getTopTweets,
  getTrendingTokens,
  getNewlyCreatedTokens,
];

// Currently no difference
export const agentSmithTools = [
  new TavilySearchResults({ maxResults: 3 }),
  getYieldInfo,
  searchTweetsForTicker,
  getTopTweets,
  getTrendingTokens,
  getNewlyCreatedTokens,
];
