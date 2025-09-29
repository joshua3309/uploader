const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const Jimp = require('jimp');

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

    // Add watermark
    const watermarkedBuffer = await addWatermark(imageBuffer);
    
    console.log(`Watermarked image size: ${watermarkedBuffer.length} bytes`);

    // Upload to destination bucket
    const destKey = `watermarked/${objectKey}`;
    const putObjectCommand = new PutObjectCommand({
      Bucket: DEST_BUCKET,
      Key: destKey,
      Body: watermarkedBuffer,
      ContentType: response.ContentType || 'image/jpeg'
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

async function addWatermark(imageBuffer) {
  try {
    console.log('Adding watermark with Jimp...');
    
    // Load image with Jimp
    const image = await Jimp.read(imageBuffer);
    const { width, height } = image.bitmap;
    
    console.log(`Image dimensions: ${width}x${height}`);
    
    // Calculate watermark size (8% of image width, minimum 16px, maximum 120px)
    const watermarkSize = Math.max(16, Math.min(120, Math.floor(width * 0.08)));
    
    // Load font (Jimp comes with built-in fonts)
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    
    // Create watermark text
    const watermarkText = 'briefly.dev';
    
    // Calculate position (bottom-right corner with padding)
    const padding = 20;
    const textWidth = Jimp.measureText(font, watermarkText);
    const textHeight = Jimp.measureTextHeight(font, watermarkText);
    const x = width - textWidth - padding;
    const y = height - textHeight - padding;
    
    console.log(`Watermark position: x=${x}, y=${y}, size=${watermarkSize}`);
    
    // Add text shadow (dark outline) for better visibility
    const shadowFont = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    image.print(shadowFont, x + 2, y + 2, watermarkText);
    image.print(shadowFont, x + 1, y + 1, watermarkText);
    
    // Add main text
    image.print(font, x, y, watermarkText);
    
    // Convert back to buffer as JPEG
    const watermarkedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    
    console.log(`Watermark added: ${watermarkText}`);
    return watermarkedBuffer;
    
  } catch (error) {
    console.error('Error adding watermark:', error);
    
    // If it's a WebP or unsupported format error, skip watermarking
    if (error.message.includes('Unsupported MIME type') || error.message.includes('webp')) {
      console.log('Skipping unsupported image format, returning original image');
      return imageBuffer;
    }
    
    // For other errors, return original image
    console.log('Watermarking failed, returning original image');
    return imageBuffer;
  }
}
