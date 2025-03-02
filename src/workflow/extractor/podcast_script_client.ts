import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText as aiGenerateText } from 'ai';

// TODO: do we need focus area/alpha since it's coming from the summary
export const generatePodcastScript = async (
  apiKey: string,
  tweets: string,
  relevantTopics: string,
  alpha: string,
  pastTopics: string,
) => {
  const anthropic = createAnthropic({
    apiKey,
  });

  let focusArea = ``;
  if (alpha === 'AI_AGENTS') {
    focusArea += `AI Agents`;
  } else if (alpha === 'KAITO') {
    focusArea += `Kaito ecosystem.`;
  } else if (alpha === 'GENERAL') {
    focusArea += `None`;
  }

  const system = `You are a podcast script generator of a Crypto meets AI podcast show called Genkless.
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

  const prompt =
    `# Task: ${task}\n\n` +
    `\n\n# Relevant Topics\n\n${relevantTopics}\n\n` +
    `\n\n# Past Topics\n\n${pastTopics}\n\n` +
    `\n\n# Characters\n\n${characters}\n\n` +
    `\n\n# Script Directions\n\n${scriptDirections}\n\n` +
    `\n\n# Focus Area\n\n$${focusArea}\n\n` +
    `\n\n# Tweets\n\n${tweets}\n\n` +
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

const example = `\Dabid Hoffbro: Welcome back to another episode of Genkless, where we break down the intersection of AI and crypto. I'm your host Dabid Hoffbro, joined by my co-host Ryan Seen Adz and our resident AI trading expert, Max Profit. Today, we've got some exciting developments to discuss in the AI-crypto space.

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
