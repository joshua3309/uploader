# Lambda Watermarking Solutions

## Problem
Sharp has native dependencies that cause issues when building on macOS and deploying to Lambda (Linux).

## Solutions (Choose One)

### Option 1: Jimp-Only Approach (Current - Recommended)
- ✅ Pure JavaScript - no native dependencies
- ✅ Cross-platform compatible
- ✅ Real image watermarking with text overlay
- ✅ Works on macOS and deploys to Lambda
- ⚠️ Limited format support (JPEG, PNG, GIF)
- ⚠️ Skips WebP, TIFF, BMP gracefully

### Option 2: Use AWS Lambda Layers
```bash
# Use pre-compiled Sharp layer
# Layer ARN: arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:25
# Or find Sharp layers at: https://github.com/aws-samples/aws-lambda-layers
```

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

## Current Implementation (Jimp-Only)
The current code uses Jimp for real watermarking:
1. Downloads image from S3
2. Adds "briefly.dev" text watermark in bottom-right corner
3. Handles JPEG, PNG, GIF with full watermarking
4. Skips WebP, TIFF, BMP gracefully (returns original)
5. Uploads watermarked image to destination bucket

## To Deploy Current Version
```bash
cd lambda
npm install
zip -r watermark-lambda-jimp.zip . -x "*.md" "deploy*.sh"
```

## Format Support
- ✅ **JPEG, PNG, GIF** - Full watermarking support
- ⚠️ **WebP, TIFF, BMP** - Gracefully skipped (no crashes)
- 📤 **Output** - Always JPEG format

## For Production with All Formats
Consider using AWS Lambda layers with pre-compiled Sharp:
1. Find Sharp layer for your region
2. Add layer to Lambda function
3. Use Sharp-based code for full format support
