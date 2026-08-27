import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hmacToken, randomToken } from "@/lib/crypto";
import { PASSWORD_RESET_TTL_MS } from "@/lib/constants";
import { sendPasswordResetEmail } from "@/lib/mail";
import { publicError } from "@/lib/http-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = (await request.json()) as { email?: unknown };
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const generic = {
    ok: true,
    message: "If that email is on file, we sent a reset link.",
  };

  if (!email) {
    return NextResponse.json(generic);
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(generic);
    }

    const rawToken = randomToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: hmacToken(rawToken),
        passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });
    await sendPasswordResetEmail(user.email, rawToken);
    return NextResponse.json(generic);
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Could not start a reset.") }, { status: 503 });
  }
}
