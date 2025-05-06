import { Telegraf } from 'telegraf';
import { Update } from 'telegraf/types';
import { Debugger } from '@/utils/debugger';
import { getSecrets } from '@/utils/secrets';

export class NotiBotClient {
  private bot: Telegraf;
  private debug = Debugger.getInstance();

  constructor(botToken: string) {
    this.bot = new Telegraf(botToken);
    this.setupMessageHandlers();
  }

  public setupMessageHandlers() {
    // Add message handlers for NotiBot here
    this.bot.start(async (ctx) => {
      await ctx.reply("I'm Noti Bot and I'm here to help!");
    });

    this.bot.command('trending-tokens', async (ctx) => {
      await ctx.reply('Trending tokens: Bitcoin, Ethereum, Solana');
    });

    this.bot.on('text', async (ctx) => {
      const message = ctx.message.text;
      const chatId = ctx.chat.id;
      this.debug.info(
        `NotiBot received message from chat ${chatId}: ${message}`,
      );
      // Add custom logic for NotiBot here
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
