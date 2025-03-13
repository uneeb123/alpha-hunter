/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from 'dotenv';
import { readFile, writeFile } from 'fs/promises';
import { getSecrets } from '@/utils/secrets';
import { ElevenLabsClient } from 'elevenlabs';

// Load environment variables
dotenv.config();

/**
 * Transcribes audio using Eleven Labs Speech-to-Text API
 */
async function transcribeAudio(
  apiKey: string,
  audioFilePath: string,
): Promise<string> {
  console.log(`Transcribing audio file: ${audioFilePath}`);
  const client = new ElevenLabsClient({
    apiKey: apiKey,
  });

  try {
    // Read the audio file as a Buffer
    const audioBuffer = await readFile(audioFilePath);

    // Create a Blob from the buffer
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

    const transcription = await client.speechToText.convert({
      file: audioBlob,
      model_id: 'scribe_v1', // Model to use, for now only "scribe_v1" is support.
      tag_audio_events: true, // Tag audio events like laughter, applause, etc.
      language_code: 'eng', // Language of the audio file. If set to null, the model will detect the language automatically.
      // diarize: true, // Whether to annotate who is speaking
    });

    if (transcription && transcription.text) {
      console.log('Transcription successful');
      console.log(transcription);
      return transcription.text;
    } else {
      throw new Error('No transcription text returned');
    }
  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    if (error.response && error.response.data) {
      console.error(
        'API error details:',
        JSON.stringify(error.response.data, null, 2),
      );
    }
    throw error;
  }
}

async function main() {
  try {
    // Get the audio file path from command line arguments or use a default
    const audioFilePath = process.argv[2] || 'data/68/audio.mp3';

    // Check if the file path is valid
    if (!audioFilePath) {
      console.error('Please provide an audio file path as an argument');
      process.exit(1);
    }

    // Get API key from environment variables
    const secrets = getSecrets();
    const apiKey = secrets.elevenLabsApiKey;

    // Transcribe the audio file
    console.log(`Starting transcription of file: ${audioFilePath}`);
    const transcription = await transcribeAudio(apiKey, audioFilePath);

    // Print the transcription
    console.log('\nTRANSCRIPTION RESULT:');
    console.log('-----------------------');
    console.log(transcription);
    console.log('-----------------------');

    // Save the transcription to a file
    const outputPath = `${audioFilePath}.transcription.txt`;
    await writeFile(outputPath, transcription);
    console.log(`Transcription saved to: ${outputPath}`);
  } catch (error: any) {
    console.error('Error in main function:', error);
    if (error.response && error.response.data) {
      console.error(
        'Error details:',
        JSON.stringify(error.response.data, null, 2),
      );
    }
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main().catch((error: any) => {
    console.error('Unhandled error:', error);
    if (error.response && error.response.data) {
      console.error(
        'Error details:',
        JSON.stringify(error.response.data, null, 2),
      );
    }
    process.exit(1);
  });
}
