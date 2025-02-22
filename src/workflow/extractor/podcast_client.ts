import { ElevenLabsClient } from 'elevenlabs';
import { writeFile, mkdir } from 'fs/promises';
import { Buffer } from 'buffer';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { Debugger } from '@/utils/debugger';

/*

TODO: script for podcast, convert to segments and merge, openai whisper to transacribe

 */

interface DialogueLine {
  speaker: string;
  text: string;
}

const VOICE_MAPPINGS: Record<string, string> = {
  'Dabid Hoffbro': 'fJE3lSefh7YI494JMYYz', // Richard Yu
  'Ryan Seen Adz': 'knOo4XX4oHnEyZZ5cjwk', // Elevenlabs Pro - Aurelian Vox
  'Max Profit': 'YI5bDiiDOYHHb2eLadHv', // Adamo
} as const;

export const generatePodcastAudio = async (
  apiKey: string,
  content: string,
  processorId: number,
): Promise<DialogueLine[]> => {
  const debug = Debugger.getInstance();

  // Create the output directory
  const outputDir = path.join('data', processorId.toString());
  await mkdir(outputDir, { recursive: true });

  const client = new ElevenLabsClient({
    apiKey,
  });

  // Parse content into dialogue lines
  const lines: DialogueLine[] = content
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const [speaker, ...textParts] = line.split(':');
      return {
        speaker: speaker.trim(),
        text: textParts.join(':').trim(),
      };
    });

  // Generate audio for each speaker's lines
  const audioFiles: string[] = [];
  for (const [index, line] of lines.entries()) {
    const voiceId = VOICE_MAPPINGS[line.speaker];
    if (!voiceId) continue;

    const audio = await client.generate({
      text: line.text,
      voice: voiceId,
      model_id: 'eleven_turbo_v2_5',
    });

    // Convert stream to buffer and save
    const chunks: Uint8Array[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const segmentPath = path.join(outputDir, `segment_${index}.mp3`);
    await writeFile(segmentPath, buffer);
    audioFiles.push(segmentPath);
  }

  // Combine all audio segments using ffmpeg
  const outputPath = path.join(outputDir, 'audio.mp3');

  return new Promise((resolve, reject) => {
    if (audioFiles.length === 0) {
      reject(new Error('No audio files to merge'));
      return;
    }

    // Create a complex filter that includes both concatenation and tempo adjustment
    const filterComplex =
      audioFiles.map((_, index) => `[${index}:0]`).join('') +
      `concat=n=${audioFiles.length}:v=0:a=1[concatenated];` +
      `[concatenated]atempo=1.25[out]`;

    const command = ffmpeg();

    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Add all audio files to the command
    audioFiles.forEach((file) => {
      command.input(file);
    });

    command
      .on('start', (commandLine) => {
        debug.verbose('FFmpeg command:', commandLine);
      })
      .on('error', (err, stdout, stderr) => {
        debug.error('FFmpeg stderr:', stderr);
        reject(err);
      })
      .on('end', () => resolve(lines))
      .complexFilter(filterComplex)
      .outputOptions(['-map [out]', '-c:a libmp3lame', '-b:a 192k'])
      .output(outputPath)
      .run();
  });
};

export const generatePodcastVideo = async (
  processorId: number,
  lines: DialogueLine[],
) => {
  const outputDir = path.join('data', processorId.toString());
  const audioPath = path.join(outputDir, 'audio.mp3');
  const outputVideoPath = path.join(outputDir, 'podcast.mp4');
  const subtitlesPath = path.join(outputDir, 'captions.srt');

  // Generate SRT subtitles file with improved timing
  let currentTime = 0;
  const srtContent = lines
    .map((line, index) => {
      const charCount = line.text.length;
      const avgCharsPerSecond = 20; // Increased from 15 to 20
      const minDuration = 0.8; // Reduced from 1.5 to 0.8 seconds
      const calculatedDuration = charCount / avgCharsPerSecond; // Removed the 1.25x speed adjustment
      const duration = Math.max(calculatedDuration, minDuration);

      const start = formatTimestamp(currentTime);
      currentTime += duration;
      const end = formatTimestamp(currentTime);

      return `${index + 1}\n${start} --> ${end}\n${line.speaker}: ${
        line.text
      }\n`;
    })
    .join('\n');

  await writeFile(subtitlesPath, srtContent);

  return new Promise((resolve, reject) => {
    const command = ffmpeg()
      .input(audioPath)
      .complexFilter([
        // Create a black background
        'color=c=black:s=1920x1080:r=30[bg]',
        // Create audio visualization
        {
          filter: 'showwaves',
          options: {
            s: '1920x400',
            r: 30,
            mode: 'line',
            colors: 'ffffff',
          },
          inputs: '0:a',
          outputs: 'waves',
        },
        // Overlay waves on background
        '[bg][waves]overlay=0:340[v]',
        // Add subtitles
        {
          filter: 'subtitles',
          options: subtitlesPath.replace(/\\/g, '/'),
          inputs: 'v',
          outputs: 'out',
        },
      ])
      .outputOptions([
        '-map [out]',
        '-map 0:a',
        '-c:v libx264',
        '-c:a aac',
        '-b:v 2M',
        '-shortest',
      ])
      .output(outputVideoPath)
      .on('end', () => resolve(true))
      .on('error', (err, stdout, stderr) => {
        console.error('FFmpeg stderr:', stderr);
        reject(err);
      });

    command.run();
  });
};

// Helper function to format timestamps for SRT
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0',
  )}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}
