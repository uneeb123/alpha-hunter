import { Telegraf, Context } from 'telegraf';
import { getOptionsKeyboard, replyWithGrokResult } from '../maix_utils';
import { getInternetCapitalMarkets } from '../grok_workflow';

interface InternetCapitalMarketsHandlerDeps {
  debug: any;
}

export function internetCapitalMarketsHandler(
  bot: Telegraf,
  dependencies: InternetCapitalMarketsHandlerDeps,
) {
  const { debug } = dependencies;
  bot.action('internet_capital_markets', async (ctx: Context) => {
    await ctx.answerCbQuery();
    await ctx.reply('_Fetching the latest on Internet Capital Markets..._', {
      parse_mode: 'Markdown',
    });
    try {
      const result = await getInternetCapitalMarkets();
      await replyWithGrokResult(ctx, result);
      await ctx.reply('_Anything else?_', {
        parse_mode: 'Markdown',
        reply_markup: getOptionsKeyboard().reply_markup,
      });
    } catch (error) {
      debug.error(
        'Error fetching Internet Capital Markets updates:',
        error as Error,
      );
      await ctx.reply(
        'Sorry, I encountered an error while fetching the updates. Please try again later.',
      );
    }
  });
}
