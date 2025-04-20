import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RugcheckClient } from '@/utils/rugcheck_client';

export async function GET() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Get tokens that are at least 1 hour old and not processed
    const tokens = await prisma.recentToken.findMany({
      where: {
        creationTime: {
          lte: oneHourAgo,
        },
        isProcessed: false,
      },
    });

    const rugcheck = RugcheckClient.getInstance();
    const results = [];

    for (const token of tokens) {
      try {
        const report = await rugcheck.getTokenReport(token.tokenAddress);

        // Store the normalized score
        await prisma.checkedToken.create({
          data: {
            tokenAddress: token.tokenAddress,
            score: Math.round(report.score_normalised),
          },
        });

        // Mark as processed in RecentToken
        await prisma.recentToken.update({
          where: { tokenAddress: token.tokenAddress },
          data: { isProcessed: true },
        });

        results.push({
          tokenAddress: token.tokenAddress,
          score: Math.round(report.score_normalised),
          success: true,
        });
      } catch (error) {
        console.error(`Error checking token ${token.tokenAddress}:`, error);
        results.push({
          tokenAddress: token.tokenAddress,
          error: 'Failed to check token',
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
    console.error('Error checking tokens:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check tokens' },
      { status: 500 },
    );
  }
}
