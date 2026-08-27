export type Modality = "image" | "video";

export interface GenerationModel {
  id: string;
  name: string;
  modality: Modality;
  mockCredits: number;
  tagline: string;
  nsfw?: boolean;
  previewLoop?: string;
  previewPoster?: string;
}

/**
 * In-code catalog. Ids are stored on Job.modelId.
 * Fal endpoint mapping lives in src/lib/fal-map.ts.
 * NSFW models stay hidden until the user opts in (18+ confirm on the User row).
 */
export const MODELS: GenerationModel[] = [
  {
    id: "flux-2-schnell",
    name: "Flux 2 Schnell",
    modality: "image",
    mockCredits: 4,
    tagline: "Fast drafts, still sharp",
  },
  {
    id: "flux-2-dev",
    name: "Flux 2 Dev",
    modality: "image",
    mockCredits: 8,
    tagline: "Higher fidelity, slower",
  },
  {
    id: "seedream-5",
    name: "Seedream 5",
    modality: "image",
    mockCredits: 10,
    tagline: "Cinematic stills, rich grade",
  },
  {
    id: "sdxl",
    name: "SDXL",
    modality: "image",
    mockCredits: 3,
    tagline: "Classic workhorse",
  },
  {
    id: "wan-2.6",
    name: "Wan 2.6",
    modality: "video",
    mockCredits: 24,
    tagline: "Motion with weight",
    previewLoop: "/placeholders/reel-portrait.mp4",
    previewPoster: "/placeholders/portrait-gold.jpg",
  },
  {
    id: "seedance-fast",
    name: "Seedance Fast",
    modality: "video",
    mockCredits: 18,
    tagline: "Quick cuts, cheap tests",
    previewLoop: "/placeholders/reel.mp4",
    previewPoster: "/placeholders/neon-rain.jpg",
  },
  {
    id: "kling-2.6",
    name: "Kling 2.6",
    modality: "video",
    mockCredits: 32,
    tagline: "Longer takes, smoother",
    previewLoop: "/placeholders/reel-dune.mp4",
    previewPoster: "/placeholders/fog-woods.jpg",
  },
  {
    id: "ltx-2",
    name: "LTX 2",
    modality: "video",
    mockCredits: 16,
    tagline: "Lean and experimental",
    previewLoop: "/placeholders/reel-dune.mp4",
    previewPoster: "/placeholders/dune-gold.jpg",
  },
  {
    id: "flux-uncensored",
    name: "Flux Uncensored",
    modality: "image",
    mockCredits: 8,
    tagline: "Flux Dev, safety checker off",
    nsfw: true,
  },
  {
    id: "pony-v7",
    name: "Pony V7",
    modality: "image",
    mockCredits: 6,
    tagline: "Adult character stills",
    nsfw: true,
  },
  {
    id: "sdxl-uncensored",
    name: "SDXL Uncensored",
    modality: "image",
    mockCredits: 4,
    tagline: "Fast SDXL, checker off",
    nsfw: true,
  },
  {
    id: "hunyuan-video",
    name: "Hunyuan Video",
    modality: "video",
    mockCredits: 28,
    tagline: "Open video, checker off",
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

/** Lowest-credit SFW video in the catalog. Today that is LTX 2. */
export function cheapestVideoModel(): GenerationModel {
  const videos = MODELS.filter((model) => model.modality === "video" && !model.nsfw);
  return videos.reduce((best, model) =>
    model.mockCredits < best.mockCredits ? model : best,
  );
}
