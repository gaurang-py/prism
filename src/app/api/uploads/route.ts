import { NextResponse } from "next/server";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { publicError } from "@/lib/http-error";
import { extensionForContentType, getReadUrl, objectKey, putObject } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attach an image file." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "First-frame uploads must be JPEG, PNG, WebP, or GIF." },
      { status: 400 },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image is larger than 8 MB." }, { status: 400 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = extensionForContentType(file.type, "png");
    const key = objectKey(`uploads/${crypto.randomUUID()}.${ext}`);
    await putObject(key, bytes, file.type || "image/png");
    const url = await getReadUrl(key);
    return NextResponse.json({ key, url });
  } catch (error) {
    const message = publicError(error, "Upload failed. Check R2 credentials.");
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
