import { Context } from 'telegraf';
import { Debugger } from '@/utils/debugger';
import { ChatAgent } from '@/workflow/chatbot/agent';

export class Chatter {
  private debug = Debugger.getInstance();
  private whitelistedChatIds = [-1002574505074, -1002494776074, -4656585527];
  private agent: ChatAgent;

  constructor() {
    this.agent = new ChatAgent();
  }

  async handleMessage(ctx: Context) {
    /*

    Context {
  update: {
    update_id: 182162242,
    message: {
      message_id: 2,
      from: {
        "id": 553387505,
        "is_bot": false,
        "first_name": "asdf",
        "username": "asdf0x",
        "language_code": "en",
        "is_premium": true
      },
      chat: {
        "id": -1002574505074,
        "title": "Max Test",
        "type": "supergroup"
      },
      date: 1743800065,
      text: 'test'
    }
  },
  telegram: Telegram {
    token: '7513311662:AAECyRVsJwK0MX4E8d7dNEpxssxwaTj2GZM',
    response: undefined,
    options: {
      apiRoot: 'https://api.telegram.org',
      apiMode: 'bot',
      webhookReply: true,
      agent: [Agent],
      attachmentAgent: undefined,
      testEnv: false
    }
  },
  botInfo: {
    id: 7513311662,
    is_bot: true,
    first_name: 'Max Profit',
    username: 'max_mrkt_bot',
    can_join_groups: true,
    can_read_all_group_messages: false,
    supports_inline_queries: false,
    can_connect_to_business: false,
    has_main_web_app: false
  },
  state: {}
}

    */

    try {
      // First check if this is in the whitelisted chats
      if (
        ctx.chat?.id &&
        !this.whitelistedChatIds.includes(ctx.chat.id) &&
        ctx.chat.type !== 'private'
      ) {
        return;
      }

      if (this.isBotMentioned(ctx)) {
        console.log('hell');
        if (
          ctx.message &&
          'text' in ctx.message &&
          ctx.message.text &&
          ctx.chat?.id
        ) {
          console.log('hellzxc');
          const response = await this.agent.generateReply(
            ctx.message.text,
            ctx.chat.id.toString(),
          );
          ctx.reply(response);
        }
      }
    } catch (error) {
      this.debug.error('Error handling message:', error as Error);
    }
  }

  // Helper to check if the bot is mentioned or replied to
  private isBotMentioned(ctx: Context): boolean {
    if (!ctx.message) return false;

    // Check for mention
    if ('text' in ctx.message && ctx.message.text && ctx.botInfo) {
      // Check for @mention
      if (ctx.message.text.includes(`@${ctx.botInfo.username}`)) {
        return true;
      }

      // Check for case-insensitive bot name in message
      // const botName = ctx.botInfo.first_name;
      const botName = 'Max';
      if (
        botName &&
        ctx.message.text.toLowerCase().includes(botName.toLowerCase())
      ) {
        return true;
      }
    }

    // Check if replying to the bot's message
    /*
    TODO: fix this
    if (
      ctx.message.reply_to_message &&
      ctx.message.reply_to_message.from?.id === ctx.botInfo?.id
    ) {
      return true;
    }
      */

    return false;
  }
}
