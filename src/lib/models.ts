import { VIDEO_DURATIONS } from "./types";

export type Modality = "image" | "video";

/** Which upstream actually serves a model. */
export type ProviderId = "fal" | "google";

export interface GenerationModel {
  id: string;
  name: string;
  modality: Modality;
  provider: ProviderId;
  mockCredits: number;
  tagline: string;
  /** Clip lengths in seconds this model accepts. Video models only. */
  durations?: readonly number[];
  nsfw?: boolean;
  previewLoop?: string;
  previewPoster?: string;
}

/**
 * In-code catalog. Ids are stored on Job.modelId.
 * Endpoint mapping lives next to each provider:
 *   provider "fal"    -> src/lib/fal-map.ts
 *   provider "google" -> src/lib/providers/google.ts
 * Order matters: the first entry per modality is that modality's default, so the
 * Google models lead — they are the ones wired to a live key.
 * NSFW models stay hidden until the user opts in (18+ confirm on the User row).
 */
export const MODELS: GenerationModel[] = [
  {
    id: "nano-banana-2",
    name: "Nano Banana 2",
    modality: "image",
    provider: "google",
    mockCredits: 6,
    tagline: "Google's fast image workhorse",
  },
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    modality: "image",
    provider: "google",
    mockCredits: 12,
    tagline: "Reasons before it draws, 2K",
  },
  {
    id: "nano-banana",
    name: "Nano Banana",
    modality: "image",
    provider: "google",
    mockCredits: 4,
    tagline: "The original, cheapest Google still",
  },
  {
    id: "veo-3.1-fast",
    name: "Veo 3.1 Fast",
    modality: "video",
    provider: "google",
    mockCredits: 28,
    tagline: "Veo quality, quicker turnaround",
    durations: [4, 6, 8],
    previewLoop: "/placeholders/reel-dune.mp4",
    previewPoster: "/placeholders/star-ridge.jpg",
  },
  {
    id: "veo-3.1",
    name: "Veo 3.1",
    modality: "video",
    provider: "google",
    mockCredits: 72,
    tagline: "Google's top-end motion",
    durations: [4, 6, 8],
    previewLoop: "/placeholders/reel.mp4",
    previewPoster: "/placeholders/tower-night.jpg",
  },
  {
    id: "veo-3.1-lite",
    name: "Veo 3.1 Lite",
    modality: "video",
    provider: "google",
    mockCredits: 18,
    tagline: "Cheapest Veo, quick tests",
    durations: [4, 6, 8],
    previewLoop: "/placeholders/reel-portrait.mp4",
    previewPoster: "/placeholders/alpine.jpg",
  },
  {
    id: "flux-2-schnell",
    name: "Flux 2 Schnell",
    modality: "image",
    provider: "fal",
    mockCredits: 4,
    tagline: "Fast drafts, still sharp",
  },
  {
    id: "flux-2-dev",
    name: "Flux 2 Dev",
    modality: "image",
    provider: "fal",
    mockCredits: 8,
    tagline: "Higher fidelity, slower",
  },
  {
    id: "seedream-5",
    name: "Seedream 5",
    modality: "image",
    provider: "fal",
    mockCredits: 10,
    tagline: "Cinematic stills, rich grade",
  },
  {
    id: "sdxl",
    name: "SDXL",
    modality: "image",
    provider: "fal",
    mockCredits: 3,
    tagline: "Classic workhorse",
  },
  {
    id: "wan-2.6",
    name: "Wan 2.6",
    modality: "video",
    provider: "fal",
    mockCredits: 24,
    tagline: "Motion with weight",
    durations: [5, 10],
    previewLoop: "/placeholders/reel-portrait.mp4",
    previewPoster: "/placeholders/portrait-gold.jpg",
  },
  {
    id: "seedance-fast",
    name: "Seedance Fast",
    modality: "video",
    provider: "fal",
    mockCredits: 18,
    tagline: "Quick cuts, cheap tests",
    durations: [5, 10],
    previewLoop: "/placeholders/reel.mp4",
    previewPoster: "/placeholders/neon-rain.jpg",
  },
  {
    id: "kling-2.6",
    name: "Kling 2.6",
    modality: "video",
    provider: "fal",
    mockCredits: 32,
    tagline: "Longer takes, smoother",
    durations: [5, 10],
    previewLoop: "/placeholders/reel-dune.mp4",
    previewPoster: "/placeholders/fog-woods.jpg",
  },
  {
    id: "ltx-2",
    name: "LTX 2",
    modality: "video",
    provider: "fal",
    mockCredits: 16,
    tagline: "Lean and experimental",
    durations: [6, 10],
    previewLoop: "/placeholders/reel-dune.mp4",
    previewPoster: "/placeholders/dune-gold.jpg",
  },
  {
    id: "flux-uncensored",
    name: "Flux Uncensored",
    modality: "image",
    provider: "fal",
    mockCredits: 8,
    tagline: "Flux Dev, safety checker off",
    nsfw: true,
  },
  {
    id: "pony-v7",
    name: "Pony V7",
    modality: "image",
    provider: "fal",
    mockCredits: 6,
    tagline: "Adult character stills",
    nsfw: true,
  },
  {
    id: "sdxl-uncensored",
    name: "SDXL Uncensored",
    modality: "image",
    provider: "fal",
    mockCredits: 4,
    tagline: "Fast SDXL, checker off",
    nsfw: true,
  },
  {
    id: "hunyuan-video",
    name: "Hunyuan Video",
    modality: "video",
    provider: "fal",
    mockCredits: 28,
    tagline: "Open video, checker off",
    durations: [5, 10],
    nsfw: true,
    previewLoop: "/placeholders/reel.mp4",
    previewPoster: "/placeholders/neon-rain.jpg",
  },
];

