import { NextRequest } from 'next/server';
import { getSecrets } from '@/utils/secrets';
import { TelegramClient } from '@/utils/telegram_client';

let telegramClient: TelegramClient;

// Initialize the telegram client
function getTelegramClient() {
  if (!telegramClient) {
    const secrets = getSecrets();
    telegramClient = new TelegramClient(secrets.telegramBotToken);
  }
  return telegramClient;
}

export async function POST(req: NextRequest) {
  try {
    const client = getTelegramClient();
    const body = await req.json();
    console.log(body);

    const success = await client.handleUpdate(body);

    if (success) {
      return new Response('OK', { status: 200 });
    } else {
      return new Response('Error processing update', { status: 500 });
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response('Error handling webhook', { status: 500 });
  }
}

// Needed for Telegram webhook verification
export async function GET() {
  return new Response('OK', { status: 200 });
}
