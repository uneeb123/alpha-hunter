import { Telegraf } from 'telegraf';
import { Update } from 'telegraf/types';
import { Debugger } from '@/utils/debugger';
import { getSecrets } from '@/utils/secrets';
import { getCryptoNews } from './grok_workflow';
import { prisma } from '@/lib/prisma';
import { startHandler } from './handler/startHandler';
import { textHandler } from './handler/textHandler';
import { macroUpdatesHandler } from './handler/macroUpdatesHandler';
import { getMemeDetailsHandler } from './handler/getMemeDetailsHandler';
import { recentNftMintsHandler } from './handler/recentNftMintsHandler';
import { catchHandler } from './handler/catchHandler';
import { settingsHandler } from './handler/settingsHandler';
import { marketOverviewHandler } from './handler/marketOverviewHandler';
import { internetCapitalMarketsHandler } from './handler/internetCapitalMarketsHandler';

export class Maix {
  private bot: Telegraf;
  private debug = Debugger.getInstance();

  constructor(botToken: string) {
    this.bot = new Telegraf(botToken);
    // Shared state for memecoin waiting
    const waitingForMemecoin: { [chatId: number]: boolean } = {};
    const deps = { debug: this.debug, prisma, waitingForMemecoin };
    startHandler(this.bot, deps);
    settingsHandler(this.bot, deps);
    marketOverviewHandler(this.bot, deps);
    textHandler(this.bot, deps);
    macroUpdatesHandler(this.bot, deps);
    getMemeDetailsHandler(this.bot, deps);
    recentNftMintsHandler(this.bot, deps);
    internetCapitalMarketsHandler(this.bot, deps);
    catchHandler(this.bot, deps);
  }

  public async handleUpdate(body: Update) {
    try {
      await this.bot.handleUpdate(body);
      return true;
    } catch (error) {
      this.debug.error('Error handling Maix update:', error as Error);
      return false;
    }
  }

  public async setWebhook() {
    try {
      const { productionUrl } = getSecrets();
      await this.bot.telegram.setWebhook(
        `https://${productionUrl}/api/maix/webhook`,
      );
      this.debug.info(`Maix webhook set to: ${productionUrl}/api/maix/webhook`);
    } catch (error) {
      this.debug.error('Failed to set Maix webhook:', error as Error);
      throw error;
    }
  }

  public async deleteWebhook() {
    try {
      await this.bot.telegram.deleteWebhook();
      this.debug.info('Maix webhook deleted successfully');
    } catch (error) {
      this.debug.error('Failed to delete Maix webhook:', error as Error);
      throw error;
    }
  }

  public async broadcastMessage() {
    try {
      const newsReply = await getCryptoNews();
      const today = new Date().toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
      let message = `_${"Here's your daily digest for " + today + ':'}_\n\n${newsReply.content}`;
      if (newsReply.xCitations && newsReply.xCitations.length > 0) {
        message +=
          `\n\n*Sources:*\n` +
          newsReply.xCitations
            .slice(0, 3)
            .map((url) => `- ${url.replace(/_/g, '\\_')}`)
            .join('\n');
      }
      const chats = await prisma.telegramChat.findMany({
        where: { subscribed: true },
      });
      await Promise.all(
        chats.map(async (chat) => {
          try {
            await this.bot.telegram.sendMessage(chat.chatId, message, {
              parse_mode: 'Markdown',
              disable_web_page_preview: true,
            } as any);
          } catch (error) {
            this.debug.error(
              `Failed to send message to chat ${chat.chatId}:`,
              error as Error,
            );
            // Remove invalid chat IDs
            if ((error as any)?.response?.error_code === 403) {
              await prisma.telegramChat.delete({
                where: { chatId: chat.chatId },
              });
            }
          }
        }),
      );
      return true;
    } catch (error) {
      this.debug.error('Error broadcasting message:', error as Error);
      return false;
    }
  }
}

let maix: Maix | undefined;
export function getMaix() {
  if (!maix) {
    const { notiBotToken } = getSecrets();
    maix = new Maix(notiBotToken);
  }
  return maix;
}
