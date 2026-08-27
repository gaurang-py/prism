import type { Modality } from "./models";
import type { AspectRatio, OutputResolution, VideoDuration } from "./types";

export const GENERATE_DRAFT_KEY = "prism.generateDraft";

export interface GenerateDraft {
  prompt: string;
  modality: Modality;
  modelId: string;
  aspectRatio: AspectRatio;
  resolution: OutputResolution;
  duration: VideoDuration;
  variationCount: number;
}

export function saveGenerateDraft(draft: GenerateDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(GENERATE_DRAFT_KEY, JSON.stringify(draft));
}

export function readGenerateDraft(): GenerateDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(GENERATE_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GenerateDraft;
  } catch {
    return null;
  }
}

export function clearGenerateDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(GENERATE_DRAFT_KEY);
}

export function generateContinuePath(draft: Pick<GenerateDraft, "prompt" | "modality" | "modelId">): string {
  const params = new URLSearchParams({
    mode: draft.modality,
    model: draft.modelId,
  });
  if (draft.prompt.trim()) params.set("prompt", draft.prompt.trim());
  return `/generate?${params.toString()}`;
}
