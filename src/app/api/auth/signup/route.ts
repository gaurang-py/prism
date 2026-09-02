import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { publicError } from "@/lib/http-error";
import { roleForNewUser } from "@/lib/admin";
import { createSession, setSessionCookie } from "@/lib/session";
import { serializeUser } from "@/lib/serialize-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { name?: unknown; email?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 1) {
    return NextResponse.json({ error: "Add your name." }, { status: 400 });
  }
  if (name.length > 80) {
    return NextResponse.json({ error: "Name is too long." }, { status: 400 });
  }
  if (!validEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: await bcrypt.hash(password, 12),
        credits: 100,
        role: roleForNewUser(email),
      },
    });

    const token = await createSession(user.id);
    await setSessionCookie(token);
    return NextResponse.json(
      { user: await serializeUser(user) },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Could not create account.") }, { status: 503 });
  }
}
