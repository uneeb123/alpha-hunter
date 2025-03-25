import { Debugger } from '@/utils/debugger';
import { MentionData, ElfaClient } from '@/utils/elfa';
import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { calculateEngagementScoreWithoutBookmarks } from './engagement_calculator';
import { getUsernameById } from '@/utils/x';

// Define an interface for the insight return type
export interface TweetInsight {
  headline: string;
  keywords: string[];
  sentiment: string;
  source: string;
  analysis: string;
}

export class TweetInsightExtractor {
  constructor(
    private model: ChatAnthropic,
    private elfaClient: ElfaClient,
    private debug: Debugger,
  ) {}

  // Extract insight from a single tweet
  public async extractInsightFromTweet(
    tweet: MentionData,
  ): Promise<TweetInsight> {
    const tweetFormatted = `Username: @${tweet.account.username}
    Content: ${tweet.content}
    Likes: ${tweet.likeCount}, Reposts: ${tweet.repostCount}, Views: ${tweet.viewCount}
    Date: ${new Date(tweet.mentionedAt).toLocaleString()}`;

    const insightsExtractionPrompt = PromptTemplate.fromTemplate(`
    You are a cryptocurrency market analyst. I'll provide you with a tweet related to cryptocurrency.
    Your task is to extract key information in a structured JSON format.
    
    Tweet:
    """
    {tweetFormatted}
    """
    
    Respond with a valid JSON object in this exact format:
    {{
      "headline": "A concise title capturing the main topic being discussed",
      "keywords": ["keyword1", "keyword2"],
      "sentiment": "positive/negative/neutral"
    }}
    
    CRITICAL INSTRUCTION: You must include EXACTLY 1 or 2 keywords total in the keywords array. Never include more than 2 keywords. Choose only the most essential terms that represent the core topic.
    
    IMPORTANT: 
    - Keywords must be proper nouns (specific names, projects, entities, protocols), not actions or verbs
    - Avoid generic keywords like "bitcoin", "crypto", "cryptocurrency", "BTC", "DeFi", "NFT" or "blockchain"
    - Instead, use specific project names, technologies, or concepts mentioned in the tweet (e.g., "Kaito", "Bored Apes", "Uniswap")
    
    Provide ONLY the JSON with no additional text or explanation.
    `);

    const chain = RunnableSequence.from([insightsExtractionPrompt, this.model]);

    // Parse the JSON response
    try {
      const response = await chain.invoke({ tweetFormatted });
      const insightData = JSON.parse(response.text.trim());

      // Create a complete insight object with tweet metadata
      const tweetUrl = `https://x.com${tweet.originalUrl}`;

      // Generate analysis based on keywords and headline
      const analysis = await this.generateAnalysisFromKeywords(
        insightData.keywords,
        insightData.headline,
      );

      return {
        headline: insightData.headline,
        keywords: insightData.keywords,
        sentiment: insightData.sentiment,
        source: tweetUrl,
        analysis: analysis,
      };
    } catch (error: unknown) {
      const parseError = error as Error;
      this.debug.error(`Error parsing JSON response: ${parseError}`);
      throw new Error(
        `Failed to parse insight from tweet: ${parseError.message}`,
      );
    }
  }

  // Generate analysis from keywords by searching related mentions and summarizing
  private async generateAnalysisFromKeywords(
    keywords: string[],
    headline: string,
  ): Promise<string> {
    if (!keywords || keywords.length === 0) {
      return 'No analysis available due to missing keywords.';
    }

    try {
      // Join keywords for search query
      const keywordsString = keywords.join(', ');
      this.debug.info(
        `Searching for related mentions with keywords: ${keywordsString}`,
      );

      // Search for related mentions using the keywords
      const searchResponse = await this.elfaClient.searchMentions({
        keywords: keywordsString,
      });

      if (!searchResponse.data || searchResponse.data.length === 0) {
        return 'No additional context found for these keywords.';
      }

      // Calculate engagement scores and sort mentions by score (highest first)
      const scoredMentions = searchResponse.data.map((mention) => ({
        mention,
        score: calculateEngagementScoreWithoutBookmarks({
          likeCount: mention.metrics.like_count,
          replyCount: mention.metrics.reply_count,
          repostCount: mention.metrics.repost_count,
          viewCount: mention.metrics.view_count,
        }),
      }));

      scoredMentions.sort((a, b) => b.score - a.score);

      // Take only the top 10 mentions
      const top10Mentions = scoredMentions.slice(0, 10);

      // Get usernames for each mention
      const mentionsWithUsernames = await Promise.all(
        top10Mentions.map(async ({ mention, score }) => {
          try {
            const username = await getUsernameById(mention.twitter_user_id);
            return { mention, score, username };
          } catch (error) {
            this.debug.error(
              `Could not get username for ${mention.twitter_user_id}: ${error}`,
            );
            return { mention, score, username: mention.twitter_user_id };
          }
        }),
      );

      this.debug.info(
        `Found ${searchResponse.data.length} related mentions for analysis for ${keywordsString}, using top 10 by engagement score`,
      );

      // Format the related mentions for the LLM (now using usernames instead of IDs)
      const relatedMentions = mentionsWithUsernames
        .map(
          ({ mention, username }) =>
            `Tweet from @${username}: ${mention.content}`,
        )
        .join('\n\n');

      // Create a prompt for the LLM to generate an analysis
      const analysisPrompt = PromptTemplate.fromTemplate(`
      You are a cryptocurrency market analyst. I'll provide you with several tweets related to the keywords: {keywords}.
      
      The main topic is: {headline}
      
      Your task is to analyze these tweets and provide a concise, factual summary of what's happening with these topics in the crypto space.
      
      Related tweets:
      """
      {relatedMentions}
      """
      
      Extract key factual information and present it as bullet points. Include specific quotes or references to sources when possible.
      
      IMPORTANT: 
      - Focus only on factual information, not speculation
      - Only consider tweets that are directly relevant to the headline
      - Present information as direct bullet points without introductory phrases
      - Extract as much factual information as possible from the tweets
      - Do not start with "Based on the tweets provided" or similar phrases
      `);

      const chain = RunnableSequence.from([analysisPrompt, this.model]);

      const response = await chain.invoke({
        keywords: keywords.join(', '),
        headline,
        relatedMentions,
      });

      return response.text.trim();
    } catch (error) {
      this.debug.error(`Error generating analysis from keywords: ${error}`);
      return 'Analysis unavailable due to processing error.';
    }
  }
}
