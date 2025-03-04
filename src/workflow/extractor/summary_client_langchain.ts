import { AgentFactory } from '@/utils/langchain_agent';
import { VectorStore } from '@/utils/vector_store';
import { getSecrets } from '@/utils/secrets';

/*
TODO: sometimes it spits out out-dated news. For instance, it said this: 0G Labs Secures $325M for Decentralized AI Infrastructure
Which was a news from Nov 2024
 */
export const generateSummary = async (
  apiKey: string,
  tweets: string,
  alpha: string,
  pastTopics: string,
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
  const summary = await summaryAgent.generateSummary(tweets, alpha, pastTopics);

  // Store the summary in the vector database if we have the necessary IDs
  if (vectorStore && alphaId !== undefined && processorId !== undefined) {
    await summaryAgent.storeSummaryInVectorStore(summary, alphaId, processorId);
  }

  return summary;
};
