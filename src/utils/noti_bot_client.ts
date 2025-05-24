import { Telegraf, Markup } from 'telegraf';
import { Update } from 'telegraf/types';
import { Debugger } from '@/utils/debugger';
import { getSecrets } from '@/utils/secrets';
import {
  getCryptoNews,
  getRecentNFTMints,
  getMemecoinDetails,
} from './grok_workflow';

function getOptionsKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('Trending Crypto News 📈', 'trending_crypto_news')],
    [Markup.button.callback('Recent NFT Mints 🖼️', 'recent_nft_mints')],
    [Markup.button.callback('Search Memecoin 🔎', 'get_meme_details')],
  ]);
}

function replyWithGrokResult(
  ctx: any,
  grokReply: { content: string; xCitations: string[] },
) {
  let replyText = grokReply.content;
  if (grokReply.xCitations.length > 0) {
    const sources = grokReply.xCitations.map((url) => `${url}`).join('\n');
    replyText += `\n\n*Sources*\n${sources}`;
  }
  return ctx.reply(replyText, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  });
}

export class NotiBotClient {
  private bot: Telegraf;
  private debug = Debugger.getInstance();
  private waitingForMemecoin: { [chatId: number]: boolean } = {};

  constructor(botToken: string) {
    this.bot = new Telegraf(botToken);
    this.setupMessageHandlers();
  }

  public setupMessageHandlers() {
    this.bot.start(async (ctx) => {
      await ctx.reply(
        '_Cool! Here are a few areas of interest I specialize in, which are you interested in diving into?_',
        {
          parse_mode: 'Markdown',
          reply_markup: getOptionsKeyboard().reply_markup,
        },
      );
    });

    this.bot.on('text', async (ctx) => {
      const message = ctx.message.text;
      const chatId = ctx.chat.id;
      this.debug.info(
        `NotiBot received message from chat ${chatId}: ${message}`,
      );
      if (this.waitingForMemecoin[chatId]) {
        this.waitingForMemecoin[chatId] = false;
        await ctx.reply('_Fetching details for your memecoin..._', {
          parse_mode: 'Markdown',
        });
        try {
          const detailsReply = await getMemecoinDetails(message);
          await replyWithGrokResult(ctx, detailsReply);
        } catch (error) {
          this.debug.error('Error fetching memecoin details:', error as Error);
          await ctx.reply(
            'Sorry, I encountered an error while fetching the memecoin details. Please try again later.',
          );
        }
        await ctx.reply('_What else would you like to know?_', {
          parse_mode: 'Markdown',
          reply_markup: getOptionsKeyboard().reply_markup,
        });
        return;
      }
      // Add custom logic for NotiBot here
    });

    this.bot.action('trending_crypto_news', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.reply(
        '_Great choice! Let me fetch the latest crypto news..._',
        {
          parse_mode: 'Markdown',
        },
      );

      try {
        const newsReply = await getCryptoNews();
        await replyWithGrokResult(ctx, newsReply);
        await ctx.reply('_What else?_', {
          parse_mode: 'Markdown',
          reply_markup: getOptionsKeyboard().reply_markup,
        });
      } catch (error) {
        this.debug.error('Error fetching crypto news:', error as Error);
        await ctx.reply(
          'Sorry, I encountered an error while fetching the news. Please try again later.',
        );
      }
    });

    this.bot.action('get_meme_details', async (ctx) => {
      await ctx.answerCbQuery();
      const chatId = ctx.chat?.id;
      if (chatId === undefined) return;
      this.waitingForMemecoin[chatId] = true;
      await ctx.reply(
        '_Please enter the name of the memecoin you want details for._',
        {
          parse_mode: 'Markdown',
        },
      );
    });

    this.bot.action('recent_nft_mints', async (ctx) => {
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
        this.debug.error('Error fetching NFT mints:', error as Error);
        await ctx.reply(
          'Sorry, I encountered an error while fetching the NFT mints. Please try again later.',
        );
      }
    });

    this.bot.catch((err) => {
      this.debug.error('NotiBot error:', err as Error);
    });
  }

  public async handleUpdate(body: Update) {
    try {
      await this.bot.handleUpdate(body);
      return true;
    } catch (error) {
      this.debug.error('Error handling NotiBot update:', error as Error);
      return false;
    }
  }

  public async setWebhook() {
    try {
      const { productionUrl } = getSecrets();
      await this.bot.telegram.setWebhook(
        `https://${productionUrl}/api/telegram/noti-bot/webhook`,
      );
      this.debug.info(
        `NotiBot webhook set to: ${productionUrl}/api/telegram/noti-bot/webhook`,
      );
    } catch (error) {
      this.debug.error('Failed to set NotiBot webhook:', error as Error);
      throw error;
    }
  }

  public async deleteWebhook() {
    try {
      await this.bot.telegram.deleteWebhook();
      this.debug.info('NotiBot webhook deleted successfully');
    } catch (error) {
      this.debug.error('Failed to delete NotiBot webhook:', error as Error);
      throw error;
    }
  }
}
