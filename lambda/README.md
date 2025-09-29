# S3 Watermark Lambda Function

This Lambda function processes SQS messages triggered by S3 uploads, downloads images, adds a watermark, and uploads to a destination bucket.

## Setup Instructions

### 1. Install Dependencies
```bash
cd lambda
npm install
```

### 2. Create Deployment Package
```bash
# Install dependencies
npm install --production

# Create zip file
zip -r watermark-lambda.zip . -x "*.md" "node_modules/.cache/*"
```

### 3. Upload to Lambda
1. Go to AWS Lambda Console
2. Create new function or update existing
3. Upload the `watermark-lambda.zip` file
4. Set runtime to Node.js 18.x or later

### 4. Environment Variables
Set these in Lambda configuration:
- `SOURCE_BUCKET`: uploader-briefly (default)
- `DEST_BUCKET`: uploader-downloads-briefly (default)
- `AWS_REGION`: your AWS region

### 5. IAM Permissions
The Lambda execution role needs these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::uploader-briefly/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::uploader-downloads-briefly/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "your-sqs-queue-arn"
    }
  ]
}
```

### 6. SQS Trigger Setup
1. Create SQS queue
2. Configure S3 bucket to send notifications to SQS
3. Add SQS as Lambda trigger

## How It Works

1. S3 upload triggers SQS message
2. Lambda receives SQS message
3. Downloads image from source bucket
4. Adds "briefly.dev" watermark in bottom-right corner
5. Uploads watermarked image to destination bucket

## Supported Image Formats
- ✅ JPEG, PNG, GIF (fully supported with watermarking)
- ⚠️ WebP, TIFF, BMP (skipped - returns original image)

## Watermark Details
- Text: "briefly.dev"
- Position: Bottom-right corner with 20px padding
- Size: 8% of image width (16px-120px range)
- Style: White text with black shadow for visibility
- Font: Built-in Jimp sans-serif font
- Output: Always JPEG format
