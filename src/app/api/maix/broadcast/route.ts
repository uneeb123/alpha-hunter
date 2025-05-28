import { NextRequest, NextResponse } from 'next/server';
import { getMaix } from '@/tg-bot/maix';

export async function POST() {
  try {
    const client = getMaix();
    const success = await client.broadcastMessage();
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to broadcast message' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error broadcasting message:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
