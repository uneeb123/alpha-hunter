import axios from 'axios';
import { getSecrets } from '../utils/secrets';
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

function getSystemPrompt(): string {
  return `You are a crypto news expert. Follow these response guidelines:
1. Provide exactly 5 bullet points
2. Use only single dashes (-) for bullets
3. Use single asterisks (*) for bold text
4. No headings, links, or double asterisks
5. No introductions or conclusions
6. Be specific and avoid generic terms
7. Don't mention "Posts found on X" or "per X posts"
8. Focus on recent, significant crypto developments`;
}

/*
function buildPrompt2(userPrompt: string): string {
  return `Reply with exactly 5 short bullet points, each on a new line, using only dashes ("-") for bullets.
You may use Markdown for bold (with single asterisks, e.g. *text*) and lists. DO NOT USE DOUBLE ASTERISKS.
Do not use heading markdown (e.g., #, ##, ###) or include any links.
Do not include any introduction or ending.
Just answer the question.
BE SPECIFIC, DON'T USE GENERIC TERMS
DO NOT BEGIN OR END THE SENTENCE BY SAYING "Posts found on X" or end with "per X posts" etc
${userPrompt}`;
}
*/

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
  userPrompt: string,
  sources: any = null,
): Promise<GrokReply> {
  const { grokApiKey } = getSecrets();
  const { from_date, to_date } = getLast24HoursRange();
  const requestBody: any = {
    model: 'grok-3-mini-fast',
    messages: [
      { role: 'system', content: getSystemPrompt() },
      { role: 'user', content: userPrompt },
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
    // Escape underscores for Telegram Markdown
    const safeContent = content.replace(/_/g, '\\_');
    const citations: string[] = response.data?.citations || [];
    const xCitations = citations.filter((url) =>
      url.startsWith('https://x.com/'),
    );
    return {
      content: safeContent,
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
  const x_handles = await getTopXHandles();
  return callGrok('What are the last news and updates in crypto?', [
    { type: 'x', x_handles },
  ]);
}

export async function getRecentNFTMints(): Promise<GrokReply> {
  return callGrok('What are the most recent notable NFT mints?');
}

export async function getMemecoinDetails(memecoin: string): Promise<GrokReply> {
  return callGrok(
    `Get information regarding the following memecoin: ${memecoin}. Focus on answering the following questions:
1. What is the original story behind the token?
2. Who created the token? Are they officially affliated with the story or anonymous creators?
3. Who are the active members of the community?

Bad examples:
- Global backend systems are increasingly integrating blockchain technology for infrastructure upgrades
- Currently, LABUBU dolls are gaining viral attention through social media trends, with celebrities and collectors driving obsession.
- In the LABUBU ecosystem, social media trends show celebrities and teens obsessing over bag charms, driving widespread collecting craze.

Good examples:
- SBET cryptocurrency surged 3,000% after announcing a $400 million investment in Ethereum

Why?
- Mention of the exact project
- Quantified by numbers
- Mentions of its getting viral or gaining popularity`,
    null,
  );
}

export async function getInternetCapitalMarkets(): Promise<GrokReply> {
  return callGrok(`What's the lastest in Internet Capital Markets?

Topics to exclude:
- Bitcoin
- Ethereum
- Solana
- Tokenized Real-World Assets 
- AI Agents
- Layer-2 Scaling
- Decentralized Physical Infrastructure Networks (DePINs)
- Web5 Applications
- DeFi
- Oracles
- Tokenomics
- Web3
- Hedera
- VeChain
- Cross-chain DApps
- DApps
- Web2-Web3 integration`);
}

/*

Interesting Prompts

What are people saying about Solana on X right now?
Are there any recent token unlocks?
Which new tokens are getting sudden traction in the last 6 hours?


 */
