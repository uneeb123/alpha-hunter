/*
import * as dotenv from 'dotenv';
import { Command } from 'commander';
import { PrismaClient } from '@prisma/client';
import { Debugger, DebugConfig } from '@/utils/debugger';
import * as readline from 'readline';

dotenv.config();

const program = new Command();
const prisma = new PrismaClient();

program
  .option('-d, --debug [level]', 'Debug level (info or verbose)', 'info')
  .option('--users', 'Delete all users')
  .option('--scrapers', 'Delete all scrapers')
  .option('--all', 'Delete both users and scrapers')
  .parse(process.argv);

const options = program.opts();

const debugConfig: DebugConfig = {
  enabled: true,
  level: options.debug === 'verbose' ? 'verbose' : 'info',
};

const debug = Debugger.create(debugConfig);

const askConfirmation = async (question: string): Promise<boolean> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await new Promise<string>((resolve) => {
      rl.question(`${question} (y/n): `, resolve);
    });
    return answer.toLowerCase() === 'y';
  } finally {
    rl.close();
  }
};

const deleteScrapers = async (): Promise<void> => {
  debug.info('Deleting all scrapers...');

  // First delete all ScraperToUser records
  const deletedScraperToUser = await prisma.scraperToUser.deleteMany({});
  debug.info(`Deleted ${deletedScraperToUser.count} ScraperToUser records`);

  // Then delete all Scraper records
  // Need to handle the self-referential relationship
  // First, remove the references
  await prisma.scraper.updateMany({
    data: {
      previousId: null,
    },
  });

  // Then delete the records
  const deletedScrapers = await prisma.scraper.deleteMany({});
  debug.info(`Deleted ${deletedScrapers.count} Scraper records`);
};

const deleteUsers = async (): Promise<void> => {
  debug.info('Deleting all users...');

  // First delete all ScraperToUser records
  const deletedScraperToUser = await prisma.scraperToUser.deleteMany({});
  debug.info(`Deleted ${deletedScraperToUser.count} ScraperToUser records`);

  // Then delete all User records
  const deletedUsers = await prisma.user.deleteMany({});
  debug.info(`Deleted ${deletedUsers.count} User records`);
};

export const main = async (): Promise<void> => {
  debug.info('Starting deletion process');

  if (!options.users && !options.scrapers && !options.all) {
    debug.error(
      'No deletion option specified. Use --users, --scrapers, or --all',
    );
    return;
  }

  const deleteAll = options.all;
  const deleteUsersFlag = options.users || deleteAll;
  const deleteScrapersFlag = options.scrapers || deleteAll;

  let confirmationMessage = 'Are you sure you want to delete';
  if (deleteUsersFlag && deleteScrapersFlag) {
    confirmationMessage += ' ALL USERS AND SCRAPERS';
  } else if (deleteUsersFlag) {
    confirmationMessage += ' ALL USERS';
  } else if (deleteScrapersFlag) {
    confirmationMessage += ' ALL SCRAPERS';
  }
  confirmationMessage += '? This action cannot be undone!';

  const proceed = await askConfirmation(confirmationMessage);

  if (!proceed) {
    debug.info('Operation cancelled by user');
    await prisma.$disconnect();
    return;
  }

  // Double-check for safety
  const doubleCheck = await askConfirmation(
    'FINAL WARNING: Are you absolutely sure?',
  );

  if (!doubleCheck) {
    debug.info('Operation cancelled by user');
    await prisma.$disconnect();
    return;
  }

  try {
    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async () => {
      if (deleteScrapersFlag) {
        await deleteScrapers();
      }

      if (deleteUsersFlag) {
        await deleteUsers();
      }
    });

    debug.info('Deletion completed successfully');
  } catch (error) {
    debug.error(`Error during deletion: ${error}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error) => {
  console.error('Error running main:', error);
  process.exit(1);
});
*/
