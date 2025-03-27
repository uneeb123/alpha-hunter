import { Debugger } from '@/utils/debugger';
import { getSecrets } from '@/utils/secrets';
import * as fs from 'fs';
import * as path from 'path';
import { fal } from '@ai-sdk/fal';
import { experimental_generateImage as generateImageAI } from 'ai';

interface ImageGenerationOptions {
  prompt: string;
  n?: number;
  outputPath?: string;
}

export async function generateImagesFromTranscriptSegment(
  text: string,
  segmentIndex: number,
  outputDir: string,
): Promise<string> {
  const debug = Debugger.getInstance();
  debug.info(`Generating image for transcript segment ${segmentIndex}`);

  // Generate a visualization prompt based on the text
  const prompt = `Create a visually engaging image that represents the following text: "${text}". \
The image should be suitable for a video presentation, with clear composition, bright colors, \
and visual elements that relate to the key concepts in the text.`;

  // Generate the image with 16:9 aspect ratio for video
  const imagePath = await generateImage({
    prompt,
    outputPath: path.join(outputDir, `segment_${segmentIndex}.png`),
  });

  debug.info(`Generated image saved at: ${imagePath}`);
  return imagePath;
}

export async function generateImage(
  options: ImageGenerationOptions,
): Promise<string> {
  const debug = Debugger.getInstance();
  const secrets = getSecrets();

  if (!secrets.falApiKey) {
    throw new Error('Fal API key is required for image generation');
  }

  try {
    debug.info(
      `Generating image with prompt: ${options.prompt.substring(0, 50)}...`,
    );

    // Use Fal AI provider instead of Vertex
    const falProvider = fal;

    // Use AI SDK to generate the image with Fal
    const { image } = await generateImageAI({
      model: falProvider.image('fal-ai/fast-sdxl'),
      prompt: options.prompt,
      aspectRatio: '16:9',
    });

    // Ensure the output directory exists
    const outputDir = path.dirname(options.outputPath || '');
    if (outputDir && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save the image to the specified path or generate a unique filename
    const imagePath =
      options.outputPath ||
      path.join('data', 'images', `image_${Date.now()}.png`);

    // Convert image data to buffer and save
    fs.writeFileSync(imagePath, image.uint8Array);

    debug.info(`Image saved to ${imagePath}`);
    return imagePath;
  } catch (error) {
    debug.error(`Failed to generate image: ${error}`);
    throw error;
  }
}
