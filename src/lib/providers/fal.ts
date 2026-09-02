import { runFalGeneration } from "../fal-run";
import type { GenerateRequest, GeneratedMedia, ProgressFn } from "./types";

export { assertFalKey, falKeyConfigured } from "../fal-map";

/** Fal hands back a public CDN URL, so the worker can fetch it unauthenticated. */
export async function runFal(
  request: GenerateRequest,
  onProgress?: ProgressFn,
): Promise<GeneratedMedia> {
  const media = await runFalGeneration(request, onProgress);
  return {
    source: "url",
    url: media.url,
    contentType: media.contentType,
    requestId: media.requestId,
  };
}
