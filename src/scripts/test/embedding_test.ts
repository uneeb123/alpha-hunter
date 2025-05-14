import { getSecrets } from '../../utils/secrets';
import OpenAI from 'openai';

async function main() {
  const { openaiApiKey } = getSecrets();
  const openai = new OpenAI({ apiKey: openaiApiKey });
  const testString = 'This is a test string for embedding.';

  try {
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: testString,
    });
    // console.log('Embedding result:', JSON.stringify(embedding, null, 2));
    console.log(embedding.data[0].embedding.length);
  } catch (err: any) {
    console.error('OpenAI API error:', err.message || err);
    process.exit(1);
  }
}

main();
