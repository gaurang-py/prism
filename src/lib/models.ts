import { veoDuration, veoResolution } from "./providers/google";
import { VIDEO_DURATIONS, VIDEO_RESOLUTIONS, type OutputResolution, type VideoDuration, type VideoResolution } from "./types";

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

export function isProviderLive(provider: ProviderId): boolean {
  // Client bundles cannot read server env — the live catalog is Google-only for now.
  if (typeof window !== "undefined") {
    return provider === "google";
  }
  if (provider === "google") {
    return Boolean(
      process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim(),
    );
  }
  return Boolean(process.env.FAL_KEY?.trim());
}

/** Models whose upstream API key is configured on this deployment. */
export function liveModels(): GenerationModel[] {
  return MODELS.filter((model) => isProviderLive(model.provider));
}

export function visibleModels(opts: {
  nsfwEnabled?: boolean;
  filter?: HomeFilter;
  modality?: Modality;
  /** When true (default), hide models whose provider key is missing. */
  configuredOnly?: boolean;
} = {}): GenerationModel[] {
  const configuredOnly = opts.configuredOnly !== false;
  return MODELS.filter((model) => {
    if (configuredOnly && !isProviderLive(model.provider)) return false;
    if (model.nsfw && !opts.nsfwEnabled) return false;
    if (opts.modality && model.modality !== opts.modality) return false;
    if (opts.filter === "image") return model.modality === "image";
    if (opts.filter === "video") return model.modality === "video";
    if (opts.filter === "nsfw") return Boolean(model.nsfw);
    return true;
  });
}

export function modelsFor(modality: Modality, nsfwEnabled = false, configuredOnly = true): GenerationModel[] {
  return visibleModels({ modality, nsfwEnabled, configuredOnly });
}

export function getModel(id: string, configuredOnly = false): GenerationModel | undefined {
  const model = MODELS.find((m) => m.id === id);
  if (!model) return undefined;
  if (configuredOnly && !isProviderLive(model.provider)) return undefined;
  return model;
}

export function defaultModelId(modality: Modality, nsfwEnabled = false): string {
  const list = modelsFor(modality, nsfwEnabled);
  if (list.length === 0) {
    throw new Error(`No live ${modality} models are configured.`);
  }
  return list[0].id;
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

/**
 * Veo only allows 1080p at 6 or 8 seconds — 4 second clips must be 720p.
 * Fal video models accept both at every duration they offer.
 */
export function videoResolutionsFor(
  modelId: string,
  duration?: VideoDuration | null,
): readonly VideoResolution[] {
  const model = getModel(modelId);
  if (model?.modality !== "video") return VIDEO_RESOLUTIONS;
  if (model.provider === "google") {
    return veoDuration(duration) === 4 ? (["720p"] as const) : VIDEO_RESOLUTIONS;
  }
  return VIDEO_RESOLUTIONS;
}

export function coerceVideoResolution(
  modelId: string,
  duration: VideoDuration | null | undefined,
  resolution: OutputResolution,
): OutputResolution {
  const model = getModel(modelId);
  if (model?.modality === "video" && model.provider === "google") {
    return veoResolution(duration, resolution);
  }
  if (model?.modality === "video") {
    const allowed = videoResolutionsFor(modelId, duration);
    return (allowed as readonly string[]).includes(resolution) ? resolution : allowed[0];
  }
  return resolution;
}

/** Lowest-credit live SFW video in the catalog. */
export function cheapestVideoModel(configuredOnly = true): GenerationModel {
  const source = configuredOnly ? liveModels() : MODELS;
  const videos = source.filter((model) => model.modality === "video" && !model.nsfw);
  if (videos.length === 0) {
    throw new Error("No live video models are configured.");
  }
  return videos.reduce((best, model) =>
    model.mockCredits < best.mockCredits ? model : best,
  );
}
