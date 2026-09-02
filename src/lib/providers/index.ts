import { getModel, type ProviderId } from "../models";
import { ProviderError, type GenerateRequest, type GeneratedMedia, type ProgressFn } from "./types";
import { assertFalKey, falKeyConfigured, runFal } from "./fal";
import { assertGoogleKey, googleKeyConfigured, runGoogleGeneration } from "./google";

export { ProviderError };
export type { GenerateRequest, GeneratedMedia, ProgressFn, ProviderId };

/** Which upstream serves a catalog id. Unknown ids fall back to Fal, as before. */
export function providerForModel(modelId: string): ProviderId {
  return getModel(modelId)?.provider ?? "fal";
}

export function providerConfigured(provider: ProviderId): boolean {
  return provider === "google" ? googleKeyConfigured() : falKeyConfigured();
}

export function assertProviderConfigured(provider: ProviderId): void {
  if (provider === "google") assertGoogleKey();
  else assertFalKey();
}

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  fal: "Fal.ai",
  google: "Google",
};

export async function runGeneration(
  request: GenerateRequest,
  onProgress?: ProgressFn,
): Promise<GeneratedMedia> {
  const provider = providerForModel(request.modelId);
  assertProviderConfigured(provider);
  return provider === "google"
    ? runGoogleGeneration(request, onProgress)
    : runFal(request, onProgress);
}
