import { Fal, RecraftOptions } from '@/utils/fal';
import path from 'path';

async function getAllStyles(): Promise<string[]> {
  return [
    // realistic_image styles
    'realistic_image/b_and_w',
    'realistic_image/hard_flash',
    'realistic_image/hdr',
    'realistic_image/natural_light',
    'realistic_image/studio_portrait',
    'realistic_image/enterprise',
    'realistic_image/motion_blur',
    'realistic_image/evening_light',
    'realistic_image/faded_nostalgia',
    'realistic_image/forest_life',
    'realistic_image/mystic_naturalism',
    'realistic_image/natural_tones',
    'realistic_image/organic_calm',
    'realistic_image/real_life_glow',
    'realistic_image/retro_realism',
    'realistic_image/retro_snapshot',
    'realistic_image/urban_drama',
    'realistic_image/village_realism',
    'realistic_image/warm_folk',

    // digital_illustration styles
    'digital_illustration/pixel_art',
    'digital_illustration/hand_drawn',
    'digital_illustration/grain',
    'digital_illustration/infantile_sketch',
    'digital_illustration/2d_art_poster',
    'digital_illustration/handmade_3d',
    'digital_illustration/hand_drawn_outline',
    'digital_illustration/engraving_color',
    'digital_illustration/2d_art_poster_2',
    'digital_illustration/antiquarian',
    'digital_illustration/bold_fantasy',
    'digital_illustration/child_book',
    'digital_illustration/child_books',
    'digital_illustration/cover',
    'digital_illustration/crosshatch',
    'digital_illustration/digital_engraving',
    'digital_illustration/expressionism',
    'digital_illustration/freehand_details',
    'digital_illustration/grain_20',
    'digital_illustration/graphic_intensity',
    'digital_illustration/hard_comics',
    'digital_illustration/long_shadow',
    'digital_illustration/modern_folk',
    'digital_illustration/multicolor',
    'digital_illustration/neon_calm',
    'digital_illustration/noir',
    'digital_illustration/nostalgic_pastel',
    'digital_illustration/outline_details',
    'digital_illustration/pastel_gradient',
    'digital_illustration/pastel_sketch',
    'digital_illustration/pop_art',
    'digital_illustration/pop_renaissance',
    'digital_illustration/street_art',
    'digital_illustration/tablet_sketch',
    'digital_illustration/urban_glow',
    'digital_illustration/urban_sketching',
    'digital_illustration/vanilla_dreams',
    'digital_illustration/young_adult_book',
    'digital_illustration/young_adult_book_2',
  ];
}

async function testRecraftV3() {
  try {
    console.log('Testing Recraft V3 API with all styles...');
    const fal = new Fal();
    const styles = await getAllStyles();

    for (const style of styles) {
      console.log(`Testing style: ${style}`);
      const outputPath = path.join(
        __dirname,
        'recraft',
        `test_${style.replace('/', '_')}_${Date.now()}.png`,
      );

      try {
        const imagePath = await fal.recraft(
          'A human-like green frog sitting on an armchair',
          {
            image_size: 'landscape_16_9',
            style,
            outputPath,
          } as RecraftOptions,
        );
        console.log(`✓ Success - Image saved to: ${imagePath}`);
      } catch (error) {
        console.error(`✗ Failed for style ${style}:`, error);
        // Continue with next style even if one fails
        continue;
      }

      // Add small delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('All style tests completed');
  } catch (error) {
    console.error('Error in test suite:', error);
  }
}

// Execute the test function
testRecraftV3().catch((error) => {
  console.error('Application error:', error);
  process.exit(1);
});
