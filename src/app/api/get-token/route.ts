import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBirdeyeTokenOverview } from '@/utils/birdeye';

export async function POST(request: Request) {
  try {
    const { address } = await request.json();
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Missing address' },
        { status: 400 },
      );
    }

    // Fetch token info from Birdeye
    const data = await getBirdeyeTokenOverview(address);
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'No data from Birdeye' },
        { status: 500 },
      );
    }

    // Update the token in the database
    const updated = await prisma.token.update({
      where: {
        address_chain: { address, chain: 'solana' },
      },
      data: {
        decimals: data.decimals,
        price: data.price,
        lastTradeUnixTime: data.lastTradeUnixTime || 0,
        liquidity: data.liquidity,
        logoURI: data.logoURI,
        mc: data.marketCap,
        name: data.name,
        symbol: data.symbol,
        v24hChangePercent: data.priceChange24hPercent,
        v24hUSD: data.v24hUSD,
        trade24hCount: data.trade24h,
        holderCount: data.holder,
        fullyDilutedValuation: data.fdv,
      },
    });

    return NextResponse.json({ success: true, token: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
