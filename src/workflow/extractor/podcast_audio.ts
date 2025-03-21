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
  speaker?: string;
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

  // Save the original script lines to a file for later reference
  const scriptPath = path.join(outputDir, 'original_script.json');
  await writeFile(scriptPath, JSON.stringify({ lines }, null, 2));
  debug.info(`Original script saved to ${scriptPath}`);

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
    // Get the raw transcription with accurate timings
    const rawTranscription = await transcribeAudio(apiKey, outputPath);

    // Combine original script text with transcription timings
    debug.verbose(rawTranscription.words);
    try {
      transcription = await alignScriptWithTranscription(
        rawTranscription,
        lines,
      );
      debug.verbose(transcription.words);
    } catch {
      debug.info('Falling back to raw transcription');
      transcription = rawTranscription;
    }

    // Save both transcriptions for reference
    const rawTranscriptionPath = path.join(outputDir, 'raw_transcription.json');
    await writeFile(
      rawTranscriptionPath,
      JSON.stringify(rawTranscription, null, 2),
    );

    // Save the aligned transcription data to a JSON file
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

/**
 * Uses Claude to align the original script with the transcription timings
 * by correcting only the words while preserving punctuation and spacing
 *
 * @param rawTranscription - The transcription result from Eleven Labs with word timings
 * @param originalLines - The original script lines with correct text
 * @returns A transcription with the original script text but with accurate timing
 */
export const alignScriptWithTranscription = async (
  rawTranscription: TranscriptionResponse,
  originalLines: { speaker: string; text: string }[],
): Promise<TranscriptionResponse> => {
  const debug = Debugger.getInstance();
  debug.info(
    'Correcting transcription words using Claude while preserving formatting',
  );

  if (!rawTranscription.words || rawTranscription.words.length === 0) {
    debug.error('Raw transcription does not contain word timings');
    return rawTranscription;
  }

  // Declare correctedWords at function scope
  let correctedWords;

  try {
    const { createAnthropic } = await import('@ai-sdk/anthropic');
    const { generateText: aiGenerateText } = await import('ai');
    const { getSecrets } = await import('@/utils/secrets');

    // Include both raw text and word-by-word timing data for Claude
    const rawText = rawTranscription.text;
    const wordTimings = rawTranscription.words.map((word) => {
      return {
        text: word.text,
        start: word.start,
        end: word.end,
        type: word.type,
        speaker: word.speaker,
      };
    });

    // Get API key from secrets manager
    const { anthropicApiKey } = getSecrets();
    const anthropic = createAnthropic({
      apiKey: anthropicApiKey,
    });

    const system = `You are a precise audio transcription correction assistant. Your task is to fix word choice errors in transcription while preserving all timing data exactly. You must return ONLY a valid JSON array of word objects with no additional text, explanations, or markdown formatting.`;

    const prompt = `I have an original script and a machine transcription of the audio with timing data.

# Original Script
"""
${originalLines}
"""

# Raw Machine Transcription
"""
${rawText}
"""

# Machine Transcription with Word-Level Timing (JSON format)
${JSON.stringify(wordTimings, null, 2)}

Your task is to create a corrected version that:
1. Uses ONLY the words from the Original Script when there are errors in the transcription
2. PRESERVES the exact timing data (start:end times) from each word in the Machine Transcription
3. MAINTAINS all original punctuation, capitalization, and sentence structure
4. DOES NOT change the number of words or their order - only replaces incorrect words with the correct ones from the script
5. Preserves the exact formatting of sentences including spaces
6. ADDS the speaker information to each word based on which speaker said that word in the original script

IMPORTANT: The only valid speakers are "MAX" and "PEPE". Every word MUST have one of these two speakers assigned.

For each word in the machine transcription:
- If the word is correctly transcribed, keep it as is with its timing
- If the word is incorrect, find the corresponding correct word from the original script but keep original timing
- Add the speaker who said that word based on the original script (must be either "MAX" or "PEPE")
- Make sure to have the original punctuation, capitalization, and sentence structure

IMPORTANT: You must return ONLY a valid JSON array of corrected words with no additional text, explanations, or markdown formatting. Do not use code blocks, just return the raw JSON array. The format must be exactly:

[
  {
    "text": "corrected_word", 
    "start": start_time,
    "end": end_time,
    "type": "word",
    "speaker": "SPEAKER_NAME"
  },
  {
    "text": "next_word",
    "start": start_time,
    "end": end_time,
    "type": "word",
    "speaker": "SPEAKER_NAME"
  },
  ...
]

Do not include any explanations, comments, or additional text before or after the JSON array. Your entire response must be valid JSON that can be directly parsed.`;

    debug.info('Calling Claude to correct transcription words');

    // Call Claude to fix the transcription
    const { text: claudeResponse } = await aiGenerateText({
      model: anthropic.languageModel('claude-3-5-sonnet-20241022'),
      prompt,
      system,
      temperature: 0.1, // Very low temperature for consistent results
      maxTokens: 8192,
    });

    // Add debug logging for Claude's response
    debug.verbose('Claude raw response:', claudeResponse);

    // Clean up the response and attempt to parse JSON
    let cleanedResponse = claudeResponse.trim();
    // Remove any potential markdown code block markers
    cleanedResponse = cleanedResponse.replace(/```json\n?|\n?```/g, '');

    try {
      correctedWords = JSON.parse(cleanedResponse);
    } catch (parseError: unknown) {
      debug.error(
        'Failed to parse Claude response as JSON:',
        parseError instanceof Error ? parseError : String(parseError),
      );
      debug.error('Raw response that failed to parse:', cleanedResponse);
      throw new Error(
        `JSON parsing failed: ${
          parseError instanceof Error ? parseError.message : String(parseError)
        }`,
      );
    }

    // Ensure we got an array of word objects
    if (!Array.isArray(correctedWords) || correctedWords.length === 0) {
      throw new Error('Response is not a valid array');
    }

    // Validate the structure of each word object and ensure valid speakers
    const validWordObjects = correctedWords.every(
      (word) =>
        typeof word.text === 'string' &&
        typeof word.start === 'number' &&
        typeof word.end === 'number' &&
        typeof word.type === 'string' &&
        typeof word.speaker === 'string' &&
        (word.speaker === 'MAX' || word.speaker === 'PEPE'),
    );

    if (!validWordObjects) {
      throw new Error(
        'Some word objects have invalid structure or invalid speaker values',
      );
    }
  } catch (error) {
    debug.error(
      'Error using Claude for transcription correction:',
      error as Error,
    );
    throw error;
  }

  const alignedWords: TranscriptionWord[] = correctedWords.map((word) => ({
    text: word.text,
    start: word.start,
    end: word.end,
    type: word.type,
    speaker: word.speaker,
  }));

  // Final validation to ensure all words have valid speakers
  const allWordsHaveValidSpeakers = alignedWords.every(
    (word) => word.speaker === 'MAX' || word.speaker === 'PEPE',
  );

  if (!allWordsHaveValidSpeakers) {
    debug.error('Some words have invalid or missing speaker values');
    throw new Error('Invalid speaker values in transcription');
  }

  debug.info(
    `Claude corrected ${alignedWords.length} words from the transcription based on original script`,
  );

  return {
    text: rawTranscription.text,
    words: alignedWords,
  };
};
