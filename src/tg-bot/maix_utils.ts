import { Markup } from 'telegraf';

export function getOptionsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Trending Crypto News 📈', 'trending_crypto_news')],
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
    [Markup.button.callback('Trending Crypto News 📈', 'trending_crypto_news')],
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
  } catch (err) {
    console.log(chunks);
    // If Markdown fails, try sending as plain text
    for (const chunk of chunks) {
      await ctx.reply(chunk, {
        disable_web_page_preview: true,
      });
    }
  }
}
