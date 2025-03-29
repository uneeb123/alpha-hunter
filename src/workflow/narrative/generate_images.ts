import { Debugger } from '@/utils/debugger';
import * as path from 'path';
import { Fal } from '@/utils/fal';

interface ImageGenerationOptions {
  prompt: string;
  n?: number;
  outputPath?: string;
  character: string;
}

export async function generateImagesFromTranscriptSegment(
  prompt: string,
  segmentIndex: number,
  outputDir: string,
  character: string,
): Promise<string> {
  const debug = Debugger.getInstance();
  debug.info(`Generating image for transcript segment ${segmentIndex}`);

  // Generate the image with 16:9 aspect ratio for video
  const imagePath = await generateImage({
    prompt,
    outputPath: path.join(outputDir, `segment_${segmentIndex}.png`),
    character,
  });

  debug.info(`Generated image saved at: ${imagePath}`);
  return imagePath;
}

export async function generateImage(
  options: ImageGenerationOptions,
): Promise<string> {
  const debug = Debugger.getInstance();

  try {
    debug.info(
      `Generating image with prompt: ${options.prompt.substring(0, 50)}...`,
    );

    // Create Fal instance and use recraft
    const fal = new Fal();
    const imagePath = await fal.recraft(options.prompt, {
      image_size: 'landscape_16_9',
      style: 'realistic_image/natural_light',
      outputPath: options.outputPath,
    });

    debug.info(`Image saved to ${imagePath}`);
    return imagePath;
  } catch (error) {
    debug.error(`Failed to generate image: ${error}`);
    throw error;
  }
}
