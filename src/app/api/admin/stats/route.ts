import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicError } from "@/lib/http-error";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      userCount,
      adminCount,
      totalCredits,
      revenue,
      purchasesWeek,
      jobsToday,
      jobsWeek,
      signupsWeek,
      recentPurchases,
      recentAdjustments,
      recentSignups,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "admin" } }),
      prisma.user.aggregate({ _sum: { credits: true } }),
      prisma.creditPurchase.aggregate({ _sum: { amountCents: true, credits: true } }),
      prisma.creditPurchase.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.job.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.job.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.creditPurchase.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { user: { select: { email: true, name: true } } },
      }),
      prisma.creditAdjustment.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: { select: { email: true, name: true } },
          admin: { select: { email: true, name: true } },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, email: true, name: true, credits: true, role: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({
      users: userCount,
      admins: adminCount,
      creditsInCirculation: totalCredits._sum.credits ?? 0,
      revenueCents: revenue._sum.amountCents ?? 0,
      creditsSold: revenue._sum.credits ?? 0,
      purchasesWeek,
      jobsToday,
      jobsWeek,
      signupsWeek,
      recentPurchases: recentPurchases.map((row) => ({
        id: row.id,
        packId: row.packId,
        credits: row.credits,
        amountCents: row.amountCents,
        createdAt: row.createdAt.getTime(),
        userEmail: row.user.email,
        userName: row.user.name,
      })),
      recentAdjustments: recentAdjustments.map((row) => ({
        id: row.id,
        delta: row.delta,
        balanceAfter: row.balanceAfter,
        reason: row.reason,
        createdAt: row.createdAt.getTime(),
        userEmail: row.user.email,
        adminEmail: row.admin.email,
      })),
      recentSignups: recentSignups.map((row) => ({
        ...row,
        createdAt: row.createdAt.getTime(),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: publicError(error, "Could not load admin stats.") },
      { status: 503 },
    );
  }
}
