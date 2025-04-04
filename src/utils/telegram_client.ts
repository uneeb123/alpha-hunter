import { Telegraf } from 'telegraf';
import { Update } from 'telegraf/types';
import { Debugger } from '@/utils/debugger';
import { getSecrets } from '@/utils/secrets';

export class TelegramClient {
  private bot: Telegraf;
  private debug = Debugger.getInstance();

  constructor(botToken: string) {
    this.bot = new Telegraf(botToken);
    this.setupMessageHandlers();
  }

  private setupMessageHandlers() {
    // Handle text messages
    this.bot.on('text', async (ctx) => {
      const message = ctx.message.text;
      const chatId = ctx.chat.id;
      this.debug.info(`Received message from chat ${chatId}: ${message}`);

      // Here you can add your message handling logic
      if (ctx.chat.type == 'private') {
        await ctx.reply('Message received!');
      }
    });

    // Handle errors
    this.bot.catch((err) => {
      this.debug.error('Telegram bot error:', err as Error);
    });
  }

  // Method to handle webhook updates
  public async handleUpdate(body: Update) {
    try {
      await this.bot.handleUpdate(body);
      return true;
    } catch (error) {
      this.debug.error('Error handling telegram update:', error as Error);
      return false;
    }
  }

  // Method to set webhook URL
  async setWebhook() {
    try {
      const { productionUrl } = getSecrets();
      await this.bot.telegram.setWebhook(
        `https://${productionUrl}/api/telegram-webhook`,
      );
      this.debug.info(`Webhook set to: ${productionUrl}/api/telegram-webhook`);
    } catch (error) {
      this.debug.error('Failed to set webhook:', error as Error);
      throw error;
    }
  }

  async deleteWebhook() {
    try {
      await this.bot.telegram.deleteWebhook();
      this.debug.info('Webhook deleted successfully');
    } catch (error) {
      this.debug.error('Failed to delete webhook:', error as Error);
      throw error;
    }
  }

  /**
   * Sends a summary to all Telegram chats the bot is a member of
   * @param summary The summary text to send
   */
  async sendSummary(summary: string): Promise<void> {
    try {
      // Get the bot information
      const botInfo = await this.bot.telegram.getMe();
      this.debug.info(`Connected to Telegram as @${botInfo.username}`);

      // Get all the chats where the bot is a member
      // Note: Telegram doesn't provide a direct API to get all chats a bot is in
      // We'll use getChatAdministrators in a try/catch to determine if the bot is in the chat

      const chatIds = ['-1002494776074', '-4656585527'];
      // const chatIds = ['-4656585527'];

      if (chatIds.length === 0) {
        this.debug.info('No chat IDs configured to send messages to');
        return;
      }

      // Format the summary for Telegram
      // Telegram supports HTML formatting
      const formattedSummary = `${summary}`;

      // Send the message to each chat
      for (const chatId of chatIds) {
        try {
          await this.bot.telegram.sendMessage(chatId, formattedSummary, {
            parse_mode: 'HTML',
          });
          this.debug.info(`Successfully sent summary to chat ${chatId}`);
        } catch (error) {
          this.debug.error(
            `Failed to send message to chat ${chatId}:`,
            error as Error,
          );
        }
      }

      this.debug.info(
        `Attempted to send summaries to ${chatIds.length} Telegram chats`,
      );
    } catch (error) {
      this.debug.error('Error with Telegram bot:', error as Error);
      throw error;
    }
  }
}
