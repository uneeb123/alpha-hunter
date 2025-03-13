import { ElevenLabsClient } from 'elevenlabs';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { Buffer } from 'buffer';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { Debugger } from '@/utils/debugger';

export const VOICE_MAPPINGS: Record<string, string> = {
  PEPE: '52d3CDIZuiBA0XXTytxR', // Caricatured Lax (Ramon)
  MAX: 'YI5bDiiDOYHHb2eLadHv', // Adamo
} as const;

export interface TranscriptionWord {
  text: string;
  start: number;
  end: number;
  type: string;
}

export interface TranscriptionResponse {
  text: string;
  words?: TranscriptionWord[];
}

/**
 * Generates podcast audio from a script with multiple speakers
 * and also generates transcription for the audio
 */
export const generatePodcastAudio = async (
  apiKey: string,
  content: string,
  processorId: number,
  options: { speed?: number } = {},
): Promise<TranscriptionResponse> => {
  const debug = Debugger.getInstance();
  const speed = options.speed || 1.0; // Default to normal speed if not specified

  // Create the output directory
  const outputDir = path.join('data', processorId.toString());
  await mkdir(outputDir, { recursive: true });

  const client = new ElevenLabsClient({
    apiKey,
  });

  // Parse content into dialogue lines
  const lines = content
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
      model_id: 'eleven_multilingual_v2',
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

  // Create a promise for the FFmpeg processing
  const ffmpegPromise = new Promise<void>((resolve, reject) => {
    if (audioFiles.length === 0) {
      reject(new Error('No audio files to merge'));
      return;
    }

    // Create a complex filter that includes both concatenation and optional tempo adjustment
    let filterComplex =
      audioFiles.map((_, index) => `[${index}:0]`).join('') +
      `concat=n=${audioFiles.length}:v=0:a=1`;

    // Add tempo adjustment if speed is not 1.0
    if (speed !== 1.0) {
      filterComplex += `[concatenated];[concatenated]atempo=${speed}[out]`;
    } else {
      filterComplex += '[out]';
    }

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
      .on('end', () => resolve())
      .complexFilter(filterComplex)
      .outputOptions(['-map [out]', '-c:a libmp3lame', '-b:a 192k'])
      .output(outputPath)
      .run();
  });

  // Wait for FFmpeg to finish
  await ffmpegPromise;

  let transcription: TranscriptionResponse | undefined;

  // Perform transcription
  try {
    debug.info('Starting audio transcription...');
    transcription = await transcribeAudio(apiKey, outputPath);
    // debug.verbose(JSON.stringify(transcription, null, 2));

    // Save the full transcription data (including word timing) to a JSON file
    const transcriptionDataPath = path.join(outputDir, 'transcription.json');
    await writeFile(
      transcriptionDataPath,
      JSON.stringify(transcription, null, 2),
    );
    debug.info(
      `Transcription data with word timings saved to ${transcriptionDataPath}`,
    );
  } catch (error) {
    debug.error('Error during transcription:', error as Error);
    throw error;
  }

  return transcription;
};

/**
 * Transcribes audio using Eleven Labs Speech-to-Text API
 *
 * @param apiKey - Eleven Labs API key
 * @param audioFilePath - Path to the audio file to transcribe
 * @returns The transcribed text with word-level timings
 */
export const transcribeAudio = async (
  apiKey: string,
  audioFilePath: string,
): Promise<TranscriptionResponse> => {
  const debug = Debugger.getInstance();
  debug.info(`Transcribing audio file: ${audioFilePath}`);

  // Create client using SDK
  const client = new ElevenLabsClient({
    apiKey: apiKey,
  });

  try {
    // Read the audio file as a Buffer
    const audioBuffer = await readFile(audioFilePath);

    // Create a Blob from the buffer
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

    // Use the client to transcribe the audio
    const transcription = await client.speechToText.convert({
      file: audioBlob,
      model_id: 'scribe_v1', // Model to use, currently only "scribe_v1" is supported
      tag_audio_events: true, // Tag audio events like laughter, applause, etc.
      language_code: 'eng', // Language of the audio file, null for auto-detection
    });

    if (transcription && transcription.text) {
      debug.info('Transcription successful');
      // Map the words to match our TranscriptionWord interface
      const mappedWords = transcription.words?.map((word) => ({
        text: word.text || '',
        start: word.start || 0,
        end: word.end || 0,
        type: word.type || 'word',
      }));

      return {
        text: transcription.text,
        words: mappedWords,
      };
    } else {
      throw new Error('No transcription text returned');
    }
  } catch (error: unknown) {
    debug.error(
      'Error transcribing audio:',
      error instanceof Error ? error : String(error),
    );
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'data' in error.response
    ) {
      debug.error(
        'API error details:',
        JSON.stringify(error.response.data, null, 2),
      );
    }
    throw error;
  }
};
