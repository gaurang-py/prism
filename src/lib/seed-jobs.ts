import type { Job } from "./types";

const HOUR = 60 * 60 * 1000;

/** Fixed timestamps so first paint is stable. */
const T0 = Date.parse("2026-08-26T18:40:00.000Z");

export const SEED_JOBS: Job[] = [
  {
    id: "seed-tokyo-rain",
    modality: "image",
    modelId: "seedream-5",
    prompt:
      "Rain-slick Tokyo alley at 2am, sodium and neon, anamorphic flares, still from a lost Wong Kar-wai reel",
    aspectRatio: "16:9",
    status: "done",
    progress: 100,
    createdAt: T0 - 2 * HOUR,
    completedAt: T0 - 2 * HOUR + 4000,
    creditsSpent: 10,
    imageUrl: "/placeholders/neon-rain.jpg",
    posterUrl: "/placeholders/neon-rain.jpg",
  },
  {
    id: "seed-desert-dolly",
    modality: "video",
    modelId: "wan-2.6",
    prompt:
      "Slow dolly through a desert at magic hour, heat shimmer, IMAX scale, no people",
    aspectRatio: "16:9",
    duration: 5,
    resolution: "1080p",
    status: "done",
    progress: 100,
    createdAt: T0 - 5 * HOUR,
    completedAt: T0 - 5 * HOUR + 8000,
    creditsSpent: 24,
    imageUrl: "/placeholders/dune-gold.jpg",
    posterUrl: "/placeholders/dune-gold.jpg",
    videoUrl: "/placeholders/reel-dune.mp4",
  },
  {
    id: "seed-portrait",
    modality: "image",
    modelId: "flux-2-dev",
    prompt:
      "Close portrait, gold rim light, 35mm, shallow depth, quiet confidence, film grain",
    negativePrompt: "plastic skin, oversharpened, watermark",
    aspectRatio: "3:4",
    status: "done",
    progress: 100,
    createdAt: T0 - 9 * HOUR,
    completedAt: T0 - 9 * HOUR + 5000,
    creditsSpent: 8,
    imageUrl: "/placeholders/portrait-gold.jpg",
    posterUrl: "/placeholders/portrait-gold.jpg",
  },
  {
    id: "seed-ridge",
    modality: "video",
    modelId: "kling-2.6",
    prompt:
      "Handheld climb toward a snow ridge, breath in cold air, documentary grade, 9:16",
    aspectRatio: "9:16",
    duration: 5,
    resolution: "1080p",
    status: "done",
    progress: 100,
    createdAt: T0 - 26 * HOUR,
    completedAt: T0 - 26 * HOUR + 9000,
    creditsSpent: 32,
    imageUrl: "/placeholders/alpine.jpg",
    posterUrl: "/placeholders/alpine.jpg",
    videoUrl: "/placeholders/reel-portrait.mp4",
  },
  {
    id: "seed-courtyard",
    modality: "image",
    modelId: "sdxl",
    prompt:
      "Symmetrical Haussmann courtyard after rain, wet stone, one open window, square frame",
    aspectRatio: "1:1",
    status: "done",
    progress: 100,
    createdAt: T0 - 30 * HOUR,
    completedAt: T0 - 30 * HOUR + 3500,
    creditsSpent: 3,
    imageUrl: "/placeholders/square-city.jpg",
    posterUrl: "/placeholders/square-city.jpg",
  },
];
