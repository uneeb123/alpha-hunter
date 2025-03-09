import { AgentFactory } from '@/utils/langchain_agent';
import { VectorStore } from '@/utils/vector_store';
import { getSecrets } from '@/utils/secrets';

export const generateSummary = async (
  apiKey: string,
  tweets: string,
  alpha: string,
  pastNews: string,
  alphaId?: number,
  processorId?: string,
) => {
  const secrets = getSecrets();

  // Initialize vector store if OpenAI API key is available
  let vectorStore: VectorStore | undefined;
  if (secrets.openaiApiKey) {
    vectorStore = VectorStore.getInstance(secrets.openaiApiKey);
  }

  // Create a summary agent using Langchain with vector store if available
  const summaryAgent = AgentFactory.createSummaryAgent(apiKey, vectorStore);

  // Use the agent to generate the summary
  const summary = await summaryAgent.generateSummary(tweets, alpha, pastNews);

  // TODO: store trend: alpha-wise aggregate of the news
  // Raw Data  →  Event  →  Concept  →  Insight  →  Prediction  →  Trend  →  Evolving Trend  →  Emerging Paradigm  →  Systemic Shift  →  Intelligence Formation

  // TODO: change this so every topic is in the vector and not the summary itself
  // Store the summary in the vector database if we have the necessary IDs
  if (vectorStore && alphaId !== undefined && processorId !== undefined) {
    await summaryAgent.storeSummaryInVectorStore(summary, alphaId, processorId);
  }

  return summary;
};
