import * as dotenv from 'dotenv';
dotenv.config();

export interface Secrets {
  twitterApiKey: string;
  twitterApiSecret: string;
  twitterAccessToken: string;
  twitterAccessSecret: string;
  twitterBearerToken: string;
  anthropicApiKey: string;
  elevenLabsApiKey: string;
  openaiApiKey: string;
  awsRegion: string;
  awsBucketName: string;
  telegramBotToken: string;
  elfaApiKey: string;
  falApiKey: string;
  productionUrl: string;
  tavilyApiKey: string;
  bitqueryAccessToken: string;
  heliusApiKey: string;
  sniperooApiKey: string;
  adminPrivateKey: string;
  moralisApiKey: string;
  ethPrivateKey: string;
  alchemyApiKey: string;
  notiBotToken: string;
  qstashToken: string;
  upstashRedisUrl: string;
  upstashRedisToken: string;
  grokApiKey: string;
  pineconeApiKey: string;
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
      TWITTER_BEARER_TOKEN,
      ANTHROPIC_API_KEY,
      ELEVENLABS_API_KEY,
      OPENAI_API_KEY,
      AWS_REGION,
      AWS_BUCKET_NAME,
      TELEGRAM_BOT_TOKEN,
      ELFA_API_KEY,
      FAL_API_KEY,
      PRODUCTION_URL,
      TAVILY_API_KEY,
      BITQUERY_ACCESS_TOKEN,
      HELIUS_API_KEY,
      SNIPEROO_API_KEY,
      ADMIN_PRIVATE_KEY,
      MORALIS_API_KEY,
      ETH_PRIVATE_KEY,
      ALCHEMY_API_KEY,
      NOTI_BOT_TOKEN,
      QSTASH_TOKEN,
      UPSTASH_REDIS_URL,
      UPSTASH_REDIS_TOKEN,
      GROK_API_KEY,
      PINECONE_API_KEY,
    } = process.env;

    // Validate all required secrets are present
    const missingSecrets = [
      ['TWITTER_API_KEY', TWITTER_API_KEY],
      ['TWITTER_API_SECRET_KEY', TWITTER_API_SECRET_KEY],
      ['TWITTER_ACCESS_TOKEN', TWITTER_ACCESS_TOKEN],
      ['TWITTER_ACCESS_TOKEN_SECRET', TWITTER_ACCESS_TOKEN_SECRET],
      ['TWITTER_BEARER_TOKEN', TWITTER_BEARER_TOKEN],
      ['ANTHROPIC_API_KEY', ANTHROPIC_API_KEY],
      ['ELEVENLABS_API_KEY', ELEVENLABS_API_KEY],
      ['AWS_REGION', AWS_REGION],
      ['AWS_BUCKET_NAME', AWS_BUCKET_NAME],
      ['TELEGRAM_BOT_TOKEN', TELEGRAM_BOT_TOKEN],
      ['ELFA_API_KEY', ELFA_API_KEY],
      ['FAL_API_KEY', FAL_API_KEY],
      ['PRODUCTION_URL', PRODUCTION_URL],
      ['TAVILY_API_KEY', TAVILY_API_KEY],
      ['BITQUERY_ACCESS_TOKEN', BITQUERY_ACCESS_TOKEN],
      ['HELIUS_API_KEY', HELIUS_API_KEY],
      ['SNIPEROO_API_KEY', SNIPEROO_API_KEY],
      ['ADMIN_PRIVATE_KEY', ADMIN_PRIVATE_KEY],
      ['MORALIS_API_KEY', MORALIS_API_KEY],
      ['ETH_PRIVATE_KEY', ETH_PRIVATE_KEY],
      ['ALCHEMY_API_KEY', ALCHEMY_API_KEY],
      ['NOTI_BOT_TOKEN', NOTI_BOT_TOKEN],
      ['QSTASH_TOKEN', QSTASH_TOKEN],
      ['UPSTASH_REDIS_URL', UPSTASH_REDIS_URL],
      ['UPSTASH_REDIS_TOKEN', UPSTASH_REDIS_TOKEN],
      ['GROK_API_KEY', GROK_API_KEY],
      ['PINECONE_API_KEY', PINECONE_API_KEY],
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
      twitterBearerToken: TWITTER_BEARER_TOKEN!,
      anthropicApiKey: ANTHROPIC_API_KEY!,
      elevenLabsApiKey: ELEVENLABS_API_KEY!,
      openaiApiKey: OPENAI_API_KEY!,
      awsRegion: AWS_REGION!,
      awsBucketName: AWS_BUCKET_NAME!,
      telegramBotToken: TELEGRAM_BOT_TOKEN!,
      elfaApiKey: ELFA_API_KEY!,
      falApiKey: FAL_API_KEY!,
      productionUrl: PRODUCTION_URL!,
      tavilyApiKey: TAVILY_API_KEY!,
      bitqueryAccessToken: BITQUERY_ACCESS_TOKEN!,
      heliusApiKey: HELIUS_API_KEY!,
      sniperooApiKey: SNIPEROO_API_KEY!,
      adminPrivateKey: ADMIN_PRIVATE_KEY!,
      moralisApiKey: MORALIS_API_KEY!,
      ethPrivateKey: ETH_PRIVATE_KEY!,
      alchemyApiKey: ALCHEMY_API_KEY!,
      notiBotToken: NOTI_BOT_TOKEN!,
      qstashToken: QSTASH_TOKEN!,
      upstashRedisUrl: UPSTASH_REDIS_URL!,
      upstashRedisToken: UPSTASH_REDIS_TOKEN!,
      grokApiKey: GROK_API_KEY!,
      pineconeApiKey: PINECONE_API_KEY!,
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
