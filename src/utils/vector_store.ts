import { ChatAnthropic } from '@langchain/anthropic';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';
import path from 'path';
import fs from 'fs';
import { Debugger } from '@/utils/debugger';

// Define a class for vector store operations
export class VectorStore {
  private static instance: VectorStore;
  private vectorStore: MemoryVectorStore | Chroma;
  private embeddings: OpenAIEmbeddings;
  private debug = Debugger.getInstance();
  private useChroma: boolean;
  private chromaCollection: string;
  private chromaUrl?: string;

  // Private constructor for singleton pattern
  private constructor(
    openAIApiKey: string,
    useChroma: boolean = false,
    chromaCollection: string = 'alpha-hunter',
    chromaUrl?: string,
  ) {
    this.embeddings = new OpenAIEmbeddings({ openAIApiKey });
    this.useChroma = useChroma;
    this.chromaCollection = chromaCollection;
    this.chromaUrl = chromaUrl;

    if (useChroma) {
      // Create a Chroma vector store
      this.vectorStore = new Chroma(this.embeddings, {
        collectionName: chromaCollection,
        url: chromaUrl,
      });
      this.debug.info(
        `Using Chroma vector store with collection: ${chromaCollection}`,
      );
    } else {
      // Create an in-memory vector store
      this.vectorStore = new MemoryVectorStore(this.embeddings);
      this.debug.info('Using in-memory vector store');

      // Try to load existing vectors from a file if it exists
      this.loadFromFile();
    }
  }

  // Get the singleton instance
  public static getInstance(
    openAIApiKey: string,
    useChroma: boolean = false,
    chromaCollection: string = 'alpha-hunter',
    chromaUrl?: string,
  ): VectorStore {
    if (!VectorStore.instance) {
      VectorStore.instance = new VectorStore(
        openAIApiKey,
        useChroma,
        chromaCollection,
        chromaUrl,
      );
    }
    return VectorStore.instance;
  }

  // Add documents to the vector store
  public async addDocuments(documents: Document[]): Promise<void> {
    try {
      await this.vectorStore.addDocuments(documents);
      this.debug.info(`Added ${documents.length} documents to vector store`);

      // If using in-memory store, save to file
      if (!this.useChroma) {
        await this.saveToFile();
      }
    } catch (error) {
      this.debug.error(
        'Error adding documents to vector store:',
        error as Error,
      );
      throw error;
    }
  }

  // Add a single summary to the vector store
  public async addSummary(
    summary: string,
    alphaId: number,
    processorId: string,
    timestamp: Date,
  ): Promise<void> {
    // Create metadata for the summary
    const metadata = {
      alphaId: alphaId.toString(),
      processorId: processorId,
      timestamp: timestamp.toISOString(),
      type: 'summary',
    };

    // Create a document from the summary
    const document = new Document({
      pageContent: summary,
      metadata,
    });

    await this.addDocuments([document]);
  }

  // Search for similar summaries
  public async similaritySummarySearch(
    query: string,
    k: number = 5,
  ): Promise<Document[]> {
    try {
      const results = await this.vectorStore.similaritySearch(query, k, {
        type: 'summary',
      });
      this.debug.info(`Found ${results.length} similar documents`);
      return results;
    } catch (error) {
      this.debug.error('Error searching vector store:', error as Error);
      throw error;
    }
  }

  // Check if a summary is too similar to existing ones
  public async isDuplicateSummary(
    summary: string,
    // similarityThreshold: number = 0.9,
  ): Promise<boolean> {
    const results = await this.similaritySummarySearch(summary, 5);

    if (results.length === 0) {
      return false;
    }

    // We'll use the model to determine similarity
    const model = new ChatAnthropic({
      anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
      modelName: 'claude-3-haiku-20240307',
      temperature: 0,
    });

    const prompt = `Compare the following two summaries and determine if they are discussing the same news or topics. 
First summary: ${summary}

Second summary: ${results[0].pageContent}

Are these summaries talking about the same news items or topics? Answer with just "yes" or "no".`;

    try {
      const response = await model.invoke(prompt);
      const answer = response.content.toString().toLowerCase().trim();

      this.debug.info(`Duplicate check result: ${answer}`);
      return answer.includes('yes');
    } catch (error) {
      this.debug.error('Error checking for duplicate summary:', error as Error);
      // If there's an error, we'll assume it's not a duplicate
      return false;
    }
  }

