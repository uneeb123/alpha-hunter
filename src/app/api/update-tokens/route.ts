import { NextResponse } from 'next/server';
import { getBirdeyeTokenList } from '@/utils/birdeye';
import { prisma } from '@/lib/prisma';

const CHAINS = ['solana', 'base', 'sui'] as const;
const LIMIT = 50;

export async function POST() {
  try {
    let allTokensLength = 0;
    for (const chain of CHAINS) {
      let offset = 10050;
      let total = null;
      do {
        let response;
        try {
          response = await getBirdeyeTokenList({
            chain,
            offset,
            limit: LIMIT,
          });
        } catch (apiError: any) {
          console.log(
            `[Birdeye API ERROR] chain=${chain} offset=${offset}:`,
            apiError?.message || String(apiError) || 'Unknown error',
          );
          throw new Error(
            `Birdeye API error for chain=${chain} offset=${offset}`,
          );
        }
        const tokens = response.data.tokens;
        total = response.data.total;
        allTokensLength += tokens.length;
        console.log(
          `[${chain}] Upserting tokens for offset ${offset} / ${total}`,
        );
        for (const token of tokens) {
          try {
            await prisma.token.upsert({
              where: {
                address_chain: { address: token.address, chain: token.chain },
              },
              update: {
                decimals: token.decimals,
                price: token.price,
                lastTradeUnixTime: token.lastTradeUnixTime,
                liquidity: token.liquidity,
                logoURI: token.logoURI,
                mc: token.mc,
                name: token.name,
                symbol: token.symbol,
                v24hChangePercent: token.v24hChangePercent,
                v24hUSD: token.v24hUSD,
              },
              create: {
                address: token.address,
                chain: token.chain,
                decimals: token.decimals,
                price: token.price,
                lastTradeUnixTime: token.lastTradeUnixTime,
                liquidity: token.liquidity,
                logoURI: token.logoURI,
                mc: token.mc,
                name: token.name,
                symbol: token.symbol,
                v24hChangePercent: token.v24hChangePercent,
                v24hUSD: token.v24hUSD,
              },
            });
          } catch (dbError: any) {
            console.log(
              `[DB UPSERT ERROR] chain=${chain} offset=${offset} token=${token.address}:`,
              dbError?.message || String(dbError) || 'Unknown error',
            );
            // Do NOT throw, just continue
          }
        }
        offset += LIMIT;
      } while (offset < total);
    }

    return NextResponse.json({ success: true, count: allTokensLength });
  } catch (error: any) {
    console.log(error?.message || String(error) || 'Unknown error');
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
