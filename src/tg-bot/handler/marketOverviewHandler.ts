import { Telegraf, Context } from 'telegraf';
import {
  getMarketSummaryForStartHandler,
  getOptionsKeyboard,
} from '../maix_utils';

interface MarketOverviewHandlerDeps {
  debug: any;
}

export function marketOverviewHandler(
  bot: Telegraf,
  dependencies: MarketOverviewHandlerDeps,
) {
  const { debug } = dependencies;

  bot.action('market_overview', async (ctx: Context) => {
    try {
      await ctx.answerCbQuery();
      await ctx.reply('_Fetching market overview..._', {
        parse_mode: 'Markdown',
      });

      const marketSummary = await getMarketSummaryForStartHandler();
      await ctx.reply(marketSummary, { parse_mode: 'Markdown' });

      await ctx.reply('_Anything else?_', {
        parse_mode: 'Markdown',
        reply_markup: getOptionsKeyboard().reply_markup,
      });
    } catch (error) {
      debug.error('Error in market overview handler:', error as Error);
      await ctx.reply(
        '_Sorry, I encountered an error while fetching market data._',
        {
          parse_mode: 'Markdown',
        },
      );
    }
  });
}
