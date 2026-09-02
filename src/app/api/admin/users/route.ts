import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { publicError } from "@/lib/http-error";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const roleParam = url.searchParams.get("role");
  const roleFilter: UserRole | undefined =
    roleParam === "admin" || roleParam === "user" ? roleParam : undefined;
  const take = Math.min(100, Math.max(1, Number(url.searchParams.get("take") ?? 50)));
  const skip = Math.max(0, Number(url.searchParams.get("skip") ?? 0));

  const where = {
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(roleFilter ? { role: roleFilter } : {}),
  };

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        select: {
          id: true,
          email: true,
          name: true,
          credits: true,
          role: true,
          createdAt: true,
          _count: { select: { jobs: true, purchases: true, sessions: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      total,
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        credits: user.credits,
        role: user.role,
        createdAt: user.createdAt.getTime(),
        jobCount: user._count.jobs,
        purchaseCount: user._count.purchases,
        sessionCount: user._count.sessions,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: publicError(error, "Could not load users.") },
      { status: 503 },
    );
  }
}
