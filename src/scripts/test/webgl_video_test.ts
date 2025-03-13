import fs from 'fs';
import path from 'path';
import { generatePodcastVideo } from '../../workflow/extractor/podcast_video';
import { Debugger } from '@/utils/debugger';
import { TranscriptionResponse } from '../../workflow/extractor/podcast_audio';

/**
 * Test file for WebGL-based video generation
 */
const debug = Debugger.getInstance();

// Test function that uses existing test audio and transcription to create a video
async function testWebGLVideoGeneration() {
  debug.info('Starting WebGL video generation test');
  
  // Use test directory
  const testDir = path.resolve('data/test');
  
  // Source and target files
  const audioPath = path.join(testDir, 'audio.mp3');
  const transcriptionPath = path.join(testDir, 'transcription.json');
  
  // Test processor ID - for generatePodcastVideo function
  const testProcessorId = 1234;
  
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
    const transcriptionData = JSON.parse(fs.readFileSync(transcriptionPath, 'utf-8')) as TranscriptionResponse;
    debug.info(`Loaded transcription data with ${transcriptionData.words?.length} words`);
    
    // Run the video generation
    debug.info('Starting podcast video generation with WebGL');
    
    // Use custom paths to read from and write directly to test directory
    const outputVideoPath = path.join(testDir, 'podcast_webgl.mp4');
    
    // Pass the audio path and output video path directly
    const result = await generatePodcastVideo(
      testProcessorId, 
      transcriptionData,
      audioPath,
      outputVideoPath
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
        debug.info(`But video file exists with size: ${fs.statSync(outputVideoPath).size} bytes`);
      }
    }
    
    return result;
  } catch (error) {
    debug.error(`Test failed with error: ${error}`);
    return false;
  }
}

// Run the test
testWebGLVideoGeneration()
  .then((result) => {
    debug.info(`Test completed with result: ${result}`);
    process.exit(result ? 0 : 1);
  })
  .catch((error) => {
    debug.error(`Test failed with error: ${error}`);
    process.exit(1);
  });