import { Debugger } from '@/utils/debugger';
import {
  TranscriptionResponse,
  TranscriptionWord,
} from '../extractor/podcast_audio';
import * as path from 'path';
import * as fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { generateImagesFromTranscriptSegment } from './generate_images';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { getSecrets } from '../../utils/secrets';

// Generate SRT content from transcription
const generateSrtContent = (words: TranscriptionWord[]): string => {
  const debug = Debugger.getInstance();

  // Check if words array exists and has items
  if (!words || !Array.isArray(words) || words.length === 0) {
    debug.error('Words array is invalid or empty');
    return '';
  }

  try {
    let srtContent = '';
    let index = 1;
    let currentLine = '';
    let startTime = 0;
    let endTime = 0;
    let wordCount = 0;
    let currentSpeaker = '';

    const formatTime = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds * 1000) % 1000);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    };

    // Filter out spacing elements and only keep word elements
    const wordElements = words.filter((word) => word.type === 'word');
    debug.info(
      `Filtered ${wordElements.length} word elements from ${words.length} total elements`,
    );

    for (let i = 0; i < wordElements.length; i++) {
      const word = wordElements[i];

      // Use text property instead of word property
      if (
        !word ||
        typeof word.start !== 'number' ||
        typeof word.end !== 'number' ||
        typeof word.text !== 'string'
      ) {
        debug.error(
          `Invalid word object at index ${i}: ${JSON.stringify(word)}`,
        );
        continue;
      }

      // Check if this is the first word or if we need to start a new line
      const speakerChanged = word.speaker && currentSpeaker !== word.speaker;

      if (currentLine.length === 0) {
        startTime = word.start;
        currentLine = word.text;
        wordCount = 1;
        if (word.speaker) currentSpeaker = word.speaker;
      } else if (wordCount < 5 && !speakerChanged) {
        // Add word to current line if we haven't reached 5 words and speaker hasn't changed
        currentLine += ' ' + word.text;
        wordCount++;
      } else {
        // End current line and start a new one
        endTime = wordElements[i - 1].end;

        srtContent += `${index}\n`;
        srtContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
        srtContent += `${currentLine}\n\n`;

        index++;
        currentLine = word.text;
        startTime = word.start;
        wordCount = 1;
        if (word.speaker) currentSpeaker = word.speaker;
      }

      // Handle the last line
      if (i === wordElements.length - 1) {
        endTime = word.end;

        srtContent += `${index}\n`;
        srtContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
        srtContent += `${currentLine}\n\n`;
      }
    }

    return srtContent;
  } catch (error) {
    debug.error(`Error in generateSrtContent: ${error}`);
    return '';
  }
};

// Function to divide transcription into segments for image generation based on speaker changes
const divideTranscriptionIntoSegments = (
  transcription: TranscriptionResponse,
): { text: string; startTime: number; endTime: number; speaker?: string }[] => {
  const debug = Debugger.getInstance();

  if (!transcription?.words || transcription.words.length === 0) {
    debug.error('No valid transcription data to segment');
    return [];
  }

  const segments: {
    text: string;
    startTime: number;
    endTime: number;
    speaker?: string;
  }[] = [];

  // Get only word elements (exclude punctuation, etc.)
  const wordElements = transcription.words.filter(
    (word) => word.type === 'word',
  );

  if (wordElements.length === 0) {
    debug.error('No word elements found in transcription');
    return [];
  }

  // Set up for the first segment
  let currentSegment = {
    text: '',
    startTime: wordElements[0].start,
    endTime: 0,
    speaker: wordElements[0].speaker,
  };
  let segmentText: string[] = [];
  const minSegmentDuration = 8; // Minimum segment duration in seconds
  const maxSegmentDuration = 20; // Maximum segment duration in seconds

  for (let i = 0; i < wordElements.length; i++) {
    const word = wordElements[i];
    const prevWord = i > 0 ? wordElements[i - 1] : null;

    // Add word to current segment text
    segmentText.push(word.text);

    // Check for conditions to end the current segment:
    // 1. Speaker changed
    // 2. Minimum duration reached AND natural pause (more than 0.5s between words)
    // 3. Maximum duration reached
    // 4. End of transcription

    const speakerChanged =
      prevWord &&
      word.speaker &&
      prevWord.speaker &&
      word.speaker !== prevWord.speaker;
    const currentDuration = word.end - currentSegment.startTime;
    const hasNaturalPause = prevWord && word.start - prevWord.end > 0.5;
    const minDurationReached = currentDuration >= minSegmentDuration;
    const maxDurationReached = currentDuration >= maxSegmentDuration;
    const isLastWord = i === wordElements.length - 1;

    if (
      speakerChanged ||
      (minDurationReached && hasNaturalPause) ||
      maxDurationReached ||
      isLastWord
    ) {
      currentSegment.text = segmentText.join(' ');
      currentSegment.endTime = word.end;

      segments.push({ ...currentSegment });

      // Start a new segment if not the last word
      if (!isLastWord) {
        segmentText = [];
        currentSegment = {
          text: '',
          startTime: word.end,
          endTime: 0,
          speaker: word.speaker,
        };
      }
    }
  }

  debug.info(
    `Divided transcription into ${segments.length} segments based on speaker changes and natural breaks`,
  );
  return segments;
};

