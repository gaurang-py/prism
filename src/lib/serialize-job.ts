import type { Job as JobRow, JobStatus as DbStatus, Modality as DbModality } from "@prisma/client";
import type { AspectRatio, Job, JobStatus, OutputResolution, VideoDuration } from "./types";
import { getReadUrl, r2Configured } from "./r2";

const ASPECTS = new Set(["1:1", "16:9", "9:16", "4:3", "3:4"]);

function asAspect(value: string): AspectRatio {
  return (ASPECTS.has(value) ? value : "1:1") as AspectRatio;
}

function asDuration(value: number | null): VideoDuration | undefined {
  if (value === 5 || value === 10) return value;
  return undefined;
}

function asResolution(value: string | null): OutputResolution | undefined {
  if (value === "1K" || value === "2K" || value === "720p" || value === "1080p") return value;
  return undefined;
}

async function readUrl(key: string | null | undefined): Promise<string> {
  if (!key || !r2Configured()) return "";
  try {
    return await getReadUrl(key);
  } catch (error) {
    console.error("[r2] signed URL failed", error);
    return "";
  }
}

export async function serializeJob(row: JobRow): Promise<Job> {
  const assetUrl = row.status === "done" ? await readUrl(row.assetKey) : "";
  const firstFrameUrl = await readUrl(row.firstFrameKey);
  const status = row.status as JobStatus;
  const modality = row.modality as DbModality;

  return {
    id: row.id,
    modality,
    modelId: row.modelId,
    prompt: row.prompt,
    aspectRatio: asAspect(row.aspectRatio),
    duration: asDuration(row.duration),
    resolution: asResolution(row.resolution),
    status,
    progress: row.progress,
    createdAt: row.createdAt.getTime(),
    completedAt: row.completedAt?.getTime(),
    creditsSpent: row.creditsSpent,
    imageUrl: modality === "image" ? assetUrl : firstFrameUrl,
    videoUrl: modality === "video" && status === "done" ? assetUrl : undefined,
    posterUrl: modality === "video" ? firstFrameUrl || assetUrl : assetUrl,
    firstFrameUrl: firstFrameUrl || undefined,
    errorMessage: row.errorMessage ?? undefined,
    assetKey: row.assetKey ?? undefined,
    firstFrameKey: row.firstFrameKey ?? undefined,
  };
}

export async function serializeJobs(rows: JobRow[]): Promise<Job[]> {
  return Promise.all(rows.map(serializeJob));
}

export function notExpired() {
  return { expiresAt: { gt: new Date() } };
}

export function isExpired(row: { expiresAt: Date; status?: DbStatus }): boolean {
  return row.expiresAt.getTime() <= Date.now();
}
