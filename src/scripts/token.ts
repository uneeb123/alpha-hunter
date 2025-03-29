import { Command } from 'commander';
import { Debugger, DebugConfig } from '@/utils/debugger';
import { ElfaClient } from '@/utils/elfa';
import { ChatAnthropic } from '@langchain/anthropic';
import { getSecrets } from '@/utils/secrets';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { PodcastCreator } from '@/workflow/narrative/podcast_creator';
import { TopMentionData } from '@/utils/elfa.types';
import { calculateEngagementScoreWithoutBookmarks } from '@/workflow/narrative/engagement_calculator';

// Interface for our token insights
interface TokenInsight {
  ticker: string;
  headline: string;
  analysis: string;
  mentionUsers: string[];
}

const program = new Command();

program
  .option('-d, --debug [level]', 'Debug level (info or verbose)', 'info')
  .option('-l, --limit <number>', 'Number of tokens to display', '10')
  .option('--podcast', 'Generate podcast', false)
  .option('--post', 'Post to social media', true)
  .parse(process.argv);

const options = program.opts();

const debugConfig: DebugConfig = {
  enabled: true,
  level: options.debug === 'verbose' ? 'verbose' : 'info',
};

const debug = Debugger.create(debugConfig);

export const main = async (): Promise<void> => {
  debug.info(`Debug level: ${options.debug}`);
  debug.info(`Limit: ${options.limit}`);
  debug.info(`Generate podcast: ${options.podcast}`);
  debug.info(`Post to social media: ${options.post}`);

  // Define blacklist of tokens to exclude
  const blacklist = [
    'btc',
    'eth',
    'sol',
    'usd',
    'ghibli',
    'imhpc',
    'wal',
    'dog',
  ];

  try {
    const elfaClient = new ElfaClient(debugConfig);

    debug.info('Fetching trending tokens from Elfa API...');
    const response = await elfaClient.getTrendingTokens();

    if (response.success && response.data.data.length > 0) {
      // Filter out blacklisted tokens (case insensitive)
      const filteredTokens = response.data.data.filter(
        (token) =>
          token.token &&
          !blacklist.some((blacklisted) =>
            token.token.toLowerCase().includes(blacklisted),
          ),
      );

      if (filteredTokens.length === 0) {
        console.log('\nNo tokens found outside the blacklist.');
        return;
      }

      // Find the token with the highest current count
      const topToken = filteredTokens.reduce(
        (max, token) => (token.current_count > max.current_count ? token : max),
        filteredTokens[0],
      );

      console.log('\nTop Trending Token (Excluding BTC, ETH, Solana, USD):');
      console.log('--------------------------------------------------');
      console.log(`Token: ${topToken.token}`);
      console.log(`Current Count: ${topToken.current_count}`);
      console.log(`Previous Count: ${topToken.previous_count}`);
      console.log(`Change: ${topToken.change_percent}%`);

      debug.info(`Successfully found top token: ${topToken.token}`);

      // Generate insights for podcast if requested
      if (options.podcast) {
        debug.info(`Generating insights for token: ${topToken.token}`);

        // Get top mentions for this token
        debug.info('Fetching top mentions for this token...');
        const mentionsResponse = await elfaClient.getTopMentions({
          ticker: topToken.token,
          timeWindow: '24h',
          pageSize: Math.min(topToken.current_count, 100), // Use current count, max 100
          includeAccountDetails: true,
        });

        if (mentionsResponse.success && mentionsResponse.data.data.length > 0) {
          debug.info(
            `Found ${mentionsResponse.data.data.length} mentions for token ${topToken.token}`,
          );

          // Sort and filter mentions by engagement score
          const sortedMentions = mentionsResponse.data.data
            .map((mention: TopMentionData) => ({
              ...mention,
              engagementScore: calculateEngagementScoreWithoutBookmarks({
                likeCount: mention.metrics.like_count,
                replyCount: mention.metrics.reply_count,
                repostCount: mention.metrics.repost_count,
                viewCount: mention.metrics.view_count,
              }),
            }))
            .filter((mention) => mention.engagementScore > 0)
            .sort((a, b) => b.engagementScore - a.engagementScore);

          // Take top 10 mentions or all if less than 20
          const topMentions = sortedMentions.slice(0, 20);

          debug.info(
            `Filtered to ${topMentions.length} high-engagement mentions`,
          );

          // Generate insights from filtered mentions
          const insight = await generateTokenInsight(
            topToken.token,
            topMentions,
          );

          // Print the generated insight
          console.log('\nToken Insight:');
          console.log('-------------');
          console.log(`Headline: ${insight.headline}`);
          console.log('\nAnalysis:');
          console.log(insight.analysis);

          if (options.podcast) {
            // Generate podcast with the insights
            debug.info('Generating podcast...');

            const secrets = getSecrets();
            const processorId =
              Math.floor(Math.random() * (999999 - 999 + 1)) + 999;

            const podcastCreator = new PodcastCreator(
              secrets,
              debug,
              processorId,
              options.post,
            );

            await podcastCreator.createPodcast(
              insight.headline,
              insight.analysis,
              insight.mentionUsers,
            );
            debug.info('Podcast generation complete');
          }
        } else {
          debug.error(
            'Failed to fetch mentions for this token or no mentions returned',
          );
        }
      }
    } else {
      debug.error('Failed to fetch trending tokens or no tokens returned');
    }
  } catch (error) {
    debug.error(`Failed to fetch trending tokens: ${error}`);
  }
};

