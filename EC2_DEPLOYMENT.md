# EC2 Deployment Guide

## Prerequisites

1. **EC2 Instance** with Node.js installed
2. **IAM Role** attached to EC2 with S3 permissions (for EC2 deployment)
3. **S3 Buckets** created and accessible

## Authentication Options

The application supports two authentication methods:

### Option 1: IAM Role (Recommended for EC2)
- Attach an IAM role to your EC2 instance
- No need to manage AWS credentials
- More secure for production deployments

### Option 2: AWS Credentials (For Local Development)
- Use AWS access keys for local testing
- Set environment variables with your credentials
- Useful for development and testing

## IAM Role Permissions

Your EC2 IAM role needs these permissions:

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

## Environment Variables

### For EC2 Deployment (IAM Role)
Create a `.env.local` file on your EC2 instance:

```bash
# AWS Configuration (optional with IAM role)
AWS_REGION=us-east-1

# S3 Bucket Names
AWS_S3_BUCKET=uploader-briefly
DEST_BUCKET=uploader-downloads-briefly
```

### For Local Development (AWS Credentials)
Create a `.env.local` file for local development:

```bash
# AWS Configuration (required for local development)
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1

# S3 Bucket Names
AWS_S3_BUCKET=uploader-briefly
DEST_BUCKET=uploader-downloads-briefly
```

### For AWS CLI Profile (Alternative)
You can also use AWS CLI profiles by setting:

```bash
AWS_PROFILE=your-profile-name
AWS_REGION=us-east-1
AWS_S3_BUCKET=uploader-briefly
DEST_BUCKET=uploader-downloads-briefly
```

## Local Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd uploader
   npm install
   ```

2. **Set up AWS credentials (choose one method):**

   **Method A: Environment Variables**
   ```bash
   # Create .env.local file
   echo "AWS_ACCESS_KEY_ID=your_access_key" >> .env.local
   echo "AWS_SECRET_ACCESS_KEY=your_secret_key" >> .env.local
   echo "AWS_REGION=us-east-1" >> .env.local
   echo "AWS_S3_BUCKET=uploader-briefly" >> .env.local
   echo "DEST_BUCKET=uploader-downloads-briefly" >> .env.local
   ```

   **Method B: AWS CLI Profile**
   ```bash
   # Configure AWS CLI
   aws configure
   
   # Create .env.local file
   echo "AWS_PROFILE=default" >> .env.local
   echo "AWS_REGION=us-east-1" >> .env.local
   echo "AWS_S3_BUCKET=uploader-briefly" >> .env.local
   echo "DEST_BUCKET=uploader-downloads-briefly" >> .env.local
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## EC2 Deployment Steps

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd uploader
   npm install
   ```

2. **Set environment variables (if not using IAM role):**
   ```bash
   export AWS_REGION=us-east-1
   export AWS_S3_BUCKET=uploader-briefly
   export DEST_BUCKET=uploader-downloads-briefly
   ```

3. **Build and start the application:**
   ```bash
   npm run build
   npm start
   ```

4. **Check logs for errors:**
   ```bash
   # Check application logs
   pm2 logs
   
   # Or if running directly
   npm start
   ```

## How Authentication Works

The application automatically detects which authentication method to use:

1. **If `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set:**
   - Uses explicit AWS credentials from environment variables
   - Perfect for local development
   - Logs: "Using AWS credentials from environment variables"

2. **If no explicit credentials are provided:**
   - Falls back to AWS SDK's default credential chain
   - On EC2: Uses IAM role credentials automatically
   - On local: Uses AWS CLI profile or other credential sources
   - Logs: "Using IAM role credentials (EC2) or default credential chain"

## Troubleshooting

### Common Issues:

1. **500 Internal Server Error**: Check IAM permissions and bucket names
2. **Access Denied**: Verify EC2 IAM role has S3 permissions
3. **NoSuchBucket**: Ensure bucket names match your actual S3 buckets
4. **Credentials not found**: Check if AWS credentials are properly set

### Debug Steps:

1. **Check application logs** for authentication method being used
2. **Verify IAM role** is attached to EC2 instance (for EC2 deployment)
3. **Test S3 access** from command line:
   ```bash
   # Test with current credentials
   aws s3 ls s3://uploader-briefly/
   aws s3 ls s3://uploader-downloads-briefly/
   
   # Check current AWS identity
   aws sts get-caller-identity
   ```

4. **For local development**, ensure your AWS credentials are valid:
   ```bash
   # Test AWS CLI
   aws sts get-caller-identity
   
   # Test S3 access
   aws s3 ls s3://uploader-briefly/
   ```

## Security Groups

Ensure your EC2 security group allows:
- Port 3000 (or your chosen port) for HTTP traffic
- Port 22 for SSH access
