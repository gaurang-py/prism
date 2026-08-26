import type { Modality } from "./models";

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
export type JobStatus = "queued" | "generating" | "done" | "error";
export type VideoDuration = 5 | 10;
export type VideoResolution = "720p" | "1080p";

export const ASPECT_RATIOS: AspectRatio[] = [
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
];

export const VIDEO_DURATIONS: VideoDuration[] = [5, 10];
export const VIDEO_RESOLUTIONS: VideoResolution[] = ["720p", "1080p"];

export interface FirstFrameRef {
  jobId: string;
  url: string;
  prompt: string;
}

export interface Job {
  id: string;
  modality: Modality;
  modelId: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio: AspectRatio;
  duration?: VideoDuration;
  resolution?: VideoResolution;
  status: JobStatus;
  progress: number;
  createdAt: number;
  completedAt?: number;
  creditsSpent: number;
  /** Still path, always present for thumbnails. */
  imageUrl: string;
  /** Bundled looping clip when we have one for this result. */
  videoUrl?: string;
  posterUrl?: string;
  firstFrameUrl?: string;
}

export const STARTING_CREDITS = 1240;
export const STORAGE_KEY = "prism.studio.v1";

export function aspectCss(ratio: AspectRatio): string {
  return ratio.replace(":", " / ");
}
