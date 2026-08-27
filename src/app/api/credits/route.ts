import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/db";
import { CREDIT_PACKS } from "@/lib/credit-packs";
import { publicError } from "@/lib/http-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  try {
    const purchases = await prisma.creditPurchase.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({
      credits: auth.user.credits,
      packs: CREDIT_PACKS,
      purchases: purchases.map((row) => ({
        id: row.id,
        packId: row.packId,
        credits: row.credits,
        amountCents: row.amountCents,
        createdAt: row.createdAt.getTime(),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Could not load credits.") }, { status: 503 });
  }
}
