import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { 
  HumanMessage, 
  SystemMessage, 
  AIMessage,
  BaseMessage 
} from '@langchain/core/messages';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate
} from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { 
  Tool,
  StructuredTool 
} from '@langchain/core/tools';
import { AgentExecutor, createReactAgent } from "langchain/agents";

// BaseAgent class to handle common agent functionality
export class BaseAgent {
  protected model: ChatAnthropic | ChatOpenAI;
  protected memory: BaseMessage[] = [];
  protected tools: Tool[] = [];

  constructor(apiKey: string, modelName: string = 'claude-3-5-sonnet-20241022', provider: 'anthropic' | 'openai' = 'anthropic') {
    if (provider === 'anthropic') {
      this.model = new ChatAnthropic({
        anthropicApiKey: apiKey,
        modelName: modelName,
        temperature: 0.7
      });
    } else {
      this.model = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: modelName,
        temperature: 0.7
      });
    }
  }

  // Add a message to the agent's memory
  addToMemory(message: BaseMessage): void {
    this.memory.push(message);
  }

  // Create a basic prompt chain with system and human messages
  createPromptChain(systemPrompt: string, humanPrompt: string): RunnableSequence {
    const promptTemplate = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemPrompt),
      HumanMessagePromptTemplate.fromTemplate(humanPrompt)
    ]);

    return RunnableSequence.from([
      promptTemplate,
      this.model,
      new StringOutputParser()
    ]);
  }

  // Register tools for the agent to use
  registerTools(tools: Tool[]): void {
    this.tools = tools;
  }

  // Create a ReAct agent with tools
  async createReActAgent(systemPrompt: string): Promise<AgentExecutor> {
    const agent = await createReactAgent({
      llm: this.model,
      tools: this.tools,
      systemMessage: systemPrompt
    });

    return new AgentExecutor({
      agent,
      tools: this.tools
    });
  }
}

// SummaryAgent specifically for generating cryptocurrency content summaries
export class SummaryAgent extends BaseAgent {
  async generateSummary(tweets: string, alpha: string, pastTopics: string): Promise<string> {
    const systemPrompt = `You are Max Profit. You identify latest updates in crypto from the given Tweets. \
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

    const task = `Generate an article from the provided News for the character Max Profit.`;

    const example = `1. Kava launched the largest decentralized AI model on Feb 28, 2025, advancing blockchain technology.
2. Crypto scam revenue reached $9.9B-$12.4B in 2024, fueled by AI-driven fraud like romance scams.
3. U.S. AI and Crypto Czar David Sacks proposed regulation and a national Bitcoin reserve in Feb 2025.
4. AI integration in crypto trading platforms is improving predictive analytics and user efficiency.
5. Stablecoins are gaining traction as AI enhances their role in global financial systems, per Sacks' vision.`;

    const humanPrompt = 
      `# Task: ${task}\n\n` +
      `\n\n# Tweets\n\n${tweets}\n\n` +
      `\n\n# Focus Area\n\n$${focusArea}\n\n` +
      `\n\n# Past Topics\n\n${pastTopics}\n\n` +
      `\n\n# Example\n\n${example}`;

    // Create and execute the prompt chain
    const chain = this.createPromptChain(systemPrompt, humanPrompt);
    return await chain.invoke({});
  }
}

