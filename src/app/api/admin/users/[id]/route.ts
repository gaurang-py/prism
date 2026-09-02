import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicError } from "@/lib/http-error";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        credits: true,
        role: true,
        nsfwEnabled: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { jobs: true, purchases: true, sessions: true } },
        purchases: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            packId: true,
            credits: true,
            amountCents: true,
            createdAt: true,
          },
        },
        creditAdjustments: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            delta: true,
            balanceAfter: true,
            reason: true,
            createdAt: true,
            admin: { select: { email: true, name: true } },
          },
        },
        jobs: {
          orderBy: { createdAt: "desc" },
          take: 15,
          select: {
            id: true,
            status: true,
            modality: true,
            modelId: true,
            creditsSpent: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        bio: user.bio,
        credits: user.credits,
        role: user.role,
        nsfwEnabled: user.nsfwEnabled,
        createdAt: user.createdAt.getTime(),
        updatedAt: user.updatedAt.getTime(),
        jobCount: user._count.jobs,
        purchaseCount: user._count.purchases,
        sessionCount: user._count.sessions,
        purchases: user.purchases.map((row) => ({
          ...row,
          createdAt: row.createdAt.getTime(),
        })),
        adjustments: user.creditAdjustments.map((row) => ({
          id: row.id,
          delta: row.delta,
          balanceAfter: row.balanceAfter,
          reason: row.reason,
          createdAt: row.createdAt.getTime(),
          adminEmail: row.admin.email,
          adminName: row.admin.name,
        })),
        jobs: user.jobs.map((row) => ({
          ...row,
          createdAt: row.createdAt.getTime(),
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: publicError(error, "Could not load user.") },
      { status: 503 },
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;

  let body: {
    delta?: unknown;
    credits?: unknown;
    role?: unknown;
    reason?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 280) : "";
  const role = body.role === "admin" || body.role === "user" ? body.role : undefined;

  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (role === "user" && target.role === "admin" && target.id === auth.user.id) {
      return NextResponse.json(
        { error: "You cannot remove your own admin access." },
        { status: 400 },
      );
    }

    if (role === "user" && target.role === "admin") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "At least one admin must remain." },
          { status: 400 },
        );
      }
    }

    const delta =
      typeof body.delta === "number" && Number.isFinite(body.delta)
        ? Math.trunc(body.delta)
        : undefined;
    const absoluteCredits =
      typeof body.credits === "number" && Number.isFinite(body.credits)
        ? Math.max(0, Math.trunc(body.credits))
        : undefined;

    if (delta === undefined && absoluteCredits === undefined && !role) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      let nextCredits = target.credits;
      let appliedDelta: number | undefined;

      if (absoluteCredits !== undefined) {
        appliedDelta = absoluteCredits - target.credits;
        nextCredits = absoluteCredits;
      } else if (delta !== undefined) {
        nextCredits = Math.max(0, target.credits + delta);
        appliedDelta = nextCredits - target.credits;
      }

      const user = await tx.user.update({
        where: { id },
        data: {
          ...(appliedDelta !== undefined ? { credits: nextCredits } : {}),
          ...(role ? { role } : {}),
        },
        select: {
          id: true,
          email: true,
          name: true,
          credits: true,
          role: true,
        },
      });

      if (appliedDelta !== undefined && appliedDelta !== 0) {
        await tx.creditAdjustment.create({
          data: {
            userId: id,
            adminId: auth.user.id,
            delta: appliedDelta,
            balanceAfter: user.credits,
            reason: reason || (appliedDelta > 0 ? "Admin credit grant" : "Admin credit removal"),
          },
        });
      }

      return user;
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    return NextResponse.json(
      { error: publicError(error, "Could not update user.") },
      { status: 503 },
    );
  }
}
