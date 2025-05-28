import { Telegraf, Context } from 'telegraf';
import { getOptionsKeyboard, replyWithGrokResult } from '../maix_utils';
import { getCryptoNews } from '../grok_workflow';

interface MacroUpdatesHandlerDeps {
  debug: any;
}

export function macroUpdatesHandler(
  bot: Telegraf,
  dependencies: MacroUpdatesHandlerDeps,
) {
  const { debug } = dependencies;
  bot.action('macro_updates', async (ctx: Context) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      '_Great choice! Let me fetch the latest macro updates..._',
      {
        parse_mode: 'Markdown',
      },
    );
    try {
      const newsReply = await getCryptoNews();
      await replyWithGrokResult(ctx, newsReply);
      await ctx.reply('_Anything else?_', {
        parse_mode: 'Markdown',
        reply_markup: getOptionsKeyboard().reply_markup,
      });
    } catch (error) {
      debug.error('Error fetching macro updates:', error as Error);
      await ctx.reply(
        'Sorry, I encountered an error while fetching the news. Please try again later.',
      );
    }
  });
}
