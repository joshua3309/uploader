# 🚀 S3 File Uploader with Image Watermarking

A full-stack Next.js application that allows users to upload files to AWS S3 with automatic image watermarking via AWS Lambda. Features a clean web interface for uploading files and viewing watermarked images.

## ✨ Features

- **📁 File Upload**: Direct upload to S3 using presigned URLs
- **🖼️ Image Watermarking**: Automatic watermarking via AWS Lambda
- **📱 Responsive UI**: Clean, modern interface with image gallery
- **🔒 Secure**: HTTPS with SSL certificates from ACM
- **🌐 Custom Domain**: Professional domain with Route 53 DNS management
- **⚖️ Load Balancing**: Application Load Balancer for high availability
- **⚡ Fast**: Optimized for performance with Next.js
- **🚀 Auto-Deploy**: GitHub Actions CI/CD to EC2

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│  Custom Domain  │───▶│   Route 53   │───▶│     ALB     │───▶│   EC2 App   │
│downloadbriefly  │    │    DNS       │    │    HTTPS    │    │  (Next.js)  │
│    .shop        │    │              │    │             │    │             │
└─────────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
                                │                    │                │
                                │                    │                ▼
                                │                    │         ┌──────────────┐
                                │                    │         │   S3 Upload  │
                                │                    │         │   Bucket     │
                                │                    │         └──────────────┘
                                │                    │                │
                                │                    │                ▼
                                │                    │         ┌─────────────┐
                                │                    │         │  SQS Queue  │
                                │                    │         └─────────────┘
                                │                    │                │
                                │                    │                ▼
                                │                    │         ┌─────────────┐
                                │                    │         │   Lambda    │
                                │                    │         │ (Watermark) │
                                │                    │         └─────────────┘
                                │                    │                │
                                │                    │                ▼
                                │                    │         ┌─────────────┐
                                │                    └────────▶│   S3 Output │
                                │                              │   Bucket    │
                                └──────────────────────────────└─────────────┘
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, CSS-in-JS
- **Backend**: Next.js API Routes
- **Cloud**: AWS S3, Lambda, SQS, ALB, Route 53, ACM
- **Domain**: Hostinger domain with AWS Route 53 DNS
- **SSL**: AWS Certificate Manager (ACM)
- **Load Balancing**: Application Load Balancer
- **Image Processing**: Jimp (Node.js)
- **Deployment**: GitHub Actions → EC2
- **Process Management**: PM2

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- AWS Account with S3, Lambda, SQS, ALB, Route 53, ACM access
- EC2 instance (for deployment)
- Custom domain (Hostinger or other provider)

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

## 🌐 Domain & Infrastructure Setup

### Domain Configuration

**Domain**: `downloadbriefly.shop` (Hostinger)

**DNS Management**: AWS Route 53
- Domain registered with Hostinger
- DNS nameservers pointed to Route 53
- Route 53 manages all DNS records

### SSL Certificate Setup

**Certificate**: AWS Certificate Manager (ACM)
- SSL/TLS certificate for `downloadbriefly.shop`
- Automatically renewed by AWS
- Integrated with Application Load Balancer

### Application Load Balancer (ALB)

**Configuration**:
- **Protocol**: HTTPS (port 443)
- **SSL Certificate**: ACM certificate for `downloadbriefly.shop`
- **Target Group**: EC2 instances (port 3000)
- **Health Checks**: HTTP health checks on `/`
- **Security Groups**: Allow HTTPS (443) and HTTP (80) inbound

### Route 53 DNS Records

```
Type: A (Alias)
Name: downloadbriefly.shop
Target: ALB DNS name (dualstack.xxx.us-east-1.elb.amazonaws.com)
TTL: 300 seconds
```

### Infrastructure Components

1. **Route 53 Hosted Zone**: `downloadbriefly.shop`
2. **ACM Certificate**: Wildcard or specific domain certificate
3. **Application Load Balancer**: HTTPS termination and routing
4. **Target Group**: EC2 instances running Next.js
5. **Security Groups**: ALB and EC2 security configurations

### Complete Infrastructure Setup Guide

