import { NextResponse } from "next/server";
import { destroyCurrentSession } from "@/lib/session";
import { publicError } from "@/lib/http-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await destroyCurrentSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Could not log out.") }, { status: 503 });
  }
}
