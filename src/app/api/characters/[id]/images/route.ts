import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CHARACTER_PREFIX } from "@/lib/constants";
import { publicError } from "@/lib/http-error";
import { MAX_REFERENCE_IMAGES, isAllowedReferenceKey } from "@/lib/references";
import { requireUser } from "@/lib/require-user";
import { characterObjectKey } from "@/lib/r2";
import { serializeCharacter } from "@/lib/serialize-character";
import { assertImageFile, imageExtension, putImageFile } from "@/lib/upload-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const characterInclude = {
  images: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] },
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;

  const character = await prisma.character.findFirst({
    where: { id, userId: auth.user.id },
    include: characterInclude,
  });
  if (!character) return NextResponse.json({ error: "Character not found." }, { status: 404 });

  const contentType = request.headers.get("content-type") || "";
  const files: File[] = [];
  let existingKey: string | null = null;

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      for (const value of form.getAll("files")) {
        if (value instanceof File) files.push(value);
      }
      const single = form.get("file");
      if (single instanceof File) files.push(single);
      const key = form.get("key");
      if (typeof key === "string") existingKey = key;
    } else {
      const body = (await request.json()) as { key?: unknown };
      existingKey = typeof body.key === "string" ? body.key : null;
    }
  } catch {
    return NextResponse.json({ error: "Expected JSON or multipart form data." }, { status: 400 });
  }

  const incoming = files.length + (existingKey ? 1 : 0);
  if (incoming === 0) {
    return NextResponse.json({ error: "Attach at least one reference image." }, { status: 400 });
  }
  if (character.images.length + incoming > MAX_REFERENCE_IMAGES) {
    return NextResponse.json(
      { error: `A character can hold up to ${MAX_REFERENCE_IMAGES} reference images.` },
      { status: 400 },
    );
  }

  for (const file of files) {
    const invalid = assertImageFile(file);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  }
  if (existingKey && !isAllowedReferenceKey(existingKey)) {
    return NextResponse.json({ error: "That reference key is not allowed." }, { status: 400 });
  }

  try {
    let sortOrder = character.images.reduce((max, image) => Math.max(max, image.sortOrder), -1) + 1;
    for (const file of files) {
      const key = characterObjectKey(
        auth.user.id,
        character.id,
        `${crypto.randomUUID()}.${imageExtension(file)}`,
      );
      if (!key.startsWith(CHARACTER_PREFIX)) {
        throw new Error("Character uploads must use the characters/ prefix.");
      }
      await putImageFile(key, file);
      await prisma.characterImage.create({
        data: { characterId: character.id, key, sortOrder },
      });
      sortOrder += 1;
    }
    if (existingKey) {
      await prisma.characterImage.create({
        data: { characterId: character.id, key: existingKey, sortOrder },
      });
    }

    const row = await prisma.character.findUniqueOrThrow({
      where: { id: character.id },
      include: characterInclude,
    });
    return NextResponse.json({ character: await serializeCharacter(row) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Failed to attach references") }, { status: 503 });
  }
}
