import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const DEST_BUCKET = process.env.DEST_BUCKET || "uploader-downloads-briefly";
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
    console.log("[list-files] Using AWS credentials from environment variables");
  } else {
    console.log("[list-files] Using IAM role credentials (EC2) or default credential chain");
  }
  
  return new S3Client(config);
};

const s3Client = createS3Client();

export async function GET(request) {
  try {
    console.log(`[list-files] Starting request with bucket: ${DEST_BUCKET}, region: ${AWS_REGION}`);
    
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || 'watermarked/';
    const maxKeys = parseInt(searchParams.get('maxKeys')) || 100;

    console.log(`[list-files] Listing objects with prefix: ${prefix}`);

    const command = new ListObjectsV2Command({
      Bucket: DEST_BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await s3Client.send(command);
    console.log(`[list-files] Successfully listed ${response.Contents?.length || 0} objects`);
    
    const files = await Promise.all((response.Contents || []).map(async obj => {
      // Generate a presigned URL for viewing the image
      const getObjectCommand = new GetObjectCommand({
        Bucket: DEST_BUCKET,
        Key: obj.Key,
      });
      
      const presignedUrl = await getSignedUrl(s3Client, getObjectCommand, { 
        expiresIn: 3600 // 1 hour
      });

      return {
        key: obj.Key,
        lastModified: obj.LastModified,
        size: obj.Size,
        storageClass: obj.StorageClass,
        // Extract filename from the key (remove 'watermarked/' prefix)
        filename: obj.Key.replace('watermarked/', ''),
        // Use presigned URL for secure access
        url: presignedUrl
      };
    }));

    return Response.json({ 
      files,
      isTruncated: response.IsTruncated,
      nextContinuationToken: response.NextContinuationToken,
      count: files.length
    });
  } catch (error) {
    console.error("[list-files] Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
      bucket: DEST_BUCKET,
      region: AWS_REGION
    });
    
    // Return more specific error information
    const errorMessage = error.code === 'NoSuchBucket' 
      ? `Bucket '${DEST_BUCKET}' does not exist`
      : error.code === 'AccessDenied'
      ? `Access denied to bucket '${DEST_BUCKET}'. Check IAM permissions.`
      : error.message || "Failed to list files";
      
    return Response.json({ 
      error: errorMessage,
      code: error.code,
      bucket: DEST_BUCKET,
      region: AWS_REGION
    }, { status: 500 });
  }
}
