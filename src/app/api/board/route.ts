import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { EMPTY_BOARD, parseBoardState } from "@/lib/board";
import { publicError } from "@/lib/http-error";
import { requireUser } from "@/lib/require-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  try {
    const row = await prisma.board.upsert({
      where: { userId: auth.user.id },
      update: {},
      create: { userId: auth.user.id, state: EMPTY_BOARD as unknown as Prisma.InputJsonValue },
    });
    return NextResponse.json({ board: { id: row.id, state: parseBoardState(row.state) } });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Failed to load board") }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  let body: { state?: unknown };
  try {
    body = (await request.json()) as { state?: unknown };
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const state = parseBoardState(body.state);
  try {
    const row = await prisma.board.upsert({
      where: { userId: auth.user.id },
      update: { state: state as unknown as Prisma.InputJsonValue },
      create: { userId: auth.user.id, state: state as unknown as Prisma.InputJsonValue },
    });
    return NextResponse.json({ board: { id: row.id, state: parseBoardState(row.state) } });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Failed to save board") }, { status: 503 });
  }
}