// Generate insights from token mentions
async function generateTokenInsight(
  ticker: string,
  mentions: TopMentionData[],
): Promise<TokenInsight> {
  const secrets = getSecrets();

  // Initialize ChatAnthropic model
  const model = new ChatAnthropic({
    anthropicApiKey: secrets.anthropicApiKey,
    modelName: 'claude-3-sonnet-20240229',
    temperature: 0.3,
  });

  // Format the related mentions for the LLM
  const formattedMentions = mentions
    .map(
      (mention, index) =>
        `Tweet ${index + 1} from @${mention.twitter_account_info?.username}: ${mention.content}`,
    )
    .join('\n\n');

  // Extract usernames for attribution
  const mentionUsers = mentions
    .map((mention) => mention.twitter_account_info?.username)
    .filter((username): username is string => username !== undefined);

  // Create a prompt for generating insights
  const insightPrompt = PromptTemplate.fromTemplate(`
  You are a cryptocurrency market analyst specializing in token analysis. 
  I'll provide you with several tweets related to the token: {ticker}.

  Your task is to analyze these tweets and provide insights about this token.
  
  Tweets about {ticker}:
  """
  {formattedMentions}
  """
  
  Respond with a valid JSON object in this exact format:
  {{
    "headline": "A concise title capturing the main trend or news for this token",
    "analysis": "A thorough analysis of what's happening with this token based on these mentions. Include relevant facts, trends, and noteworthy information in bullet point format."
  }}
  
  IMPORTANT GUIDELINES:
  - Include EXACTLY 2 keywords representing specific aspects of this token or related projects
  - Use specific, informative keywords instead of generic terms
  - Present factual information with minimal speculation
  - Format the analysis as clear bullet points
  - Extract meaningful trends and patterns across multiple tweets
  
  Provide ONLY the JSON with no additional text or explanation.
  `);

  // Create and run the chain
  const chain = RunnableSequence.from([insightPrompt, model]);

  try {
    const response = await chain.invoke({
      ticker,
      formattedMentions,
    });

    // Parse JSON response
    const insightData = JSON.parse(response.text.trim());

    return {
      ticker,
      headline: insightData.headline,
      analysis: insightData.analysis,
      mentionUsers,
    };
  } catch (error) {
    debug.error(`Error generating token insight: ${error}`);

    // Return a fallback insight
    return {
      ticker,
      headline: `${ticker} Market Update`,
      analysis: 'Unable to generate detailed analysis due to processing error.',
      mentionUsers,
    };
  }
}

process.on('SIGINT', () => {
  debug.error('Received SIGINT signal (Ctrl+C). Shutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Error running main:', error);
  process.exit(1);
});
