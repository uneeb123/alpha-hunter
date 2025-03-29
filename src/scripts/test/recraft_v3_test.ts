import { Fal } from '@/utils/fal';
import path from 'path';

async function testRecraftV3() {
  try {
    console.log('Testing Recraft V3 API with official client...');

    const fal = new Fal();
    const outputPath = path.join(
      __dirname,
      'recraft',
      `test_${Date.now()}.png`,
    );

    const imagePath = await fal.recraft(
      'A human-like green frog sitting on an armchair',
      {
        image_size: 'landscape_16_9',
        style: 'digital_illustration/hand_drawn',
        outputPath,
      },
    );

    console.log(`Image generated successfully and saved to: ${imagePath}`);
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error testing Recraft V3 API:', error);
  }
}

// Execute the test function
testRecraftV3().catch((error) => {
  console.error('Application error:', error);
  process.exit(1);
});
