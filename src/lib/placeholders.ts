import type { AspectRatio } from "./types";

export interface StillAsset {
  src: string;
  aspect: AspectRatio;
}

export interface ReelAsset {
  src: string;
  poster: string;
  aspect: AspectRatio;
}

export const STILLS: StillAsset[] = [
  { src: "/placeholders/neon-rain.jpg", aspect: "16:9" },
  { src: "/placeholders/dune-gold.jpg", aspect: "16:9" },
  { src: "/placeholders/tide.jpg", aspect: "16:9" },
  { src: "/placeholders/chrome-car.jpg", aspect: "16:9" },
  { src: "/placeholders/portrait-gold.jpg", aspect: "3:4" },
  { src: "/placeholders/tower-night.jpg", aspect: "9:16" },
  { src: "/placeholders/alpine.jpg", aspect: "9:16" },
  { src: "/placeholders/fog-woods.jpg", aspect: "4:3" },
  { src: "/placeholders/star-ridge.jpg", aspect: "4:3" },
  { src: "/placeholders/square-city.jpg", aspect: "1:1" },
];

export const REELS: ReelAsset[] = [
  {
    src: "/placeholders/reel-dune.mp4",
    poster: "/placeholders/dune-gold.jpg",
    aspect: "16:9",
  },
  {
    src: "/placeholders/reel.mp4",
    poster: "/placeholders/neon-rain.jpg",
    aspect: "16:9",
  },
  {
    src: "/placeholders/reel-portrait.mp4",
    poster: "/placeholders/alpine.jpg",
    aspect: "9:16",
  },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function pickStill(
  aspect: AspectRatio,
  prompt: string,
  exclude?: string,
): StillAsset {
  const exact = STILLS.filter((still) => still.aspect === aspect);
  const pool = exact.length > 0 ? exact : STILLS;
  let index = hashString(prompt + aspect) % pool.length;
  if (exclude && pool.length > 1 && pool[index].src === exclude) {
    index = (index + 1) % pool.length;
  }
  return pool[index];
}

export function pickReel(
  aspect: AspectRatio,
  prompt: string,
): ReelAsset | undefined {
  const exact = REELS.filter((reel) => reel.aspect === aspect);
  if (exact.length === 0) return undefined;
  return exact[hashString(prompt) % exact.length];
}

export function mockDelayMs(): number {
  return 2000 + Math.random() * 2000;
}
