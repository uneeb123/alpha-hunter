import { Debugger, DebugConfig } from '@/utils/debugger';
import { ElfaClient, MentionData } from '@/utils/elfa';
import { getSecrets } from '@/utils/secrets';
import { ChatAnthropic } from '@langchain/anthropic';
import { calculateEngagementScoreFromTweet } from './engagement_calculator';
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
            enhancedTweet.engagementScore =
              calculateEngagementScoreFromTweet(tweet);
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

      this.debug.verbose(sortedTweets);

      const selectedTweet = sortedTweets[0];

      if (selectedTweet) {
        // Extract insights from the selected product announcement tweet
        this.debug.info(
          'Extracting insights from product announcement tweet...',
        );
        const insight =
          await this.insightExtractor.extractInsightFromTweet(selectedTweet);

        // Convert the TweetInsight object to a formatted string
        return `Headline: ${insight.headline}\nKeywords: ${insight.keywords.join(', ')}\nSentiment: ${insight.sentiment}\nSource: ${insight.source}\nAnalysis: ${insight.analysis}`;
      } else {
        return 'No crypto-related tweets found matching the criteria.';
      }
    } catch (error) {
      this.debug.error(`Failed to extract insights: ${error}`);
      throw error;
    }
  }
}
