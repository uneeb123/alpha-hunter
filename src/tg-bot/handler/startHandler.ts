import { Telegraf, Context } from 'telegraf';
import { getOptionsKeyboard } from '../maix_utils';

interface StartHandlerDeps {
  prisma: any;
}

export function startHandler(bot: Telegraf, dependencies: StartHandlerDeps) {
  const { prisma } = dependencies;
  bot.start(async (ctx: Context) => {
    if (!ctx.chat) return;
    const chatId = ctx.chat.id.toString();
    await prisma.telegramChat.upsert({
      where: { chatId },
      update: { updatedAt: new Date() },
      create: { chatId },
    });
    await ctx.reply(
      '_Cool! Here are a few areas of interest I specialize in, which are you interested in diving into?_',
      {
        parse_mode: 'Markdown',
        reply_markup: getOptionsKeyboard().reply_markup,
      },
    );
  });
}
