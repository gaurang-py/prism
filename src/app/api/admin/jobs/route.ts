import { NextResponse } from "next/server";
import type { JobStatus } from "@prisma/client";
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
  const statusParam = url.searchParams.get("status");
  const q = url.searchParams.get("q")?.trim() ?? "";

  const statusFilter: JobStatus | undefined =
    statusParam === "queued" ||
    statusParam === "generating" ||
    statusParam === "done" ||
    statusParam === "error"
      ? statusParam
      : undefined;

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q
      ? {
          OR: [
            { modelId: { contains: q, mode: "insensitive" as const } },
            { prompt: { contains: q, mode: "insensitive" as const } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  try {
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: { user: { select: { id: true, email: true, name: true } } },
      }),
      prisma.job.count({ where }),
    ]);

    return NextResponse.json({
      total,
      jobs: jobs.map((row) => ({
        id: row.id,
        userId: row.userId,
        userEmail: row.user.email,
        userName: row.user.name,
        status: row.status,
        modality: row.modality,
        modelId: row.modelId,
        prompt: row.prompt.slice(0, 120),
        creditsSpent: row.creditsSpent,
        creditsRefunded: row.creditsRefunded,
        errorMessage: row.errorMessage,
        createdAt: row.createdAt.getTime(),
        completedAt: row.completedAt?.getTime() ?? null,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: publicError(error, "Could not load jobs.") },
      { status: 503 },
    );
  }
}
