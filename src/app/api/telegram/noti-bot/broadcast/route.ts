import { NextRequest, NextResponse } from 'next/server';
import { getNotiBotClient } from '@/utils/noti_bot_client';

export async function POST(req: NextRequest) {
  try {
    const client = getNotiBotClient();
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
