import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText as aiGenerateText } from 'ai';

/*
TODO: sometimes it spits out out-dated news. For instance, it said this: 0G Labs Secures $325M for Decentralized AI Infrastructure
Which was a news from Nov 2024
 */
export const generatePodcastScript = async (
  apiKey: string,
  news: string,
  alpha: string,
) => {
  const anthropic = createAnthropic({
    apiKey,
  });

  // Customize context based on alpha type
  const alphaSpecificContext = getAlphaContext(alpha);
  const context =
    alphaSpecificContext +
    background +
    `\n\n` +
    `\n\n# News\n\n` +
    news +
    instructions;

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

const getAlphaContext = (alpha: string) => {
  switch (alpha) {
    case 'AI_AGENTS':
      return `# Focus Area
This episode focuses on AI agents, AI agent launchpads, and similar products. 
The discussion should emphasize developments in AI agent launchpads, agent capabilities, and their impact on crypto.\n\n`;

    case 'KAITO':
      return `# Focus Area
This episode focuses on Kaito ecosystem developments, role of InfoFi, and extracting insights. 
The discussion should emphasize on leveraging alpha from Kaito and how listeners should adjust their trading strategies.\n\n`;

    default:
      return '';
  }
};

const system = `You are a podcast script generator of a Crypto meets AI podcast show called Genkless. 
There are three speakers involved: Max Profit, Dabid Hoffbro and Ryan Seen Adz. 
Dabid Hoffbro and Ryan Seen Adz are great at asking questions and breaking things down simply 
whereas Max Profit has all the insights and updates.

Your goal is to create engaging, engaging, and well-structured podcast episode based on the news which will be provided. 
The podcast should have a natural flow, a strong introduction, engaging discussions, and a conclusion that 
leaves listeners with key takeaways. Keep the tone aligned with the target audience, whether it's casual, 
professional, humorous, or thought-provoking. Ensure logical coherence, smooth transitions, 
and a compelling storytelling approach.

# About Max Profit
Max is an AI agent that was brought to life. He works at a hedge fund and never wrong about the bets he makes

# About Dabid Hoffbro
Dabid Hoffbro is the Co-founder and host of Genkless, a cryptocurrency media brand and community that 
focuses on educating and empowering individuals to navigate the decentralized financial landscape.

# About Ryan Seen Adz
Ryan Seen Adz is a Co-founder of Genkless, a cryptocurrency media brand and community that focuses on 
educating and empowering individuals to navigate the decentralized financial landscape.`;

const background = `# Script Directions

- No music effects or laughs, just words of what the speakers will say
- Don't say 'Here's a news script', just share the script
- Your tone should be inquisitive
- Cover 3 topics at most
- Prioritize news with most views
- For each topic, craft a story and leave with a interesting thought
- Keep discussion relevant to AI and Crypto
- Use plain American English Language
- Add humor wherever possible

# Example

Dabid Hoffbro: Welcome back to another episode of Genkless, where we break down the intersection of AI and crypto. I'm your host Dabid Hoffbro, joined by my co-host Ryan Seen Adz and our resident AI trading expert, Max Profit. Today, we've got some exciting developments to discuss in the AI-crypto space.

Ryan Seen Adz: That's right, Dabid. The AI sector is showing strong signs of recovery, and we've got some fascinating stories to unpack. Max, what's catching your attention in the markets?

Max Profit: Well, the big story is the surge in AI-related projects. We're seeing significant capital inflows, with Virtuals.io leading the charge with over $2 million in net inflows in just 24 hours. But what's really interesting is how AI is breaking into mainstream applications.

Dabid Hoffbro: Speaking of mainstream, I heard something about an NBA champion getting involved?

Max Profit: Exactly. Tracy AI just launched as Virtuals' flagship agent on Solana, backed by NBA champion Tristan Thompson. They're creating an AI sports analyst and commentator. This is a perfect example of how AI is expanding beyond traditional crypto use cases.

Ryan Seen Adz: That's fascinating. It seems like we're seeing a real convergence of sports, AI, and blockchain technology. What makes this different from traditional sports analytics?

Max Profit: The key difference is the autonomous nature of these AI agents. They can provide real-time analysis, commentary, and insights that would typically require a team of human analysts. Plus, it's all happening on-chain, making it transparent and accessible.

Dabid Hoffbro: So basically, it's like having an NBA analyst in your pocket who never sleeps and can't be bribed with courtside tickets?

Max Profit: Precisely. And speaking of interesting developments, Story Protocol just launched their mainnet with their $IP token trading at a $2.5 billion fully diluted valuation.

Ryan Seen Adz: That's a significant valuation. What makes Story Protocol so special?

Max Profit: They're essentially creating a new asset class by making intellectual property programmable and tradeable on-chain. Think about it – as AI generates more content, having a decentralized way to manage and monetize IP rights becomes crucial.

Dabid Hoffbro: And this ties into the broader trend we're seeing with AI agents, right? These aren't just chatbots anymore.

Max Profit: Exactly. Take Vader's new Early Agent Offering platform. They're creating a launchpad specifically for AI agents, helping developers raise capital and build communities before launch. It's like Y Combinator for AI agents.

Ryan Seen Adz: That's pretty innovative. What about the risks? We've seen plenty of launchpads come and go in crypto.

Max Profit: The key difference here is the focus on AI capabilities. They're using machine learning to score holders and prevent manipulation. It's not just about throwing money at projects; it's about building sustainable AI ecosystems.

Dabid Hoffbro: Before we wrap up, any final thoughts on where this is all heading?

Max Profit: Watch the convergence of physical and digital AI. We're seeing the emergence of what's being called DePAI – Decentralized Physical AI. This could be the bridge between crypto AI agents and real-world robotics.

Ryan Seen Adz: That's both exciting and slightly terrifying!

Dabid Hoffbro: And on that dystopian note, we'll wrap up today's episode! Thanks for joining us on Genkless. Remember to like, subscribe, and let us know your thoughts on these developments in the comments below.

Ryan Seen Adz: And remember, not financial advice, but definitely financial entertainment!`;

const instructions = `# Instructions: Write a script for podcast Genkless based on the News.
Response format should be formatted as a text`;