export type HomeFilter = "all" | "image" | "video" | "nsfw";

export function visibleModels(opts: {
  nsfwEnabled?: boolean;
  filter?: HomeFilter;
  modality?: Modality;
} = {}): GenerationModel[] {
  return MODELS.filter((model) => {
    if (model.nsfw && !opts.nsfwEnabled) return false;
    if (opts.modality && model.modality !== opts.modality) return false;
    if (opts.filter === "image") return model.modality === "image";
    if (opts.filter === "video") return model.modality === "video";
    if (opts.filter === "nsfw") return Boolean(model.nsfw);
    return true;
  });
}

export function modelsFor(modality: Modality, nsfwEnabled = false): GenerationModel[] {
  return visibleModels({ modality, nsfwEnabled });
}

export function getModel(id: string): GenerationModel | undefined {
  return MODELS.find((model) => model.id === id);
}

export function defaultModelId(modality: Modality, nsfwEnabled = false): string {
  return modelsFor(modality, nsfwEnabled)[0].id;
}

/**
 * Clip lengths a model accepts. Veo only takes 4, 6 or 8 seconds; the Fal video
 * models take 5 or 10; LTX 2 takes 6 or 10. Showing the wrong ones in the dock
 * means the provider rejects the run, so the dock reads this.
 */
export function durationsFor(modelId: string): readonly number[] {
  return getModel(modelId)?.durations ?? VIDEO_DURATIONS;
}

export function defaultDurationFor(modelId: string): number {
  return durationsFor(modelId)[0];
}

/** Snap an arbitrary duration onto the nearest one the model accepts. */
export function coerceDuration(modelId: string, value: number | null | undefined): number {
  const allowed = durationsFor(modelId);
  if (value == null) return allowed[0];
  if (allowed.includes(value)) return value;
  return allowed.reduce((best, option) =>
    Math.abs(option - value) <= Math.abs(best - value) ? option : best,
  );
}

/** Lowest-credit SFW video in the catalog. Today that is LTX 2. */
export function cheapestVideoModel(): GenerationModel {
  const videos = MODELS.filter((model) => model.modality === "video" && !model.nsfw);
  return videos.reduce((best, model) =>
    model.mockCredits < best.mockCredits ? model : best,
  );
}
