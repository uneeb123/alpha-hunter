import { TweetsManager } from '@/workflow/extractor/tweets_manager';
import { generateSummary as generateSummaryVanilla } from '@/workflow/extractor/summary_client';
import { generateSummary as generateSummaryLangchain } from '@/workflow/extractor/summary_client_langchain';
import { generatePodcastScript as generatePodcastScriptVanilla } from '@/workflow/extractor/podcast_script_client';
import { generatePodcastScript as generatePodcastScriptLangchain } from '@/workflow/extractor/podcast_script_client_langchain';
import {
  generatePodcastAudio,
  generatePodcastVideo,
} from '@/workflow/extractor/podcast_client';
import { Debugger } from '@/utils/debugger';
import { getSecrets } from '@/utils/secrets';
import { PrismaClient } from '@prisma/client';
import { TweetsCompiler } from './tweets_compiler';
import { TelegramClient } from './telegram_client';
import { AgentFactory } from '@/utils/langchain_agent';
// import { generateAudio } from './voice_client';

export async function processWorkflow(
  alphaId: number,
  dryRun: boolean,
  hours: number,
  telegramEnabled: boolean = false,
  useLangchain: boolean = false,
): Promise<void> {
  const debug = Debugger.getInstance();
  const secrets = getSecrets();
  const prisma = new PrismaClient();

  const alpha = await prisma.alpha.findUnique({
    where: { id: alphaId },
    include: { users: true },
  });

  if (!alpha) {
    throw new Error(`Alpha with ID ${alphaId} not found`);
  }

  debug.info(`Found ${alpha.users.length} users for Alpha: ${alpha.name}`);

  const processor = await prisma.processor.create({
    data: {
      alphaId: alphaId,
    },
  });
  debug.info('Created processor record:', processor.id);

  // Get the cutoff time based on current time minus specified hours
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  const tweetsCompiler = new TweetsCompiler();
  const contents = await tweetsCompiler.getTweetContents(
    alpha,
    processor,
    cutoffTime,
  );

  const pastTopics = `- Kaito Launches Token on Base, InfoFi Era Begins Tomorrow
- Bybit's $1.4B Hack Triggers Industry-Wide Shift in Crisis Management
- Citadel Securities Makes Major Crypto Market Making Move, Targets Top Exchanges
- Stablecoin Wars Heat Up as Regulatory Battle Emerges Over Treasury Market Access`;

  // Use Langchain agents for content generation if enabled
  let summary;
  if (useLangchain) {
    // Optional: Add tweet analysis with Langchain
    if (useLangchain) {
      debug.info('Analyzing tweets with Langchain agent');
      const tweetAnalyzerAgent = AgentFactory.createTweetAnalyzerAgent(
        secrets.anthropicApiKey,
      );
      const tweetContents = contents.split('\n\n');
      const interests = ['AI', 'DeFi', 'NFT', 'Layer2', 'Regulation'];
      try {
        const analysisResults = await tweetAnalyzerAgent.analyzeTweets(
          tweetContents,
          interests,
        );
        debug.verbose(
          'Tweet analysis results:',
          JSON.stringify(analysisResults, null, 2),
        );
      } catch (error) {
        debug.error('Tweet analysis failed:', error as Error);
        // Continue execution even if analysis fails
      }
    }

    summary = await generateSummaryLangchain(
      secrets.anthropicApiKey,
      contents,
      alpha.name,
      pastTopics,
    );
    debug.info('Generated summary using Langchain');
  } else {
    summary = await generateSummaryVanilla(
      secrets.anthropicApiKey,
      contents,
      alpha.name,
      pastTopics,
    );
    debug.info('Generated summary using vanilla LLM');
  }
  debug.verbose(summary);

  await prisma.processor.update({
    where: { id: processor.id },
    data: { summary },
  });
  debug.info('Updated processor with summary');

  let script;
  if (useLangchain) {
    script = await generatePodcastScriptLangchain(
      secrets.anthropicApiKey,
      contents,
      summary,
      alpha.name,
      pastTopics,
    );
    debug.info('Generated podcast script using Langchain');
  } else {
    script = await generatePodcastScriptVanilla(
      secrets.anthropicApiKey,
      contents,
      summary,
      alpha.name,
      pastTopics,
    );
    debug.info('Generated podcast script using vanilla LLM');
  }
  debug.verbose(script);

  await prisma.processor.update({
    where: { id: processor.id },
    data: { generatedScript: script },
  });
  debug.info('Updated processor with generated script');

  const lines = await generatePodcastAudio(
    secrets.elevenLabsApiKey,
    script,
    processor.id,
  );
  debug.info('Generated podcast audio');
  debug.verbose(lines);

  await generatePodcastVideo(processor.id, lines);
  debug.info('Generated podcast video');

  if (!dryRun) {
    debug.info('Posting to Twitter');
    const tweetsManager = new TweetsManager(
      secrets.twitterApiKey,
      secrets.twitterApiSecret,
      secrets.twitterAccessToken,
      secrets.twitterAccessSecret,
    );
    await tweetsManager.postTweetWithMedia(processor.id, summary);
  } else {
    debug.info('Skipping Twitter post (dry run)');
  }

  // Post to Telegram if enabled
  if (telegramEnabled && !dryRun) {
    debug.info('Posting to Telegram');
    try {
      const telegramClient = new TelegramClient(secrets.telegramBotToken);
      await telegramClient.sendSummary(summary);
      debug.info('Successfully sent summary to Telegram');
    } catch (error) {
      debug.error('Failed to send summary to Telegram:', error as Error);
      // Continue execution - we don't want to fail the whole workflow if Telegram fails
    }
  } else if (telegramEnabled && dryRun) {
    debug.info('Skipping Telegram post (dry run)');
  } else {
    debug.info('Telegram posting not enabled');
  }
}
