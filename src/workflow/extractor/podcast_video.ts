import { Debugger } from '@/utils/debugger';
import { TranscriptionResponse, TranscriptionWord } from './podcast_audio';
import * as path from 'path';
import { generateVideo } from './video-generator/puppeteer';
import * as fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

// Define the ColorKeyframe interface at the top of the file
interface ColorKeyframe {
  time: number;
  colors: {
    red: number;
    green: number;
    blue: number;
  };
}

// Helper function to convert transcription to SRT format
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

export const generatePodcastVideo = async (
  processorId: number,
  transcription: TranscriptionResponse,
  customAudioPath?: string,
  customOutputPath?: string,
): Promise<boolean> => {
  const debug = Debugger.getInstance();
  debug.info('Starting podcast video generation with WebGL');

  // Debug the transcription object
  debug.verbose(
    `Transcription object: ${JSON.stringify(transcription, null, 2)}`,
  );

  const outputDir = path.join('data', 'videos', processorId.toString());

  // Use custom paths if provided, otherwise use default paths
  const audioPath = customAudioPath || path.join(outputDir, 'audio.mp3');
  const outputVideoPath =
    customOutputPath || path.join(outputDir, 'podcast.mp4');
  const tempVideoPath = path.join(outputDir, 'temp_podcast.mp4');
  const srtPath = path.join(outputDir, 'captions.srt');

  try {
    // Generate color keyframes based on speaker transitions in the transcription
    const colorKeyframes = generateColorKeyframes(transcription);

    // Call the generateVideo function with the audio path and output path
    debug.info(`Generating base video with audio: ${audioPath}`);
    await generateVideo(audioPath, {
      outputPath: tempVideoPath, // Use temporary path for the initial video
      width: 1200,
      height: 676,
      strength: 0.3,
      colorKeyframes: colorKeyframes,
    });

    debug.info(`Base podcast video generated at: ${tempVideoPath}`);

    // Generate SRT file from transcription
    debug.info('Checking transcription data...');
    if (!transcription) {
      debug.error('Transcription is null or undefined');
      // Just use the video without captions
      await fs.promises.rename(tempVideoPath, outputVideoPath);
      return true;
    }

    if (!transcription.words) {
      debug.error('Transcription.words is null or undefined');
      // Just use the video without captions
      await fs.promises.rename(tempVideoPath, outputVideoPath);
      return true;
    }

    if (!Array.isArray(transcription.words)) {
      debug.error(
        `Transcription.words is not an array: ${typeof transcription.words}`,
      );
      // Just use the video without captions
      await fs.promises.rename(tempVideoPath, outputVideoPath);
      return true;
    }

    debug.info(
      `Transcription words array length: ${transcription.words.length}`,
    );

    const srtContent = generateSrtContent(transcription.words);
    debug.info(`SRT content generated: ${srtContent ? 'Yes' : 'No'}`);

    // Only proceed with captions if we have valid SRT content
    if (srtContent) {
      await fs.promises.writeFile(srtPath, srtContent);
      debug.info(`Generated SRT caption file at: ${srtPath}`);

      // Use fluent-ffmpeg instead of spawn
      debug.info(`Adding subtitles to video using FFmpeg`);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempVideoPath)
          .videoFilters(
            `subtitles=${srtPath}:force_style='FontName=Roboto,FontSize=28,PrimaryColour=&HFFFFFF,Bold=1,BorderStyle=1,Outline=1.5,Shadow=1,Alignment=2,MarginV=50'`,
            // `subtitles=${srtPath}:force_style='FontSize=24,FontName=Arial,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,BorderStyle=3,Outline=1'`,
          )
          .output(outputVideoPath)
          .on('progress', (progress) => {
            if (progress.percent) {
              debug.info(`FFmpeg progress: ${progress.percent.toFixed(1)}%`);
            }
          })
          .on('end', () => {
            debug.info('FFmpeg process completed successfully');
            resolve();
          })
          .on('error', (err) => {
            reject(
              new Error(`Failed to process video with FFmpeg: ${err.message}`),
            );
          })
          .run();
      });

      // Clean up temporary files
      await fs.promises.unlink(tempVideoPath);
      await fs.promises.unlink(srtPath);
    } else {
      // If no valid SRT content, just rename the temp video to the final output
      debug.info(
        'No valid transcription words found, using video without captions',
      );
      await fs.promises.rename(tempVideoPath, outputVideoPath);
    }

    debug.info(`Podcast video successfully generated at: ${outputVideoPath}`);
    return true;
  } catch (error) {
    debug.error(`Failed to generate podcast video with captions: ${error}`);
    // If there's an error, try to at least save the base video if it exists
    try {
      if (fs.existsSync(tempVideoPath)) {
        await fs.promises.rename(tempVideoPath, outputVideoPath);
        debug.info(`Saved base video without captions at: ${outputVideoPath}`);
        return true;
      }
    } catch (saveError) {
      debug.error(`Failed to save base video: ${saveError}`);
    }
    return false;
  }
};

// Helper function to generate color keyframes based on speaker transitions
const generateColorKeyframes = (
  transcription: TranscriptionResponse,
): ColorKeyframe[] => {
  const debug = Debugger.getInstance();

  if (
    !transcription ||
    !transcription.words ||
    transcription.words.length === 0
  ) {
    debug.info(
      'No valid transcription data for color keyframes, using defaults',
    );
    // Use default keyframes if no transcription data
    return [
      {
        time: 0,
        colors: { red: 0.8, green: 0.2, blue: 1.0 },
      },
      {
        time: 10,
        colors: { red: 0.3, green: 0.6, blue: 0.5 },
      },
      {
        time: 15,
        colors: { red: 0.8, green: 0.2, blue: 1.0 },
      },
    ];
  }

  debug.info('Generating color keyframes based on speaker transitions');

  const speakerColors: Record<
    string,
    { red: number; green: number; blue: number }
  > = {
    MAX: { red: 0.8, green: 0.2, blue: 1.0 },
    PEPE: { red: 0.3, green: 0.6, blue: 0.5 },
  };

  const colorKeyframes = [];

  // Start with a default keyframe at time 0
  const currentSpeaker = transcription.words[0].speaker || 'PEPE';
  colorKeyframes.push({
    time: 0,
    colors: speakerColors[currentSpeaker] || speakerColors.MAX,
  });

  // Add keyframes at each speaker transition
  for (let i = 1; i < transcription.words.length; i++) {
    const word = transcription.words[i];
    const prevWord = transcription.words[i - 1];

    // If speaker changes, add a new keyframe
    if (word.speaker && prevWord.speaker && word.speaker !== prevWord.speaker) {
      colorKeyframes.push({
        time: word.start,
        colors: speakerColors[word.speaker],
      });
    }
  }

  // Add a final keyframe at the end of the audio
  const lastWord = transcription.words[transcription.words.length - 1];
  colorKeyframes.push({
    time: lastWord.end + 0.1, // Slightly after the last word
    colors: speakerColors[lastWord.speaker || 'MAX'],
  });

  debug.info(
    `Generated ${colorKeyframes.length} color keyframes based on speaker transitions`,
  );
  return colorKeyframes;
};
