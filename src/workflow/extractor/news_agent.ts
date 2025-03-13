import { ChatAnthropic } from '@langchain/anthropic';
// import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
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

# Past Extracted Tweets
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
    const extractionChain = RunnableSequence.from([
      extractionPrompt,
      this.model,
      async (output) => {
        try {
          // Try to parse the output directly
          return await jsonOutputParser.parse(output);
        } catch (e) {
          // If direct parsing fails, try to extract JSON from the text
          this.debug.verbose(
            'Initial JSON parsing failed, attempting to extract JSON from text',
          );
          try {
            // Look for JSON-like content in the response
            const jsonMatch = output.text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
            if (jsonMatch) {
              const jsonString = jsonMatch[0];
              return JSON.parse(jsonString);
            }

            // If no JSON-like content found, try a more structured approach
            this.debug.verbose(
              'Attempting to parse structured content from LLM response',
            );
            const structuredOutput = await this.extractStructuredContent(
              output.text,
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
      },
    ]);

    let extractedNews;
    try {
      const recentHeadlines = await this.vectorStore.getRecentNewsHeadlines(10);
      extractedNews = await extractionChain.invoke({
        tweets,
        topic,
        pastNews: recentHeadlines.map((h) => `- ${h}`).join('\n'),
      });

      // If it's not an array, wrap it
      if (!Array.isArray(extractedNews)) {
        extractedNews = [extractedNews];
      }
    } catch (e) {
      console.error('Failed to parse extracted news as JSON', e);
      // Fallback to empty array if parsing fails
      extractedNews = [];
    }
    this.debug.verbose(extractedNews);

    // Step 2: Filter out news that's too similar to existing news
    const uniqueNews = [];

    for (const newsItem of extractedNews) {
      // Create a query string from the news item
      const queryText = `${newsItem.headline} ${newsItem.summary}`;

      // Check similarity with existing news in vector store
      const similarDocs = await this.vectorStore.similaritySearch(queryText, 5);

      // Default to unique if no similar docs found
      let isDuplicate = false;

      // No need to check similarity scores - if we found any results with same headline or very similar content,
      // it's likely a duplicate since we're using semantic search
      if (similarDocs.length > 0) {
        // Check if headlines match or content is very similar
        for (const doc of similarDocs) {
          if (
            doc.metadata.headline &&
            (doc.metadata.headline.toLowerCase() ===
              newsItem.headline.toLowerCase() ||
              doc.pageContent.includes(newsItem.headline))
          ) {
            this.debug.info('Found duplicate by headline match');
            isDuplicate = true;
            break;
          }
        }
      }

      if (!isDuplicate) {
        uniqueNews.push(newsItem);
      }
    }

    // Step 3: Store the new, unique news items in the vector store
    for (const newsItem of uniqueNews) {
      const newsText = `${newsItem.headline} ${newsItem.summary}`;
      await this.vectorStore.addDocuments([
        {
          pageContent: newsText,
          metadata: {
            headline: newsItem.headline,
            summary: newsItem.summary,
            source: newsItem.source,
            timestamp: new Date().toISOString(),
            type: 'news_item',
          },
        },
      ]);
    }

    return uniqueNews;
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
    const structuringChain = RunnableSequence.from([
      structuringPrompt,
      this.model,
      jsonOutputParser,
    ]);

    return await structuringChain.invoke({ text });
  }
}
