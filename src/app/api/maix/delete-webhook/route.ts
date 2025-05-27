import { NextResponse } from 'next/server';
import { getSecrets } from '@/utils/secrets';
import { Debugger } from '@/utils/debugger';
import { Maix } from '@/tg-bot/maix';

const debug = Debugger.getInstance();

export async function POST() {
  try {
    const secrets = getSecrets();
    const client = new Maix(secrets.notiBotToken);
    await client.deleteWebhook();
    debug.info('NotiBot webhook deleted successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    debug.error('Failed to delete NotiBot webhook:', error as Error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
