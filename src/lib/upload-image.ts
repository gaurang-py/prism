import { MAX_UPLOAD_BYTES } from "./constants";
import { extensionForContentType, putObject } from "./r2";

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function assertImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Uploads must be JPEG, PNG, WebP, or GIF.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Image is larger than 8 MB.";
  }
  return null;
}

export async function putImageFile(key: string, file: File): Promise<void> {
  const bytes = Buffer.from(await file.arrayBuffer());
  await putObject(key, bytes, file.type || "image/png");
}

export function imageExtension(file: File): string {
  return extensionForContentType(file.type, "png");
}
