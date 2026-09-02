import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicError } from "@/lib/http-error";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const take = Math.min(100, Math.max(1, Number(url.searchParams.get("take") ?? 50)));
  const skip = Math.max(0, Number(url.searchParams.get("skip") ?? 0));
  const q = url.searchParams.get("q")?.trim() ?? "";

  const where = q
    ? {
        OR: [
          { packId: { contains: q, mode: "insensitive" as const } },
          { user: { email: { contains: q, mode: "insensitive" as const } } },
          { user: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : {};

  try {
    const [purchases, total, aggregate] = await Promise.all([
      prisma.creditPurchase.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: { user: { select: { id: true, email: true, name: true } } },
      }),
      prisma.creditPurchase.count({ where }),
      prisma.creditPurchase.aggregate({
        where,
        _sum: { amountCents: true, credits: true },
      }),
    ]);

    return NextResponse.json({
      total,
      revenueCents: aggregate._sum.amountCents ?? 0,
      creditsSold: aggregate._sum.credits ?? 0,
      purchases: purchases.map((row) => ({
        id: row.id,
        userId: row.userId,
        userEmail: row.user.email,
        userName: row.user.name,
        packId: row.packId,
        credits: row.credits,
        amountCents: row.amountCents,
        stripeSessionId: row.stripeSessionId,
        createdAt: row.createdAt.getTime(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: publicError(error, "Could not load purchases.") },
      { status: 503 },
    );
  }
}
