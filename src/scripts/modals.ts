import 'dotenv/config';
import { getSecrets } from '../utils/secrets';
import OpenAI from 'openai';

async function listOpenAIModels() {
  try {
    // Get secrets from the SecretsManager
    const secrets = getSecrets();

    // Initialize the OpenAI client with the API key
    const openai = new OpenAI({
      apiKey: secrets.openaiApiKey,
    });

    // Call the API to list available models
    const response = await openai.models.list();

    // Sort models by creation date (newest first)
    const sortedModels = [...response.data].sort(
      (a, b) => b.created - a.created,
    );

    // Display the results
    console.log(
      'Available OpenAI Models (sorted by creation date, newest first):',
    );
    sortedModels.forEach((model) => {
      console.log(
        `- ${model.id} (Created: ${new Date(model.created * 1000).toLocaleDateString()})`,
      );
    });

    return sortedModels;
  } catch (error) {
    console.error('Error listing OpenAI models:', error);
    throw error;
  }
}

// Execute the function
listOpenAIModels()
  .then(() => console.log('Successfully retrieved models'))
  .catch((err) => console.error('Failed to retrieve models:', err));
