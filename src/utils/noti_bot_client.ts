import { Telegraf, Markup } from 'telegraf';
import { Update } from 'telegraf/types';
import { Debugger } from '@/utils/debugger';
import { getSecrets } from '@/utils/secrets';
import {
  getCryptoNews,
  getEmergingMemecoins,
  getRecentNFTMints,
} from './grok_workflow';

export class NotiBotClient {
  private bot: Telegraf;
  private debug = Debugger.getInstance();

  constructor(botToken: string) {
    this.bot = new Telegraf(botToken);
    this.setupMessageHandlers();
  }

  public setupMessageHandlers() {
    this.bot.start(async (ctx) => {
      await ctx.reply(
        'Cool! Here are a few areas of interest I specialize in, which are you interested in diving into?',
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              'Trending Crypto News 📈',
              'trending_crypto_news',
            ),
            Markup.button.callback(
              'Emerging Memecoins 🐸',
              'emerging_memecoins',
            ),
            Markup.button.callback('Recent NFT Mints 🖼️', 'recent_nft_mints'),
          ],
        ]),
      );
    });

    // this.bot.command('trending-tokens', async (ctx) => {
    //   await ctx.reply('Trending tokens: Bitcoin, Ethereum, Solana');
    // });

    this.bot.on('text', async (ctx) => {
      const message = ctx.message.text;
      const chatId = ctx.chat.id;
      this.debug.info(
        `NotiBot received message from chat ${chatId}: ${message}`,
      );
      // Add custom logic for NotiBot here
    });

    // Handle callback queries (button clicks)
    this.bot.action('trending_crypto_news', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.reply('Great choice! Let me fetch the latest crypto news...');

      try {
        const news = await getCryptoNews();
        await ctx.reply(news);
      } catch (error) {
        this.debug.error('Error fetching crypto news:', error as Error);
        await ctx.reply(
          'Sorry, I encountered an error while fetching the news. Please try again later.',
        );
      }
    });

    this.bot.action('emerging_memecoins', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.reply('Solid choice! Let me fetch the latest memecoin news...');

      try {
        const news = await getEmergingMemecoins();
        await ctx.reply(news);
      } catch (error) {
        this.debug.error('Error fetching memecoin news:', error as Error);
        await ctx.reply(
          'Sorry, I encountered an error while fetching the memecoin news. Please try again later.',
        );
      }
    });

    this.bot.action('recent_nft_mints', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.reply('Excellent choice! Let me fetch the latest NFT mints...');

      try {
        const mints = await getRecentNFTMints();
        await ctx.reply(mints);
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
