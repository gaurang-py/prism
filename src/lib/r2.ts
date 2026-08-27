import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AVATAR_PREFIX, R2_PREFIX, SIGNED_URL_TTL_SECONDS } from "./constants";

export function r2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID?.trim() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim() &&
      process.env.R2_BUCKET_NAME?.trim() &&
      process.env.R2_ENDPOINT?.trim(),
  );
}

export function assertR2Configured(): void {
  if (!r2Configured()) {
    throw new Error(
      "Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_ENDPOINT.",
    );
  }
}

function endpoint(): string {
  const raw = process.env.R2_ENDPOINT!.trim().replace(/\/$/, "");
  if (raw.startsWith("http")) return raw;
  return `https://${raw}`;
}

let client: S3Client | null = null;

function getClient(): S3Client {
  assertR2Configured();
  client ??= new S3Client({
    region: "auto",
    endpoint: endpoint(),
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
    },
    forcePathStyle: true,
  });
  return client;
}

function bucket(): string {
  return process.env.R2_BUCKET_NAME!.trim();
}

export function objectKey(name: string): string {
  return `${R2_PREFIX}${name.replace(/^\/+/, "")}`;
}

export function avatarObjectKey(userId: string, ext: string): string {
  return `${AVATAR_PREFIX}${userId}.${ext}`;
}

export async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  assertR2Configured();
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getReadUrl(key: string): Promise<string> {
  assertR2Configured();
  const publicBase = process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
  if (publicBase) {
    return `${publicBase}/${key}`;
  }
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
    { expiresIn: SIGNED_URL_TTL_SECONDS },
  );
}

export function extensionForContentType(contentType: string, fallback: string): string {
  const type = contentType.split(";")[0]?.trim().toLowerCase();
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return map[type] ?? fallback;
}
