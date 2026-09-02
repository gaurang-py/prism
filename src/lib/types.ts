import type { Modality } from "./models";

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
export type JobStatus = "queued" | "generating" | "done" | "error";
/**
 * Clip length in seconds. Not a fixed union any more: each model declares the
 * lengths it actually accepts (GenerationModel.durations), because Veo takes
 * 4/6/8 while the Fal video models take 5/10.
 */
export type VideoDuration = number;
export type ImageResolution = "1K" | "2K";
export type VideoResolution = "720p" | "1080p";
export type OutputResolution = ImageResolution | VideoResolution;

export const ASPECT_RATIOS: AspectRatio[] = [
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
];

/** Fallback for a video model that does not declare its own durations. */
export const VIDEO_DURATIONS: VideoDuration[] = [5, 10];
export const IMAGE_RESOLUTIONS: ImageResolution[] = ["1K", "2K"];
export const VIDEO_RESOLUTIONS: VideoResolution[] = ["720p", "1080p"];
export const MAX_VARIATIONS = 4;

export interface FirstFrameRef {
  jobId: string;
  url: string;
  prompt: string;
  key?: string;
}

export interface Job {
  id: string;
  modality: Modality;
  modelId: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio: AspectRatio;
  duration?: VideoDuration;
  resolution?: OutputResolution;
  status: JobStatus;
  progress: number;
  createdAt: number;
  completedAt?: number;
  creditsSpent: number;
  creditsRefunded?: boolean;
  imageUrl: string;
  videoUrl?: string;
  posterUrl?: string;
  firstFrameUrl?: string;
  errorMessage?: string;
  assetKey?: string;
  firstFrameKey?: string;
}

export const STARTING_CREDITS = 0;

export function aspectCss(ratio: AspectRatio): string {
  return ratio.replace(":", " / ");
}

export function generatePath(mode: Modality, modelId?: string): string {
  const params = new URLSearchParams({ mode });
  if (modelId) params.set("model", modelId);
  return `/generate?${params.toString()}`;
}
