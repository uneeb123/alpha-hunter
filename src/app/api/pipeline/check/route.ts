import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MoralisClient } from '@/utils/moralis_client';
import { TransactionType } from '@prisma/client';

export async function GET() {
  try {
    // Get all tokens that are being monitored
    const monitors = await prisma.tokenMonitor.findMany({
      where: { isMonitoring: true },
    });

    const moralis = MoralisClient.getInstance();
    const results = [];

    // Process each monitored token
    for (const monitor of monitors) {
      try {
        // Get swaps from the last hour
        const swaps = await moralis.getSwapsByTokenAddress(
          monitor.tokenAddress,
        );

        // Process and store swaps
        const processedSwaps = swaps.map((swap) => {
          const isBuy = swap.transactionType.toLowerCase() === 'buy';
          return {
            transactionHash: swap.transactionHash,
            transactionType: isBuy ? TransactionType.BUY : TransactionType.SELL,
            blockTimestamp: new Date(swap.blockTimestamp),
            blockNumber: swap.blockNumber,
            walletAddress: swap.walletAddress,
            pairAddress: swap.pairAddress,
            exchangeName: swap.exchangeName,
            baseToken: swap.baseToken,
            quoteToken: swap.quoteToken,
            baseAmount: isBuy
              ? swap.bought.amount.toString()
              : swap.sold.amount.toString(),
            baseAmountUsd: isBuy
              ? swap.bought.usdAmount.toString()
              : swap.sold.usdAmount.toString(),
            quoteAmount: isBuy
              ? swap.sold.amount.toString()
              : swap.bought.amount.toString(),
            quoteAmountUsd: isBuy
              ? swap.sold.usdAmount.toString()
              : swap.bought.usdAmount.toString(),
          };
        });

        // Store swaps in database
        await prisma.swap.createMany({
          data: processedSwaps,
          skipDuplicates: true,
        });

        // Update last checked timestamp
        await prisma.tokenMonitor.update({
          where: { id: monitor.id },
          data: { lastCheckedAt: new Date() },
        });

        results.push({
          tokenAddress: monitor.tokenAddress,
          swapsProcessed: processedSwaps.length,
          success: true,
        });
      } catch (error) {
        console.error(`Error processing token ${monitor.tokenAddress}:`, error);
        results.push({
          tokenAddress: monitor.tokenAddress,
          error: 'Failed to process swaps',
          success: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error in monitor check:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check monitors' },
      { status: 500 },
    );
  }
}
