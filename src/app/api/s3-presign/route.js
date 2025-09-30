import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "uploader-briefly";
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

// Configure S3 client with flexible authentication
// Supports both IAM roles (EC2) and AWS credentials (local development)
const createS3Client = () => {
  const config = { region: AWS_REGION };
  
  // If AWS credentials are provided via environment variables, use them
  // Otherwise, AWS SDK will automatically use IAM role credentials on EC2
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN })
    };
    console.log("[s3-presign] Using AWS credentials from environment variables");
  } else {
    console.log("[s3-presign] Using IAM role credentials (EC2) or default credential chain");
  }
  
  return new S3Client(config);
};

const s3Client = createS3Client();

export async function POST(request) {
  try {
    console.log(`[s3-presign] Starting request with bucket: ${BUCKET_NAME}, region: ${AWS_REGION}`);
    
    const body = await request.json();
    const { filename, contentType } = body || {};

    if (!filename || !contentType) {
      return Response.json(
        { error: "filename and contentType are required" },
        { status: 400 }
      );
    }

    const objectKey = `${uuidv4()}-${filename}`;
    console.log(`[s3-presign] Generating presigned URL for key: ${objectKey}`);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });
    console.log(`[s3-presign] Successfully generated presigned URL`);

    return Response.json({ url, key: objectKey, bucket: BUCKET_NAME });
  } catch (error) {
    console.error("[s3-presign] Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
      bucket: BUCKET_NAME,
      region: AWS_REGION
    });
    
    // Return more specific error information
    const errorMessage = error.code === 'NoSuchBucket' 
      ? `Bucket '${BUCKET_NAME}' does not exist`
      : error.code === 'AccessDenied'
      ? `Access denied to bucket '${BUCKET_NAME}'. Check IAM permissions.`
      : error.message || "Failed to generate presigned URL";
      
    return Response.json({ 
      error: errorMessage,
      code: error.code,
      bucket: BUCKET_NAME,
      region: AWS_REGION
    }, { status: 500 });
  }
}


