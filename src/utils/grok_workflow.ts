import axios from 'axios';
import { getSecrets } from './secrets';

function truncateMessage(message: string, maxLength: number): string {
  if (message.length <= maxLength) return message;
  return message.slice(0, maxLength - 3) + '...';
}

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
${userPrompt}`;
}

export interface GrokReply {
  content: string;
  xCitations: string[];
}

async function callGrok(prompt: string, maxLength = 1000): Promise<GrokReply> {
  const { grokApiKey } = getSecrets();
  const { from_date, to_date } = getLast24HoursRange();
  try {
    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-3-latest',
        messages: [{ role: 'user', content: buildPrompt(prompt) }],
        search_parameters: {
          mode: 'on',
          return_citations: true,
          from_date,
          to_date,
        },
        sources: [{ type: 'x' }],
      },
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
      content: truncateMessage(content, maxLength),
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

export async function getCryptoNews(maxLength = 1000): Promise<GrokReply> {
  return callGrok(
    'What are the most important trending news in crypto right now?',
    maxLength,
  );
}

export async function getRecentNFTMints(maxLength = 1000): Promise<GrokReply> {
  return callGrok('What are the most recent notable NFT mints?', maxLength);
}

export async function getMemecoinDetails(
  memecoin: string,
  maxLength = 1000,
): Promise<GrokReply> {
  return callGrok(
    `Give me the latest details, news, and sentiment about the memecoin '${memecoin}'.`,
    maxLength,
  );
}
