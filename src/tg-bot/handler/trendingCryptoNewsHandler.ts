import { Telegraf, Context } from 'telegraf';
import { getOptionsKeyboard, replyWithGrokResult } from '../maix_utils';
import { getCryptoNews } from '../grok_workflow';

interface TrendingCryptoNewsHandlerDeps {
  debug: any;
}

export function trendingCryptoNewsHandler(
  bot: Telegraf,
  dependencies: TrendingCryptoNewsHandlerDeps,
) {
  const { debug } = dependencies;
  bot.action('trending_crypto_news', async (ctx: Context) => {
    await ctx.answerCbQuery();
    await ctx.reply('_Great choice! Let me fetch the latest crypto news..._', {
      parse_mode: 'Markdown',
    });
    try {
      const newsReply = await getCryptoNews();
      await replyWithGrokResult(ctx, newsReply);
      await ctx.reply('_Anything else?_', {
        parse_mode: 'Markdown',
        reply_markup: getOptionsKeyboard().reply_markup,
      });
    } catch (error) {
      debug.error('Error fetching crypto news:', error as Error);
      await ctx.reply(
        'Sorry, I encountered an error while fetching the news. Please try again later.',
      );
    }
  });
}
