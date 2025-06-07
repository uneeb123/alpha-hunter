import { Telegraf, Context } from 'telegraf';
import { getOptionsKeyboard, replyWithGrokResult } from '../maix_utils';
import { getMemecoinDetails } from '../grok_workflow';
import { message } from 'telegraf/filters';
import { ChatAgent } from '@/utils/agent';

interface TextHandlerDeps {
  debug: any;
  waitingForMemecoin: { [chatId: number]: boolean };
}

export function textHandler(bot: Telegraf, dependencies: TextHandlerDeps) {
  const { debug, waitingForMemecoin } = dependencies;
  bot.on(message('text'), async (ctx: Context) => {
    if (!ctx.message || !('text' in ctx.message) || !ctx.chat) return;
    const message = ctx.message.text;
    const chatId = ctx.chat.id;
    debug.info(`Maix received message from chat ${chatId}: ${message}`);
    if (waitingForMemecoin[chatId]) {
      waitingForMemecoin[chatId] = false;
      await ctx.reply('_Fetching details for your memecoin..._', {
        parse_mode: 'Markdown',
      });
      try {
        const detailsReply = await getMemecoinDetails(message);
        await replyWithGrokResult(ctx, detailsReply);
      } catch (error) {
        debug.error('Error fetching memecoin details:', error as Error);
        await ctx.reply(
          'Sorry, I encountered an error while fetching the memecoin details. Please try again later.',
        );
      }
      await ctx.reply('_Anything else would you like to know?_', {
        parse_mode: 'Markdown',
        reply_markup: getOptionsKeyboard().reply_markup,
      });
      return;
    }

    // be able to have conversations with the chat agent
    const agent = new ChatAgent();
    const response = await agent.generateReply(
      ctx.message.text,
      ctx.chat.id.toString(),
    );
    ctx.reply(response);
  });
}
