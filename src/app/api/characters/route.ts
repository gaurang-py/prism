import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicError } from "@/lib/http-error";
import { CHARACTER_PREFIX } from "@/lib/constants";
import { MAX_REFERENCE_IMAGES } from "@/lib/references";
import { requireUser } from "@/lib/require-user";
import { characterObjectKey } from "@/lib/r2";
import { serializeCharacter, serializeCharacters } from "@/lib/serialize-character";
import { assertImageFile, imageExtension, putImageFile } from "@/lib/upload-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const characterInclude = {
  images: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] },
};

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  try {
    const rows = await prisma.character.findMany({
      where: { userId: auth.user.id },
      include: characterInclude,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ characters: await serializeCharacters(rows) });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Failed to list characters") }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const contentType = request.headers.get("content-type") || "";
  let name = "";
  const files: File[] = [];

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      name = typeof form.get("name") === "string" ? String(form.get("name")).trim() : "";
      for (const value of form.getAll("files")) {
        if (value instanceof File) files.push(value);
      }
      const single = form.get("file");
      if (single instanceof File) files.push(single);
    } else {
      const body = (await request.json()) as { name?: unknown };
      name = typeof body.name === "string" ? body.name.trim() : "";
    }
  } catch {
    return NextResponse.json({ error: "Expected JSON or multipart form data." }, { status: 400 });
  }

  if (!name) {
    return NextResponse.json({ error: "Give the character a name." }, { status: 400 });
  }
  if (name.length > 80) {
    return NextResponse.json({ error: "Name is too long." }, { status: 400 });
  }
  if (files.length > MAX_REFERENCE_IMAGES) {
    return NextResponse.json(
      { error: `A character can hold up to ${MAX_REFERENCE_IMAGES} reference images.` },
      { status: 400 },
    );
  }

  for (const file of files) {
    const invalid = assertImageFile(file);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  }

  try {
    const created = await prisma.character.create({
      data: { userId: auth.user.id, name },
    });

    for (const [index, file] of files.entries()) {
      const key = characterObjectKey(
        auth.user.id,
        created.id,
        `${crypto.randomUUID()}.${imageExtension(file)}`,
      );
      if (!key.startsWith(CHARACTER_PREFIX)) {
        throw new Error("Character uploads must use the characters/ prefix.");
      }
      await putImageFile(key, file);
      await prisma.characterImage.create({
        data: { characterId: created.id, key, sortOrder: index },
      });
    }

    const row = await prisma.character.findUniqueOrThrow({
      where: { id: created.id },
      include: characterInclude,
    });
    return NextResponse.json({ character: await serializeCharacter(row) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Failed to create character") }, { status: 503 });
  }
}
