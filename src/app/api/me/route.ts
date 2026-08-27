import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { serializeUser } from "@/lib/serialize-user";
import { publicError } from "@/lib/http-error";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/require-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    return NextResponse.json({ user: await serializeUser(user) });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Could not load session.") }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  let body: { name?: unknown; bio?: unknown; nsfwEnabled?: unknown; nsfwAgeConfirmed?: unknown };
  try {
    body = (await request.json()) as {
      name?: unknown;
      bio?: unknown;
      nsfwEnabled?: unknown;
      nsfwAgeConfirmed?: unknown;
    };
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : auth.user.name;
  const bio = typeof body.bio === "string" ? body.bio.trim() : auth.user.bio;
  const togglingNsfw = typeof body.nsfwEnabled === "boolean";
  const confirmingAge = body.nsfwAgeConfirmed === true;
  if (togglingNsfw && body.nsfwEnabled && !auth.user.nsfwAgeConfirmed && !confirmingAge) {
    return NextResponse.json(
      { error: "Confirm you are 18 or older before turning NSFW on." },
      { status: 400 },
    );
  }
  if (name.length < 1) {
    return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
  }
  if (name.length > 80) {
    return NextResponse.json({ error: "Name is too long." }, { status: 400 });
  }
  if (bio.length > 280) {
    return NextResponse.json({ error: "Bio is too long." }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        name,
        bio,
        ...(togglingNsfw ? { nsfwEnabled: body.nsfwEnabled as boolean } : {}),
        ...(confirmingAge ? { nsfwAgeConfirmed: true } : {}),
      },
    });
    return NextResponse.json({ user: await serializeUser(user) });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Could not update profile.") }, { status: 503 });
  }
}
