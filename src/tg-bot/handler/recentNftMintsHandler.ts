import { Telegraf, Context } from 'telegraf';
import { getOptionsKeyboard, replyWithGrokResult } from '../maix_utils';
import { getRecentNFTMints } from '../grok_workflow';

interface RecentNftMintsHandlerDeps {
  debug: any;
}

export function recentNftMintsHandler(
  bot: Telegraf,
  dependencies: RecentNftMintsHandlerDeps,
) {
  const { debug } = dependencies;
  bot.action('recent_nft_mints', async (ctx: Context) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      '_Excellent choice! Let me fetch the latest NFT mints..._',
      {
        parse_mode: 'Markdown',
      },
    );
    try {
      const mintsReply = await getRecentNFTMints();
      await replyWithGrokResult(ctx, mintsReply);
      await ctx.reply('_Anything else?_', {
        parse_mode: 'Markdown',
        reply_markup: getOptionsKeyboard().reply_markup,
      });
    } catch (error) {
      debug.error('Error fetching NFT mints:', error as Error);
      await ctx.reply(
        'Sorry, I encountered an error while fetching the NFT mints. Please try again later.',
      );
    }
  });
}
