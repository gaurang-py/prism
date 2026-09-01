export const SHOWCASE = [
  {
    title: "Dream travel",
    model: "Seedream 5",
    prompt: "sunrise over another world",
    src: "/placeholders/alpine.jpg",
  },
  {
    title: "Fantasy worlds",
    model: "Flux 2 Dev",
    prompt: "future heritage at golden hour",
    src: "/placeholders/star-ridge.jpg",
  },
  {
    title: "Beauty products",
    model: "Seedream 5",
    prompt: "macro commercial lighting",
    src: "/placeholders/portrait-gold.jpg",
  },
  {
    title: "Neon cinema",
    model: "Flux 2 Dev",
    prompt: "high-speed neon chase",
    src: "/placeholders/tower-night.jpg",
  },
  {
    title: "Editorial",
    model: "Seedream 5",
    prompt: "sunrise over another world",
    src: "/placeholders/fog-woods.jpg",
  },
  {
    title: "Sci-fi",
    model: "Flux 2 Dev",
    prompt: "future heritage at golden hour",
    src: "/placeholders/square-city.jpg",
  },
  {
    title: "Product film",
    model: "Seedream 5",
    prompt: "macro commercial lighting",
    src: "/placeholders/chrome-car.jpg",
  },
  {
    title: "Indian futures",
    model: "Flux 2 Dev",
    prompt: "future heritage at golden hour",
    src: "/placeholders/dune-gold.jpg",
  },
  {
    title: "Food campaigns",
    model: "Seedream 5",
    prompt: "macro commercial lighting",
    src: "/placeholders/tide.jpg",
  },
  {
    title: "Anime motion",
    model: "Flux 2 Dev",
    prompt: "high-speed neon chase",
    src: "/placeholders/neon-rain.jpg",
  },
] as const;

export const VIDEO_ENGINES = [
  {
    id: "wan-2.6",
    name: "Wan 2.6",
    blurb: "Cinematic camera motion",
    loop: "/placeholders/reel-portrait.mp4",
    poster: "/placeholders/portrait-gold.jpg",
  },
  {
    id: "seedance-fast",
    name: "Seedance Fast",
    blurb: "Image-to-video",
    loop: "/placeholders/reel.mp4",
    poster: "/placeholders/neon-rain.jpg",
  },
  {
    id: "kling-2.6",
    name: "Kling 2.6",
    blurb: "Fast social cuts",
    loop: "/placeholders/reel-dune.mp4",
    poster: "/placeholders/fog-woods.jpg",
  },
  {
    id: "ltx-2",
    name: "LTX 2",
    blurb: "Lean experimental motion",
    loop: "/placeholders/reel-dune.mp4",
    poster: "/placeholders/dune-gold.jpg",
  },
] as const;

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

export const IMAGE_MODELS = [
  {
    id: "flux-2-schnell",
    name: "Flux 2 Schnell",
    tagline: "Fast drafts, still sharp",
  },
  {
    id: "flux-2-dev",
    name: "Flux 2 Dev",
    tagline: "Higher fidelity and control",
  },
  {
    id: "seedream-5",
    name: "Seedream 5",
    tagline: "Cinematic stills, rich colour",
  },
  {
    id: "sdxl",
    name: "SDXL",
    tagline: "Reliable, flexible image creation",
  },
] as const;

export const STEPS = [
  {
    n: "01",
    title: "Describe it",
    body: "Write your idea naturally or begin with a suggested prompt.",
  },
  {
    n: "02",
    title: "Choose your engine",
    body: "Pick the model, format and settings that fit the job.",
  },
  {
    n: "03",
    title: "Generate and refine",
    body: "Create, compare and try again without leaving Prism.",
  },
] as const;

export const USE_CASES = [
  {
    title: "Fashion & editorial",
    model: "Flux 2 Schnell",
    src: "/placeholders/portrait-gold.jpg",
    hrefModel: "flux-2-schnell",
  },
  {
    title: "Cinematic worlds",
    model: "Seedream 5",
    src: "/placeholders/dune-gold.jpg",
    hrefModel: "seedream-5",
  },
  {
    title: "Product campaigns",
    model: "Flux 2 Dev",
    src: "/placeholders/chrome-car.jpg",
    hrefModel: "flux-2-dev",
  },
] as const;

export const FAQ = [
  {
    q: "What do I get when I join?",
    a: "You receive 100 image-generation credits. No credit card is required, so you can explore Prism before buying anything.",
  },
  {
    q: "Which models can I use?",
    a: "Image engines include Flux 2 Schnell, Flux 2 Dev, Seedream 5 and SDXL. Video engines include Wan 2.6, Seedance Fast, Kling 2.6 and LTX 2 — all on one account.",
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
