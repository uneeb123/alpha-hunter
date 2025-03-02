import { AgentFactory } from '@/utils/langchain_agent';

/*
TODO: sometimes it spits out out-dated news. For instance, it said this: 0G Labs Secures $325M for Decentralized AI Infrastructure
Which was a news from Nov 2024
 */
export const generateSummary = async (
  apiKey: string,
  tweets: string,
  alpha: string,
  pastTopics: string,
) => {
  // Create a summary agent using Langchain
  const summaryAgent = AgentFactory.createSummaryAgent(apiKey);
  
  // Use the agent to generate the summary
  const summary = await summaryAgent.generateSummary(tweets, alpha, pastTopics);
  
  return summary;
};