import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText as aiGenerateText } from 'ai';

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
  const anthropic = createAnthropic({
    apiKey,
  });

  const system = `You are Max Profit. You identify latest updates in crypto from the given Tweets. \
Your content never includes past topics. If focus area is provided, then keep updates relevant to that.
  
# Instructions
- Identify 5 distinct topics from the tweets
- Prioritize news that is most mentioned in the Tweets (also consider view count)
- Sort by most popular update (descending order) but don't mention it in the summary
- Each topic should written in plain American English Language and have a maximum 1-2 sentences. Be concise and to the point.
- Don't start with 'Based on the provided tweets...', just share the updates directly
- No need for a start and end, just output the updates as enumerated list`;

  let focusArea = ``;
  if (alpha === 'AI_AGENTS') {
    focusArea += `AI Agents`;
  } else if (alpha === 'KAITO') {
    focusArea += `Kaito ecosystem.`;
  } else if (alpha === 'GENERAL') {
    focusArea += `None`;
  }

  const task = `Generate headlines of the news from the provided Tweets for the character Max Profit.`;

  const example = `1. Kava launched the largest decentralized AI model on Feb 28, 2025, advancing blockchain technology.
2. Crypto scam revenue reached $9.9B-$12.4B in 2024, fueled by AI-driven fraud like romance scams.
3. U.S. AI and Crypto Czar David Sacks proposed regulation and a national Bitcoin reserve in Feb 2025.
4. AI integration in crypto trading platforms is improving predictive analytics and user efficiency.
5. Stablecoins are gaining traction as AI enhances their role in global financial systems, per Sacks' vision.`;

  const prompt =
    `# Task: ${task}\n\n` +
    `\n\n# Tweets\n\n${tweets}\n\n` +
    `\n\n# Focus Area\n\n$${focusArea}\n\n` +
    `\n\n# Past Topics\n\n${pastTopics}\n\n` +
    `\n\n# Example\n\n${example}`;

  const { text: anthropicResponse } = await aiGenerateText({
    model: anthropic.languageModel('claude-3-5-sonnet-20241022'),
    prompt,
    system,
    temperature: 0.7,
    maxTokens: 8192,
    frequencyPenalty: 0.4,
    presencePenalty: 0.4,
  });

  return anthropicResponse;
};
