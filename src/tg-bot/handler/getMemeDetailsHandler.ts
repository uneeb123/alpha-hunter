import { Telegraf, Context } from 'telegraf';

interface GetMemeDetailsHandlerDeps {
  waitingForMemecoin: { [chatId: number]: boolean };
}

export function getMemeDetailsHandler(
  bot: Telegraf,
  dependencies: GetMemeDetailsHandlerDeps,
) {
  const { waitingForMemecoin } = dependencies;
  bot.action('get_meme_details', async (ctx: Context) => {
    await ctx.answerCbQuery();
    const chatId = ctx.chat?.id;
    if (chatId === undefined) return;
    waitingForMemecoin[chatId] = true;
    await ctx.reply(
      '_Please enter the name of the memecoin you want details for._',
      {
        parse_mode: 'Markdown',
      },
    );
  });
}
