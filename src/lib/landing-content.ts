import { getModel, liveModels, MODELS } from "./models";

/** Credits for a catalog model id. Single source of truth is src/lib/models.ts. */
export function creditsFor(id: string): number {
  return getModel(id)?.mockCredits ?? 0;
}

/** How many free images the 100 welcome credits buy on a given model. */
export function freeRunsFor(id: string): number {
  const cost = creditsFor(id);
  return cost > 0 ? Math.floor(WELCOME_CREDITS / cost) : 0;
}

export const WELCOME_CREDITS = 100;

/** Count of adults-only engines in the catalog — keeps the 18+ copy honest. */
export const NSFW_MODEL_COUNT = MODELS.filter((model) => model.nsfw).length;

/**
 * Proof numbers shown on the landing page.
 *
 * TODO: wire these to real counts before launch. The design brief is explicit —
 * "Wire to real /api counts — never fake." They are placeholders, not measurements.
 */
export const LANDING_STATS = {
  spotsLeft: 1284,
  creatorsThisWeek: 2418,
  imagesToday: 38210,
  remixesToday: 412,
  totalCreators: 11960,
  waitlistCount: 3208,
} as const;

/**
 * Founding-creator urgency banner.
 *
 * "countdown" needs a real, fixed deadline — set `deadline` to an absolute ISO
 * timestamp the offer actually ends at. "spots" shows the seat counter only.
 * "none" hides the banner. Do not ship a cap or deadline that is not real.
 */
export const URGENCY: {
  mode: "countdown" | "spots" | "none";
  deadline: string;
  capacity: number;
} = {
  mode: "spots",
  deadline: "2026-10-01T00:00:00+05:30",
  capacity: 5000,
};

export const SHOWCASE = [
  {
    title: "Dream travel",
    model: "Nano Banana 2",
    prompt: "sunrise over another world",
    src: "/placeholders/alpine.jpg",
  },
  {
    title: "Fantasy worlds",
    model: "Nano Banana Pro",
    prompt: "future heritage at golden hour",
    src: "/placeholders/star-ridge.jpg",
  },
  {
    title: "Beauty products",
    model: "Nano Banana 2",
    prompt: "macro commercial lighting",
    src: "/placeholders/portrait-gold.jpg",
  },
  {
    title: "Neon cinema",
    model: "Veo 3.1 Fast",
    prompt: "high-speed neon chase",
    src: "/placeholders/tower-night.jpg",
  },
  {
    title: "Editorial",
    model: "Nano Banana Pro",
    prompt: "sunrise over another world",
    src: "/placeholders/fog-woods.jpg",
  },
  {
    title: "Sci-fi",
    model: "Nano Banana 2",
    prompt: "future heritage at golden hour",
    src: "/placeholders/square-city.jpg",
  },
  {
    title: "Product film",
    model: "Veo 3.1 Lite",
    prompt: "macro commercial lighting",
    src: "/placeholders/chrome-car.jpg",
  },
  {
    title: "Indian futures",
    model: "Nano Banana Pro",
    prompt: "future heritage at golden hour",
    src: "/placeholders/dune-gold.jpg",
  },
  {
    title: "Food campaigns",
    model: "Nano Banana 2",
    prompt: "macro commercial lighting",
    src: "/placeholders/tide.jpg",
  },
  {
    title: "Anime motion",
    model: "Veo 3.1",
    prompt: "high-speed neon chase",
    src: "/placeholders/neon-rain.jpg",
  },
] as const;

export const VIDEO_ENGINES = liveModels()
  .filter((model) => model.modality === "video" && !model.nsfw)
  .map((model) => ({
    id: model.id,
    name: model.name,
    blurb: model.tagline,
    loop: model.previewLoop ?? "/placeholders/reel.mp4",
    poster: model.previewPoster ?? "/placeholders/neon-rain.jpg",
  }));

/** Cheapest live video engine — the one the copy quotes as the first-clip price. */
export const STARTER_ENGINE_ID = "veo-3.1-lite";

export const PAIN_POINTS = [
  {
    n: "01",
    title: "Too many subscriptions",
    body: "One tool for images, another for video, and another bill every month.",
  },
  {
    n: "02",
    title: "Credits disappear too quickly",
    body: "Expensive generations make experimentation feel risky.",
  },
  {
    n: "03",
    title: "The right model is elsewhere",
    body: "Creators lose time moving between platforms and learning new interfaces.",
  },
  {
    n: "04",
    title: "Creation stops too soon",
    body: "Rigid tools interrupt legitimate exploration instead of enabling it responsibly.",
  },
] as const;

