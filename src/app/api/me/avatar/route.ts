import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/db";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { publicError } from "@/lib/http-error";
import {
  avatarObjectKey,
  extensionForContentType,
  getReadUrl,
  putObject,
} from "@/lib/r2";
import { serializeUser } from "@/lib/serialize-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

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
    return NextResponse.json({ error: "Avatar must be JPEG, PNG, or WebP." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image is larger than 8 MB." }, { status: 400 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = extensionForContentType(file.type, "png");
    const key = avatarObjectKey(auth.user.id, ext);
    await putObject(key, bytes, file.type || "image/png");
    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data: { avatarKey: key },
    });
    const url = await getReadUrl(key);
    return NextResponse.json({ user: await serializeUser(user), url });
  } catch (error) {
    return NextResponse.json(
      { error: publicError(error, "Avatar upload failed. Check R2 credentials.") },
      { status: 503 },
    );
  }
}
