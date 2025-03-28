// Define TimeWindow type
export type TimeWindow = '1h' | '24h' | '7d';

// Common response wrapper
export interface ElfaResponse<T> {
  success: boolean;
  data: T;
}

// Ping response
export interface PingResponse {
  message: string;
}

// Key status response
export interface KeyStatusData {
  id: number;
  key: string;
  name: string;
  status: string;
  dailyRequestLimit: number;
  monthlyRequestLimit: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  requestsPerMinute: number;
  email: string;
  project: string | null;
  usage: {
    daily: number;
    monthly: number;
  };
  limits: {
    daily: number;
    monthly: number;
  };
  isExpired: boolean;
  remainingRequests: {
    daily: number;
    monthly: number;
  };
}

// Mentions response
export interface AccountData {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string;
  followerCount: number;
  followingCount: number;
  description: string;
  createdAt: string;
}

export interface MentionData {
  id: string;
  type: 'post' | 'quote' | 'repost';
  content: string;
  originalUrl: string;
  data: Record<string, unknown>;
  likeCount: number;
  quoteCount: number;
  replyCount: number;
  repostCount: number;
  viewCount: number;
  mentionedAt: string;
  bookmarkCount: number;
  account: AccountData;
}

export interface MentionsResponse {
  success: boolean;
  data: MentionData[];
  metadata: {
    total: number;
    limit: number;
    offset: number;
  };
}

// Top mentions response
export interface TwitterAccountInfo {
  username: string;
  twitter_user_id: string;
  description: string;
  profileImageUrl: string;
}

export interface Metrics {
  like_count: number;
  reply_count: number;
  repost_count: number;
  view_count: number;
}

export interface TopMentionData {
  id: number;
  twitter_id: string;
  twitter_user_id: string;
  content: string;
  mentioned_at: string;
  type: 'post' | 'quote' | 'repost';
  metrics: Metrics;
  twitter_account_info?: TwitterAccountInfo;
}

// Update TopMentionsData to use the new type
export interface TopMentionsData {
  data: TopMentionData[];
  total: number;
  page: number;
  pageSize: number;
}

// Search mentions response
export interface SearchMentionData {
  id: number;
  twitter_id: string;
  twitter_user_id: string;
  content: string;
  mentioned_at: string;
  type: string;
  metrics: {
    like_count: number;
    reply_count: number;
    repost_count: number;
    view_count: number;
  };
  sentiment: 'positive' | 'negative' | 'netural';
}

export interface SearchMentionsResponse {
  success: boolean;
  data: SearchMentionData[];
  metadata: {
    total: number;
    cursor: string;
  };
}

// Trending tokens response
export interface TrendingToken {
  token: string;
  current_count: number;
  previous_count: number;
  change_percent: number;
}

export interface TrendingTokensResponse {
  total: number;
  page: number;
  pageSize: number;
  data: TrendingToken[];
}

// Account smart stats response
export interface AccountSmartStatsData {
  smartFollowingCount: number;
  averageEngagement: number;
  followerEngagementRatio: number;
}
