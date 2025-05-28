import { Markup } from 'telegraf';
import type { PriceInfo } from '@/utils/coinmarketcap';
import type { BirdeyeTokenInfo } from '@/utils/birdeye';
import { getPrices } from '@/utils/coinmarketcap';
import { getTrendingMemecoins } from '@/utils/birdeye';

export function getOptionsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Market Overview 📊', 'market_overview')],
    [Markup.button.callback('Macro Updates 🗞️', 'macro_updates')],
    [Markup.button.callback('Recent NFT Mints 🖼️', 'recent_nft_mints')],
    [Markup.button.callback('Search Memecoin 🔎', 'get_meme_details')],
  ]);
}

export function getSubscribeKeyboard(isSubscribed: boolean) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        isSubscribed ? 'Unsubscribe' : 'Subscribe',
        isSubscribed ? 'unsubscribe' : 'subscribe',
      ),
    ],
  ]);
}

export function getOnboardingOptionsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Market Overview 📊', 'market_overview')],
    [Markup.button.callback('Macro Updates 🗞️', 'macro_updates')],
    [Markup.button.callback('Recent NFT Mints 🖼️', 'recent_nft_mints')],
    [Markup.button.callback('Search Memecoin 🔎', 'get_meme_details')],
  ]);
}

export async function replyWithGrokResult(
  ctx: any,
  grokReply: { content: string; xCitations: string[] },
) {
  let replyText = grokReply.content;
  if (grokReply.xCitations.length > 0) {
    const sources = grokReply.xCitations
      .slice(0, 3)
      .map((url) => url.replace(/_/g, '\\_'))
      .join('\n');
    replyText += `\n\n*Sources*\n${sources}`;
  }
  // Chunk the replyText into 4000 character pieces
  const chunks = [];
  let text = replyText;
  while (text.length > 0) {
    chunks.push(text.slice(0, 4000));
    text = text.slice(4000);
  }
  try {
    for (const chunk of chunks) {
      await ctx.reply(chunk, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });
    }
  } catch {
    console.log(chunks);
    // If Markdown fails, try sending as plain text
    for (const chunk of chunks) {
      await ctx.reply(chunk, {
        disable_web_page_preview: true,
      });
    }
  }
}

export function formatStartHandlerMarketSummary(
  prices: PriceInfo[],
  trendingMemecoins: BirdeyeTokenInfo[],
): string {
  const priceLines = prices.map((p) => {
    const arrow = p.change > 0 ? '🔼' : p.change < 0 ? '🔽' : '';
    return `*${p.symbol}*: $${p.price} (${p.change > 0 ? '+' : ''}${p.change}% ${arrow})`;
  });
  // Table-like formatting for memecoins (extra padding for Telegram)
  const memecoinLinesTable = trendingMemecoins
    .slice(0, 5)
    .sort((a, b) => (b.marketcap || 0) - (a.marketcap || 0))
    .map((t) => {
      const pct =
        t.price24hChangePercent !== null
          ? `${t.price24hChangePercent > 0 ? '+' : ''}${t.price24hChangePercent?.toFixed(2)}%`
          : 'N/A';
      const marketcap = t.marketcap
        ? `$${t.marketcap >= 1_000_000_000 ? (t.marketcap / 1_000_000_000).toFixed(1) + 'B' : (t.marketcap / 1_000_000).toFixed(1) + 'M'}`
        : 'N/A';
      return `${t.symbol} (${t.chain}) 💰 ${marketcap} | ▲ ${pct}`;
    });
  return (
    '*Market Overview:*\n' +
    priceLines.join('\n') +
    '\n\n*Trending* 🔥\n' +
    memecoinLinesTable.join('\n') +
    '\n\n_All changes shown are for the last 24 hours._'
  );
}

export async function getMarketSummaryForStartHandler(): Promise<string> {
  try {
    const [prices, trendingMemecoins] = await Promise.all([
      getPrices(['BTC', 'ETH', 'SOL']),
      getTrendingMemecoins(),
    ]);
    return formatStartHandlerMarketSummary(prices, trendingMemecoins);
  } catch {
    return '_Failed to fetch prices or trending tokens._';
  }
}
