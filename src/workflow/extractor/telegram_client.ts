import { Telegraf } from 'telegraf';
import { Debugger } from '@/utils/debugger';

export class TelegramClient {
  private bot: Telegraf;
  private debug = Debugger.getInstance();

  constructor(botToken: string) {
    this.bot = new Telegraf(botToken);
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
