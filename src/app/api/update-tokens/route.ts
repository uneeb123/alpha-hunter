import { NextResponse } from 'next/server';
import {
  getBirdeyeV3TokenList,
  getBirdeyeTokenCreationInfo,
} from '@/utils/birdeye';
import { prisma } from '@/lib/prisma';
import { Debugger } from '@/utils/debugger';

const LIMIT = 50;
const debug = Debugger.getInstance();

export async function POST() {
  try {
    let allTokensLength = 0;
    let offset = 0;
    let hasNext = true;
    while (hasNext) {
      let response;
      try {
        response = await getBirdeyeV3TokenList({
          offset,
          limit: LIMIT,
        });
      } catch (apiError: any) {
        debug.error(
          `[Birdeye V3 API ERROR] offset=${offset}:`,
          apiError?.message || String(apiError) || 'Unknown error',
        );
        throw new Error(`Birdeye V3 API error for offset=${offset}`);
      }
      const tokens = response.data.items;
      hasNext = response.data.has_next;
      allTokensLength += tokens.length;
      debug.info(`[solana] Upserting tokens for offset ${offset}`);
      for (const token of tokens) {
        try {
          // Check if creationTime is already set
          let creationTime: Date | undefined = undefined;
          const existing = await prisma.token.findUnique({
            where: {
              address_chain: { address: token.address, chain: 'solana' },
            },
            select: { creationTime: true },
          });
          if (!existing?.creationTime) {
            const creationInfo = await getBirdeyeTokenCreationInfo(
              token.address,
            );
            if (creationInfo && creationInfo.blockHumanTime) {
              creationTime = new Date(creationInfo.blockHumanTime);
            }
          } else {
            creationTime = existing.creationTime ?? undefined;
          }
          await prisma.token.upsert({
            where: {
              address_chain: { address: token.address, chain: 'solana' },
            },
            update: {
              decimals: token.decimals,
              price: token.price,
              lastTradeUnixTime: token.last_trade_unix_time,
              liquidity: token.liquidity,
              logoURI: token.logo_uri,
              mc: token.market_cap,
              name: token.name,
              symbol: token.symbol,
              v24hChangePercent: token.volume_24h_change_percent,
              v24hUSD: token.volume_24h_usd,
              trade24hCount: token.trade_24h_count,
              holderCount: token.holder,
              fullyDilutedValuation: token.fdv,
              creationTime,
            },
            create: {
              address: token.address,
              chain: 'solana',
              decimals: token.decimals,
              price: token.price,
              lastTradeUnixTime: token.last_trade_unix_time,
              liquidity: token.liquidity,
              logoURI: token.logo_uri,
              mc: token.market_cap,
              name: token.name,
              symbol: token.symbol,
              v24hChangePercent: token.volume_24h_change_percent,
              v24hUSD: token.volume_24h_usd,
              trade24hCount: token.trade_24h_count,
              holderCount: token.holder,
              fullyDilutedValuation: token.fdv,
              creationTime,
            },
          });
        } catch (dbError: any) {
          debug.error(
            `[DB UPSERT ERROR] offset=${offset} token=${token.address}:`,
            dbError?.message || String(dbError) || 'Unknown error',
          );
          // Do NOT throw, just continue
        }
      }
      offset += LIMIT;
    }

    return NextResponse.json({ success: true, count: allTokensLength });
  } catch (error: any) {
    debug.error(error?.message || String(error) || 'Unknown error');
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
