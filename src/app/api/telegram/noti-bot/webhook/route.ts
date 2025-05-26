import { NextRequest } from 'next/server';
import { getNotiBotClient } from '@/utils/noti_bot_client';

export async function POST(req: NextRequest) {
  try {
    const client = getNotiBotClient();
    const body = await req.json();
    const success = await client.handleUpdate(body);
    if (success) {
      return new Response('OK', { status: 200 });
    } else {
      return new Response('Error processing update', { status: 500 });
    }
  } catch (error) {
    console.error('Error handling NotiBot webhook:', error);
    return new Response('Error handling NotiBot webhook', { status: 500 });
  }
}

export async function GET() {
  return new Response('OK', { status: 200 });
}
