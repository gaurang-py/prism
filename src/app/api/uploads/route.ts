import { NextResponse } from "next/server";
import { publicError } from "@/lib/http-error";
import { getReadUrl, objectKey } from "@/lib/r2";
import { requireUser } from "@/lib/require-user";
import { assertImageFile, imageExtension, putImageFile } from "@/lib/upload-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const invalid = assertImageFile(file);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  try {
    const key = objectKey(`uploads/${crypto.randomUUID()}.${imageExtension(file)}`);
    await putImageFile(key, file);
    const url = await getReadUrl(key);
    return NextResponse.json({ key, url });
  } catch (error) {
    return NextResponse.json(
      { error: publicError(error, "Upload failed. Check R2 credentials.") },
      { status: 503 },
    );
  }
}
