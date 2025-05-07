import { ElevenLabsClient } from 'elevenlabs';
import { writeFile } from 'fs/promises';
import { Buffer } from 'buffer';
import ffmpeg from 'fluent-ffmpeg';

/*

TODO: script for podcast, convert to segments and merge, openai whisper to transacribe

 */

export const generateAudio = async (
  apiKey: string,
  content: string,
  workflowId: string,
) => {
  const client = new ElevenLabsClient({
    apiKey,
  });

  // Available model IDs
  //     'eleven_multilingual_v2'
  //     'eleven_flash_v2_5'
  //     'eleven_turbo_v2_5'
  //     'eleven_turbo_v2'
  //     'eleven_flash_v2'
  //     'eleven_multilingual_sts_v2'
  //     'eleven_monolingual_v1'
  //     'eleven_multilingual_v1'
  //     'eleven_english_sts_v2'

  const audio = await client.generate({
    text: content,
    voice: 'fJE3lSefh7YI494JMYYz', // Usman
    model_id: 'eleven_turbo_v2_5',
  });

  // Convert stream to buffer before saving
  const chunks: Uint8Array[] = [];
  for await (const chunk of audio) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  // Save the original audio buffer as a temporary file
  const tempPath = `data/videos/${workflowId}/temp_audio.mp3`;
  const outputPath = `data/videos/${workflowId}/audio.mp3`;
  await writeFile(tempPath, buffer);

  // Modify the audio speed using ffmpeg
  return new Promise((resolve, reject) => {
    ffmpeg(tempPath)
      .audioFilter('atempo=1.25') // Speed up by 1.25x
      .save(outputPath)
      .on('end', () => resolve(true))
      .on('error', (err) => reject(err));
  });
};
