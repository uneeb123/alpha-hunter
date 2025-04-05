import { ChatAnthropic } from '@langchain/anthropic';
// import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { VectorStore } from '@/utils/vector_store';
import { getSecrets } from '@/utils/secrets';
import { Debugger } from '@/utils/debugger';

export interface NewsItem {
  headline: string;
  summary: string;
  source: string;
  views: number;
}

export class NewsAgent {
  protected model: ChatAnthropic;
  protected vectorStore!: VectorStore;
  protected secrets = getSecrets();
  private debug = Debugger.getInstance();

  constructor(
    apiKey: string,
    modelName: string = 'claude-3-5-sonnet-20241022',
    // provider: 'anthropic' | 'openai' = 'anthropic',
  ) {
    this.model = new ChatAnthropic({
      anthropicApiKey: apiKey,
      modelName: modelName,
      temperature: 0.3,
    });
    /*
    if (provider === 'anthropic') {
      this.model = new ChatAnthropic({
        anthropicApiKey: apiKey,
        modelName: modelName,
        temperature: 0.3,
      });
    } else {
      this.model = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: modelName,
        temperature: 0.3,
      });
    }
    */
  }

  async init() {
    this.vectorStore = await VectorStore.getInstance(this.secrets.openaiApiKey);
  }

  async extractNewsFromTweets(
    tweets: string,
    topic: string,
    // existingNewsThreshold = 0.85,
  ): Promise<NewsItem[]> {
    // Step 1: Extract potential news items from tweets
    const extractionPrompt = PromptTemplate.fromTemplate(`
You are a news extraction system analyzing tweets to identify news stories. Past News have already been extracted. Only extract new news. 

# Tweets to be analyzed
{tweets}

# Past Extracted News
{pastNews}
  
Extract 5 distinct news items from the following tweets related to the topic: {topic}. For each news item:
1. Provide a clear headline
2. Write a brief 1-2 sentence summary
3. Note the source in the tweet. If multiple sources, choose the earliest one. Note: this is a link.
4. Aggregate their total views based on the tweets that mentioned them.

Focus only on factual news, ignore opinions, personal updates, or promotional content.

# Response Format
IMPORTANT: Your response must be a valid JSON array of objects. Each object should have keys: "headline", "summary", "source", "views".
Do not include any explanatory text before or after the JSON. Only return the JSON array.

\`\`\`
[
  {{
    "headline": "Example Headline",
    "summary": "Example summary text",
    "source": "https://example.com",
    "views": 1000
  }}
]
\`\`\`
`);

    const jsonOutputParser = new JsonOutputParser<NewsItem[]>();
    const recentHeadlines = await this.vectorStore.getRecentNewsHeadlines(10);
    const formattedPrompt = await extractionPrompt.format({
      tweets,
      topic,
      pastNews: recentHeadlines.map((h) => `- ${h}`).join('\n'),
    });

    const response = await this.model.invoke([
      {
        role: 'user',
        content: formattedPrompt,
      },
    ]);

    try {
      return await jsonOutputParser.parse(response.text);
    } catch (e) {
      // If direct parsing fails, try to extract JSON from the text
      this.debug.verbose(
        'Initial JSON parsing failed, attempting to extract JSON from text',
      );
      try {
        // Look for JSON-like content in the response
        const jsonMatch = response.text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          return JSON.parse(jsonString);
        }

        // If no JSON-like content found, try a more structured approach
        this.debug.verbose(
          'Attempting to parse structured content from LLM response',
        );
        const structuredOutput = await this.extractStructuredContent(
          response.text,
        );
        return structuredOutput;
      } catch (innerError) {
        this.debug.error(
          'Failed to extract JSON from text',
          innerError as Error,
        );
        throw e; // Throw the original error
      }
    }
  }

  // Helper method to extract structured content when JSON parsing fails
  private async extractStructuredContent(text: string): Promise<NewsItem[]> {
    const structuringPrompt = PromptTemplate.fromTemplate(`
    I need to convert the following text into a valid JSON array of news items.
    Each news item should have "headline", "summary", "source", and "views" fields.
    
    Original text:
    {text}
    
    Return ONLY a valid JSON array with no additional text or explanation.
    `);

    const jsonOutputParser = new JsonOutputParser<NewsItem[]>();
    const formattedPrompt = await structuringPrompt.format({ text });
    const response = await this.model.invoke([
      {
        role: 'user',
        content: formattedPrompt,
      },
    ]);
    return await jsonOutputParser.parse(response.text);
  }
}
