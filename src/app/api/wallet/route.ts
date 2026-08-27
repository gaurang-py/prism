import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LOCAL_WALLET_ID } from "@/lib/constants";
import { STARTING_CREDITS } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readCredits(): Promise<number> {
  const wallet = await prisma.wallet.upsert({
    where: { id: LOCAL_WALLET_ID },
    create: { id: LOCAL_WALLET_ID, credits: STARTING_CREDITS },
    update: {},
  });
  return wallet.credits;
}

export async function GET() {
  try {
    return NextResponse.json({ credits: await readCredits() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wallet unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
