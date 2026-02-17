import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TRPCError } from "@trpc/server";
import { env } from "../lib/env.js";
import { logger } from "../lib/logger.js";

let _s3: S3Client | null = null;

function getS3Client(): S3Client {
  if (_s3) return _s3;
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "R2 non configuré — variables d'environnement manquantes",
    });
  }
  _s3 = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
    // Disable automatic checksums — mobile clients can't recompute CRC32
    // for presigned URL uploads (AWS SDK v3.600+ adds them by default)
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return _s3;
}

const BUCKET = env.R2_BUCKET_NAME;

/**
 * Generate a presigned PUT URL for direct upload from mobile → R2
 * Expires in 10 minutes.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn: 600 });
}

/**
 * Get the public CDN URL for a stored object.
 */
export function getPublicUrl(key: string): string {
  return `https://${env.R2_PUBLIC_DOMAIN}/${key}`;
}

/**
 * Delete an object from R2 (e.g. old avatar).
 */
export async function deleteObject(key: string): Promise<void> {
  try {
    await getS3Client().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    logger.error("Erreur suppression R2", {
      key,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
