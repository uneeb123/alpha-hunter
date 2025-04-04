import { NextResponse } from 'next/server';
import { getSecrets } from '@/utils/secrets';
import { Debugger } from '@/utils/debugger';
import { TelegramClient } from '@/utils/telegram_client';

const debug = Debugger.getInstance();

export async function POST() {
  try {
    const secrets = getSecrets();
    const client = new TelegramClient(secrets.telegramBotToken);
    await client.deleteWebhook();
    debug.info('Webhook deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    debug.error('Failed to delete webhook:', error as Error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
