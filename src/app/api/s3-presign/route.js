import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "uploader-briefly";
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION; // falls back to shared config if undefined

const s3Client = new S3Client({ region: AWS_REGION });

export async function POST(request) {
  try {
    const body = await request.json();
    const { filename, contentType } = body || {};

    if (!filename || !contentType) {
      return Response.json(
        { error: "filename and contentType are required" },
        { status: 400 }
      );
    }

    const objectKey = `${uuidv4()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    return Response.json({ url, key: objectKey, bucket: BUCKET_NAME });
  } catch (error) {
    console.error("/api/s3-presign error", error);
    return Response.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}


