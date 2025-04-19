import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MoralisClient } from '@/utils/moralis_client';
import { TransactionType } from '@prisma/client';

export async function GET() {
  try {
    const moralis = MoralisClient.getInstance();
    const tokenAddress = '8i3bdsdDn7a4MchHVVAZApLzxT4NgJhKcSdTNStUpump';

    const swaps = await moralis.getSwapsByTokenAddress(tokenAddress);

    const processedSwaps = swaps.map((swap) => {
      const isBuy = swap.transactionType.toLowerCase() === 'buy';
      const baseToken = swap.baseToken;
      const quoteToken = swap.quoteToken;

      // Determine base and quote amounts based on transaction type
      const baseAmount = isBuy ? swap.bought.amount : swap.sold.amount;
      const baseAmountUsd = isBuy ? swap.bought.usdAmount : swap.sold.usdAmount;
      const quoteAmount = isBuy ? swap.sold.amount : swap.bought.amount;
      const quoteAmountUsd = isBuy
        ? swap.sold.usdAmount
        : swap.bought.usdAmount;

      return {
        transactionHash: swap.transactionHash,
        transactionType: isBuy ? TransactionType.BUY : TransactionType.SELL,
        blockTimestamp: new Date(swap.blockTimestamp),
        blockNumber: swap.blockNumber,
        walletAddress: swap.walletAddress,
        pairAddress: swap.pairAddress,
        exchangeName: swap.exchangeName,
        baseToken,
        quoteToken,
        baseAmount: baseAmount.toString(),
        baseAmountUsd: baseAmountUsd.toString(),
        quoteAmount: quoteAmount.toString(),
        quoteAmountUsd: quoteAmountUsd.toString(),
      };
    });

    // Use createMany to insert all swaps at once
    await prisma.swap.createMany({
      data: processedSwaps,
      skipDuplicates: true, // Skip duplicates based on unique constraint (transactionHash)
    });

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${processedSwaps.length} swaps`,
    });
  } catch (error) {
    console.error('Error processing swaps:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process swaps' },
      { status: 500 },
    );
  }
}
