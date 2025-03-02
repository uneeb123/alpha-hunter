import * as dotenv from 'dotenv';
import { TelegramClient } from '@/workflow/extractor/telegram_client';
import { Debugger, DebugConfig } from '@/utils/debugger';
import { getSecrets } from '@/utils/secrets';

// Load environment variables
dotenv.config();

const debugConfig: DebugConfig = {
  enabled: true,
  level: 'info',
};

const debug = Debugger.create(debugConfig);

const main = async (): Promise<void> => {
  try {
    debug.info('Starting Telegram test');
    
    // Get secrets
    const secrets = getSecrets();
    
    // Create telegram client
    const telegramClient = new TelegramClient(secrets.telegramBotToken);
    
    // Send test message
    const testMessage = 'Hello World from Alpha Hunter! 🚀';
    debug.info(`Sending test message: "${testMessage}"`);
    
    await telegramClient.sendSummary(testMessage);
    
    debug.info('Test message sent successfully');
  } catch (error) {
    debug.error('Error sending test message:', error);
    process.exit(1);
  }
};

// Run the main function
main().catch((error) => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});