import { Telegraf, Context } from 'telegraf';
import {
  getOnboardingOptionsKeyboard,
  getMarketSummaryForStartHandler,
} from '../maix_utils';
import { getCryptoNews } from '../grok_workflow';

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
      update: { updatedAt: new Date(), subscribed: true },
      create: { chatId, subscribed: true },
    });

    // 1. Show trending crypto news
    await ctx.reply(
      "_Hey there! My name is Maix. I'll be your guide in navigating the crypto landscape._",
      { parse_mode: 'Markdown' },
    );

    // 1a. Show BTC, ETH, SOL prices and trending memecoins
    await ctx.reply("_Let's begin with an overview of the market..._", {
      parse_mode: 'Markdown',
    });
    const priceMsg = await getMarketSummaryForStartHandler();
    await ctx.reply(priceMsg, { parse_mode: 'Markdown' });

    // 1b. Show trending crypto news
    await ctx.reply("_Now let's explore some macro news..._", {
      parse_mode: 'Markdown',
    });
    const newsReply = await getCryptoNews();
    const newsText = newsReply.content;
    // No sources on start
    /*
    if (newsReply.xCitations && newsReply.xCitations.length > 0) {
      const sources = newsReply.xCitations
        .slice(0, 3)
        .map((url) => url.replace(/_/g, '\\_'))
        .join('\n');
      newsText += `\n\n*Sources*\n${sources}`;
    }
    */
    await ctx.reply(newsText, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    } as any);

    // 2. Show subscription message
    await ctx.reply(
      '_You are now subscribed to receive daily digest at 9 am PST. To manage your subscription, type /settings_',
      { parse_mode: 'Markdown' },
    );

    // 3. Show onboarding options
    await ctx.reply('_Dive deeper into any of the following areas_', {
      parse_mode: 'Markdown',
      reply_markup: getOnboardingOptionsKeyboard().reply_markup,
    });
  });
}
