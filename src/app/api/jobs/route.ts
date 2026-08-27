import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { JOB_TTL_MS } from "@/lib/constants";
import { enqueueGenerateJob } from "@/lib/queue";
import { notExpired, serializeJobs } from "@/lib/serialize-job";
import { publicError } from "@/lib/http-error";
import { getModel, type Modality } from "@/lib/models";
import { requireUser } from "@/lib/require-user";
import {
  ASPECT_RATIOS,
  IMAGE_RESOLUTIONS,
  MAX_VARIATIONS,
  VIDEO_RESOLUTIONS,
  type AspectRatio,
  type OutputResolution,
  type VideoDuration,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  try {
    const rows = await prisma.job.findMany({
      where: { ...notExpired(), userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({
      jobs: await serializeJobs(rows),
      credits: auth.user.credits,
    });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Failed to list jobs") }, { status: 503 });
  }
}

interface CreateBody {
  prompt?: unknown;
  modality?: unknown;
  modelId?: unknown;
  aspect?: unknown;
  aspectRatio?: unknown;
  resolution?: unknown;
  duration?: unknown;
  count?: unknown;
  firstFrameKey?: unknown;
  firstFrameUrl?: unknown;
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "Add a prompt first." }, { status: 400 });
  }

  const modality = body.modality === "video" ? "video" : body.modality === "image" ? "image" : null;
  if (!modality) {
    return NextResponse.json({ error: "modality must be image or video." }, { status: 400 });
  }

  const model = getModel(typeof body.modelId === "string" ? body.modelId : "");
  if (!model || model.modality !== modality) {
    return NextResponse.json(
      { error: "Unknown model for this modality." },
      { status: 400 },
    );
  }

  const aspectRaw =
    typeof body.aspect === "string"
      ? body.aspect
      : typeof body.aspectRatio === "string"
        ? body.aspectRatio
        : "";
  if (!ASPECT_RATIOS.includes(aspectRaw as AspectRatio)) {
    return NextResponse.json({ error: "Invalid aspect ratio." }, { status: 400 });
  }
  const aspectRatio = aspectRaw as AspectRatio;

  const allowedRes = modality === "image" ? IMAGE_RESOLUTIONS : VIDEO_RESOLUTIONS;
  const resolutionRaw = typeof body.resolution === "string" ? body.resolution : allowedRes[0];
  if (!(allowedRes as readonly string[]).includes(resolutionRaw)) {
    return NextResponse.json({ error: "Invalid resolution." }, { status: 400 });
  }
  const resolution = resolutionRaw as OutputResolution;

  let duration: VideoDuration | null = null;
  if (modality === "video") {
    const value = body.duration === 10 || body.duration === "10" ? 10 : 5;
    duration = value as VideoDuration;
  }

  const count = Math.min(
    MAX_VARIATIONS,
    Math.max(1, Number.parseInt(String(body.count ?? 1), 10) || 1),
  );

  const firstFrameKey =
    typeof body.firstFrameKey === "string" && body.firstFrameKey.startsWith("generations/")
      ? body.firstFrameKey
      : null;

  const cost = model.mockCredits * count;
  const expiresAt = new Date(Date.now() + JOB_TTL_MS);
  const batchId = crypto.randomUUID();

  try {
    const created = await prisma.$transaction(async (tx) => {
      const debit = await tx.user.updateMany({
        where: { id: auth.user.id, credits: { gte: cost } },
        data: { credits: { decrement: cost } },
      });
      if (debit.count === 0) {
        return null;
      }
      return Promise.all(
        Array.from({ length: count }, () =>
          tx.job.create({
            data: {
              userId: auth.user.id,
              status: "queued",
              modality: modality as Modality,
              modelId: model.id,
              prompt,
              aspectRatio,
              duration,
              resolution,
              batchId,
              firstFrameKey,
              creditsSpent: model.mockCredits,
              progress: 4,
              expiresAt,
            },
          }),
        ),
      );
    });

    if (!created) {
      const latest = await prisma.user.findUnique({ where: { id: auth.user.id } });
      const credits = latest?.credits ?? auth.user.credits;
      return NextResponse.json(
        {
          error: `Not enough credits. This run needs ${cost}. You have ${credits}.`,
          credits,
        },
        { status: 402 },
      );
    }

    for (const job of created) {
      try {
        await enqueueGenerateJob(job.id);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Could not enqueue generation. Is Postgres running?";
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: "error",
            errorMessage: message,
            completedAt: new Date(),
          },
        });
      }
    }

    const [rows, latest] = await Promise.all([
      prisma.job.findMany({ where: { id: { in: created.map((job) => job.id) } } }),
      prisma.user.findUnique({ where: { id: auth.user.id } }),
    ]);
    return NextResponse.json(
      { jobs: await serializeJobs(rows), credits: latest?.credits ?? auth.user.credits - cost },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Failed to create job") }, { status: 503 });
  }
}
