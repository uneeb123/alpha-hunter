/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';
import ffmpeg from 'fluent-ffmpeg';

// Define interfaces for type safety
interface VideoOptions {
  headless?: boolean;
  width?: number;
  height?: number;
  duration?: number | null;
  outputPath?: string;
}

interface VideoConfig extends Required<Omit<VideoOptions, 'duration'>> {
  duration: number | null;
}

/**
 * Generate a visualization video from an audio file
 * @param {string} audioPath - Path to the audio file
 * @param {VideoOptions} options - Configuration options
 * @returns {Promise<string>} - Path to the generated video
 */
async function generateVideo(
  audioPath: string,
  options: VideoOptions = {},
): Promise<string> {
  if (!fs.existsSync(audioPath)) {
    throw new Error(`Audio file not found: ${audioPath}`);
  }

  // Default options with sensible defaults
  const config: VideoConfig = {
    headless: options.headless !== false, // Default to headless unless explicitly set to false
    width: options.width || 720,
    height: options.height || 1280,
    duration: options.duration || null,
    outputPath: options.outputPath || './audio-visualizer.mp4',
  };

  console.log('🎬 Generating audio visualization video...');

  // Prepare directories
  const tempDir = path.join(__dirname, 'temp_web');
  const framesDir = path.join(__dirname, 'temp_frames');

  // Create temp directory if needed
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Create frames directory if needed
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  // Copy audio file to temp directory
  const audioFileName = path.basename(audioPath);
  const tempAudioPath = path.join(tempDir, audioFileName);
  fs.copyFileSync(audioPath, tempAudioPath);

  // Prepare the HTML template
  const templatePath = path.join(__dirname, 'video-template.html');
  let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
  htmlTemplate = htmlTemplate.replace('{{AUDIO_PATH}}', `./${audioFileName}`);

  // Write processed template to temp directory
  const tempHtmlPath = path.join(tempDir, 'index.html');
  fs.writeFileSync(tempHtmlPath, htmlTemplate);

  // Launch browser
  console.log(
    config.headless
      ? '🌐 Launching headless browser...'
      : '🌐 Launching browser in visible mode for debugging...',
  );

  const browser = await puppeteer.launch({
    headless: config.headless ? true : false,
    defaultViewport: null, // Let the browser window size be the viewport in non-headless mode
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--use-gl=angle',
      '--ignore-gpu-blocklist',
      '--enable-gpu-rasterization',
      '--enable-webgl',
      '--disable-gpu-sandbox',
      '--disable-features=IsolateOrigins,site-per-process',
      `--window-size=${config.width},${config.height}`,
    ],
  });

  try {
    // Create a new page and navigate to template
    const page = await browser.newPage();
    await page.setViewport({
      width: config.width,
      height: config.height,
      deviceScaleFactor: 1,
    });

    // Log browser console messages (filter out common WebGL errors in headless mode)
    page.on('console', (msg) => {
      const text = msg.text();
      console.log(`🌐 Browser: ${text}`);
    });

    page.on('pageerror', (err) => {
      const message = err.message;
      console.error(`🌐 Browser error: ${message}`);
    });

    // Navigate to the template
    await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });

    // Just log a message in non-headless mode
    if (!config.headless) {
      console.log('\n👀 Browser is visible for monitoring');
      console.log('✨ The visualization is running in the browser window');
    }

    // Get audio duration from actual audio element if possible
    const audioDuration = await page.evaluate(() => {
      // First try to get actual duration from audio element
      const audioEl = document.querySelector('audio');
      if (audioEl && !isNaN(audioEl.duration) && audioEl.duration > 0) {
        console.log(`Found audio element with duration: ${audioEl.duration}s`);
        return audioEl.duration;
      }
      // Fall back to the window property or default
      return (window as any).audioDuration || 60;
    });

    // Calculate actual duration based on options
    const videoDuration = config.duration
      ? Math.min(config.duration, audioDuration)
      : audioDuration;

    console.log(`🎵 Audio duration: ${audioDuration.toFixed(1)}s`);
    console.log(`🎬 Video duration: ${videoDuration.toFixed(1)}s`);

    console.log('Preparing for synchronized capture...');

    // Ensure audio is loaded/ready for visualization
    await page.evaluate(() => {
      console.log('Setting visualization flags');

      // Add a timestamp for tracking
      (window as any).captureStartTime = Date.now();

      // Simulate user interaction to start audio
      document.body.dispatchEvent(
        new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    // Explicitly trigger frame capture BEFORE audio starts
    console.log('1. Preparing frames');

    // Debug the audio in more detail before capturing
    await page.evaluate(() => {
      console.log('DEBUG AUDIO: Starting audio diagnostics');
      if ((window as any).sound && (window as any).sound.buffer) {
        console.log(
          `DEBUG AUDIO: Audio buffer duration: ${(window as any).sound.buffer.duration}s`,
        );
        console.log(
          `DEBUG AUDIO: Audio context state: ${(window as any).sound.context.state}`,
        );
      } else {
        console.log('DEBUG AUDIO: Sound or buffer is not available');
      }
    });

    // Use time-based capture instead of frame rate
    const startTime = Date.now();
    const endTime = startTime + videoDuration * 1000; // Convert to ms

    // Start frame counter
    let frameCount = 0;
    let audioHasEnded = false;

    // Keep capturing until we reach the full video duration
    // This uses the actual elapsed time rather than trying to maintain a precise frame rate
    console.log(
      `📊 Starting capture for ${videoDuration.toFixed(1)} seconds of video...`,
    );

    while (Date.now() < endTime) {
      // Check if we should log progress (every 10% of duration)
      const elapsedMs = Date.now() - startTime;
      const elapsedSec = elapsedMs / 1000;
      const progressPct = (elapsedSec / videoDuration) * 100;

      if (
        Math.floor(progressPct) % 10 === 0 &&
        Math.floor(progressPct) >
          Math.floor((elapsedMs - 200) / videoDuration / 10)
      ) {
        console.log(
          `📊 Capture progress: ${Math.floor(
            progressPct,
          )}% (${elapsedSec.toFixed(1)}s / ${videoDuration.toFixed(1)}s)`,
        );
      }

      // Check for audio ended event (but don't stop capturing)
      if (!audioHasEnded) {
        audioHasEnded = await page.evaluate(() => {
          const isEnded = (window as any).audioEnded === true;
          if (isEnded) {
            console.log(
              `DEBUG AUDIO: Audio ended at ${
                (Date.now() - (window as any).captureStartTime) / 1000
              }s`,
            );
          }
          return isEnded;
        });
        if (audioHasEnded) {
          console.log(
            '🎵 Audio ended, but continuing capture for full duration',
          );
        }
      }

      // Take screenshot
      const framePath = path.join(
        framesDir,
        `frame_${frameCount.toString().padStart(6, '0')}.jpg`,
      );
      await page.screenshot({
        path: framePath,
        type: 'jpeg',
        quality: 80, // Adjust quality (0-100) for size/quality tradeoff
        omitBackground: false,
      });

      // Increment frame counter
      frameCount++;

      // Log diagnostic info occasionally
      if (frameCount % 30 === 0) {
        const currentFps = frameCount / (elapsedSec || 1);
        console.log(
          `Diagnostic: Captured ${frameCount} frames in ${elapsedSec.toFixed(
            1,
          )}s (effective ${currentFps.toFixed(1)} fps)`,
        );
      }

      // Minimal delay to prevent CPU overload but allow maximum capture speed
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    console.log(`✅ Frame capture complete. Captured ${frameCount} frames`);

    // Count actual frame files in the directory to verify
    const frameFiles = fs
      .readdirSync(framesDir)
      .filter((file) => file.startsWith('frame_') && file.endsWith('.jpg'));
    console.log(`Found ${frameFiles.length} frame files in directory`);

    await browser.close();

    // Generate video from frames
    console.log('🎥 Generating video from frames...');

    return new Promise<string>((resolve, reject) => {
      // Calculate actual achieved FPS
      const achievedFps = frameCount / (videoDuration || 1); // Avoid division by zero

      console.log(
        `Actual capture: ${frameCount} frames over ${videoDuration.toFixed(
          1,
        )}s = ${achievedFps.toFixed(1)} FPS`,
      );
      console.log(
        `Using achieved FPS value (${achievedFps.toFixed(
          1,
        )}) to create video with correct timing`,
      );

      ffmpeg()
        .input(path.join(framesDir, 'frame_%06d.jpg'))
        .inputFPS(achievedFps)
        .input(audioPath)
        .outputOptions([
          `-c:v libx264`,
          `-crf 23`,
          `-preset medium`,
          `-pix_fmt yuv420p`,
          `-c:a aac`,
          `-b:a 192k`,
          `-shortest`,
        ])
        .output(config.outputPath)
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(
              `🎥 Video encoding: ${progress.percent.toFixed(1)}% complete`,
            );
          }
        })
        .on('end', () => {
          console.log(`✅ Video saved to ${config.outputPath}`);

          // Clean up frames
          console.log('🧹 Cleaning up temporary files...');
          fs.readdirSync(framesDir).forEach((file) => {
            fs.unlinkSync(path.join(framesDir, file));
          });
          fs.rmdirSync(framesDir);

          resolve(config.outputPath);
        })
        .on('error', (err) => {
          console.error('❌ FFmpeg error:', err);
          reject(err);
        })
        .run();
    });
  } catch (error) {
    console.error('❌ Error during processing:', error);
    if (browser) await browser.close();
    throw error;
  }
}

// Simple script interface for command line usage
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error(
      'Usage: node generateVideo.js <audioPath> [--visible] [--duration=seconds]',
    );
    process.exit(1);
  }

  const audioPath = args[0];
  const isVisible = args.includes('--visible');

  // Check for duration parameter
  let duration: number | null = null;
  const durationArg = args.find((arg) => arg.startsWith('--duration='));
  if (durationArg) {
    const durationValue = durationArg.split('=')[1];
    duration = parseFloat(durationValue);
    if (isNaN(duration)) {
      console.error('❌ Invalid duration value. Must be a number in seconds.');
      process.exit(1);
    }
  }

  generateVideo(audioPath, {
    headless: !isVisible,
    duration: duration,
  })
    .then((outputPath) => console.log(`✅ Done! Output: ${outputPath}`))
    .catch((err) => {
      console.error('❌ Error:', err);
      process.exit(1);
    });
}

export { generateVideo };
