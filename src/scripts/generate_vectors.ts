import * as dotenv from 'dotenv';
import { Command } from 'commander';
import { Debugger, DebugConfig } from '@/utils/debugger';
import { PrismaClient } from '@prisma/client';
import { VectorStore } from '@/utils/vector_store';
import { getSecrets } from '@/utils/secrets';

dotenv.config();

const program = new Command();

program
  .option('-d, --debug [level]', 'Debug level (info or verbose)', 'info')
  .parse(process.argv);

const options = program.opts();

const debugConfig: DebugConfig = {
  enabled: true,
  level: options.debug === 'verbose' ? 'verbose' : 'info',
};

const debug = Debugger.create(debugConfig);

export const main = async (): Promise<void> => {
  debug.info(`Debug level: ${options.debug}`);
  debug.info('Generating vectors from existing summaries...');

  try {
    const secrets = getSecrets();
    
    // Check if OpenAI API key is available
    if (!secrets.openaiApiKey) {
      debug.error('OpenAI API key is required for generating vectors');
      process.exit(1);
    }
    
    const prisma = new PrismaClient();
    const vectorStore = VectorStore.getInstance(secrets.openaiApiKey);
    
    // Get all processors with summaries
    const processors = await prisma.processor.findMany({
      where: {
        summary: {
          not: null,
        },
      },
      include: {
        alpha: true,
      },
    });
    
    debug.info(`Found ${processors.length} summaries to process`);
    
    // Process each summary and add to vector store
    for (const processor of processors) {
      if (!processor.summary) continue;
      
      try {
        await vectorStore.addSummary(
          processor.summary,
          processor.alphaId,
          processor.id.toString(),
          processor.createdAt
        );
        
        debug.info(`Added summary from processor ${processor.id} to vector store`);
      } catch (error) {
        debug.error(`Failed to add summary from processor ${processor.id} to vector store:`, error as Error);
      }
    }
    
    debug.info('Finished generating vectors from existing summaries');
    await prisma.$disconnect();
  } catch (error) {
    debug.error(`Failed to generate vectors: ${error}`);
    throw error;
  }
};

main().catch((error) => {
  console.error('Error running main:', error);
  process.exit(1);
});