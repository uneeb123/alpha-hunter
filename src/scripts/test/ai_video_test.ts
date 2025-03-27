import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { generate_ai_video } from '../../workflow/narrative/generate_ai_video';
import { Debugger, DebugConfig } from '@/utils/debugger';
import { TranscriptionResponse } from '../../workflow/extractor/podcast_audio';

// Load environment variables
dotenv.config();

/**
 * Test file for AI-based video generation with OpenAI images
 */
const debugConfig: DebugConfig = {
  enabled: true,
  level: 'verbose',
};
const debug = Debugger.create(debugConfig);

// Test function that uses existing test audio and transcription to create a video with AI-generated images
async function testAIVideoGeneration() {
  debug.info('Starting AI video generation test');

  // Use test directory
  const testDir = path.resolve('data/test');

  // Source and target files
  const audioPath = path.join(testDir, 'audio.mp3');
  const transcriptionPath = path.join(testDir, 'transcription.json');

  // Test processor ID - for generate_ai_video function
  const testProcessorId = 5678;

  try {
    // Check if source files exist
    if (!fs.existsSync(audioPath)) {
      debug.error(`Audio file not found: ${audioPath}`);
      return false;
    }

    if (!fs.existsSync(transcriptionPath)) {
      debug.error(`Transcription file not found: ${transcriptionPath}`);
      return false;
    }

    debug.info(`Using audio file: ${audioPath}`);

    // Read transcription data
    const transcriptionData = JSON.parse(
      fs.readFileSync(transcriptionPath, 'utf-8'),
    ) as TranscriptionResponse;
    debug.info(
      `Loaded transcription data with ${transcriptionData.words?.length} words`,
    );

    // Run the AI video generation
    debug.info('Starting AI-based video generation with OpenAI images');

    // Use custom paths to read from and write directly to test directory
    const outputVideoPath = path.join(testDir, 'podcast_ai.mp4');

    // Pass the audio path and output video path directly
    const result = await generate_ai_video(
      testProcessorId,
      transcriptionData,
      audioPath,
      outputVideoPath,
    );

    if (result) {
      debug.info(`Video generation successful: ${outputVideoPath}`);

      if (fs.existsSync(outputVideoPath)) {
        const stats = fs.statSync(outputVideoPath);
        debug.info(`Video file size: ${stats.size} bytes`);
      } else {
        debug.error('Video file not found after successful generation');
      }
    } else {
      debug.error('Video generation failed');

      if (fs.existsSync(outputVideoPath)) {
        debug.info(
          `But video file exists with size: ${fs.statSync(outputVideoPath).size} bytes`,
        );
      }
    }

    return result;
  } catch (error) {
    debug.error(`Test failed with error: ${error}`);
    return false;
  }
}

// Run the test
testAIVideoGeneration()
  .then((result) => {
    debug.info(`Test completed with result: ${result}`);
    process.exit(result ? 0 : 1);
  })
  .catch((error) => {
    debug.error(`Test failed with error: ${error}`);
    process.exit(1);
  });
