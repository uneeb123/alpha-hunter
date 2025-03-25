import { MentionData } from '@/utils/elfa';
import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { Debugger } from '@/utils/debugger';

export class CryptoDetector {
  constructor(
    private model: ChatAnthropic,
    private debug: Debugger,
  ) {}

  // Check if a tweet is crypto-related
  public async isCryptoRelated(tweet: MentionData): Promise<boolean> {
    if (!tweet || !tweet.content || tweet.content.trim().length === 0) {
      return false;
    }

    // Check if tweet has media
    if (
      tweet.data?.mediaUrls &&
      Array.isArray(tweet.data.mediaUrls) &&
      tweet.data.mediaUrls.length > 0
    ) {
      return false;
    }

    // Use LLM to determine if the tweet is crypto-related
    try {
      const cryptoCheckPrompt = PromptTemplate.fromTemplate(`
      Determine if the following tweet is related to cryptocurrency, blockchain, web3, or tokens.
      Only respond with "YES" if it's clearly about crypto, or "NO" if it's not.
      
      Tweet: {tweetContent}
      
      Answer (YES/NO):
      `);

      const chain = RunnableSequence.from([cryptoCheckPrompt, this.model]);

      const response = await chain.invoke({ tweetContent: tweet.content });
      const answer = response.text.trim().toUpperCase();

      this.debug.info(`Crypto check for tweet: ${answer}`);
      return answer === 'YES';
    } catch (error) {
      this.debug.error(`Error checking if tweet is crypto-related: ${error}`);
      return false; // Default to false if there's an error
    }
  }
}
