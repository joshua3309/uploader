#!/bin/bash

# Lambda deployment script
echo "Installing dependencies..."
npm install --production

echo "Creating deployment package..."
zip -r watermark-lambda.zip . -x "*.md" "deploy.sh" "node_modules/.cache/*"

echo "Deployment package created: watermark-lambda.zip"
echo "Upload this file to your Lambda function in the AWS Console"
echo ""
echo "Don't forget to:"
echo "1. Set environment variables (SOURCE_BUCKET, DEST_BUCKET, AWS_REGION)"
echo "2. Configure IAM permissions for S3 and SQS access"
echo "3. Set up SQS trigger from S3 bucket notifications"
