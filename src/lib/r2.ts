import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "trackio-uploads";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g. https://pub-xxx.r2.dev

/** Whether R2 is configured and available */
export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_PUBLIC_URL);
}

function getClient(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Upload a file to Cloudflare R2.
 * Returns the public URL of the uploaded file.
 *
 * @param buffer - File contents as a Buffer
 * @param contentType - MIME type (e.g. "image/jpeg")
 * @param folder - Optional folder prefix (e.g. "assets", "condition-checks")
 * @returns Public URL string
 */
export async function uploadToR2(
  buffer: Buffer,
  contentType: string,
  folder = "uploads"
): Promise<string> {
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const key = `${folder}/${randomUUID()}.${ext}`;

  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Delete a file from R2 by its key (extracted from the URL).
 */
export async function deleteFromR2(url: string): Promise<void> {
  if (!R2_PUBLIC_URL || !url.startsWith(R2_PUBLIC_URL)) return;
  const key = url.replace(`${R2_PUBLIC_URL}/`, "");

  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })
  );
}
