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

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  try {
    const row = await prisma.character.findFirst({
      where: { id, userId: auth.user.id },
      include: characterInclude,
    });
    if (!row) return NextResponse.json({ error: "Character not found." }, { status: 404 });
    return NextResponse.json({ character: await serializeCharacter(row) });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Failed to load character") }, { status: 503 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;

  let body: { name?: unknown };
  try {
    body = (await request.json()) as { name?: unknown };
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Give the character a name." }, { status: 400 });
  if (name.length > 80) return NextResponse.json({ error: "Name is too long." }, { status: 400 });

  try {
    const existing = await prisma.character.findFirst({ where: { id, userId: auth.user.id } });
    if (!existing) return NextResponse.json({ error: "Character not found." }, { status: 404 });
    const row = await prisma.character.update({
      where: { id },
      data: { name },
      include: characterInclude,
    });
    return NextResponse.json({ character: await serializeCharacter(row) });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Failed to update character") }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  try {
    const existing = await prisma.character.findFirst({ where: { id, userId: auth.user.id } });
    if (!existing) return NextResponse.json({ error: "Character not found." }, { status: 404 });
    await prisma.character.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Failed to delete character") }, { status: 503 });
  }
}
