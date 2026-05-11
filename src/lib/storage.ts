import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Storage configuration — supports S3, Cloudflare R2, MinIO, etc.
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || "local"; // "s3" | "local"

const s3Client =
  STORAGE_PROVIDER === "s3"
    ? new S3Client({
        region: process.env.AWS_REGION || "ap-southeast-2",
        endpoint: process.env.S3_ENDPOINT, // For R2: https://<account>.r2.cloudflarestorage.com
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
        forcePathStyle: !!process.env.S3_FORCE_PATH_STYLE, // For MinIO/R2
      })
    : null;

const BUCKET = process.env.S3_BUCKET || "naturo-portal-uploads";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Upload a file to cloud storage (S3/R2) or fall back to local filesystem.
 */
export async function uploadFile(
  file: File,
  folder: string = "uploads"
): Promise<UploadResult> {
  // Validate
  if (file.size > MAX_SIZE) {
    throw new Error("File too large (max 5MB)");
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, HEIC");
  }

  const ext = file.name.split(".").pop() || "jpg";
  const key = `${folder}/${uuidv4()}.${ext}`;

  if (STORAGE_PROVIDER === "s3" && s3Client) {
    const buffer = Buffer.from(await file.arrayBuffer());

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000",
      })
    );

    // If using a CDN/public bucket, return the public URL
    const publicUrl = process.env.S3_PUBLIC_URL;
    if (publicUrl) {
      return { url: `${publicUrl}/${key}`, key };
    }

    // Otherwise generate a signed URL (valid for 7 days)
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: 604800 }
    );
    return { url: signedUrl, key };
  }

  // Fallback to local storage (development only)
  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");

  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  await mkdir(uploadDir, { recursive: true });
  const filename = key.split("/").pop()!;
  const filepath = join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filepath, buffer);

  return { url: `/api/upload/${filename}`, key: filename };
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(key: string): Promise<void> {
  if (STORAGE_PROVIDER === "s3" && s3Client) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    return;
  }

  // Local fallback
  const { unlink } = await import("fs/promises");
  const { join } = await import("path");
  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  try {
    await unlink(join(uploadDir, key));
  } catch {
    // File may not exist, that's OK
  }
}

/**
 * Get a signed URL for an existing file (for private buckets).
 */
export async function getFileUrl(key: string): Promise<string> {
  if (STORAGE_PROVIDER === "s3" && s3Client) {
    const publicUrl = process.env.S3_PUBLIC_URL;
    if (publicUrl) return `${publicUrl}/${key}`;

    return getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: 3600 }
    );
  }

  return `/api/upload/${key}`;
}
