import { Debugger } from '@/utils/debugger';
import { NextResponse } from 'next/server';

const debug = Debugger.create({
  enabled: true, // TODO: use a better debugger
  level: (process.env.DEBUG_LEVEL as 'info' | 'verbose' | 'error') || 'info',
});

export async function GET() {
  debug.info('Hello World');
  return NextResponse.json({ success: true });
}