  // Get all summaries as structured data
  public async getAllSummaries(): Promise<
    {
      content: string;
      alphaId: string;
      processorId: string;
      timestamp: string;
    }[]
  > {
    try {
      if (this.useChroma) {
        // For Chroma, we need to get all documents
        const results = await this.vectorStore.similaritySearch('', 1000, {
          type: 'summary',
        });

        return results.map((doc) => ({
          content: doc.pageContent,
          alphaId: doc.metadata.alphaId,
          processorId: doc.metadata.processorId,
          timestamp: doc.metadata.timestamp,
        }));
      } else if (this.vectorStore instanceof MemoryVectorStore) {
        // For memory store, we can access the documents directly
        const memoryStore = this.vectorStore as MemoryVectorStore;
        const documents = memoryStore.memoryVectors;

        return documents
          .filter((doc) => doc.metadata?.type === 'summary')
          .map((doc) => ({
            content: doc.content,
            alphaId: doc.metadata.alphaId,
            processorId: doc.metadata.processorId,
            timestamp: doc.metadata.timestamp,
          }));
      }

      return [];
    } catch (error) {
      this.debug.error('Error getting all summaries:', error as Error);
      return [];
    }
  }

  // For in-memory vector store: save to a JSON file
  private async saveToFile(): Promise<void> {
    if (this.useChroma || !(this.vectorStore instanceof MemoryVectorStore)) {
      return;
    }

    try {
      const memoryStore = this.vectorStore as MemoryVectorStore;
      const dataDir = path.join(process.cwd(), 'data', 'vectors');

      // Create directory if it doesn't exist
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const filePath = path.join(dataDir, 'memory_vectors.json');

      // Save the memory vectors to a file
      fs.writeFileSync(
        filePath,
        JSON.stringify(memoryStore.memoryVectors, null, 2),
      );

      this.debug.info(
        `Saved ${memoryStore.memoryVectors.length} vectors to ${filePath}`,
      );
    } catch (error) {
      this.debug.error('Error saving vector store to file:', error as Error);
    }
  }

  // For in-memory vector store: load from a JSON file
  private async loadFromFile(): Promise<void> {
    if (this.useChroma || !(this.vectorStore instanceof MemoryVectorStore)) {
      return;
    }

    try {
      const filePath = path.join(
        process.cwd(),
        'data',
        'vectors',
        'memory_vectors.json',
      );

      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        this.debug.info('No existing vector store file found');
        return;
      }

      // Read the file
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const vectors = JSON.parse(fileContent);

      // Convert the loaded data to Documents
      const documents = vectors.map(
        (vec: {
          content: string;
          metadata: {
            alphaId: string;
            processorId: string;
            timestamp: string;
            type: string;
          };
        }) =>
          new Document({
            pageContent: vec.content,
            metadata: vec.metadata,
          }),
      );

      // Add the documents to the vector store
      if (documents.length > 0) {
        await this.vectorStore.addDocuments(documents);
        this.debug.info(`Loaded ${documents.length} vectors from file`);
      }
    } catch (error) {
      this.debug.error('Error loading vector store from file:', error as Error);
    }
  }

  // Get the past topics as a formatted string for the LLM prompt
  public async getPastTopics(count: number = 10): Promise<string> {
    const summaries = await this.getAllSummaries();

    // Sort by timestamp (newest first)
    summaries.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Take the most recent summaries
    const recentSummaries = summaries.slice(0, count);

    // Extract all topics from the summaries
    let allTopics: string[] = [];
    for (const summary of recentSummaries) {
      const topics = summary.content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.match(/^\d+\./)); // Lines that start with a number and period

      allTopics = [...allTopics, ...topics];
    }

    // Return formatted topics
    return allTopics
      .map((topic) => `- ${topic.replace(/^\d+\.\s*/, '')}`)
      .join('\n');
  }
}
