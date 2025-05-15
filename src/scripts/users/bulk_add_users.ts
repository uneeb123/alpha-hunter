/*
import * as dotenv from 'dotenv';
import { Command } from 'commander';
import { PrismaClient } from '@prisma/client';
import { Debugger, DebugConfig } from '@/utils/debugger';
import * as readline from 'readline';
import * as fs from 'fs/promises';
import { TwitterApi } from 'twitter-api-v2';
import { getSecrets } from '@/utils/secrets';

dotenv.config();

const program = new Command();
const prisma = new PrismaClient();

program
  .option('-d, --debug [level]', 'Debug level (info or verbose)', 'info')
  .parse(process.argv);

const options = program.opts();

const debugConfig: DebugConfig = {
  enabled: true,
  level: options.debug === 'verbose' ? 'verbose' : 'info',
};

const debug = Debugger.create(debugConfig);

const secrets = getSecrets();
const client = new TwitterApi({
  appKey: secrets.twitterApiKey,
  appSecret: secrets.twitterApiSecret,
  accessToken: secrets.twitterAccessToken,
  accessSecret: secrets.twitterAccessSecret,
});

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

export const main = async (): Promise<void> => {
  debug.info('Starting bulk user addition');

  const proceed = await askConfirmation(
    'Do you want to proceed with bulk user addition?',
  );

  if (!proceed) {
    debug.info('Operation cancelled by user');
    await prisma.$disconnect();
    return;
  }

  try {
    // Read users.json
    const usersData = JSON.parse(
      await fs.readFile('src/scripts/users.json', 'utf-8'),
    );

    // Process each alpha and its users
    for (const [alphaName, twitterUsers] of Object.entries(usersData)) {
      debug.info(`Processing alpha: ${alphaName}`);

      // Create or find alpha
      const alpha = await prisma.alpha.upsert({
        where: { name: alphaName },
        create: { name: alphaName },
        update: {},
      });

      // Process each user
      for (const twitterUsername of twitterUsers as string[]) {
        debug.info(`Processing user: ${twitterUsername}`);

        try {
          // Check if user already exists in database
          const existingUser = await prisma.user.findFirst({
            where: {
              twitterUser: twitterUsername,
            },
          });

          let twitterUser;
          if (existingUser) {
            debug.info(
              `User ${twitterUsername} already exists in database, skipping Twitter API call`,
            );
            twitterUser = {
              data: {
                id: existingUser.twitterId,
                name: existingUser.twitterName,
                username: existingUser.twitterUser,
              },
            };
          } else {
            // Fetch user info from Twitter only if not in database
            twitterUser = await client.v2.userByUsername(twitterUsername);
          }

          if (!twitterUser.data) {
            debug.error(`Twitter user not found: ${twitterUsername}`);
            continue;
          }

          // Create or update user and connect to alpha
          const user = await prisma.user.upsert({
            where: { twitterId: twitterUser.data.id },
            create: {
              twitterId: twitterUser.data.id,
              twitterName: twitterUser.data.name,
              twitterUser: twitterUser.data.username,
              alphas: {
                connect: { id: alpha.id },
              },
            },
            update: {
              twitterName: twitterUser.data.name,
              twitterUser: twitterUser.data.username,
              alphas: {
                connect: { id: alpha.id },
              },
            },
          });

          debug.verbose(
            `Successfully processed user: ${JSON.stringify(user, null, 2)}`,
          );
        } catch (error) {
          debug.error(`Error processing user ${twitterUsername}: ${error}`);
        }
      }

      debug.info(`Successfully processed alpha: ${alphaName}`);
    }
  } catch (error) {
    debug.error(`Failed to process users: ${error}`);
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
