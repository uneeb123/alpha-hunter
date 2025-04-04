import * as dotenv from 'dotenv';
dotenv.config();

export interface Secrets {
  twitterApiKey: string;
  twitterApiSecret: string;
  twitterAccessToken: string;
  twitterAccessSecret: string;
  anthropicApiKey: string;
  elevenLabsApiKey: string;
  openaiApiKey: string;
  awsRegion: string;
  awsBucketName: string;
  telegramBotToken: string;
  elfaApiKey: string;
  falApiKey: string;
  vercelEnv: string;
}

class SecretsManager {
  private static instance: SecretsManager;
  private secrets: Secrets;

  private constructor() {
    const {
      TWITTER_API_KEY,
      TWITTER_API_SECRET_KEY,
      TWITTER_ACCESS_TOKEN,
      TWITTER_ACCESS_TOKEN_SECRET,
      ANTHROPIC_API_KEY,
      ELEVENLABS_API_KEY,
      OPENAI_API_KEY,
      AWS_REGION,
      AWS_BUCKET_NAME,
      TELEGRAM_BOT_TOKEN,
      ELFA_API_KEY,
      FAL_API_KEY,
      VERCEL_ENV,
    } = process.env;

    // Validate all required secrets are present
    const missingSecrets = [
      ['TWITTER_API_KEY', TWITTER_API_KEY],
      ['TWITTER_API_SECRET_KEY', TWITTER_API_SECRET_KEY],
      ['TWITTER_ACCESS_TOKEN', TWITTER_ACCESS_TOKEN],
      ['TWITTER_ACCESS_TOKEN_SECRET', TWITTER_ACCESS_TOKEN_SECRET],
      ['ANTHROPIC_API_KEY', ANTHROPIC_API_KEY],
      ['ELEVENLABS_API_KEY', ELEVENLABS_API_KEY],
      ['AWS_REGION', AWS_REGION],
      ['AWS_BUCKET_NAME', AWS_BUCKET_NAME],
      ['TELEGRAM_BOT_TOKEN', TELEGRAM_BOT_TOKEN],
      ['ELFA_API_KEY', ELFA_API_KEY],
      ['FAL_API_KEY', FAL_API_KEY],
      ['VERCEL_ENV', VERCEL_ENV],
      // OPENAI_API_KEY is optional, used for vector embeddings
    ].filter(([, value]) => !value);

    if (missingSecrets.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingSecrets
          .map(([key]) => key)
          .join(', ')}`,
      );
    }

    this.secrets = {
      twitterApiKey: TWITTER_API_KEY!,
      twitterApiSecret: TWITTER_API_SECRET_KEY!,
      twitterAccessToken: TWITTER_ACCESS_TOKEN!,
      twitterAccessSecret: TWITTER_ACCESS_TOKEN_SECRET!,
      anthropicApiKey: ANTHROPIC_API_KEY!,
      elevenLabsApiKey: ELEVENLABS_API_KEY!,
      openaiApiKey: OPENAI_API_KEY!,
      awsRegion: AWS_REGION!,
      awsBucketName: AWS_BUCKET_NAME!,
      telegramBotToken: TELEGRAM_BOT_TOKEN!,
      elfaApiKey: ELFA_API_KEY!,
      falApiKey: FAL_API_KEY!,
      vercelEnv: VERCEL_ENV!,
    };
  }

  public static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  public getSecrets(): Secrets {
    return this.secrets;
  }
}

export const getSecrets = (): Secrets =>
  SecretsManager.getInstance().getSecrets();