// Main function to generate AI video with images based on transcript
export const generate_ai_video = async (
  processorId: number,
  transcription: TranscriptionResponse,
  customAudioPath?: string,
  customOutputPath?: string,
): Promise<boolean> => {
  const debug = Debugger.getInstance();
  debug.info('Generating AI video');

  const outputDir = path.join('data', processorId.toString());

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Use custom paths if provided, otherwise use default paths
  const audioPath = customAudioPath || path.join(outputDir, 'audio.mp3');
  const outputVideoPath =
    customOutputPath || path.join(outputDir, 'podcast.mp4');
  const srtPath = path.join(outputDir, 'captions.srt');
  const imagesDir = path.join(outputDir, 'images');

  // Create images directory if it doesn't exist
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  try {
    // Check if audio file exists
    if (!fs.existsSync(audioPath)) {
      debug.error(`Audio file does not exist: ${audioPath}`);
      return false;
    }

    // Validate transcription data
    if (
      !transcription ||
      !transcription.words ||
      !Array.isArray(transcription.words) ||
      transcription.words.length === 0
    ) {
      debug.error('Invalid or empty transcription data');
      return false;
    }

    // 1. Divide transcription into segments for image generation
    debug.info(
      'Dividing transcription into segments for image generation based on speaker changes',
    );
    const segments = divideTranscriptionIntoSegments(transcription);

    if (segments.length === 0) {
      debug.error('Failed to create segments from transcription');
      return false;
    }

    console.log(segments);

    debug.info(`Created ${segments.length} segments from transcription`);

    // 2. Generate images for each segment
    debug.info('Generating images for each transcript segment');
    const imagePaths: string[] = [];

    // Generate optimized prompts for all segments using OpenAI
    debug.info('Generating optimized image prompts with OpenAI');
    const optimizedPrompts = await generateOptimizedImagePrompts(segments);

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      try {
        // Use the optimized prompt if available, otherwise fall back to the segment text
        const promptToUse = optimizedPrompts[i] || segment.text;
        const imagePath = await generateImagesFromTranscriptSegment(
          promptToUse,
          i,
          imagesDir,
        );
        imagePaths.push(imagePath);
        debug.info(`Generated image ${i + 1}/${segments.length}: ${imagePath}`);
      } catch (error) {
        debug.error(`Failed to generate image for segment ${i}: ${error}`);
        // Continue with other segments even if one fails
      }
    }

    if (imagePaths.length === 0) {
      debug.error('Failed to generate any images for the video');
      return false;
    }

    // 3. Create a slideshow video from the images using a different approach
    debug.info('Creating slideshow video from generated images');
    const tempSlideshowPath = path.join(outputDir, 'temp_slideshow.mp4');

    try {
      // Let's try a different approach - directly creating a video from images
      // using the image2 demuxer instead of concat

      // Add the images with durations calculated from the transcript
      let totalDuration = 0;
      const imageSequence: { path: string; duration: number }[] = [];

      for (let i = 0; i < segments.length; i++) {
        const duration =
          i < segments.length - 1
            ? segments[i + 1].startTime - segments[i].startTime
            : 5; // Default duration for last segment

        imageSequence.push({
          path: imagePaths[i],
          duration: duration,
        });

        totalDuration += duration;
      }

      debug.info(
        `Total slideshow duration will be approximately ${totalDuration.toFixed(1)} seconds`,
      );

      // Instead of copying frames, we'll use ffmpeg's concat demuxer with a list file
      // Use absolute path for concat file to avoid ffmpeg path issues
      const concatFilePath = path.resolve(
        path.join(outputDir, 'concat_list.txt'),
      );
      let concatFileContent = '';

      // Create the concat file content
      for (let i = 0; i < imageSequence.length; i++) {
        const item = imageSequence[i];
        // Use absolute paths and proper escaping for ffmpeg
        const absolutePath = path.resolve(item.path);
        const escapedPath = absolutePath.replace(/'/g, "'\\''");
        concatFileContent += `file '${escapedPath}'\n`;
        concatFileContent += `duration ${item.duration}\n`;
      }

      // Add the last image again (required by concat demuxer)
      if (imageSequence.length > 0) {
        const lastItem = imageSequence[imageSequence.length - 1];
        const absolutePath = path.resolve(lastItem.path);
        const escapedPath = absolutePath.replace(/'/g, "'\\''");
        concatFileContent += `file '${escapedPath}'\n`;
      }

      // Write the concat file
      fs.writeFileSync(concatFilePath, concatFileContent);
      debug.info(`Created concat file with ${imageSequence.length} entries`);

      // Create video using the concat demuxer
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(concatFilePath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions([
            '-c:v',
            'libx264',
            '-pix_fmt',
            'yuv420p',
            '-r',
            '30',
            '-s',
            '1280x720',
          ])
          .output(tempSlideshowPath)
          .on('progress', (progress) => {
            if (progress.percent) {
              debug.info(
                `Slideshow creation progress: ${progress.percent.toFixed(1)}%`,
              );
            }
          })
          .on('end', () => {
            debug.info('Slideshow video created successfully');
            resolve();
          })
          .on('error', (err) => {
            debug.error(`FFMPEG error: ${err.message}`);

            // Fallback to using the first image as a static image for the video
            const firstImage = imagePaths[0];
            debug.info(`Falling back to using static image: ${firstImage}`);

            // Create a 30-second video from a single image
            ffmpeg()
              .input(firstImage)
              .loop(30) // Loop for 30 seconds
              .outputOptions([
                '-c:v',
                'libx264',
                '-t',
                '30',
                '-pix_fmt',
                'yuv420p',
                '-r',
                '30',
              ])
              .output(tempSlideshowPath)
              .on('end', () => {
                debug.info('Fallback video created successfully');
                resolve();
              })
              .on('error', (fallbackErr) => {
                reject(
                  new Error(
                    `Failed to create fallback video: ${fallbackErr.message}`,
                  ),
                );
              })
              .run();
          })
          .run();
      });

      // Clean up concat file
      if (fs.existsSync(concatFilePath)) {
        fs.unlinkSync(concatFilePath);
      }
    } catch (error) {
      debug.error(`Error creating slideshow: ${error}`);
      throw error;
    }

    // 4. Add audio to the slideshow
    debug.info('Adding audio to the slideshow video');
    const videoWithAudioPath = path.join(outputDir, 'temp_with_audio.mp4');

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(tempSlideshowPath)
        .input(audioPath)
        .outputOptions(['-c:v', 'copy', '-c:a', 'aac', '-shortest'])
        .output(videoWithAudioPath)
        .on('progress', (progress) => {
          if (progress.percent) {
            debug.info(
              `Audio addition progress: ${progress.percent.toFixed(1)}%`,
            );
          }
        })
        .on('end', () => {
          debug.info('Audio added to video successfully');
          resolve();
        })
        .on('error', (err) => {
          reject(new Error(`Failed to add audio to video: ${err.message}`));
        })
        .run();
    });

    // 5. Generate SRT file from transcription
    debug.info('Generating SRT caption file');
    const srtContent = generateSrtContent(transcription.words);

    if (!srtContent) {
      debug.error('Failed to generate SRT content');
      // Continue without captions if SRT generation fails
      fs.renameSync(videoWithAudioPath, outputVideoPath);
      debug.info(`Video without captions saved to: ${outputVideoPath}`);
      return true;
    }

    fs.writeFileSync(srtPath, srtContent);
    debug.info(`SRT file generated: ${srtPath}`);

    // 6. Add captions to the video
    debug.info('Adding captions to the final video');

    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoWithAudioPath)
        .videoFilters(
          `subtitles=${srtPath}:force_style='FontName=Roboto,FontSize=28,PrimaryColour=&HFFFFFF,Bold=1,BorderStyle=1,Outline=1.5,Shadow=1,Alignment=2,MarginV=50'`,
        )
        .output(outputVideoPath)
        .on('progress', (progress) => {
          if (progress.percent) {
            debug.info(
              `Caption addition progress: ${progress.percent.toFixed(1)}%`,
            );
          }
        })
        .on('end', () => {
          debug.info('Captions added successfully');
          resolve();
        })
        .on('error', (err) => {
          reject(new Error(`Failed to add captions: ${err.message}`));
        })
        .run();
    });

    // 7. Clean up temporary files
    debug.info('Cleaning up temporary files');

    const filesToCleanup = [tempSlideshowPath, videoWithAudioPath, srtPath];

    for (const file of filesToCleanup) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }

    // Don't delete the generated images as they might be useful for review

    debug.info(`AI video successfully generated at: ${outputVideoPath}`);
    return true;
  } catch (error) {
    debug.error(`Failed to generate AI video: ${error}`);
    return false;
  }
};

