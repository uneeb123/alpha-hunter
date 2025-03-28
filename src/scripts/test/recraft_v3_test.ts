import { Fal } from '@/utils/fal';

async function testRecraftV3() {
  try {
    console.log('Testing Recraft V3 API with official client...');

    const fal = new Fal(12345); // Test processor ID
    const result = await fal.recraft(
      'A serene mountain landscape with a clear blue lake',
      {
        image_size: 'square_hd',
        style: 'realistic_image/natural_light',
      },
    );

    console.log('Request ID:', result.requestId);
    console.log('Response received:', JSON.stringify(result.data, null, 2));
    console.log(`Image saved to: ${result.imagePath}`);
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
