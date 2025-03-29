import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fal } from '@fal-ai/client';
import { getSecrets } from './secrets';

interface RecraftOptions {
  image_size?:
    | 'square_hd'
    | 'square'
    | 'portrait_4_3'
    | 'portrait_16_9'
    | 'landscape_4_3'
    | 'landscape_16_9';
  style?:
    | 'any'
    | 'realistic_image'
    | 'digital_illustration'
    | 'vector_illustration'
    | 'realistic_image/b_and_w'
    | 'realistic_image/hard_flash'
    | 'realistic_image/hdr'
    | 'realistic_image/natural_light'
    | 'realistic_image/studio_portrait'
    | 'realistic_image/enterprise'
    | 'realistic_image/motion_blur'
    | 'realistic_image/evening_light'
    | 'realistic_image/faded_nostalgia'
    | 'realistic_image/forest_life'
    | 'realistic_image/mystic_naturalism'
    | 'realistic_image/natural_tones'
    | 'realistic_image/organic_calm'
    | 'realistic_image/real_life_glow'
    | 'realistic_image/retro_realism'
    | 'realistic_image/retro_snapshot'
    | 'realistic_image/urban_drama'
    | 'realistic_image/village_realism'
    | 'realistic_image/warm_folk'
    | 'digital_illustration/pixel_art'
    | 'digital_illustration/hand_drawn'
    | 'digital_illustration/grain'
    | 'digital_illustration/infantile_sketch'
    | 'digital_illustration/2d_art_poster'
    | 'digital_illustration/handmade_3d'
    | 'digital_illustration/hand_drawn_outline'
    | 'digital_illustration/engraving_color'
    | 'digital_illustration/2d_art_poster_2'
    | 'digital_illustration/antiquarian'
    | 'digital_illustration/bold_fantasy'
    | 'digital_illustration/child_book'
    | 'digital_illustration/child_books'
    | 'digital_illustration/cover'
    | 'digital_illustration/crosshatch'
    | 'digital_illustration/digital_engraving'
    | 'digital_illustration/expressionism'
    | 'digital_illustration/freehand_details'
    | 'digital_illustration/grain_20'
    | 'digital_illustration/graphic_intensity'
    | 'digital_illustration/hard_comics'
    | 'digital_illustration/long_shadow'
    | 'digital_illustration/modern_folk'
    | 'digital_illustration/multicolor'
    | 'digital_illustration/neon_calm'
    | 'digital_illustration/noir'
    | 'digital_illustration/nostalgic_pastel'
    | 'digital_illustration/outline_details'
    | 'digital_illustration/pastel_gradient'
    | 'digital_illustration/pastel_sketch'
    | 'digital_illustration/pop_art'
    | 'digital_illustration/pop_renaissance'
    | 'digital_illustration/street_art'
    | 'digital_illustration/tablet_sketch'
    | 'digital_illustration/urban_glow'
    | 'digital_illustration/urban_sketching'
    | 'digital_illustration/vanilla_dreams'
    | 'digital_illustration/young_adult_book'
    | 'digital_illustration/young_adult_book_2'
    | 'vector_illustration/bold_stroke'
    | 'vector_illustration/chemistry'
    | 'vector_illustration/colored_stencil'
    | 'vector_illustration/contour_pop_art'
    | 'vector_illustration/cosmics'
    | 'vector_illustration/cutout'
    | 'vector_illustration/depressive'
    | 'vector_illustration/editorial'
    | 'vector_illustration/emotional_flat'
    | 'vector_illustration/infographical'
    | 'vector_illustration/marker_outline'
    | 'vector_illustration/mosaic'
    | 'vector_illustration/naivector'
    | 'vector_illustration/roundish_flat'
    | 'vector_illustration/segmented_colors'
    | 'vector_illustration/sharp_contrast'
    | 'vector_illustration/thin'
    | 'vector_illustration/vector_photo'
    | 'vector_illustration/vivid_shapes'
    | 'vector_illustration/engraving'
    | 'vector_illustration/line_art'
    | 'vector_illustration/line_circuit'
    | 'vector_illustration/linocut';
  outputPath?: string;
}

export class Fal {
  constructor() {
    const secrets = getSecrets();
    fal.config({
      credentials: secrets.falApiKey,
    });
  }

  async recraft(prompt: string, opts: RecraftOptions = {}) {
    const defaultOpts: RecraftOptions = {
      image_size: 'landscape_16_9',
      style: 'realistic_image/natural_light',
    };

    const options = { ...defaultOpts, ...opts };
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await fal.subscribe('fal-ai/recraft-v3', {
          input: {
            prompt,
            ...options,
          },
          onQueueUpdate: (update) => {
            if (update.status === 'IN_PROGRESS') {
              //   console.log('Progress:', update);
            }
          },
          logs: true,
        });

        if (result.data.images?.[0]) {
          const outputDir = opts.outputPath
            ? path.dirname(opts.outputPath)
            : path.join('data', 'images');

          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          const imageUrl = result.data.images[0].url;
          const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
          });

          const imagePath =
            opts.outputPath || path.join(outputDir, `image_${Date.now()}.png`);

          fs.writeFileSync(imagePath, Buffer.from(imageResponse.data));

          return imagePath;
        }
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt} failed:`, (error as Error).message);
        if (attempt < maxRetries) {
          // Wait for 1 second before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    throw new Error(
      `Failed after ${maxRetries} attempts. Last error: ${(lastError as Error)?.message}`,
    );
  }
}
