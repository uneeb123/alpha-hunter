/*
import * as dotenv from 'dotenv';
import { Command } from 'commander';
import { Debugger, DebugConfig } from '@/utils/debugger';
import { Extractor } from '@/workflow/extractor/extractor';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const program = new Command();

// TODO: add command to resume workflow
program
  .option('-a, --alpha <type>', 'Alpha (AI_AGENTS or KAITO)', 'AI_AGENTS')
  .option('-d, --debug [level]', 'Debug level (info or verbose)', 'info')
  .option('--dry-run', 'Run without posting', false)
  .option('--telegram', 'Post summary to Telegram', false)
  .option('--podcast', 'Generate podcast audio and video', false)
  .parse(process.argv);

const options = program.opts();

const debugConfig: DebugConfig = {
  enabled: true,
  level: options.debug === 'verbose' ? 'verbose' : 'info',
};

const debug = Debugger.create(debugConfig);

export const main = async (): Promise<void> => {
  debug.info(`Dry run: ${options.dryRun}`);
  debug.info(`Debug level: ${options.debug}`);
  debug.info(`Alpha: ${options.alpha}`);
  debug.info(`Post to Telegram: ${options.telegram}`);
  debug.info(`Generate podcast: ${options.podcast}`);

  try {
    const prisma = new PrismaClient();
    const alphaRecord = await prisma.alpha.findFirst({
      where: {
        name: {
          contains: options.alpha,
          mode: 'insensitive',
        },
      },
    });

    if (!alphaRecord) {
      throw new Error(`No alpha found matching ${options.alpha} in database`);
    }

    const extractor = new Extractor();
    await extractor.init(alphaRecord.id);
    // setting it to one day
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await extractor.run(
      options.dryRun,
      cutoffTime,
      options.telegram,
      options.podcast,
    );
    await prisma.$disconnect();
  } catch (error) {
    debug.error(`Failed to complete workflow: ${error}`);
    // no need to throw here
  }
};

process.on('SIGINT', () => {
  debug.error('Received SIGINT signal (Ctrl+C). Shutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Error running main:', error);
  process.exit(1);
});
*/
