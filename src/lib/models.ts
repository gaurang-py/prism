export type Modality = "image" | "video";

export interface GenerationModel {
  id: string;
  name: string;
  modality: Modality;
  mockCredits: number;
  tagline: string;
}

/**
 * In-code catalog. Ids are stored on Job.modelId.
 * Fal endpoint mapping lives in src/lib/fal-map.ts.
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
  },
  {
    id: "seedance-fast",
    name: "Seedance Fast",
    modality: "video",
    mockCredits: 18,
    tagline: "Quick cuts, cheap tests",
  },
  {
    id: "kling-2.6",
    name: "Kling 2.6",
    modality: "video",
    mockCredits: 32,
    tagline: "Longer takes, smoother",
  },
  {
    id: "ltx-2",
    name: "LTX 2",
    modality: "video",
    mockCredits: 16,
    tagline: "Lean and experimental",
  },
];

export function modelsFor(modality: Modality): GenerationModel[] {
  return MODELS.filter((model) => model.modality === modality);
}

export function getModel(id: string): GenerationModel | undefined {
  return MODELS.find((model) => model.id === id);
}

export function defaultModelId(modality: Modality): string {
  return modelsFor(modality)[0].id;
}
