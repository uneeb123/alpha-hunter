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
import { prisma } from '@/lib/prisma';

const debug = Debugger.getInstance();

// Alert thresholds and cooldowns
const ALERT_THRESHOLDS = {
  MARKET_CAP_CHANGE: 20, // 20% change in market cap
  VOLUME_CHANGE: 50, // 50% change in volume
  MIN_MARKET_CAP: 100000, // $100k minimum market cap
  MIN_VOLUME: 50000, // $50k minimum volume
};
const ALERT_COOLDOWNS = {
  NEW_TOKEN: 24, // hours
  MARKET_CAP: 24, // hours
  VOLUME: 12, // hours
};

interface AlertCheckResult {
  shouldAlert: boolean;
  type?: 'new_token' | 'market_cap_change' | 'volume_spike';
  change?: number;
}

async function shouldAlertToken(
  token: any,
  lastAlert: any,
): Promise<AlertCheckResult> {
  const now = new Date();
  let creationTime = token.creationTime
    ? new Date(token.creationTime)
    : undefined;
  if (!creationTime && token.blockHumanTime) {
    creationTime = new Date(token.blockHumanTime);
  }
  // New token: created in last 24h
  const isNewToken =
    creationTime &&
    now.getTime() - creationTime.getTime() < 24 * 60 * 60 * 1000;
  if (
    isNewToken &&
    (!lastAlert ||
      now.getTime() - new Date(lastAlert.createdAt).getTime() >
        ALERT_COOLDOWNS.NEW_TOKEN * 60 * 60 * 1000)
  ) {
    return { shouldAlert: true, type: 'new_token' };
  }
  // Market cap change
  if (lastAlert && lastAlert.marketCap > 0) {
    const marketCapChange =
      ((token.market_cap - lastAlert.marketCap) / lastAlert.marketCap) * 100;
    if (
      Math.abs(marketCapChange) >= ALERT_THRESHOLDS.MARKET_CAP_CHANGE &&
      now.getTime() - new Date(lastAlert.createdAt).getTime() >
        ALERT_COOLDOWNS.MARKET_CAP * 60 * 60 * 1000
    ) {
      return {
        shouldAlert: true,
        type: 'market_cap_change',
        change: marketCapChange,
      };
    }
  }
  // Volume spike
  if (lastAlert && lastAlert.extra && lastAlert.extra.volume) {
    const volumeChange =
      ((token.volume_24h_usd - lastAlert.extra.volume) /
        lastAlert.extra.volume) *
      100;
    if (
      volumeChange >= ALERT_THRESHOLDS.VOLUME_CHANGE &&
      now.getTime() - new Date(lastAlert.createdAt).getTime() >
        ALERT_COOLDOWNS.VOLUME * 60 * 60 * 1000
    ) {
      return { shouldAlert: true, type: 'volume_spike', change: volumeChange };
    }
  }
  return { shouldAlert: false };
}

export async function GET() {
  try {
    let alertedTokens = 0;
    let response;
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
        // Skip if below minimum thresholds
        if (
          token.market_cap < ALERT_THRESHOLDS.MIN_MARKET_CAP ||
          token.volume_24h_usd < ALERT_THRESHOLDS.MIN_VOLUME
        ) {
          continue;
        }
        // Fetch creation info
        let creationInfo;
        try {
          creationInfo = await getBirdeyeTokenCreationInfo(token.address);
        } catch {
          creationInfo = null;
        }
        let creationTime = undefined;
        if (creationInfo && creationInfo.blockHumanTime) {
          creationTime = new Date(creationInfo.blockHumanTime);
        }
        // Only proceed if creationTime is within last 3 months
        if (!creationTime || creationTime < threeMonthsAgo) {
          continue;
        }
        // Fetch overview
        let overview;
        try {
          overview = await getBirdeyeTokenOverview(token.address);
        } catch {
          overview = null;
        }
        // Get last alert for this token
        const lastAlert = await prisma.tokenAlertMemory.findFirst({
          where: { tokenAddress: token.address },
          orderBy: { createdAt: 'desc' },
        });
        // Check if we should alert
        const alertCheck = await shouldAlertToken(
          {
            ...token,
            creationTime,
          },
          lastAlert,
        );
        if (!alertCheck.shouldAlert) {
          continue;
        }
        // Prepare alert message
        let message = '';
        switch (alertCheck.type) {
          case 'new_token':
            message = `🆕 *New Token Alert!*\n`;
            break;
          case 'market_cap_change':
            message = `📈 *Market Cap Change Alert!*\nChange: ${(alertCheck.change ?? 0).toFixed(2)}%\n`;
            break;
          case 'volume_spike':
            message = `📊 *Volume Spike Alert!*\nChange: ${(alertCheck.change ?? 0).toFixed(2)}%\n`;
            break;
        }
        message += `Name: ${token.name}\nSymbol: ${token.symbol}\nMarket Cap: ${formatNumber(token.market_cap, 0)}\nAddress: \`${token.address}\`\nCreated: ${formatDateWithOrdinal(creationTime)}`;
        if (overview && overview.extensions) {
          if (overview.extensions.description) {
            message += `\nDescription: ${overview.extensions.description}`;
          }
          if (overview.extensions.twitter) {
            message += `\n[Twitter/X](${overview.extensions.twitter})`;
          }
        }
        await getMaix().alert(message);
        await prisma.tokenAlertMemory.create({
          data: {
            tokenAddress: token.address,
            eventType: alertCheck.type ?? '',
            marketCap: token.market_cap,
            extra: {
              volume: token.volume_24h_usd,
              price: token.price,
              description: overview?.extensions?.description ?? '',
              twitter: overview?.extensions?.twitter ?? '',
            },
          },
        });
        debug.info(
          `Alerted for token: ${token.name} (${token.symbol}) - ${alertCheck.type}`,
        );
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
