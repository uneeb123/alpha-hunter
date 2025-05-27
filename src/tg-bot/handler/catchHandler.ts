import { Telegraf } from 'telegraf';

interface CatchHandlerDeps {
  debug: any;
}

export function catchHandler(bot: Telegraf, dependencies: CatchHandlerDeps) {
  const { debug } = dependencies;
  bot.catch((err: unknown) => {
    debug.error('Maix error:', err as Error);
  });
}
