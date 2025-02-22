import * as dotenv from 'dotenv';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

dotenv.config();

async function uploadFileToS3(
  jsonData: object,
  bucketName: string,
  key: string,
): Promise<void> {
  try {
    // Initialize the S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    // Convert JSON to string
    const jsonContent = JSON.stringify(jsonData, null, 2);

    // Upload parameters
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: jsonContent,
      ContentType: 'application/json',
    };

    // Upload the file
    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    console.log(`Successfully uploaded ${key} to ${bucketName}`);
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

async function readFileFromS3(
  bucketName: string,
  key: string,
): Promise<object> {
  try {
    // Initialize the S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    // Read parameters
    const params = {
      Bucket: bucketName,
      Key: key,
    };

    // Get the file
    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);

    // Convert the stream to string
    const bodyContents = await response.Body?.transformToString();
    if (!bodyContents) {
      throw new Error('Empty response from S3');
    }

    // Parse JSON string to object
    return JSON.parse(bodyContents);
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
}

// Example usage
async function main() {
  try {
    const testData = {
      message: 'Hello World',
      timestamp: new Date().toISOString(),
      testValue: 123,
    };

    const bucketName = 'alpha-hunter';
    const key = 'test.json';

    // Upload file
    await uploadFileToS3(testData, bucketName, key);

    // Read file
    const readData = await readFileFromS3(bucketName, key);
    console.log('Read data from S3:', readData);
  } catch (error) {
    console.error('Main error:', error);
  }
}

main();
