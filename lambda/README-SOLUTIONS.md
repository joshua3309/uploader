# Lambda Watermarking Solutions

## Problem
Sharp has native dependencies that cause issues when building on macOS and deploying to Lambda (Linux).

## Solutions (Choose One)

### Option 1: Use AWS Lambda Layers (Recommended)
```bash
# Use pre-compiled Sharp layer
# Layer ARN: arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:25
# Or find Sharp layers at: https://github.com/aws-samples/aws-lambda-layers
```

### Option 2: Simple Metadata Approach (Current)
- No external dependencies
- Adds watermark as metadata
- Works immediately
- Good for proof of concept

### Option 3: Use Canvas API (Alternative)
```javascript
// Add to package.json
"canvas": "^2.11.2"

// Use in Lambda
const { createCanvas, loadImage } = require('canvas');
```

### Option 4: Use AWS Services
- AWS Rekognition for image processing
- AWS Step Functions for complex workflows
- S3 Object Lambda for real-time processing

## Current Implementation
The current code uses a simple metadata approach that:
1. Downloads image from S3
2. Adds watermark metadata
3. Uploads to destination bucket
4. No complex image processing

## To Deploy Current Version
```bash
cd lambda
npm install
zip -r watermark-lambda.zip . -x "*.md" "deploy.sh"
```

## For Production Watermarking
Consider using AWS Lambda layers with pre-compiled Sharp:
1. Find Sharp layer for your region
2. Add layer to Lambda function
3. Use the original Sharp-based code
