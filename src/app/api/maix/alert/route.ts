import { NextResponse } from 'next/server';
import { getMaix } from '@/tg-bot/maix';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 },
      );
    }
    const client = getMaix();
    const formattedMessage = `_System Alert 🚨: ${message}_`;
    const success = await client.alert(formattedMessage);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send alert' },
        { status: 500 },
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
