import axios from 'axios';
import { getSecrets } from './secrets';
import { prisma } from '@/lib/prisma';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getLast24HoursRange() {
  const now = new Date();
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return {
    from_date: formatDate(from),
    to_date: formatDate(now),
  };
}

function buildPrompt(userPrompt: string): string {
  return `Reply with exactly 5 short bullet points, each on a new line, using only dashes ("-") for bullets.
You may use Markdown for bold (with single asterisks, e.g. *text*) and lists. DO NOT USE DOUBLE ASTERISKS.
Do not use heading markdown (e.g., #, ##, ###) or include any links.
Do not include any introduction or ending.
Just answer the question.
BE SPECIFIC, DON'T USE GENERIC TERMS
DO NOT BEGIN OR END THE SENTENCE BY SAYING "Posts found on X"
${userPrompt}`;
}

// function buildPrompt(userPrompt: string): string {
//   return `${userPrompt}`;
// }

export interface GrokReply {
  content: string;
  xCitations: string[];
}

// Helper to get top X usernames for x_handles
async function getTopXHandles(limit = 100): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      followersCount: { gte: 5000 },
      followingCount: { gte: 250 },
      smartFollowingCount: { gte: 300 },
    },
    orderBy: { tweetCount: 'desc' },
    take: limit,
    select: { username: true },
  });
  // Twitter handles should not include the @
  return users.map((u) => u.username);
}

async function callGrok(
  prompt: string,
  sources: any = null,
): Promise<GrokReply> {
  const { grokApiKey } = getSecrets();
  const { from_date, to_date } = getLast24HoursRange();
  const requestBody: any = {
    model: 'grok-3-mini-fast',
    messages: [
      {
        role: 'system',
        content: 'You are a leader in crypto and blockchain news.',
      },
      { role: 'user', content: buildPrompt(prompt) },
    ],
    search_parameters: {
      mode: 'on',
      return_citations: true,
      from_date,
      to_date,
    },
  };
  if (sources) {
    requestBody.search_parameters.sources = sources;
  }
  try {
    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${grokApiKey}`,
        },
      },
    );
    const content =
      response.data?.choices?.[0]?.message?.content || 'No response from Grok.';
    const citations: string[] = response.data?.citations || [];
    const xCitations = citations.filter((url) =>
      url.startsWith('https://x.com/'),
    );
    return {
      content: content,
      xCitations,
    };
  } catch (error: any) {
    console.log(error.response);
    return {
      content: `Error fetching from Grok: ${error.response?.data?.error?.message || error.message || error}`,
      xCitations: [],
    };
  }
}

export async function getCryptoNews(): Promise<GrokReply> {
  /*
  const x_handles = [
    'coinbureau',
    'WatcherGuru',
    'Cointelegraph',
    'AutismCapital',
    'goodgamepodxyz',
  ];
  */
  const x_handles = await getTopXHandles();
  return callGrok('What are the last news and updates in crypto?', [
    { type: 'x', x_handles },
  ]);
}

export async function getRecentNFTMints(): Promise<GrokReply> {
  return callGrok('What are the most recent notable NFT mints?', null);
}

export async function getMemecoinDetails(memecoin: string): Promise<GrokReply> {
  return callGrok(
    `Give me the latest details, news, and sentiment about the memecoin '${memecoin}'.`,
    null,
  );
}

/*

Interesting Prompts

What are people saying about Solana on X right now?
Are there any recent token unlocks?
Which new tokens are getting sudden traction in the last 6 hours?


 */
