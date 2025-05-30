import { NextResponse } from 'next/server';
import { getSecrets } from '@/utils/secrets';
import { Maix } from '@/tg-bot/maix';
import { Debugger } from '@/utils/debugger';

const debug = Debugger.getInstance();

export async function POST() {
  try {
    const secrets = getSecrets();
    const client = new Maix(secrets.notiBotToken);
    await client.setWebhook();
    return NextResponse.json({ success: true });
  } catch (error) {
    debug.error('Failed to set NotiBot webhook:', error as Error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
