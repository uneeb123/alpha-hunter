import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText as aiGenerateText } from 'ai';

// TODO: do we need focus area/alpha since it's coming from the summary
export const generatePodcastScript = async (
  apiKey: string,
  tweets: string,
  relevantTopics: string,
) => {
  const anthropic = createAnthropic({
    apiKey,
  });

  const system = `You are a podcast script generator of a Crypto meets AI podcast show called "The Max Market Show".
"The Max Market Show" focuses on educating and empowering individuals to navigate the crypto landscape.
There are two speakers involved: Max Market and Pepe the Frog.

# Instructions

- The script should cover the first topic from the "Relevant Topics" section
- The characters information is provided in the "Character" section, make sure the script is relevant to the characters
- Check the "Tweets" section and extrapolate information from there to get more information for the script
- Check the "Script Directions" section for the style and tone of the script content
- Don't say 'Here's a news script', just share the script
- IMPORTANT: NO SOUND EFFECTS IN THE SCRIPT, JUST PLAIN WORDS
- 5 LINES MAXIMUM, MAX GETS 2 LINES AND PEPE GETS 3 LINES`;

  const task = `Write a script for podcast "The Max Market Show" based on the News.`;

  const characters = `## Max Profit
Max is an AI agent is the expert guest on the podcast.
He works at a hedge fund and is never wrong about the bets he makes.
Max Market has all the insights and updates.

## Pepe the Frog
Pepe is a laid-back internet icon and the host on the podcast.  
He started as a humble comic book character but evolved into a cultural phenomenon.  
Pepe lives by the motto *“Feels good, man”*—but his moods can shift with the markets.  
Sometimes a savvy trader, sometimes a doomposter, Pepe represents the highs and lows of speculation.  
Whether celebrating a bull run or lamenting a rug pull, Pepe always keeps it real.`;

  const scriptDirections = `\
- There is no beginning or end, just jump directly into the topic.
- Pepe (host) is curious, chaotic, and always keeps it real. He asks sharp, sometimes ridiculous questions, reacts with memes, sarcasm, and exaggerated emotions, but ultimately pushes for real insights.
- Max Market (guest) is the seasoned trader who's seen it all. He explains big trades, market moves, and trends in a way that even a degen can understand.
- Use plain, American English—but sprinkle in crypto slang, internet culture references, and Pepe-isms where it makes sense.
- MAKE IT FUNNY
- NO ASTERISKS IN THE SCRIPT`;

  const prompt =
    `# Task: ${task}\n\n` +
    `\n\n# Relevant Topics\n\n${relevantTopics}\n\n` +
    // `\n\n# Past Topics\n\n${pastTopics}\n\n` +
    `\n\n# Characters\n\n${characters}\n\n` +
    `\n\n# Script Directions\n\n${scriptDirections}\n\n` +
    // `\n\n# Focus Area\n\n$${focusArea}\n\n` +
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

const example = `PEPE: Yo what's good fam! Welcome back to another episode of The Max Market Show. I'm your host Pepe the Frog, and with me today is the one and only Max Market! Max, the AI space is absolutely BOOMING right now. What's got you excited?

MAX: Thanks Pepe. The AI landscape is evolving at breakneck speed. Just in the past week, we've seen some major developments. Anthropic's CEO made waves by predicting AI will write 90% of code within 6 months. That's a bold claim that's got everyone talking.

PEPE: Feels good man! But also kinda scary for all the dev frens out there. What else is cooking?

MAX: Well, Alibaba just dropped their QWEN-32B model that's matching top performers at just 5% of the cost. OpenAI released their Agent SDK, making it easier for developers to create multi-agent systems. And Kaito AI launched a public API for real-time Yaps scores, which is huge for social metrics in crypto.`;
