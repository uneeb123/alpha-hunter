import { Telegraf, Context } from 'telegraf';
import { getSubscribeKeyboard } from '../maix_utils';

interface SettingsHandlerDeps {
  prisma: any;
}

export function settingsHandler(
  bot: Telegraf,
  dependencies: SettingsHandlerDeps,
) {
  const { prisma } = dependencies;

  bot.command('settings', async (ctx: Context) => {
    if (!ctx.chat) return;
    const chatId = ctx.chat.id.toString();
    const chat = await prisma.telegramChat.findUnique({ where: { chatId } });
    const isSubscribed = chat?.subscribed ?? true;
    await ctx.reply(
      isSubscribed
        ? '_You are currently subscribed to the daily digest._'
        : '_You are not subscribed to the daily digest._',
      {
        parse_mode: 'Markdown',
        reply_markup: getSubscribeKeyboard(isSubscribed).reply_markup,
      },
    );
  });

  bot.action('subscribe', async (ctx: Context) => {
    if (!ctx.chat) return;
    const chatId = ctx.chat.id.toString();
    await prisma.telegramChat.update({
      where: { chatId },
      data: { subscribed: true },
    });
    await ctx.editMessageReplyMarkup(getSubscribeKeyboard(true).reply_markup);
    await ctx.reply('_You have been subscribed to the daily digest!_', {
      parse_mode: 'Markdown',
    });
  });

  bot.action('unsubscribe', async (ctx: Context) => {
    if (!ctx.chat) return;
    const chatId = ctx.chat.id.toString();
    await prisma.telegramChat.update({
      where: { chatId },
      data: { subscribed: false },
    });
    await ctx.editMessageReplyMarkup(getSubscribeKeyboard(false).reply_markup);
    await ctx.reply('_You have been unsubscribed from the daily digest._', {
      parse_mode: 'Markdown',
    });
  });
}
