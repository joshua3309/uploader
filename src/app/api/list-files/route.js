import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const DEST_BUCKET = process.env.DEST_BUCKET || "uploader-downloads-briefly";
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

const s3Client = new S3Client({ region: AWS_REGION });

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || 'watermarked/';
    const maxKeys = parseInt(searchParams.get('maxKeys')) || 100;

    const command = new ListObjectsV2Command({
      Bucket: DEST_BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await s3Client.send(command);
    
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
    console.error("/api/list-files error", error);
    return Response.json({ error: "Failed to list files" }, { status: 500 });
  }
}
