import OpenAI from 'openai';
import { getSecrets } from './secrets';

export async function getCryptoNews(): Promise<string> {
  try {
    const { grokApiKey } = getSecrets();
    const client = new OpenAI({
      apiKey: grokApiKey,
      baseURL: 'https://api.x.ai/v1',
    });

    const completion = await client.chat.completions.create({
      model: 'grok-3-latest',
      messages: [
        {
          role: 'user',
          content:
            'What are the 5 most engaging crypto news in the last 24 hours. Be concise. Exclude price action and predictions.',
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content || 'No response from Grok';
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch crypto news',
    );
  }
}

export async function getEmergingMemecoins(): Promise<string> {
  try {
    const { grokApiKey } = getSecrets();
    const client = new OpenAI({
      apiKey: grokApiKey,
      baseURL: 'https://api.x.ai/v1',
    });

    const completion = await client.chat.completions.create({
      model: 'grok-3-latest',
      messages: [
        {
          role: 'user',
          content: `What are the 5 most engaging news in memecoins in the last 24 hours. Be concise. Exclude any general crypto news. Exclude the following:
DOGE, SHIB, PEPE, TRUMP, BONK, FARTCOIN, WIF, FLOKI, PENGU, BRETT, SPX, DOG, KET, POPCAT, MOG, TURBO, CHEEMS, PNUT, AI16Z, MEW, TOSHI, NOT, BABYDOGE, SNEK, TDCCP, GIGA, AGENTFUN, NEIRO, DAKU, LAUNCHCOIN, MOODENG, FAI, MEOW, AIXBT, BOME, NPC, GOAT, AIC, ALCH, ANIME, MELANIA, GOHOME, SIREN, PTGC, DEGEN, PEOPLE, MIU, MEME`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content || 'No response from Grok';
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch memecoin news',
    );
  }
}

export async function getRecentNFTMints(): Promise<string> {
  try {
    const { grokApiKey } = getSecrets();
    const client = new OpenAI({
      apiKey: grokApiKey,
      baseURL: 'https://api.x.ai/v1',
    });

    const completion = await client.chat.completions.create({
      model: 'grok-3-latest',
      messages: [
        {
          role: 'user',
          content:
            'Give me the 5 most engaging upcoming NFT mints in the last 24 hours. Do not mention "due to limited data".',
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content || 'No response from Grok';
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch NFT mints',
    );
  }
}
