#!/bin/bash

# Lambda deployment script with Jimp
echo "Installing dependencies with Jimp..."
npm install --production

echo "Creating deployment package..."
zip -r watermark-lambda-jimp.zip . -x "*.md" "deploy*.sh" "node_modules/.cache/*"

echo "Deployment package created: watermark-lambda-jimp.zip"
echo "Upload this file to your Lambda function in the AWS Console"
echo ""
echo "Jimp benefits:"
echo "✅ Pure JavaScript - no native dependencies"
echo "✅ Cross-platform compatible"
echo "✅ Real image watermarking with text overlay"
echo "✅ Works on macOS and deploys to Lambda"
echo ""
echo "Don't forget to:"
echo "1. Set environment variables (SOURCE_BUCKET, DEST_BUCKET, AWS_REGION)"
echo "2. Configure IAM permissions for S3 and SQS access"
echo "3. Set up SQS trigger from S3 bucket notifications"
