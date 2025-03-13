import { TweetsManager } from '@/workflow/extractor/tweets_manager';
import { generatePodcastScript } from '@/workflow/extractor/podcast_script_client';
// import { generatePodcastScript as generatePodcastScriptLangchain } from '@/workflow/extractor/podcast_script_client_langchain';
import {
  generatePodcastAudio,
  generatePodcastVideo,
} from '@/workflow/extractor/podcast_client';
import { Debugger } from '@/utils/debugger';
import { getSecrets } from '@/utils/secrets';
import { PrismaClient, Alpha, Processor, User } from '@prisma/client';
import { TweetsCompiler } from './tweets_compiler';
import { TelegramClient } from './telegram_client';
// import { AgentFactory } from '@/utils/langchain_agent';
// import { generateAudio } from './voice_client';
import { NewsAgent } from '@/workflow/extractor/news_agent';

export class Extractor {
  private debug = Debugger.getInstance();
  private secrets = getSecrets();
  private prisma = new PrismaClient();
  private alpha!: Alpha & { users: User[] };
  private processor!: Processor;

  public async init(alphaId: number): Promise<void> {
    this.alpha = await this.fetchAlpha(alphaId);
    this.processor = await this.createProcessor(alphaId);
  }

  public async run(
    dryRun: boolean,
    cutoffTime: Date,
    telegramEnabled: boolean = false,
    generatePodcast: boolean = false,
  ): Promise<void> {
    // Ensure alpha and processor are initialized
    if (!this.alpha || !this.processor) {
      throw new Error(
        'Alpha or processor not initialized. Make sure to await init() completion.',
      );
    }
    const contents = await this.fetchTweetContents(cutoffTime);

    const summary = await this.generateAndStoreSummary(contents);

    if (generatePodcast) {
      await this.createPodcast(contents, summary);
    }

    await this.handleSocialMediaPosting(
      summary,
      dryRun,
      telegramEnabled,
      generatePodcast,
    );
  }

  private async fetchAlpha(alphaId: number) {
    const alpha = await this.prisma.alpha.findUnique({
      where: { id: alphaId },
      include: { users: true },
    });

    if (!alpha) {
      throw new Error(`Alpha with ID ${alphaId} not found`);
    }

    this.debug.info(
      `Found ${alpha.users.length} users for Alpha: ${alpha.name}`,
    );
    return alpha;
  }

  private async createProcessor(alphaId: number) {
    const processor = await this.prisma.processor.create({
      data: {
        alphaId: alphaId,
      },
    });
    this.debug.info('Created processor record:', processor.id);
    return processor;
  }

  private async fetchTweetContents(cutoffTime: Date) {
    const tweetsCompiler = new TweetsCompiler();
    const contents = await tweetsCompiler.getTweetContents(
      this.alpha,
      this.processor,
      cutoffTime,
    );
    return contents;
  }

  private async generateAndStoreSummary(tweets: string) {
    const newsAgent = new NewsAgent(this.secrets.anthropicApiKey);
    await newsAgent.init();
    let topic = ``;
    const alpha = this.alpha.name;
    if (alpha === 'AI_AGENTS') {
      topic += `AI Agents`;
    } else if (alpha === 'KAITO') {
      topic += `Kaito ecosystem.`;
    } else if (alpha === 'GENERAL') {
      topic += `Crypto`;
    }
    const news = await newsAgent.extractNewsFromTweets(tweets, topic);
    this.debug.info('Generated news using Langchain with vector store');
    this.debug.verbose(news);

    // Sort news items by views in descending order
    const sortedNews = [...news].sort(
      (a, b) => (b.views || 0) - (a.views || 0),
    );
    const summary = sortedNews.map((item) => `- ${item.headline}`).join('\n\n');

    await this.prisma.processor.update({
      where: { id: this.processor.id },
      data: { summary },
    });
    this.debug.info('Updated processor with summary');

    return summary;
  }

  private async createPodcast(contents: string, summary: string) {
    const script = await generatePodcastScript(
      this.secrets.anthropicApiKey,
      contents,
      summary,
    );
    this.debug.info('Generated podcast script using vanilla LLM');
    this.debug.verbose(script);

    await this.prisma.processor.update({
      where: { id: this.processor.id },
      data: { generatedScript: script },
    });
    this.debug.info('Updated processor with generated script');

    const transcription = await generatePodcastAudio(
      this.secrets.elevenLabsApiKey,
      script,
      this.processor.id,
    );
    this.debug.info('Generated podcast audio');

    await generatePodcastVideo(this.processor.id, transcription);
    this.debug.info('Generated podcast video');
  }

  private async postToTwitter(summary: string, withMedia: boolean) {
    const tweetsManager = new TweetsManager(
      this.secrets.twitterApiKey,
      this.secrets.twitterApiSecret,
      this.secrets.twitterAccessToken,
      this.secrets.twitterAccessSecret,
    );

    if (withMedia) {
      // Post with media if podcast was generated
      await tweetsManager.postTweetWithMedia(this.processor.id, '');
      this.debug.info('Posted tweet with podcast media');
    } else {
      // Post text-only tweet if no podcast
      await tweetsManager.postTweet(summary);
      this.debug.info('Posted text-only tweet');
    }
  }

  private async postToTelegram(summary: string) {
    try {
      const telegramClient = new TelegramClient(this.secrets.telegramBotToken);
      await telegramClient.sendSummary(summary);
      this.debug.info('Successfully sent summary to Telegram');
    } catch (error) {
      this.debug.error('Failed to send summary to Telegram:', error as Error);
      // Continue execution - we don't want to fail the whole workflow if Telegram fails
    }
  }

  private async handleSocialMediaPosting(
    summary: string,
    dryRun: boolean,
    telegramEnabled: boolean,
    podcastGenerated: boolean,
  ) {
    if (!dryRun) {
      this.debug.info('Posting to Twitter');
      await this.postToTwitter(summary, podcastGenerated);
    } else {
      this.debug.info('Skipping Twitter post (dry run)');
      this.debug.info('Summary that would be posted:');
      console.log(summary);
    }

    // Post to Telegram if enabled
    if (telegramEnabled && !dryRun) {
      this.debug.info('Posting to Telegram');
      await this.postToTelegram(summary);
    } else if (telegramEnabled && dryRun) {
      this.debug.info('Skipping Telegram post (dry run)');
    } else {
      this.debug.info('Telegram posting not enabled');
    }
  }
}
