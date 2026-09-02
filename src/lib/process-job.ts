import { prisma } from "./db";
import { GENERATE_QUEUE } from "./constants";
import { getBoss } from "./queue";
import {
  assertProviderConfigured,
  providerForModel,
  runGeneration,
} from "./providers";
import {
  assertR2Configured,
  extensionForContentType,
  getReadUrl,
  objectKey,
  putObject,
} from "./r2";
import type { AspectRatio, OutputResolution, VideoDuration } from "./types";

function clipError(message: string): string {
  return message.slice(0, 1000);
}

async function failJob(jobId: string, message: string): Promise<void> {
  await prisma.job.updateMany({
    where: { id: jobId, status: { not: "done" } },
    data: {
      status: "error",
      errorMessage: clipError(message),
      progress: 0,
      completedAt: new Date(),
    },
  });
}

export async function processGeneration(jobId: string): Promise<void> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    console.warn(`[worker] job ${jobId} not found`);
    return;
  }
  if (job.status === "done") return;
  if (job.expiresAt.getTime() <= Date.now()) {
    await failJob(jobId, "This generation expired after 7 days.");
    return;
  }

  try {
    assertProviderConfigured(providerForModel(job.modelId));
    assertR2Configured();
  } catch (error) {
    await failJob(jobId, error instanceof Error ? error.message : "Provider is not configured.");
    return;
  }

  await prisma.job.update({
    where: { id: jobId },
    data: { status: "generating", progress: Math.max(job.progress, 8), errorMessage: null },
  });

  let firstFrameUrl: string | null = null;
  if (job.firstFrameKey) {
    try {
      firstFrameUrl = await getReadUrl(job.firstFrameKey);
    } catch (error) {
      await failJob(
        jobId,
        `Could not read the first-frame object from R2: ${error instanceof Error ? error.message : "unknown error"}`,
      );
      return;
    }
  }

  try {
    const media = await runGeneration(
      {
        modelId: job.modelId,
        modality: job.modality,
        prompt: job.prompt,
        aspectRatio: job.aspectRatio as AspectRatio,
        duration: (job.duration === 5 || job.duration === 10 ? job.duration : 5) as VideoDuration,
        resolution: job.resolution as OutputResolution | null,
        firstFrameUrl,
      },
      async ({ requestId, progress }) => {
        await prisma.job.updateMany({
          where: { id: jobId, status: { notIn: ["done", "error"] } },
          data: {
            status: "generating",
            progress,
            ...(requestId ? { falRequestId: requestId } : {}),
          },
        });
      },
    );

    await prisma.job.updateMany({
      where: { id: jobId, status: { notIn: ["done", "error"] } },
      data: { progress: 88, falRequestId: media.requestId ?? undefined },
    });

    // Fal gives us a public CDN URL; Google resolves its own bytes because the
    // Files URI needs the API key. Handle both without a second round trip.
    let bytes: Buffer;
    let contentType: string;
    if (media.source === "bytes") {
      bytes = media.bytes;
      contentType = media.contentType;
    } else {
      const download = await fetch(media.url);
      if (!download.ok) {
        throw new Error(`Failed to download the provider output (${download.status}).`);
      }
      bytes = Buffer.from(await download.arrayBuffer());
      contentType =
        media.contentType ||
        download.headers.get("content-type") ||
        (job.modality === "video" ? "video/mp4" : "image/png");
    }
    const ext = extensionForContentType(contentType, job.modality === "video" ? "mp4" : "png");
    const assetKey = objectKey(`${job.id}.${ext}`);

    await putObject(assetKey, bytes, contentType);

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "done",
        progress: 100,
        assetKey,
        contentType,
        errorMessage: null,
        completedAt: new Date(),
        falRequestId: media.requestId ?? job.falRequestId,
      },
    });
  } catch (error) {
    await failJob(jobId, error instanceof Error ? error.message : "Generation failed.");
  }
}

export async function startWorker(): Promise<void> {
  const boss = await getBoss();
  await boss.work<{ jobId: string }>(
    GENERATE_QUEUE,
    { localConcurrency: 2, pollingIntervalSeconds: 2 },
    async (jobs: Array<{ data?: { jobId?: string } }>) => {
      for (const job of jobs) {
        const jobId = job.data?.jobId;
        if (!jobId) continue;
        console.info(`[worker] processing ${jobId}`);
        await processGeneration(jobId);
      }
    },
  );
  console.info(`[prism-worker] listening on ${GENERATE_QUEUE}`);
}
