import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicError } from "@/lib/http-error";
import { requireUser } from "@/lib/require-user";
import { serializeCharacter } from "@/lib/serialize-character";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const characterInclude = {
  images: { orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }] },
};

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; imageId: string }> },
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id, imageId } = await context.params;

  try {
    const character = await prisma.character.findFirst({
      where: { id, userId: auth.user.id },
    });
    if (!character) return NextResponse.json({ error: "Character not found." }, { status: 404 });

    const image = await prisma.characterImage.findFirst({
      where: { id: imageId, characterId: character.id },
    });
    if (!image) return NextResponse.json({ error: "Reference not found." }, { status: 404 });

    await prisma.characterImage.delete({ where: { id: image.id } });
    const row = await prisma.character.findUniqueOrThrow({
      where: { id: character.id },
      include: characterInclude,
    });
    return NextResponse.json({ character: await serializeCharacter(row) });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Failed to remove reference") }, { status: 503 });
  }
}
