import { Debugger, DebugConfig } from '@/utils/debugger';
import { ElfaClient, MentionData } from '@/utils/elfa';
import { getSecrets, Secrets } from '@/utils/secrets';
import { ChatAnthropic } from '@langchain/anthropic';
import { calculateEngagementScoreFromTweet } from './engagement_calculator';
import { CryptoDetector } from './crypto_detector';
import { TweetInsightExtractor, TweetInsight } from './tweet_insight_extractor';
import { VectorStore } from '@/utils/vector_store';
import { PodcastCreator } from './podcast_creator';

// Extended type that includes engagement score
export interface EnhancedMentionData extends MentionData {
  engagementScore: number;
}

export interface ElfaExtractorOptions {
  limit: number;
  debugConfig?: DebugConfig;
  generatePodcast?: boolean;
  dryRun?: boolean;
}

export class ElfaExtractor {
  private elfaClient: ElfaClient;
  private model: ChatAnthropic;
  private debug: Debugger;
  private cryptoDetector: CryptoDetector;
  private insightExtractor: TweetInsightExtractor;
  private secrets: Secrets;
  private processorId: number;
  private vectorStore!: VectorStore;
  private podcastCreator!: PodcastCreator;

  constructor(private options: ElfaExtractorOptions) {
    this.debug = Debugger.create(
      options.debugConfig || { enabled: true, level: 'info' },
    );
    this.elfaClient = new ElfaClient(options.debugConfig);

    // Initialize ChatAnthropic model instead of direct Anthropic client
    this.secrets = getSecrets();
    this.model = new ChatAnthropic({
      anthropicApiKey: this.secrets.anthropicApiKey,
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

    // Generate a random processor ID between 999 and 999999
    this.processorId = Math.floor(Math.random() * (999999 - 999 + 1)) + 999;

    // Initialize podcast creator
    this.podcastCreator = new PodcastCreator(
      this.secrets,
      this.debug,
      this.processorId,
      this.options.dryRun,
    );
  }

  public async run(): Promise<string> {
    try {
      // Initialize vector store
      this.vectorStore = await VectorStore.getInstance(
        this.secrets.openaiApiKey,
      );

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

      // Instead of just selecting the first tweet, find the most unique one
      const selectedTweet = await this.findMostUniqueTweet(sortedTweets);

      if (selectedTweet) {
        // Extract insights from the selected product announcement tweet
        this.debug.info(
          'Extracting insights from product announcement tweet...',
        );
        const insight =
          await this.insightExtractor.extractInsightFromTweet(selectedTweet);

        // Save the insight headline to the vector store
        await this.saveInsightToVectorStore(insight);

        await this.podcastCreator.createPodcast(insight);

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

  private async findMostUniqueTweet(
    topTweets: EnhancedMentionData[],
  ): Promise<EnhancedMentionData | null> {
    if (topTweets.length === 0) return null;

    this.debug.info(
      `Finding most unique tweet among top ${topTweets.length} tweets`,
    );

    // For each tweet, check similarity with existing content in vector store
    const uniquenessScores = await Promise.all(
      topTweets.map(async (tweet) => {
        try {
          // Search for similar content in vector store with a similarity threshold
          const similarDocuments = await this.vectorStore.similaritySearch(
            tweet.content,
            3,
            { scoreThreshold: 0.8 }, // Only consider documents with 80% or higher similarity
          );

          // If no similar documents found, this is very unique
          if (similarDocuments.length === 0) return { tweet, uniqueness: 1.0 };

          // Calculate average uniqueness (lower number of similar docs means more unique)
          const uniqueness = 1.0 - similarDocuments.length / 3;

          return { tweet, uniqueness };
        } catch (error) {
          this.debug.error(`Error calculating uniqueness for tweet: ${error}`);
          // Default to medium uniqueness on error
          return { tweet, uniqueness: 0.5 };
        }
      }),
    );

    // Sort by uniqueness (higher is better)
    uniquenessScores.sort((a, b) => {
      // Primary sort by uniqueness
      if (b.uniqueness !== a.uniqueness) {
        return b.uniqueness - a.uniqueness;
      }
      // Secondary sort by engagement score
      return b.tweet.engagementScore - a.tweet.engagementScore;
    });

    this.debug.info(
      `Selected most unique tweet with uniqueness score: ${uniquenessScores[0]?.uniqueness}`,
    );

    return uniquenessScores[0]?.tweet || topTweets[0];
  }

  private async saveInsightToVectorStore(insight: TweetInsight): Promise<void> {
    try {
      const { headline } = insight;

      // Create a document to store in the vector database
      const document = {
        pageContent: headline,
        metadata: {
          type: 'news_item',
          timestamp: new Date().toISOString(),
        },
      };

      await this.vectorStore.addDocuments([document]);
      this.debug.info(`Saved insight "${headline}" to vector store`);
    } catch (error) {
      this.debug.error(`Failed to save insight to vector store: ${error}`);
      // Don't throw to allow the process to continue
    }
  }
}
