import type { Modality, ProviderId } from "../models";
import type { AspectRatio, OutputResolution, VideoDuration } from "../types";

export type { ProviderId };

/** Thrown when a provider is misconfigured or cannot service a model. */
export class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface GenerateRequest {
  modelId: string;
  modality: Modality;
  prompt: string;
  aspectRatio: AspectRatio;
  duration?: VideoDuration | null;
  resolution?: OutputResolution | null;
  /** Signed URL of an uploaded still, when the run is image-to-image / image-to-video. */
  firstFrameUrl?: string | null;
}

/**
 * What a provider hands back. Fal returns a CDN URL we can fetch anonymously;
 * Google returns base64 bytes, or a Files URI that needs the API key to read —
 * so the provider resolves that itself and gives us bytes.
 */
export type GeneratedMedia =
  | { source: "url"; url: string; contentType?: string; requestId?: string }
  | { source: "bytes"; bytes: Buffer; contentType: string; requestId?: string };

export type ProgressFn = (update: {
  requestId?: string;
  progress: number;
}) => Promise<void> | void;
