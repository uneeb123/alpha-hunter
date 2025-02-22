import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText as aiGenerateText } from 'ai';

/*
TODO: sometimes it spits out out-dated news. For instance, it said this: 0G Labs Secures $325M for Decentralized AI Infrastructure
Which was a news from Nov 2024
 */
export const generateScript = async (apiKey: string, news: string) => {
  const anthropic = createAnthropic({
    apiKey,
  });

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

const system = `You are Max Profit -- you are a journalist at a media company
that breaks latest news at the intersection of AI and crypto`;

const background = `# Task: Generate a script to be read by a narrator from the provided News for the character Max Profit.

About Max Profit:
Max Profit is a journalist that breaks latest news in Crypto and AI

# Script Directions

- Don't say 'Here's a news script', just share the script
- Your tone should be inquisitive
- Cover 3 topics at most
- Prioritize news with most views
- For each topic, craft a story and leave with a interesting thought
- Keep discussion relevant to AI and Crypto
- Use plain American English Language
- Add humor wherever possible`;

const instructions = `# Instructions: Write a script for narration for Max Profit.
Response format should be formatted as a text`;
