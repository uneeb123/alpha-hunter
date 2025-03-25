import { Debugger, DebugConfig } from '@/utils/debugger';
import { ElfaClient, MentionData } from '@/utils/elfa';
import { getSecrets } from '@/utils/secrets';
import { ChatAnthropic } from '@langchain/anthropic';
import { calculateEngagementScore } from './engagement_calculator';
import { CryptoDetector } from './crypto_detector';
import { TweetInsightExtractor } from './tweet_insight_extractor';

// Extended type that includes engagement score
export interface EnhancedMentionData extends MentionData {
  engagementScore: number;
}

export interface ElfaExtractorOptions {
  limit: number;
  debugConfig?: DebugConfig;
}

// Define an interface for the insight return type
export interface TweetInsight {
  headline: string;
  keywords: string[];
  sentiment: string;
  source: string;
  analysis: string;
}

export class ElfaExtractor {
  private elfaClient: ElfaClient;
  private model: ChatAnthropic;
  private debug: Debugger;
  private cryptoDetector: CryptoDetector;
  private insightExtractor: TweetInsightExtractor;

  constructor(private options: ElfaExtractorOptions) {
    this.debug = Debugger.create(
      options.debugConfig || { enabled: true, level: 'info' },
    );
    this.elfaClient = new ElfaClient(options.debugConfig);

    // Initialize ChatAnthropic model instead of direct Anthropic client
    const secrets = getSecrets();
    this.model = new ChatAnthropic({
      anthropicApiKey: secrets.anthropicApiKey,
      modelName: 'claude-3-sonnet-20240229',
      temperature: 0.3,
    });

    // Initialize the crypto detector
    this.cryptoDetector = new CryptoDetector(this.model, this.debug);

    // Initialize the tweet insight extractor
    this.insightExtractor = new TweetInsightExtractor(
      this.model,
      this.elfaClient,
      this.debug,
    );
  }

  public async run(): Promise<string> {
    try {
      // Get mentions from the API
      const mentionsResponse = await this.elfaClient.getMentions({
        limit: this.options.limit,
        offset: 0,
      });

      this.debug.info(
        `Retrieved ${mentionsResponse.data.length} tweets from Elfa API`,
      );

      // Filter crypto-related tweets in parallel
      this.debug.info('Filtering for crypto-related tweets in parallel...');

      // Process all tweets in parallel using Promise.all
      const processedTweets = await Promise.all(
        mentionsResponse.data.map(async (tweet) => {
          const isCrypto = await this.cryptoDetector.isCryptoRelated(tweet);
          if (isCrypto) {
            // Calculate and add engagement score to the tweet object
            const enhancedTweet = tweet as EnhancedMentionData;
            enhancedTweet.engagementScore = calculateEngagementScore(tweet);
            return enhancedTweet;
          }
          return null;
        }),
      );

      // Filter out null values (non-crypto tweets)
      const cryptoTweets = processedTweets.filter(
        (tweet): tweet is EnhancedMentionData => tweet !== null,
      );

      this.debug.info(`Found ${cryptoTweets.length} crypto-related tweets`);

      // Sort tweets by a comprehensive engagement score
      const sortedTweets = cryptoTweets.sort((a, b) => {
        return b.engagementScore - a.engagementScore; // Higher scores first
      });

      // Take top 3 tweets by engagement score
      const topTweets = sortedTweets.slice(0, Math.min(3, sortedTweets.length));
      this.debug.info(`Selected top ${topTweets.length} tweets by engagement`);

      this.debug.verbose(topTweets);

      // Extract insights from each of the top 3 tweets individually
      if (topTweets.length > 0) {
        this.debug.info('Extracting insights from top tweets individually...');
        const insights = await Promise.all(
          topTweets.map((tweet) =>
            this.insightExtractor.extractInsightFromTweet(tweet),
          ),
        );
        // Convert the TweetInsight objects to formatted strings before joining
        const insightStrings = insights.map(
          (insight) =>
            `Headline: ${insight.headline}\nKeywords: ${insight.keywords.join(', ')}\nSentiment: ${insight.sentiment}\nSource: ${insight.source}\nAnalysis: ${insight.analysis}`,
        );
        return insightStrings.join('\n\n');
      } else {
        return 'No crypto-related tweets found matching the criteria.';
      }
    } catch (error) {
      this.debug.error(`Failed to extract insights: ${error}`);
      throw error;
    }
  }
}