export const IMAGE_MODELS = liveModels()
  .filter((model) => model.modality === "image" && !model.nsfw)
  .map((model) => ({
    id: model.id,
    name: model.name,
    tagline: model.tagline,
  }));

/** Default pick the copy points beginners at. */
export const STARTER_MODEL_ID = "nano-banana-2";

export const STEPS = [
  {
    n: "01",
    title: "Describe it",
    body: "Plain words work. Or tap a preset and change one thing.",
  },
  {
    n: "02",
    title: "Keep the default engine",
    body: "We pre-select the right model. Switch later when you know what you like.",
  },
  {
    n: "03",
    title: "Generate and post",
    body: "Download, remix, or animate it into a clip — all in one place.",
  },
] as const;

export const USE_CASES = [
  {
    title: "Fashion & editorial",
    model: "Nano Banana 2",
    modelId: "nano-banana-2",
    src: "/placeholders/portrait-gold.jpg",
    prompt: "Editorial portrait, hard studio flash, magenta gel, 85mm",
  },
  {
    title: "Cinematic worlds",
    model: "Nano Banana Pro",
    modelId: "nano-banana-pro",
    src: "/placeholders/dune-gold.jpg",
    prompt: "Lone traveller crossing golden dunes at dusk, anamorphic",
  },
  {
    title: "Product campaigns",
    model: "Nano Banana Pro",
    modelId: "nano-banana-pro",
    src: "/placeholders/chrome-car.jpg",
    prompt: "Chrome sports car on wet black studio floor, rim light",
  },
] as const;

/** One-tap prompt starters for the landing docks. */
export const PROMPT_PRESETS = [
  { label: "Neon Mumbai street", prompt: "A rain-soaked neon street in Mumbai, cinematic, 35mm" },
  {
    label: "Chrome sneaker",
    prompt: "Product shot of a chrome sneaker on wet marble, studio light",
  },
  { label: "Golden-hour portrait", prompt: "Portrait at golden hour, 85mm, soft film grain" },
  { label: "Anime dusk city", prompt: "Anime city at dusk, drifting lanterns, wide shot" },
] as const;

/** Floating model chips pinned around the hero studio mock. */
export const HERO_CHIPS = [
  { id: "nano-banana-pro", label: "Nano Banana Pro", kind: "Image", pos: "left-[-18px] top-[22%]" },
  { id: "nano-banana", label: "Nano Banana", kind: "Image", pos: "left-[6%] bottom-[42%]" },
  { id: "nano-banana-2", label: "Nano Banana 2", kind: "Image", pos: "right-[-12px] top-[30%]" },
  {
    id: "veo-3.1-fast",
    label: "Veo 3.1 Fast",
    kind: "Video",
    pos: "right-[4%] bottom-[44%]",
  },
  { id: "veo-3.1", label: "Veo 3.1", kind: "Video", pos: "right-[-16px] bottom-[26%]" },
] as const;

export const COMPARE_STITCHED = [
  "Pay 3–4 subscriptions before you’ve made anything",
  "Guess which model does what from a forum thread",
  "Learn a new interface for images, another for video",
  "Desktop-only tools when you create from your phone",
  "Burn credits on experiments you can’t afford to repeat",
] as const;

export const COMPARE_PRISM = [
  "One account, one balance, image and video",
  "Every model explained in plain words, with a default pick",
  "Remixable prompts so you never start from a blank box",
  "Built phone-first, priced for India",
  "100 free credits — your first 25 images cost nothing",
] as const;

export const FAQ = [
  {
    q: "What do I get when I join?",
    a: "You receive 100 image-generation credits. No credit card is required, so you can explore Prism before buying anything.",
  },
  {
    q: "Which models can I use?",
    a: "Image engines include Nano Banana 2, Nano Banana Pro and Nano Banana. Video engines include Veo 3.1 Fast, Veo 3.1 and Veo 3.1 Lite — all powered by Google Gemini on one account.",
  },
  {
    q: "Can I switch models with one account?",
    a: "Yes. One login and one credit balance cover every image and video engine in Prism. Switch models without opening another tab or another bill.",
  },
  {
    q: "Does Prism work on a phone?",
    a: "Yes. Prism is built phone-first so you can describe, choose an engine and generate from the device already in your hand.",
  },
  {
    q: "How will paid credits work?",
    a: "Creator credit packs arrive at launch. Until then, start with 100 free welcome credits and buy more only when you need them — no subscription maze.",
  },
  {
    q: "What is Prism’s adults-only mode?",
    a: "Verified adults can opt in to broader NSFW image and video creation. It stays off by default, requires 18+ confirmation, and bans minors, non-consensual intimate imagery and explicit deepfakes of identifiable people.",
  },
] as const;
