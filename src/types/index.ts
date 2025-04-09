export interface TwitterResponse {
  _maxResultsWhenFetchLast: number;
  _realData: {
    data: Tweet[];
    includes: {
      users?: User[];
      tweets?: Tweet[];
      media?: Media[]; // Added media includes
    };
    meta: {
      result_count: number;
      newest_id: string;
      oldest_id: string;
    };
  };
  _rateLimit: {
    limit: number;
    remaining: number;
    reset: number;
  };
  _instance: {
    _prefix: string;
    _requestMaker: {
      rateLimits: Record<
        string,
        {
          limit: number;
          remaining: number;
          reset: number;
        }
      >;
      clientSettings: Record<string, never>;
      consumerToken: string;
      consumerSecret: string;
      accessToken: string;
      accessSecret: string;
    };
  };
  _queryParams: QueryParams;
  _sharedParams: {
    id: string;
  };
  _endpoint: string;
}

interface QueryParams {
  max_results: number;
  exclude: string[];
  'tweet.fields': string[];
  'user.fields': string[];
  'media.fields': string[];
  expansions: string[];
  start_time: string;
}

export interface Tweet {
  edit_history_tweet_ids: string[];
  id: string;
  text: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    bookmark_count: number;
    impression_count: number;
  };
  author_id: string;
  conversation_id: string;
  created_at: string;
  entities?: {
    annotations?: Annotation[];
    urls?: UrlEntity[];
    cashtags?: CashtagEntity[];
    mentions?: MentionEntity[];
    hashtags?: HashtagEntity[]; // Added hashtags
  };
  note_tweet?: {
    text: string;
    entities?: {
      mentions?: MentionEntity[];
      cashtags?: CashtagEntity[];
      hashtags?: HashtagEntity[]; // Added hashtags in note_tweet
    };
  };
  attachments?: {
    media_keys: string[];
  };
  referenced_tweets?: {
    type: 'quoted' | 'replied_to'; // Added specific types
    id: string;
  }[];
}

interface User {
  profile_image_url: string;
  name: string;
  username: string;
  id: string;
  url?: string;
}

export interface Media {
  type: 'photo' | 'video'; // Added media types
  width: number;
  height: number;
  media_key: string;
  url?: string;
  preview_image_url?: string;
  variants?: MediaVariant[];
}

interface MediaVariant {
  bit_rate?: number;
  content_type: string;
  url: string;
}

interface Annotation {
  start: number;
  end: number;
  probability: number;
  type: string;
  normalized_text: string;
}

interface UrlEntity {
  start: number;
  end: number;
  url: string;
  expanded_url: string;
  display_url: string;
  media_key?: string;
  status?: number;
  unwound_url?: string;
}

interface CashtagEntity {
  start: number;
  end: number;
  tag: string;
}

interface HashtagEntity {
  // Added HashtagEntity
  start: number;
  end: number;
  tag: string;
}

interface MentionEntity {
  start: number;
  end: number;
  username: string;
  id: string;
}

// TYPES FOR THE SCRAPED DATA

interface UserTimeline {
  user: {
    data: {
      id: string;
      name: string;
      username: string;
    };
  };
  tweets: TweetOutput[];
}

interface TweetOutput {
  id: string;
  created_at: string; // ISO 8601 date format
  view_count: number;
  text: string[]; // Array of tweet text segments
}

// The root level is an array of RootObject
export type ParsedData = UserTimeline[];

interface ScrapeRun {
  id: number;
  workflowId: string;
  startedAt: string; // ISO 8601 date string
}

export interface Scrape {
  runs: ScrapeRun[];
}

export * from './events';
export * from './helius';
export * from './bitquery';