// Function to generate optimized image prompts using OpenAI
async function generateOptimizedImagePrompts(
  segments: {
    text: string;
    startTime: number;
    endTime: number;
    speaker?: string;
  }[],
): Promise<string[]> {
  const debug = Debugger.getInstance();
  const secrets = getSecrets();

  try {
    if (!secrets.openaiApiKey) {
      debug.error(
        'OpenAI API key not found, using original segment text for prompts',
      );
      return segments.map((segment) => segment.text);
    }

    const openai = createOpenAI({
      apiKey: secrets.openaiApiKey,
    });

    // Create a context string with all segments for reference
    const fullContext = segments
      .map((seg, i) => `Segment ${i + 1}: "${seg.text}"`)
      .join('\n');

    // Process all segments at once without batching
    const promises = segments.map(async (segment, index) => {
      try {
        const { text: promptText } = await generateText({
          model: openai.chat('gpt-4-turbo'),
          system:
            'You are an expert at creating descriptive image prompts for AI image generation. \
Create vivid, detailed prompts that will result in high-quality, engaging images for a video \
presentation. The video features an ongoing dialog between a frog character and an anime character. \
Maintain visual continuity between scenes.',
          prompt: `Convert this transcript segment into a detailed image generation prompt. \
The prompt should describe a scene that visually represents the content, suitable for a 16:9 \
video. Focus on visual elements, style, mood, and composition. Don't include any audio or \
text overlay instructions.\n\n\
This is part of an ongoing conversation between a frog character and an anime character.\n\n\
FULL CONVERSATION CONTEXT:\n${fullContext}\n\n\
CURRENT SEGMENT (${index + 1}):\n"${segment.text}"\n\n\
Create a prompt that shows these characters interacting while maintaining visual continuity with previous and future scenes.\n\n\
Image generation prompt:`,
          temperature: 0.7,
          maxTokens: 300,
        });

        debug.info(`Generated optimized prompt for segment ${index}`);
        return promptText.trim();
      } catch (error) {
        debug.error(`Failed to generate optimized prompt: ${error}`);
        // Fall back to original text
        return segment.text;
      }
    });

    const optimizedPrompts = await Promise.all(promises);

    debug.info(
      `Successfully generated ${optimizedPrompts.length} optimized image prompts`,
    );
    return optimizedPrompts;
  } catch (error) {
    debug.error(`Error in generateOptimizedImagePrompts: ${error}`);
    // Fall back to original segment text
    return segments.map((segment) => segment.text);
  }
}