// PodcastAgent for generating podcast scripts
export class PodcastAgent extends BaseAgent {
  async generatePodcastScript(tweets: string, relevantTopics: string, alpha: string, pastTopics: string): Promise<string> {
    let focusArea = ``;
    if (alpha === 'AI_AGENTS') {
      focusArea += `AI Agents`;
    } else if (alpha === 'KAITO') {
      focusArea += `Kaito ecosystem.`;
    } else if (alpha === 'GENERAL') {
      focusArea += `None`;
    }

    const systemPrompt = `You are a podcast script generator of a Crypto meets AI podcast show called Genkless.
Genkless focuses on educating and empowering individuals to navigate the crypto landscape.
There are three speakers involved: Max Profit, Dabid Hoffbro and Ryan Seen Adz.

# Instructions

- The script should cover all the topics provided in the "Relevant Topics" section
- The characters information is provided in the "Character" section, make sure the script is relevant to the characters
- Check the "Tweets" section and extrapolate information from there to get contents for the scripts
- Check "Past Topics" section to know which topics have already been covered and should be avoided
- Check the "Script Directions" section for the style and tone of the script content
- Don't say 'Here's a news script', just share the script
- No music effects or laughs, just words of what the speakers will say`;

    const task = `Write a script for podcast Genkless based on the News.`;

    const characters = `## Max Profit
Max is an AI agent is the expert guest on the podcast.
He works at a hedge fund and is never wrong about the bets he makes.
Max Profit has all the insights and updates.

## Dabid Hoffbro
Dabid Hoffbro is the co-founder and host of Genkless.
Dabid is great at asking questions and breaking things down simply.

## Ryan Seen Adz
Ryan Seen Adz is the co-founder and host of Genkless.
Ryan is great at asking questions and breaking things down simply.`;

    const scriptDirections = `\
- Engaging and well-structured podcast episode.
- The podcast should have a natural flow, a strong introduction, engaging discussions, and a conclusion that 
leaves listeners with key takeaways. Keep the tone aligned with the target audience, whether it's casual, 
professional, humorous, or thought-provoking.
- Ensure logical coherence, smooth transitions, and a compelling storytelling approach.
- The host should be inquisitive and the guest should share insights
- The host can challenge the guest to get more clarity
- Use plain American English Language
- Add humor wherever possible`;

    const example = `\Dabid Hoffbro: Welcome back to another episode of Genkless, where we break down the intersection of AI and crypto. I'm your host Dabid Hoffbro, joined by my co-host Ryan Seen Adz and our resident AI trading expert, Max Profit. Today, we've got some exciting developments to discuss in the AI-crypto space.

Ryan Seen Adz: That's right, Dabid. The AI sector is showing strong signs of recovery, and we've got some fascinating stories to unpack. Max, what's catching your attention in the markets?

Max Profit: Well, the big story is the surge in AI-related projects. We're seeing significant capital inflows, with Virtuals.io leading the charge with over $2 million in net inflows in just 24 hours. But what's really interesting is how AI is breaking into mainstream applications.`;

    const humanPrompt =
      `# Task: ${task}\n\n` +
      `\n\n# Relevant Topics\n\n${relevantTopics}\n\n` +
      `\n\n# Past Topics\n\n${pastTopics}\n\n` +
      `\n\n# Characters\n\n${characters}\n\n` +
      `\n\n# Script Directions\n\n${scriptDirections}\n\n` +
      `\n\n# Focus Area\n\n$${focusArea}\n\n` +
      `\n\n# Tweets\n\n${tweets}\n\n` +
      `\n\n# Example\n\n${example}`;

    // Create and execute the prompt chain
    const chain = this.createPromptChain(systemPrompt, humanPrompt);
    return await chain.invoke({});
  }
}

// TweetAnalyzerAgent to analyze tweet relevance and categorize content
export class TweetAnalyzerAgent extends BaseAgent {
  async analyzeTweets(tweets: string[], interests: string[]): Promise<Record<string, number>> {
    const systemPrompt = `You are an AI assistant that specializes in analyzing cryptocurrency and blockchain related tweets.
Your task is to analyze each tweet for relevance to specific interest areas and assign relevance scores.`;

    const humanPrompt = `I have a set of tweets and want to know how relevant they are to these interest areas: ${interests.join(', ')}.
Please analyze each tweet and assign a relevance score from 0-100 for each interest area.
Return the results as a JSON object where each tweet has a score for each interest area.

Tweets:
${tweets.join('\n\n')}`;

    this.model.temperature = 0;  // Set to deterministic for analysis
    
    const response = await this.model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(humanPrompt)
    ]);

    this.model.temperature = 0.7;  // Reset temperature
    
    try {
      const content = response.content.toString();
      // Extract the JSON part from the response
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                       content.match(/```\n([\s\S]*?)\n```/) ||
                       content.match(/{[\s\S]*}/);
                       
      const jsonContent = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      return JSON.parse(jsonContent);
    } catch (error) {
      console.error("Failed to parse JSON from analysis response:", error);
      return {};
    }
  }
}

// Factory to create different types of agents
export class AgentFactory {
  static createSummaryAgent(apiKey: string): SummaryAgent {
    return new SummaryAgent(apiKey);
  }

  static createPodcastAgent(apiKey: string): PodcastAgent {
    return new PodcastAgent(apiKey);
  }

  static createTweetAnalyzerAgent(apiKey: string): TweetAnalyzerAgent {
    return new TweetAnalyzerAgent(apiKey);
  }
}