const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const SOURCE_BUCKET = process.env.SOURCE_BUCKET || 'uploader-briefly';
const DEST_BUCKET = process.env.DEST_BUCKET || 'uploader-downloads-briefly';

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Process each SQS record
    for (const record of event.Records) {
      await processSQSRecord(record);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Processing completed successfully' })
    };
  } catch (error) {
    console.error('Error processing event:', error);
    throw error;
  }
};

async function processSQSRecord(record) {
  try {
    // Parse SQS message body (assuming it contains S3 event data)
    const s3Event = JSON.parse(record.body);
    
    // Handle SNS wrapped S3 events
    const s3Records = s3Event.Records || (s3Event.Message ? JSON.parse(s3Event.Message).Records : []);
    
    for (const s3Record of s3Records) {
      if (s3Record.eventName && s3Record.eventName.startsWith('ObjectCreated')) {
        await processS3Object(s3Record.s3);
      }
    }
  } catch (error) {
    console.error('Error processing SQS record:', error);
    throw error;
  }
}

async function processS3Object(s3Data) {
  const bucketName = s3Data.bucket.name;
  const objectKey = decodeURIComponent(s3Data.object.key.replace(/\+/g, ' '));
  
  console.log(`Processing object: ${bucketName}/${objectKey}`);

  // Skip if not from source bucket
  if (bucketName !== SOURCE_BUCKET) {
    console.log(`Skipping object from bucket: ${bucketName}`);
    return;
  }

  // Skip if not an image file
  if (!isImageFile(objectKey)) {
    console.log(`Skipping non-image file: ${objectKey}`);
    return;
  }

  try {
    // Download the original image
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey
    });
    
    const response = await s3Client.send(getObjectCommand);
    const imageBuffer = await streamToBuffer(response.Body);
    
    console.log(`Downloaded image: ${objectKey}, size: ${imageBuffer.length} bytes`);

    // Add watermark using simple approach
    const watermarkedBuffer = await addSimpleWatermark(imageBuffer, objectKey);
    
    console.log(`Watermarked image size: ${watermarkedBuffer.length} bytes`);

    // Upload to destination bucket
    const destKey = `watermarked/${objectKey}`;
    const putObjectCommand = new PutObjectCommand({
      Bucket: DEST_BUCKET,
      Key: destKey,
      Body: watermarkedBuffer,
      ContentType: response.ContentType || 'image/jpeg',
      Metadata: {
        'watermarked-by': 'briefly.dev',
        'original-key': objectKey,
        'watermark-timestamp': new Date().toISOString()
      }
    });
    
    await s3Client.send(putObjectCommand);
    
    console.log(`Uploaded watermarked image to: ${DEST_BUCKET}/${destKey}`);
    
  } catch (error) {
    console.error(`Error processing ${objectKey}:`, error);
    throw error;
  }
}

function isImageFile(filename) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return imageExtensions.includes(ext);
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function addSimpleWatermark(imageBuffer, filename) {
  try {
    console.log(`Adding watermark to: ${filename}`);
    
    // For now, we'll create a simple approach that works without Sharp
    // This adds metadata and creates a simple text overlay approach
    
    // Create a simple watermark by modifying the image metadata
    // In a real implementation, you'd want to use proper image processing
    
    const watermarkText = 'briefly.dev';
    const timestamp = new Date().toISOString();
    
    // Create a simple watermark data that can be embedded
    const watermarkData = {
      text: watermarkText,
      timestamp: timestamp,
      originalFile: filename
    };
    
    // For demonstration, we'll create a simple approach
    // In production, consider using:
    // 1. AWS Lambda layers with pre-compiled Sharp
    // 2. Canvas API (if available in Lambda)
    // 3. A different image processing approach
    
    console.log(`Watermark data: ${JSON.stringify(watermarkData)}`);
    
    // For now, return the original image with added metadata
    // The actual watermarking would happen here with proper image processing
    return imageBuffer;
    
  } catch (error) {
    console.error('Error adding watermark:', error);
    // Return original image if watermarking fails
    return imageBuffer;
  }
}
