import { Pinecone } from '@pinecone-database/pinecone';
import { getSecrets } from '@/utils/secrets';

const secrets = getSecrets();

const PINECONE_API_KEY = secrets.pineconeApiKey;
const INDEX_NAME = 'tweets-embed';
const DIMENSION = 1536; // OpenAI text-embedding-3-small output dimension

async function main() {
  const pc = new Pinecone({
    apiKey: PINECONE_API_KEY,
  });

  // Check if index exists
  const existingIndexes = await pc.listIndexes();
  if (
    existingIndexes.indexes &&
    existingIndexes.indexes.some((idx) => idx.name === INDEX_NAME)
  ) {
    console.log(`Index '${INDEX_NAME}' already exists.`);
    return;
  }

  // Create index
  await pc.createIndex({
    name: INDEX_NAME,
    dimension: DIMENSION,
    metric: 'cosine',
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-east-1',
      },
    },
  });

  console.log(`Index '${INDEX_NAME}' created.`);
}

main().catch((err) => {
  console.error('Failed to initialize Pinecone index:', err);
  process.exit(1);
});
