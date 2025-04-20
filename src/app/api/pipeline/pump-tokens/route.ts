import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BitQueryClient } from '@/utils/bitquery_client';

export async function GET() {
  try {
    const bitquery = new BitQueryClient();
    /*
        Vercel has a time-limit of 60 seconds
        Fetching last 20 tokens should take 10 seconds
        Right now there are roughly 10 tokens being created an hour
        So if we run this every hour, we should see a few repeated but not much
     */
    const graduatedTokens = await bitquery.getRecentlyGraduatedToken(20);

    const results = [];

    for (const token of graduatedTokens) {
      try {
        // Only process successful transactions and pump tokens
        if (token.success && token.pump_token) {
          await prisma.recentToken.upsert({
            where: { tokenAddress: token.pump_token },
            update: {}, // Don't update if exists
            create: {
              tokenAddress: token.pump_token,
              creationTime: new Date(token.creation_time),
            },
          });

          results.push({
            tokenAddress: token.pump_token,
            success: true,
          });
        }
      } catch (error) {
        console.error(`Error processing token ${token.pump_token}:`, error);
        results.push({
          tokenAddress: token.pump_token,
          error: 'Failed to process token',
          success: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Error fetching pump tokens:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pump tokens' },
      { status: 500 },
    );
  }
}
