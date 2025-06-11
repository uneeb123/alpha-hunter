import { NextResponse } from 'next/server';
import {
  getBirdeyeV3TokenList,
  BirdeyeV3TokenListParams,
  getBirdeyeTokenCreationInfo,
  formatNumber,
  formatDateWithOrdinal,
  getBirdeyeTokenOverview,
} from '@/utils/birdeye';
import { Debugger } from '@/utils/debugger';
import { getMaix } from '@/tg-bot/maix';
import { PrismaClient } from '@prisma/client';

const debug = Debugger.getInstance();
const prisma = new PrismaClient();

export async function GET() {
  try {
    let alertedTokens = 0;
    let response;
    // Fetch filter values from DB
    let filter;
    try {
      filter = await prisma.filter.findUnique({ where: { name: 'alert1' } });
    } catch (dbError: any) {
      debug.error(
        '[DB ERROR]:',
        dbError?.message || String(dbError) || 'Unknown error',
      );
      filter = null;
    }
    // Prepare params for getBirdeyeV3TokenList
    const params: Record<string, any> = {
      sort_by: filter?.sort_by || 'volume_1h_change_percent',
      sort_type:
        filter?.sort_type === 'asc' || filter?.sort_type === 'desc'
          ? filter.sort_type
          : 'desc',
    };
    // List of possible numeric filter fields
    const numericFields = [
      'min_liquidity',
      'max_liquidity',
      'min_market_cap',
      'max_market_cap',
      'min_fdv',
      'max_fdv',
      'min_recent_listing_time',
      'max_recent_listing_time',
      'min_last_trade_unix_time',
      'max_last_trade_unix_time',
      'min_holder',
      'min_volume_1h_usd',
      'min_volume_2h_usd',
      'min_volume_4h_usd',
      'min_volume_8h_usd',
      'min_volume_24h_usd',
      'min_volume_1h_change_percent',
      'min_volume_2h_change_percent',
      'min_volume_4h_change_percent',
      'min_volume_8h_change_percent',
      'min_volume_24h_change_percent',
      'min_price_change_1h_percent',
      'min_price_change_2h_percent',
      'min_price_change_4h_percent',
      'min_price_change_8h_percent',
      'min_price_change_24h_percent',
      'min_trade_1h_count',
      'min_trade_2h_count',
      'min_trade_4h_count',
      'min_trade_8h_count',
      'min_trade_24h_count',
      'max_trade_1h_count',
      'max_trade_2h_count',
      'max_trade_4h_count',
      'max_trade_8h_count',
      'max_trade_24h_count',
    ];
    if (filter) {
      const filterAny = filter as Record<string, any>;
      for (const field of numericFields) {
        if (
          filterAny[field] !== undefined &&
          filterAny[field] !== null &&
          filterAny[field] !== ''
        ) {
          params[field] = Number(filterAny[field]);
        }
      }
    }
    try {
      response = await getBirdeyeV3TokenList(
        params as BirdeyeV3TokenListParams,
      );
    } catch (apiError: any) {
      debug.error(
        `[Birdeye V3 API ERROR]:`,
        apiError?.message || String(apiError) || 'Unknown error',
      );
      throw new Error(`Birdeye V3 API error`);
    }
    const tokens = response.data.items;
    const now = new Date();
    const threeMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 3,
      now.getDate(),
    );
    for (const token of tokens) {
      try {
        // Fetch creation info from Birdeye
        const creationInfo = await getBirdeyeTokenCreationInfo(token.address);
        let creationTime: Date | undefined = undefined;
        if (creationInfo && creationInfo.blockHumanTime) {
          creationTime = new Date(creationInfo.blockHumanTime);
        }
        // Filter: only proceed if creationTime is within last 3 months
        if (!creationTime || creationTime < threeMonthsAgo) {
          continue;
        }
        // Fetch token overview for description and twitter
        let overview;
        try {
          overview = await getBirdeyeTokenOverview(token.address);
        } catch {
          overview = null;
        }
        let description = '';
        let twitter = '';
        if (overview && overview.extensions) {
          if (overview.extensions.description) {
            description = `\nDescription: ${overview.extensions.description}`;
          }
          if (overview.extensions.twitter) {
            twitter = `\n[Twitter/X](${overview.extensions.twitter})`;
          }
        }
        const { ChatAgent } = await import('@/utils/agent');
        const agent = new ChatAgent();
        const llmMessage = await agent.generateAlert({
          name: token.name,
          symbol: token.symbol,
          marketCap: token.market_cap,
          address: token.address,
          created: creationTime?.toISOString() || '',
          description: overview?.extensions?.description || '',
        });

        const originalMessage = `Name: ${token.name}\nSymbol: ${token.symbol}\nMarket Cap: ${formatNumber(token.market_cap, 0)}\nAddress: \`${token.address}\`\nCreated: ${formatDateWithOrdinal(creationTime)}${description}${twitter}`;

        const finalMessage = llmMessage
          ? `📈 *Trending Token!*\n${llmMessage}\n${originalMessage}`
          : `📈 *Trending Token!*\n${originalMessage}`;
        await getMaix().alert(finalMessage);
        debug.info(`Alerted for token: ${token.name} (${token.symbol})`);
        alertedTokens++;
      } catch (err) {
        debug.error(
          `Failed to broadcast alert for token ${token.address}:`,
          err as any,
        );
      }
    }
    return NextResponse.json({ success: true, alertedTokens });
  } catch (error: any) {
    debug.error(error?.message || String(error) || 'Unknown error');
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
