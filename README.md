# 🚀 S3 File Uploader with Image Watermarking

A full-stack Next.js application that allows users to upload files to AWS S3 with automatic image watermarking via AWS Lambda. Features a clean web interface for uploading files and viewing watermarked images.

## ✨ Features

- **📁 File Upload**: Direct upload to S3 using presigned URLs
- **🖼️ Image Watermarking**: Automatic watermarking via AWS Lambda
- **📱 Responsive UI**: Clean, modern interface with image gallery
- **🔒 Secure**: Uses AWS IAM roles and presigned URLs
- **⚡ Fast**: Optimized for performance with Next.js
- **🚀 Auto-Deploy**: GitHub Actions CI/CD to EC2

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   Next.js App   │───▶│   S3 Upload  │───▶│  SQS Queue  │───▶│   Lambda    │
│   (Frontend)    │    │   Bucket     │    │             │    │ (Watermark) │
└─────────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
         │                      │                                      │
         │                      ▼                                      ▼
         │               ┌──────────────┐                    ┌─────────────┐
         └──────────────▶│   S3 Output  │◀───────────────────│  Watermarked│
                         │   Bucket     │                    │   Images    │
                         └──────────────┘                    └─────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, CSS-in-JS
- **Backend**: Next.js API Routes
- **Cloud**: AWS S3, Lambda, SQS
- **Image Processing**: Jimp (Node.js)
- **Deployment**: GitHub Actions → EC2
- **Process Management**: PM2

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- AWS Account with S3, Lambda, SQS access
- EC2 instance (for deployment)

### 1. Clone & Install

```bash
git clone <your-repo>
cd uploader
npm install
```

### 2. Environment Setup

Create `.env.local`:

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# S3 Buckets
AWS_S3_BUCKET=uploader-briefly
DEST_BUCKET=uploader-downloads-briefly
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
uploader/
├── src/
│   └── app/
│       ├── api/
│       │   ├── s3-presign/     # Generate presigned URLs
│       │   └── list-files/     # List watermarked files
│       ├── components/
│       │   └── FileList.js     # Image gallery component
│       ├── layout.js           # App layout
│       └── page.js             # Main upload page
├── lambda/                     # Image watermarking Lambda
├── .github/workflows/          # CI/CD pipeline
└── README.md
```

## 🔧 API Endpoints

### `POST /api/s3-presign`
Generates presigned URLs for direct S3 uploads.

**Request:**
```json
{
  "filename": "image.jpg",
  "contentType": "image/jpeg"
}
```

**Response:**
```json
{
  "url": "https://s3.amazonaws.com/presigned-url",
  "key": "uuid-filename.jpg",
  "bucket": "uploader-briefly"
}
```

### `GET /api/list-files`
Lists all watermarked files with presigned download URLs.

**Response:**
```json
{
  "files": [
    {
      "key": "watermarked/uuid-image.jpg",
      "filename": "image.jpg",
      "size": 12345,
      "lastModified": "2024-01-01T00:00:00Z",
      "url": "https://presigned-download-url"
    }
  ],
  "count": 1
}
```

## 🖼️ Image Watermarking

The Lambda function automatically processes uploaded images:

- **Supported Formats**: JPEG, PNG, GIF
- **Watermark**: "briefly.dev" in bottom-right corner
- **Style**: White text with black shadow
- **Size**: 8% of image width (16px-120px range)
- **Output**: Always JPEG format

### Lambda Setup

1. **Deploy Lambda Function:**
```bash
cd lambda
npm install
zip -r watermark-lambda.zip . -x "*.md"
```

2. **Configure Environment Variables:**
- `SOURCE_BUCKET`: uploader-briefly
- `DEST_BUCKET`: uploader-downloads-briefly
- `AWS_REGION`: us-east-1

3. **Set up SQS Trigger:**
- Create SQS queue
- Configure S3 bucket notifications → SQS
- Add SQS as Lambda trigger

## 🚀 Deployment

### GitHub Actions CI/CD

The project includes automated deployment to EC2:

1. **Required Secrets** (GitHub Repository Settings):
   ```
   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   AWS_REGION
   AWS_EC2_HOST
   AWS_EC2_USER
   EC2_SSH_KEY
   SLACK_WEBHOOK_URL (optional)
   ```

2. **Deployment Process:**
   - Builds Next.js application
   - Runs linting and tests
   - Syncs files to EC2 via SSH
   - Installs dependencies with retry logic
   - Restarts application with PM2

### Manual EC2 Deployment

```bash
# On EC2 instance
git clone <your-repo>
cd uploader
npm install
npm run build
npm start

# Or with PM2
pm2 start npm --name "uploader" -- start
pm2 save
pm2 startup
```

## 🔐 AWS IAM Permissions

### EC2 Instance Role
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::uploader-briefly",
        "arn:aws:s3:::uploader-briefly/*",
        "arn:aws:s3:::uploader-downloads-briefly",
        "arn:aws:s3:::uploader-downloads-briefly/*"
      ]
    }
  ]
}
```

### Lambda Execution Role
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

## 🐛 Troubleshooting

### Common Issues

1. **Upload Fails (500 Error)**
   - Check AWS credentials/IAM permissions
   - Verify S3 bucket names and region
   - Check EC2 security groups allow outbound HTTPS

2. **Images Not Watermarking**
   - Verify Lambda function is deployed
   - Check SQS queue configuration
   - Ensure S3 bucket notifications are set up

3. **SSH Connection Issues**
   - Verify EC2_SSH_KEY secret format
   - Check EC2 security group allows SSH (port 22)
   - Ensure EC2 instance is running

### Debug Commands

```bash
# Test AWS credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://uploader-briefly/
aws s3 ls s3://uploader-downloads-briefly/

# Check application logs
pm2 logs uploader

# Test Lambda function
aws lambda invoke --function-name watermark-lambda response.json
```

## 📊 Performance Features

- **Direct S3 Upload**: No server bottleneck for file uploads
- **Presigned URLs**: Secure, time-limited access
- **Image Optimization**: Automatic JPEG conversion
- **CDN Ready**: S3 serves static content efficiently
- **PM2 Process Management**: Auto-restart on crashes

## 🔄 Development Workflow

1. **Local Development**: `npm run dev`
2. **Testing**: Upload files and verify watermarking
3. **Deploy**: Push to GitHub triggers automatic deployment
4. **Monitor**: Check PM2 logs and S3 bucket contents

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ using Next.js and AWS**