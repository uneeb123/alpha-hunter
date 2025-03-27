import { TweetInsight } from './tweet_insight_extractor';
import { Debugger } from '@/utils/debugger';
import { TweetsManager } from '@/workflow/extractor/tweets_manager';
import { Secrets } from '@/utils/secrets';
import {
  generatePodcastAudio,
  generatePodcastVideo as generateAudioVisualization,
  TranscriptionResponse,
} from '@/workflow/extractor/podcast_client';
import { generatePodcastScript } from '@/workflow/extractor/podcast_script_client';
import { generate_ai_video } from './generate_ai_video';

export class PodcastCreator {
  constructor(
    private secrets: Secrets,
    private debug: Debugger,
    private processorId: number,
    private shouldPost: boolean = true,
    private generatePictures: boolean = true,
  ) {}

  public async createPodcast(insight: TweetInsight): Promise<void> {
    try {
      this.debug.info('Generating podcast script...');

      // Use insight.analysis for tweets content
      const tweetsContent = insight.analysis;

      // Use insight.headline for relevant topics
      const relevantTopics = insight.headline;

      // Generate the podcast script
      const script = await generatePodcastScript(
        tweetsContent,
        relevantTopics,
        true,
      );

      this.debug.info('Generated podcast script');
      this.debug.verbose(script);

      // Generate podcast audio
      const transcription = await generatePodcastAudio(
        this.secrets.elevenLabsApiKey,
        script,
        this.processorId,
      );
      this.debug.info('Generated podcast audio');

      // Generate podcast video
      if (this.generatePictures) {
        await this.generatePictureVisualization(
          this.processorId,
          transcription,
        );
      } else {
        await generateAudioVisualization(this.processorId, transcription);
      }
      this.debug.info('Generated podcast video');

      // Post to Twitter if not a dry run
      if (this.shouldPost) {
        await this.postToTwitter(insight.headline, insight.mentionUsers);
      } else {
        this.debug.info('Skipping Twitter post (dry run)');
      }

      this.debug.info('Podcast creation and posting completed');
    } catch (error) {
      this.debug.error(`Failed to create podcast: ${error}`);
      // Don't throw the error to allow the rest of the process to continue
    }
  }

  private async postToTwitter(
    headline: string,
    sources: string[],
  ): Promise<void> {
    try {
      const tweetsManager = new TweetsManager(
        this.secrets.twitterApiKey,
        this.secrets.twitterApiSecret,
        this.secrets.twitterAccessToken,
        this.secrets.twitterAccessSecret,
      );

      const response = await tweetsManager.postTweetWithMedia(
        this.processorId,
        headline,
      );
      console.log(response.data.id);

      const uniqueSources = [...new Set(sources)];
      // Filter out sources that are just numbers
      const validSources = uniqueSources.filter(
        (source) => !/^\d+$/.test(source),
      );

      if (validSources.length > 0) {
        await tweetsManager.replyToTweet(
          response.data.id,
          `Sources: ${validSources.map((source) => `@${source}`).join(' ')}`,
        );
      } else {
        this.debug.info('No valid sources to mention, skipping reply tweet');
      }
      this.debug.info('Posted tweet with podcast media');
    } catch (error) {
      this.debug.error(`Failed to post to Twitter: ${error}`);
    }
  }

  async generatePictureVisualization(
    processorId: number,
    transcription: TranscriptionResponse,
  ): Promise<boolean> {
    try {
      this.debug.info('Generating AI-based video with Imagen');

      // Call the AI video generation function
      const result = await generate_ai_video(processorId, transcription);

      if (result) {
        this.debug.info('Successfully generated AI video with images');
      } else {
        this.debug.error('Failed to generate AI video with images');
      }

      return result;
    } catch (error) {
      this.debug.error(`Failed to generate AI video: ${error}`);
      return false;
    }
  }
}
