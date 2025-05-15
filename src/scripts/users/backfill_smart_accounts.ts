import { ElfaClient } from '@/utils/elfa';
import * as fs from 'fs/promises';
import path from 'path';
import { Debugger } from '@/utils/debugger';

const USERS_PATH = path.join(__dirname, 'users_from_lists.json');

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const debug = Debugger.getInstance();
  const elfa = new ElfaClient({ enabled: true, level: 'info' });

  // Load users
  debug.info(`Loading users from ${USERS_PATH}`);
  const usersRaw = await fs.readFile(USERS_PATH, 'utf-8');
  const users = JSON.parse(usersRaw);

  let updated = false;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (!user.username || user.smart_stats) continue;
    let attempt = 0;
    let success = false;
    let lastError = null;
    while (!success && attempt < 5) {
      try {
        debug.info(
          `Fetching smart stats for @${user.username} (${i + 1}/${users.length}), attempt ${attempt + 1}`,
        );
        const statsResp = await elfa.getAccountSmartStats(user.username);
        user.smart_stats = statsResp?.data ?? null;
        debug.info(`Fetched smart stats for @${user.username}`);
        updated = true;
        success = true;
        // Save after each successful update
        await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
        debug.info(`Saved updated users to ${USERS_PATH}`);
      } catch (err: any) {
        lastError = err;
        if (
          err?.response?.status === 429 ||
          (err?.message && err.message.includes('429'))
        ) {
          const waitTime = 60000 * Math.pow(2, attempt); // exponential backoff: 60s, 120s, 240s, ...
          debug.error(
            `ELFA API rate limited (429). Waiting ${waitTime / 1000}s before retrying...`,
          );
          await wait(waitTime);
          attempt++;
        } else {
          debug.error(
            `Failed to fetch smart stats for @${user.username}:`,
            err instanceof Error ? err.message : JSON.stringify(err),
          );
          user.smart_stats = null;
          success = true; // Don't retry for other errors
        }
      }
    }
    if (!success) {
      debug.error(
        `Giving up on @${user.username} after ${attempt} attempts. Last error:`,
        lastError instanceof Error
          ? lastError.message
          : JSON.stringify(lastError),
      );
    }
  }

  if (updated) {
    debug.info('All updates complete. Final save.');
    await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
  } else {
    debug.info('No updates were needed.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
