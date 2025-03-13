import { readFile } from 'fs/promises';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { Debugger } from '@/utils/debugger';
import { TranscriptionResponse } from './podcast_audio';
import puppeteer from 'puppeteer';

/*
Integration with FFmpeg for podcast video generation and styled captions
*/

/**
 * Generates podcast video from audio with styled captions using WebGL
 */
export const generatePodcastVideo = async (
  processorId: number,
  transcription: TranscriptionResponse,
  customAudioPath?: string,
  customOutputPath?: string,
): Promise<boolean> => {
  const outputDir = path.join('data', processorId.toString());

  // Use custom paths if provided, otherwise use default paths
  const audioPath = customAudioPath || path.join(outputDir, 'audio.mp3');
  const outputVideoPath =
    customOutputPath || path.join(outputDir, 'podcast.mp4');

  const debug = Debugger.getInstance();

  try {
    debug.info('Generating podcast video with WebGL in headless browser');
    debug.info(`Using audio file: ${audioPath}`);
    debug.info(`Output video will be saved to: ${outputVideoPath}`);

    return await generateVideoWithWebGL(
      processorId,
      audioPath,
      transcription,
      outputVideoPath,
    );
  } catch (error) {
    debug.error(`Failed to generate podcast video: ${error}`);
    return false;
  }
};

/**
 * Generate a video using WebGL in a headless browser
 */
const generateVideoWithWebGL = async (
  processorId: number,
  audioPath: string,
  transcription: TranscriptionResponse,
  outputPath: string,
): Promise<boolean> => {
  const debug = Debugger.getInstance();

  // Make sure output directory exists (for the final video file)
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Use absolute paths for better reliability
  const absAudioPath = path.resolve(audioPath);
  const absOutputPath = path.resolve(outputPath);

  debug.info(`Using absolute audio path: ${absAudioPath}`);
  debug.info(`Using absolute output path: ${absOutputPath}`);

  // Use a consistent webgl directory instead of processor ID
  const tempDir = path.join('data', 'webgl', 'temp');
  const videoFramesDir = path.join(tempDir, 'frames');

  // Create temp directories if they don't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  if (!fs.existsSync(videoFramesDir)) {
    fs.mkdirSync(videoFramesDir, { recursive: true });
  }

  // Verify audio file exists
  if (!fs.existsSync(absAudioPath)) {
    debug.error(`Audio file not found at: ${absAudioPath}`);
    return false;
  }

  try {
    // Launch browser with WebGL support
    debug.info('Launching headless browser for WebGL video generation');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--ignore-gpu-blocklist',
        '--enable-gpu-rasterization',
        '--enable-webgl',
        '--use-gl=angle',
        '--use-angle=metal',
      ],
    });

    // Create a new page
    const page = await browser.newPage();

    // Set viewport size
    await page.setViewport({ width: 720, height: 1280 });

    // Create subtitles in a format suitable for browser rendering
    const subtitles = convertTranscriptionToWebSubtitles(transcription);

    // Read audio file as base64 to embed in the page
    const audioBase64 = await readFile(absAudioPath, { encoding: 'base64' });

    // Read the HTML template file
    const templatePath = path.join(__dirname, 'webgl_video_template.html');
    const htmlTemplate = await readFile(templatePath, 'utf-8');

    // Replace template variables with actual values
    const htmlContent = htmlTemplate
      .replace('{{AUDIO_BASE64}}', audioBase64)
      .replace('{{SUBTITLES_JSON}}', JSON.stringify(subtitles));

    // Load HTML content
    await page.setContent(htmlContent);

    // Check if WebGL is available
    const webGLAvailable = await page.evaluate(() => {
      try {
        const canvas = document.createElement('canvas');
        const gl =
          canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
      } catch (e) {
        return false;
      }
    });

    debug.info(`WebGL available: ${webGLAvailable}`);

    if (!webGLAvailable) {
      debug.error('WebGL is not available in the headless browser');
      await browser.close();
      return false;
    }

    // Set up frame capturing
    let frameIndex = 0;
    let isComplete = false;
    
    // Expose functions to the page
    await page.exposeFunction(
      'captureFrame',
      async (frameNum, currentTime, duration) => {
        // Capture every 3rd frame (10fps) to reduce CPU usage
        if (frameNum % 3 === 0) {
          const framePath = path.join(
            videoFramesDir,
            `frame_${String(frameIndex).padStart(6, '0')}.png`,
          );
          await page.screenshot({ path: framePath, type: 'png' });
          frameIndex++;

          // Log progress every 30 frames
          if (frameIndex % 30 === 0) {
            const progress = Math.floor((currentTime / duration) * 100);
            debug.info(`WebGL rendering progress: ${progress}%`);
          }
        }
      },
    );

    await page.exposeFunction('animationComplete', async () => {
      isComplete = true;
    });

    // Wait for animation to complete
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const checkComplete = setInterval(() => {
          if (document.getElementById('audio').ended) {
            clearInterval(checkComplete);
            resolve();
          }
        }, 1000);
      });
    });

    // Close browser
    await browser.close();

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(framesPattern)
        .inputFPS(10)
        .input(absAudioPath)
        .outputOptions([
          '-c:v',
          'libx264',
          '-c:a',
          'aac',
          '-pix_fmt',
          'yuv420p',
          '-shortest',
        ])
        .output(absOutputPath)
        .on('start', (commandLine) => {
          debug.info(`FFmpeg command: ${commandLine}`);
        })
        .on('progress', (progress) => {
          debug.info(`FFmpeg progress: ${JSON.stringify(progress)}`);
        })
        .on('end', () => {
          debug.info(`WebGL video generated successfully: ${absOutputPath}`);
          debug.info(
            `Checking if file exists: ${fs.existsSync(absOutputPath)}`,
          );

          // Clean up temp files
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch (err) {
            debug.error(`Error cleaning up temp files: ${err}`);
          }

          resolve(true);
        })
        .on('error', (err) => {
          debug.error(`Error creating WebGL video: ${err.message}`);
          debug.error(`Command: ${err.method} ${err.path}`);
          debug.error(`Exit code: ${err.exitCode}`);
          reject(false);
        })
        .run();
    });
  } catch (err) {
    debug.error(`WebGL video generation failed: ${err}`);
    return false;
  }
};

/**
 * Convert transcription to a format suitable for web rendering
 */
const convertTranscriptionToWebSubtitles = (
  transcription: TranscriptionResponse,
): Array<{ start: number; end: number; text: string }> => {
  const { words } = transcription;
  const subtitles: Array<{ start: number; end: number; text: string }> = [];
  let currentSubtitle = '';
  let lineStartTime = 0;
  let lineEndTime = 0;
  const maxLineLength = 40;

  for (let i = 0; i < words!.length; i++) {
    const word = words![i];

    // Skip spacing type
    if (word.type === 'spacing') continue;

    // If this is the first word in the line, set the start time
    if (currentSubtitle === '') {
      lineStartTime = word.start;
    }

    // Add word to current line
    currentSubtitle += (currentSubtitle ? ' ' : '') + word.text;
    lineEndTime = word.end;

    // If line is long enough or it's the last word, create a subtitle entry
    if (
      currentSubtitle.length >= maxLineLength ||
      i === words!.length - 1 ||
      (i < words!.length - 2 && words![i + 1].start - word.end > 1.0)
    ) {
      // Add subtitle entry
      subtitles.push({
        start: lineStartTime,
        end: lineEndTime,
        text: currentSubtitle,
      });

      currentSubtitle = '';
    }
  }

  return subtitles;
};
