import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText as aiGenerateText } from 'ai';

/*
TODO: sometimes it spits out out-dated news. For instance, it said this: 0G Labs Secures $325M for Decentralized AI Infrastructure
Which was a news from Nov 2024
 */
export const generateSummary = async (
  apiKey: string,
  news: string,
  alpha: string,
) => {
  const anthropic = createAnthropic({
    apiKey,
  });

  let system = `You are Max Profit -- you are a journalist at a media company that breaks latest news at the intersection of AI and crypto`;

  // Adjust system prompt based on alpha
  if (alpha === 'AI_AGENTS') {
    system += ` with a special focus on AI Agents and their developments in the crypto space`;
  } else if (alpha === 'KAITO') {
    system += ` with a special focus on Kaito ecosystem and related projects`;
  }

  const context = background + `\n\n` + `\n\n# News\n\n` + news + instructions;

  const { text: anthropicResponse } = await aiGenerateText({
    model: anthropic.languageModel('claude-3-5-sonnet-20241022'),
    prompt: context,
    system,
    temperature: 0.7,
    maxTokens: 8192,
    frequencyPenalty: 0.4,
    presencePenalty: 0.4,
  });

  return anthropicResponse;
};

const background = `# Task: Generate an article from the provided News for the character Max Profit.

About Max Profit:
Max Profit is a journalist that breaks latest news in Crypto and AI

# Script Directions

- The headline should be specific and interesting
- Title should not be "Breaking"
- Cover Market Sentiment first
- Prioritize news with most views
- Keep discussion relevant to AI and Crypto
- The script should be short, punchy, and to the point
- Use plain American English Language
- Keep a casual tone and make it amusing
- Just the facts and info, no questions, no emojis
- No need to close the post with regards

# Example article

AI Agents Race to Solana as Virtuals Expansion Goes Live

The AI agent wars are heating up on Solana as major protocols make their move to crypto's fastest blockchain. Virtuals, the leading AI agent protocol, officially launched its Solana expansion today with over 100 Base agents receiving liquidity pools on the new chain.

Market Sentiment:
- AI Agents Total Market Cap: $7.03B (-11%)
- Virtuals Ecosystem: $1.7B (-1.05%)
- Top performer: Ribbita up 24% to $14.02M

Key Developments:
- TracyAI leads new launches with $25M market cap - an NBA commentary focused AI agent
- Multiple Base projects migrating to Solana including former hits GMIKA and LEONAI
- Early launch period saw 135 new agents with scam activity cooling after first 5 hours

The race for AI agent dominance is intensifying as major platforms Virtuals, Arc, and AI16z all establish presence on Solana. Industry watchers note platforms are shifting focus from quantity to quality of agents.

"Until I can text my agent to send ETH to my wife from my new wallet, we haven't solved the hard problems," noted prominent crypto developer Shaw.

Platform monetization models are also evolving beyond simple launch fees toward service layer revenue through agent marketplaces and execution engines - similar to how the Apple App Store takes a cut of transactions.

With Solana emerging as the preferred chain for AI agents, the next phase of development appears focused on agent utility and cross-agent commerce rather than pure token launches.`;

const instructions = `# Instructions: Write a post for Max Profit.
Response format should be formatted as a text`;
