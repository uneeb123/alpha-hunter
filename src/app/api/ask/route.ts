import { NextResponse } from 'next/server';
import axios from 'axios';
import { getSecrets } from '@/utils/secrets';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    const { openaiApiKey } = getSecrets();
    const openaiRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: message },
        ],
        max_tokens: 512,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
      },
    );
    const response =
      openaiRes.data.choices?.[0]?.message?.content || 'No response.';
    return NextResponse.json({ response });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 },
    );
  }
}
