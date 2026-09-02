import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicError } from "@/lib/http-error";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      admins: admins.map((row) => ({
        ...row,
        createdAt: row.createdAt.getTime(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: publicError(error, "Could not load admins.") },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: { email?: unknown };
  try {
    body = (await request.json()) as { email?: unknown };
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!validEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "No account with that email. They must sign up first." },
        { status: 404 },
      );
    }
    if (user.role === "admin") {
      return NextResponse.json({ error: "That user is already an admin." }, { status: 409 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: "admin" },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    return NextResponse.json(
      { error: publicError(error, "Could not promote admin.") },
      { status: 503 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!validEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "That admin was not found." }, { status: 404 });
    }
    if (user.id === auth.user.id) {
      return NextResponse.json(
        { error: "You cannot remove your own admin access." },
        { status: 400 },
      );
    }

    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "At least one admin must remain." },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: "user" },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    return NextResponse.json(
      { error: publicError(error, "Could not remove admin.") },
      { status: 503 },
    );
  }
}
