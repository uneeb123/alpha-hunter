import { NextResponse } from 'next/server';
import { SwapEvent } from '@/types';

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as SwapEvent;
    console.log(JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request data' },
      { status: 400 },
    );
  }
}