#### 1. Domain Setup (Hostinger → Route 53)

```bash
# In Hostinger control panel:
1. Go to DNS Zone Editor
2. Change nameservers to Route 53 nameservers:
   ns-xxx.awsdns-xx.org
   ns-xxx.awsdns-xx.co.uk
   ns-xxx.awsdns-xx.com
   ns-xxx.awsdns-xx.net
```

#### 2. Route 53 Configuration

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name downloadbriefly.shop \
  --caller-reference $(date +%s)

# Note the nameservers from the response
```

#### 3. ACM Certificate

```bash
# Request certificate for domain
aws acm request-certificate \
  --domain-name downloadbriefly.shop \
  --validation-method DNS \
  --subject-alternative-names "*.downloadbriefly.shop"

# Add DNS validation records to Route 53
```

#### 4. Application Load Balancer

```bash
# Create target group
aws elbv2 create-target-group \
  --name downloadbriefly-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxxxxxx

# Create ALB
aws elbv2 create-load-balancer \
  --name downloadbriefly-alb \
  --subnets subnet-xxxxxxxxx subnet-yyyyyyyyy \
  --security-groups sg-xxxxxxxxx \
  --scheme internet-facing

# Create HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

#### 5. Security Groups

**ALB Security Group**:
- Inbound: HTTP (80), HTTPS (443) from 0.0.0.0/0
- Outbound: HTTP (3000) to EC2 security group

**EC2 Security Group**:
- Inbound: HTTP (3000) from ALB security group, SSH (22) from your IP
- Outbound: HTTPS (443) to 0.0.0.0/0

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

1. **Domain Not Resolving**
   - Check Route 53 nameservers are set in Hostinger
   - Verify DNS propagation (can take 24-48 hours)
   - Test with `nslookup downloadbriefly.shop`
   - Check Route 53 hosted zone records

2. **SSL Certificate Issues**
   - Verify ACM certificate is validated and issued
   - Check certificate is attached to ALB listener
   - Ensure domain name matches certificate
   - Test SSL with `openssl s_client -connect downloadbriefly.shop:443`

3. **ALB Health Check Failures**
   - Check EC2 instance is running on port 3000
   - Verify security groups allow ALB → EC2 communication
   - Check target group health status in AWS console
   - Ensure Next.js app responds to health checks

4. **Upload Fails (500 Error)**
   - Check AWS credentials/IAM permissions
   - Verify S3 bucket names and region
   - Check EC2 security groups allow outbound HTTPS

5. **Images Not Watermarking**
   - Verify Lambda function is deployed
   - Check SQS queue configuration
   - Ensure S3 bucket notifications are set up

6. **SSH Connection Issues**
   - Verify EC2_SSH_KEY secret format
   - Check EC2 security group allows SSH (port 22)
   - Ensure EC2 instance is running

### Debug Commands

```bash
# Test domain resolution
nslookup downloadbriefly.shop
dig downloadbriefly.shop

# Test SSL certificate
openssl s_client -connect downloadbriefly.shop:443 -servername downloadbriefly.shop

# Test ALB health
curl -I https://downloadbriefly.shop/

# Test AWS credentials
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://uploader-briefly/
aws s3 ls s3://uploader-downloads-briefly/

# Check ALB target group health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:...

# Check application logs
pm2 logs uploader

# Test Lambda function
aws lambda invoke --function-name watermark-lambda response.json

# Test Route 53 records
aws route53 list-resource-record-sets --hosted-zone-id Z123456789

# Check ACM certificate status
aws acm list-certificates --certificate-statuses ISSUED
```

## 📊 Performance Features

- **Direct S3 Upload**: No server bottleneck for file uploads
- **Presigned URLs**: Secure, time-limited access
- **Image Optimization**: Automatic JPEG conversion
- **CDN Ready**: S3 serves static content efficiently
- **Load Balancing**: ALB distributes traffic across multiple EC2 instances
- **SSL Termination**: ALB handles HTTPS encryption
- **Health Checks**: Automatic failover for unhealthy instances
- **Custom Domain**: Professional branding with `downloadbriefly.shop`
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