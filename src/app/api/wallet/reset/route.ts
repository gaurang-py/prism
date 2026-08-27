import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LOCAL_WALLET_ID } from "@/lib/constants";
import { STARTING_CREDITS } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const wallet = await prisma.wallet.upsert({
      where: { id: LOCAL_WALLET_ID },
      create: { id: LOCAL_WALLET_ID, credits: STARTING_CREDITS },
      update: { credits: STARTING_CREDITS },
    });
    return NextResponse.json({ credits: wallet.credits });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reset credits";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
