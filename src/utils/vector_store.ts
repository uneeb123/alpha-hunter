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
  private vectorStore!: MemoryVectorStore | Chroma;
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
  }

  public async init() {
    if (this.useChroma) {
      // Create a Chroma vector store
      this.vectorStore = new Chroma(this.embeddings, {
        collectionName: this.chromaCollection,
        url: this.chromaUrl,
      });
      this.debug.info(
        `Using Chroma vector store with collection: ${this.chromaCollection}`,
      );
    } else {
      // Create an in-memory vector store
      this.vectorStore = new MemoryVectorStore(this.embeddings);
      this.debug.info('Using in-memory vector store');

      // Try to load existing vectors from a file if it exists
      await this.loadFromFile();
    }
  }

  // Get the singleton instance
  public static async getInstance(
    openAIApiKey: string,
    useChroma: boolean = false,
    chromaCollection: string = 'alpha-hunter',
    chromaUrl?: string,
  ): Promise<VectorStore> {
    if (!VectorStore.instance) {
      VectorStore.instance = new VectorStore(
        openAIApiKey,
        useChroma,
        chromaCollection,
        chromaUrl,
      );
    }
    await VectorStore.instance.init();
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

  // Search for similar news items
  public async similaritySearch(
    query: string,
    k: number = 5,
    options?: { scoreThreshold?: number },
  ): Promise<Document[]> {
    try {
      const filter = (doc: Document) => doc.metadata?.type === 'news_item';

      // First get results with scores
      const resultsWithScores =
        await this.vectorStore.similaritySearchWithScore(query, k, filter);

      // Apply score threshold if provided
      let results: Document[];
      if (options?.scoreThreshold !== undefined) {
        // Filter by threshold and extract just the documents
        results = resultsWithScores
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .filter(([_, score]) => score >= options.scoreThreshold!)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .map(([doc, _]) => doc);

        this.debug.info(
          `Found ${resultsWithScores.length} similar items, ${results.length} above threshold ${options.scoreThreshold}`,
        );
      } else {
        // Just extract the documents without filtering
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        results = resultsWithScores.map(([doc, _]) => doc);
        this.debug.info(`Found ${results.length} similar news items`);
      }

      return results;
    } catch (error) {
      this.debug.error('Error searching vector store:', error as Error);
      throw error;
    }
  }

  // Get recent news headlines from the vector store
  public async getRecentNewsHeadlines(limit: number = 5): Promise<string[]> {
    try {
      // Use filter directly in the search call, same as similaritySearch method
      const filter = (doc: Document) => doc.metadata?.type === 'news_item';
      const results = await this.vectorStore.similaritySearch(
        '',
        limit * 2,
        filter,
      );
      this.debug.info(
        `Total documents retrieved from vector store: ${results.length}`,
      );

      // No need to filter again as we've already filtered in the search
      const newsItems = results;
      this.debug.info(
        `Found ${newsItems.length} news items before sorting and limiting`,
      );

      // Sort by timestamp descending
      const sortedResults = newsItems.sort((a, b) => {
        const timestampA = new Date(a.metadata?.timestamp || 0).getTime();
        const timestampB = new Date(b.metadata?.timestamp || 0).getTime();
        return timestampB - timestampA;
      });

      // Extract headlines from metadata and limit results
      const headlines = sortedResults
        .slice(0, limit)
        .map((doc) => doc.metadata?.headline)
        .filter((headline): headline is string => !!headline); // Filter out any undefined headlines

      this.debug.info(`Retrieved ${headlines.length} recent headlines`);
      return headlines;
    } catch (error) {
      this.debug.error('Error getting recent headlines:', error as Error);
      throw error;
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
        (vec: { content: string; metadata: Record<string, unknown> }) =>
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
}
