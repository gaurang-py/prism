"use client";

/* eslint-disable @next/next/no-img-element -- marketing stills are local placeholders */

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clapperboard,
  Globe2,
  ImageIcon,
  Play,
  Smartphone,
  Sparkles,
  Wallet,
  Zap,
  Aperture,
  Moon,
} from "lucide-react";
import { GenerateDock } from "@/components/studio/generate-dock";
import { PrismMark } from "@/components/studio/prism-mark";
import { HoverVideo } from "@/components/studio/hover-video";
import { useStudio } from "@/context/studio-context";
import {
  FAQ,
  IMAGE_MODELS,
  PAIN_POINTS,
  SHOWCASE,
  STEPS,
  USE_CASES,
  VIDEO_ENGINES,
} from "@/lib/landing-content";
import { loginUrl, signupUrl } from "@/lib/paths";
import { generatePath } from "@/lib/types";
import { cn } from "@/lib/utils";

const BG = "#080908";
const FG = "#F5F7F1";
const LIME = "#C8FF00";

const CLAIM = signupUrl("/home");
const SIGN_IN = loginUrl("/home");
const VIDEO_SIGNUP = signupUrl(generatePath("video", "seedance-fast"));

const limeBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#C8FF00] px-7 text-[15px] font-semibold text-[#080908] shadow-[0_0_40px_rgba(200,255,0,.22)] transition hover:bg-[#dcff54] sm:h-14 sm:px-8";
const ghostBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-transparent px-7 text-[15px] font-semibold text-[#F5F7F1] transition hover:border-[#C8FF00]/45 hover:bg-white/[.04] sm:h-14 sm:px-8";

export function LandingPage() {
  return (
    <div id="top" className="min-h-dvh font-sans text-[#F5F7F1]" style={{ background: BG }}>
      <div className="sticky top-0 z-40">
        <TopBanner />
        <MarketingNav />
      </div>
      <Hero />
      <Showcase />
      <ImageToVideo />
      <PainPoints />
      <ModelPicker />
      <ThreeSteps />
      <UseCases />
      <Compare />
      <Freedom />
      <BuiltInIndia />
      <Pricing />
      <Faq />
      <FinalCta />
      <SiteFooter />
      <MobileClaimBar />
    </div>
  );
}

function Shell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6", className)}>
      {children}
    </div>
  );
}

function TopBanner() {
  return (
    <div className="border-b border-white/[0.06] bg-[#0b0c0a] px-4 py-2.5 text-center text-[13px] text-[#F5F7F1]/70">
      <span className="mr-2 inline-block size-1.5 rounded-full bg-[#C8FF00] shadow-[0_0_8px_#C8FF00]" />
      Now open for early creators — get{" "}
      <span className="font-medium text-[#F5F7F1]">100 image credits free</span>. No card
      required.
    </div>
  );
}

function MarketingNav() {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#showcase", label: "Showcase" },
    { href: "#models", label: "Models" },
    { href: "#video", label: "Video" },
    { href: "#freedom", label: "18+ Freedom" },
    { href: "#pricing", label: "Pricing" },
  ];
  return (
    <header className="border-b border-white/[0.06] bg-[#080908]/92 backdrop-blur-xl">
      <Shell className="flex h-[64px] items-center justify-between gap-3">
        <a href="#top" className="flex items-center gap-2.5">
          <PrismMark className="size-[22px] text-[#C8FF00]" />
          <span className="text-[17px] font-semibold tracking-tight">Prism</span>
        </a>
        <nav className="hidden items-center gap-7 text-[14px] text-[#F5F7F1]/72 lg:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={SIGN_IN}
            className="hidden h-10 items-center rounded-full px-3 text-[14px] text-[#F5F7F1]/85 hover:bg-white/[0.05] sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href={CLAIM}
            className="hidden h-10 items-center gap-1.5 rounded-full bg-[#C8FF00] px-4 text-[13px] font-semibold text-[#080908] shadow-[0_0_28px_rgba(200,255,0,.2)] hover:bg-[#dcff54] sm:inline-flex"
          >
            Claim 100 Free Credits
            <ArrowRight className="size-3.5" />
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-white/12 lg:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "×" : "☰"}
          </button>
        </div>
      </Shell>
      {open && (
        <div className="border-t border-white/[0.06] px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3 text-sm">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
            <Link href={SIGN_IN}>Sign in</Link>
            <Link href={CLAIM} className={cn(limeBtn, "h-11")} onClick={() => setOpen(false)}>
              Claim 100 Free Credits
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-12 sm:pt-16 lg:pb-24 lg:pt-20">
      <div className="pointer-events-none absolute top-[-20%] right-[-10%] h-[70%] w-[55%] rounded-full bg-[radial-gradient(circle,rgba(200,255,0,0.18),transparent_68%)] blur-2xl" />
      <div className="pointer-events-none absolute top-[10%] left-[35%] h-[40%] w-[40%] rounded-full bg-[radial-gradient(circle,rgba(200,255,0,0.08),transparent_70%)]" />
      <Shell className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.2em] text-[#C8FF00] uppercase">
            Built in India · Created for every imagination
          </p>
          <h1
            className="mt-5 text-[44px] leading-[0.98] font-[560] text-[#F5F7F1] sm:text-[64px] lg:text-[78px]"
            style={{ letterSpacing: "-0.06em" }}
          >
            Imagine it.
            <br />
            Generate it.
            <br />
            <span className="text-[#C8FF00]">No limits</span>
            <br />
            <span className="text-[#C8FF00]">between.</span>
          </h1>
          <p className="mt-6 max-w-[420px] text-[16px] leading-relaxed text-[#F5F7F1]/65 sm:text-[17px]">
            Images, videos and the models you want—one simple studio built in India.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#C8FF00]/25 bg-[#C8FF00]/10 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#C8FF00] uppercase">
            <Sparkles className="size-3.5" />
            100 free image credits · No card
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={CLAIM} className={limeBtn}>
              Create My First Image — Free
              <ArrowRight className="size-4" />
            </Link>
            <a href="#video" className={ghostBtn}>
              <Play className="size-4 fill-current" />
              Watch Prism Create
            </a>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#F5F7F1]/55">
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-[#C8FF00]" /> No card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-[#C8FF00]" /> Works on phone and desktop
            </span>
          </div>
        </div>
        <HeroStudioMock />
      </Shell>
    </section>
  );
}

function HeroStudioMock() {
  const { modality, setModality, selectModel, selectedModelId } = useStudio();
  const chips = useMemo(
    () => [
      { id: "flux-2-dev", label: "Flux 2 Dev", kind: "Image", pos: "left-[-18px] top-[22%]" },
      { id: "sdxl", label: "SDXL", kind: "Image", pos: "left-[6%] bottom-[42%]" },
      { id: "seedream-5", label: "Seedream 5", kind: "Image", pos: "right-[-12px] top-[30%]" },
      { id: "flux-2-schnell", label: "Flux 2 Schnell", kind: "Image", pos: "right-[4%] bottom-[44%]" },
      { id: "kling-2.6", label: "Kling 2.6", kind: "Video", pos: "right-[-16px] bottom-[26%]" },
    ],
    [],
  );
  const tiles = [
    { src: "/prism-hero.png", pos: "object-[18%_22%]" },
    { src: "/prism-hero.png", pos: "object-[72%_28%]" },
    { src: "/prism-hero.png", pos: "object-[28%_78%]" },
    { src: "/prism-hero.png", pos: "object-[78%_72%]" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[540px]">
      <div className="absolute -inset-6 rounded-[36px] bg-[radial-gradient(circle_at_30%_20%,rgba(200,255,0,0.16),transparent_55%)]" />
      <div className="relative overflow-visible rounded-[28px] border border-white/[0.1] bg-[#10110f] shadow-[0_40px_120px_-48px_rgba(0,0,0,0.9)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#C8FF00] text-[12px] font-bold text-[#080908]">
              P
            </span>
            <div className="flex rounded-full bg-white/[0.05] p-1">
              {(["image", "video"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setModality(mode)}
                  className={cn(
                    "h-8 rounded-full px-3.5 text-[13px] font-medium capitalize",
                    modality === mode
                      ? "bg-[#C8FF00] text-[#080908]"
                      : "text-[#F5F7F1]/55 hover:text-white",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <span className="rounded-full border border-[#C8FF00]/25 bg-[#C8FF00]/10 px-2.5 py-1 text-[11px] font-semibold text-[#C8FF00]">
            100 credits
          </span>
        </div>

        <div className="relative overflow-visible px-4 pt-4 pb-3">
          <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-xl">
            {tiles.map((tile, index) => (
              <div key={`${tile.pos}-${index}`} className="aspect-[4/3] overflow-hidden bg-black/40">
                <img
                  src={tile.src}
                  alt=""
                  className={cn("size-full scale-110 object-cover opacity-95", tile.pos)}
                />
              </div>
            ))}
          </div>
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => selectModel(chip.id)}
              className={cn(
                "absolute z-10 rounded-xl border px-2.5 py-1.5 text-left shadow-lg backdrop-blur-md transition",
                chip.pos,
                selectedModelId === chip.id
                  ? "border-[#C8FF00]/50 bg-[#C8FF00] text-[#080908]"
                  : "border-white/10 bg-[#141514]/92 text-[#F5F7F1]",
              )}
            >
              <span className="block text-[12px] font-semibold">{chip.label}</span>
              <span className="block text-[10px] opacity-60">{chip.kind}</span>
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-b-[28px] border-t border-white/[0.06] p-3">
          <GenerateDock embedded />
        </div>
      </div>
    </div>
  );
}

function Showcase() {
  return (
    <section id="showcase" className="scroll-mt-24 py-20 sm:py-24">
      <Shell>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
              Creative possibilities · style references
            </p>
            <h2
              className="mt-3 max-w-[640px] text-[40px] leading-[1.05] font-[560] sm:text-[56px]"
              style={{ letterSpacing: "-0.04em" }}
            >
              From a thought
              <br />
              to something impossible.
            </h2>
          </div>
          <p className="max-w-sm text-[14px] leading-relaxed text-[#F5F7F1]/55 lg:text-right">
            Hover or tap to reveal the model and prompt direction. These visuals show Prism’s
            range—not fabricated customer outputs.
          </p>
        </div>
      </Shell>
      <div className="mt-10 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex w-max gap-3 px-4 sm:px-6 lg:pl-[max(1.5rem,calc((100vw-1200px)/2+1.5rem))]">
          {SHOWCASE.map((item) => (
            <article
              key={`${item.title}-${item.prompt}`}
              tabIndex={0}
              className="group relative h-[320px] w-[240px] shrink-0 overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#10110f] sm:h-[360px] sm:w-[260px]"
            >
              <img
                src={item.src}
                alt=""
                className="size-full object-cover transition duration-700 group-hover:scale-[1.04] group-focus-within:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-[#C8FF00] uppercase">
                  {item.model}
                </p>
                <p className="mt-1 text-[17px] font-semibold">{item.title}</p>
                <p className="mt-0.5 text-[12px] text-[#F5F7F1]/60">{item.prompt}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ImageToVideo() {
  const [active, setActive] = useState<(typeof VIDEO_ENGINES)[number]["id"]>(
    VIDEO_ENGINES[1].id,
  );
  const engine = VIDEO_ENGINES.find((item) => item.id === active) ?? VIDEO_ENGINES[0];
  const strip = [
    "/placeholders/neon-rain.jpg",
    "/placeholders/dune-gold.jpg",
    "/placeholders/portrait-gold.jpg",
    "/placeholders/chrome-car.jpg",
    "/placeholders/fog-woods.jpg",
    "/placeholders/star-ridge.jpg",
  ];
  return (
    <section id="video" className="scroll-mt-24 border-y border-white/[0.06] py-20 sm:py-24">
      <Shell className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
            Image → Video
          </p>
          <h2
            className="mt-3 text-[40px] leading-[1.05] font-[560] sm:text-[56px]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Turn a frame
            <br />
            into a film.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#F5F7F1]/58">
            Choose the motion engine, set the pace and watch a still become a cinematic
            sequence—all from the same credit balance.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {VIDEO_ENGINES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                className={cn(
                  "h-10 rounded-full px-4 text-[13px] font-semibold",
                  active === item.id
                    ? "bg-[#C8FF00] text-[#080908]"
                    : "border border-white/12 bg-white/[0.03] text-[#F5F7F1]/65",
                )}
              >
                {item.name}
              </button>
            ))}
          </div>
          <Link href={VIDEO_SIGNUP} className={cn(limeBtn, "mt-8")}>
            Make My First Video
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#10110f] p-3 shadow-[0_0_80px_-40px_rgba(200,255,0,0.35)]">
          <div className="relative aspect-video overflow-hidden rounded-[20px] bg-black">
            <HoverVideo src={engine.loop} poster={engine.poster} autoPlay active />
            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
              <span className="flex size-16 items-center justify-center rounded-full bg-[#C8FF00] text-[#080908] shadow-[0_0_40px_rgba(200,255,0,.35)]">
                <Play className="size-6 fill-current" />
              </span>
            </div>
            <span className="absolute top-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] tabular-nums">
              00:05
            </span>
          </div>
          <div className="relative mt-3 flex gap-2 overflow-x-auto pb-1">
            {strip.map((src, index) => (
              <div
                key={`${src}-${index}`}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border",
                  index === 2 || index === 3 ? "border-[#C8FF00]" : "border-white/10",
                )}
              >
                <img src={src} alt="" className="size-full object-cover" />
              </div>
            ))}
            <span className="pointer-events-none absolute top-0 bottom-1 left-[calc(2*6.5rem+0.5rem)] w-0.5 bg-[#C8FF00] shadow-[0_0_12px_#C8FF00]" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 px-1 pb-1 text-[11px] text-[#F5F7F1]/50">
            <span className="rounded-full bg-white/[0.05] px-2.5 py-1">Cinematic camera motion</span>
            <span className="rounded-full bg-white/[0.05] px-2.5 py-1">Image-to-video</span>
            <span className="rounded-full bg-white/[0.05] px-2.5 py-1">Fast social cuts</span>
          </div>
        </div>
      </Shell>
    </section>
  );
}

function PainPoints() {
  return (
    <section id="why" className="scroll-mt-24 py-20 sm:py-24">
      <Shell>
        <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
          AI creation shouldn’t feel like admin
        </p>
        <h2
          className="mt-3 max-w-2xl text-[40px] leading-[1.05] font-[560] sm:text-[52px]"
          style={{ letterSpacing: "-0.04em" }}
        >
          Your imagination moves fast.
          <br />
          Your tools should keep up.
        </h2>
        <p className="mt-4 max-w-xl text-[15px] text-[#F5F7F1]/55">
          Prism brings your models, credits and workflow together—so the idea stays the focus.
        </p>
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {PAIN_POINTS.map((item) => (
            <article
              key={item.n}
              className="rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-6"
            >
              <p className="text-[12px] font-semibold tracking-wide text-[#C8FF00]">{item.n}</p>
              <h3 className="mt-2 text-[18px] font-semibold">{item.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#F5F7F1]/55">{item.body}</p>
            </article>
          ))}
        </div>
        <Link href={CLAIM} className={cn(limeBtn, "mt-8")}>
          Create Without the Tool-Hopping
          <ArrowRight className="size-4" />
        </Link>
      </Shell>
    </section>
  );
}

const MODEL_ICONS = {
  "flux-2-schnell": Zap,
  "flux-2-dev": Aperture,
  "seedream-5": Moon,
  sdxl: ImageIcon,
} as const;

function ModelPicker() {
  const [selected, setSelected] = useState<(typeof IMAGE_MODELS)[number]["id"]>(
    IMAGE_MODELS[0].id,
  );
  const [tab, setTab] = useState<"image" | "video">("image");
  return (
    <section id="models" className="scroll-mt-24 border-y border-white/[0.06] py-20 sm:py-24">
      <Shell>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
              One login. Multiple engines.
            </p>
            <h2
              className="mt-3 max-w-xl text-[40px] leading-[1.05] font-[560] sm:text-[56px]"
              style={{ letterSpacing: "-0.04em" }}
            >
              Choose the right model
              <br />
              for every idea.
            </h2>
          </div>
          <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-1">
            {(
              [
                { id: "image" as const, label: "Image", Icon: ImageIcon },
                { id: "video" as const, label: "Video", Icon: Clapperboard },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold",
                  tab === item.id
                    ? "bg-[#C8FF00] text-[#080908]"
                    : "text-[#F5F7F1]/55 hover:text-white",
                )}
              >
                <item.Icon className="size-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "image" ? (
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {IMAGE_MODELS.map((model) => {
              const active = selected === model.id;
              const Icon = MODEL_ICONS[model.id as keyof typeof MODEL_ICONS] ?? Sparkles;
              return (
                <button
                  key={model.id}
                  type="button"
                  aria-label={`Select ${model.name}`}
                  onClick={() => setSelected(model.id)}
                  className={cn(
                    "relative flex min-h-[200px] flex-col rounded-[22px] border p-5 text-left transition",
                    active
                      ? "border-[#C8FF00] bg-[#C8FF00] text-[#080908] shadow-[0_0_48px_rgba(200,255,0,.18)]"
                      : "border-white/[0.07] bg-[#10110f] text-[#F5F7F1] hover:border-white/20",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <Icon className="size-5" strokeWidth={1.7} />
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                        active ? "bg-black/10" : "bg-white/8 text-white/50",
                      )}
                    >
                      Image
                    </span>
                  </div>
                  <div className="mt-auto pt-10">
                    <h3 className="text-[18px] font-semibold">{model.name}</h3>
                    <p className={cn("mt-1 text-[13px]", active ? "text-black/65" : "text-white/50")}>
                      {model.tagline}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "absolute right-4 bottom-4 flex size-9 items-center justify-center rounded-full",
                      active ? "bg-[#080908] text-[#C8FF00]" : "bg-white/[0.06] text-white/70",
                    )}
                  >
                    <ArrowRight className="size-4" />
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {VIDEO_ENGINES.map((model) => (
              <Link
                key={model.id}
                href={signupUrl(generatePath("video", model.id))}
                className="relative flex min-h-[200px] flex-col rounded-[22px] border border-white/[0.07] bg-[#10110f] p-5 hover:border-white/20"
              >
                <Clapperboard className="size-5 text-[#F5F7F1]" strokeWidth={1.7} />
                <div className="mt-auto pt-10">
                  <h3 className="text-[18px] font-semibold">{model.name}</h3>
                  <p className="mt-1 text-[13px] text-white/50">{model.blurb}</p>
                </div>
                <span className="absolute right-4 bottom-4 flex size-9 items-center justify-center rounded-full bg-white/[0.06]">
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[14px] text-[#F5F7F1]/45">Switch the engine. Keep the idea.</p>
          <Link
            href={signupUrl(
              generatePath(tab === "image" ? "image" : "video", tab === "image" ? selected : "seedance-fast"),
            )}
            className={limeBtn}
          >
            Try the Models Free
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </Shell>
    </section>
  );
}

function ThreeSteps() {
  return (
    <section className="py-20 sm:py-24">
      <Shell>
        <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
          From thought to finished visual
        </p>
        <h2
          className="mt-3 text-[40px] leading-[1.05] font-[560] sm:text-[52px]"
          style={{ letterSpacing: "-0.04em" }}
        >
          Three steps. Zero friction.
        </h2>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {STEPS.map((step) => (
            <article
              key={step.n}
              className="rounded-[22px] border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent p-6"
            >
              <p className="text-[12px] font-semibold text-[#C8FF00]">{step.n}</p>
              <h3 className="mt-3 text-[20px] font-semibold">{step.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#F5F7F1]/55">{step.body}</p>
            </article>
          ))}
        </div>
      </Shell>
    </section>
  );
}

function UseCases() {
  return (
    <section className="border-y border-white/[0.06] py-20 sm:py-24">
      <Shell>
        <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
          One platform. Many possibilities.
        </p>
        <h2
          className="mt-3 text-[40px] leading-[1.05] font-[560] sm:text-[52px]"
          style={{ letterSpacing: "-0.04em" }}
        >
          What will you create first?
        </h2>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {USE_CASES.map((item) => (
            <article
              key={item.title}
              className="group relative min-h-[300px] overflow-hidden rounded-[22px] border border-white/[0.06]"
            >
              <img
                src={item.src}
                alt=""
                className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
              <div className="relative flex h-full min-h-[300px] flex-col justify-end p-5">
                <p className="text-[11px] font-semibold tracking-wide text-[#C8FF00] uppercase">
                  {item.model}
                </p>
                <h3 className="mt-1 text-[24px] font-semibold">{item.title}</h3>
                <Link
                  href={signupUrl(generatePath("image", item.hrefModel))}
                  className="mt-4 inline-flex items-center gap-1 text-[14px] font-medium hover:text-[#C8FF00]"
                >
                  Try this direction
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Shell>
    </section>
  );
}

function Compare() {
  return (
    <section className="py-20 sm:py-24">
      <Shell>
        <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
          More creating. Less managing.
        </p>
        <h2
          className="mt-3 max-w-2xl text-[40px] leading-[1.05] font-[560] sm:text-[52px]"
          style={{ letterSpacing: "-0.04em" }}
        >
          Your ideas don’t need another subscription.
        </h2>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          <article className="rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-6">
            <p className="text-[12px] tracking-wide text-[#F5F7F1]/40 uppercase">
              Typical multi-tool setup
            </p>
            <ul className="mt-5 space-y-3 text-[14px] text-[#F5F7F1]/55">
              {[
                "Separate subscriptions",
                "Different credit systems",
                "Multiple interfaces",
                "Desktop-heavy workflow",
                "Costly experimentation",
              ].map((item) => (
                <li key={item}>– {item}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-[22px] border border-[#C8FF00]/35 bg-[#C8FF00]/[0.07] p-6 shadow-[0_0_60px_-40px_rgba(200,255,0,0.55)]">
            <p className="text-[12px] font-semibold tracking-wide text-[#C8FF00] uppercase">
              The Prism way · One creative studio
            </p>
            <ul className="mt-5 space-y-3 text-[14px] text-[#F5F7F1]/85">
              {[
                "One account and balance",
                "Image + video models",
                "A simple, familiar workflow",
                "Made for phone and desktop",
                "Designed to cost less",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 size-4 text-[#C8FF00]" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
        <Link href={CLAIM} className={cn(limeBtn, "mt-8")}>
          Move Your Ideas to Prism
          <ArrowRight className="size-4" />
        </Link>
      </Shell>
    </section>
  );
}

function Freedom() {
  return (
    <section id="freedom" className="scroll-mt-24 border-y border-white/[0.06] py-20 sm:py-24">
      <Shell>
        <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
          Verified 18+ · NSFW creative mode
        </p>
        <h2
          className="mt-3 max-w-2xl text-[40px] leading-[1.05] font-[560] sm:text-[52px]"
          style={{ letterSpacing: "-0.04em" }}
        >
          Adult creativity,
          <br />
          without pretending
          <br />
          adults don’t exist.
        </h2>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#F5F7F1]/55">
          Verified adults can opt in to broader NSFW image and video creation—with age gates,
          consent rules and strict safeguards.
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-[12px] text-[#F5F7F1]/60">
          {[
            "Private opt-in mode",
            "Images + video",
            "Broader adult creative range",
            "Age verification required",
          ].map((item) => (
            <span key={item} className="rounded-full border border-white/10 px-3 py-1">
              {item}
            </span>
          ))}
        </div>
        <ul className="mt-8 space-y-2 text-[14px] text-[#F5F7F1]/65">
          {[
            "Strictly no minors",
            "No non-consensual intimate imagery",
            "No explicit deepfakes of identifiable people",
            "Consent and privacy safeguards",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <Check className="mt-0.5 size-4 text-[#C8FF00]" />
              {item}
            </li>
          ))}
        </ul>
        <Link href={CLAIM} className={cn(limeBtn, "mt-8")}>
          Explore 18+ Creative Mode
          <ArrowRight className="size-4" />
        </Link>
      </Shell>
    </section>
  );
}

function BuiltInIndia() {
  return (
    <section className="py-20 sm:py-24">
      <Shell>
        <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
          Made here. Ready everywhere.
        </p>
        <h2
          className="mt-3 max-w-2xl text-[40px] leading-[1.05] font-[560] sm:text-[52px]"
          style={{ letterSpacing: "-0.04em" }}
        >
          Built in India
          <br />
          for creators everywhere.
        </h2>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {[
            {
              icon: Wallet,
              title: "Budget-aware",
              body: "More room to create without stacking subscriptions.",
            },
            {
              icon: Smartphone,
              title: "Phone-first",
              body: "A complete creative studio in the device already in your hand.",
            },
            {
              icon: Globe2,
              title: "Global models",
              body: "Leading image and video engines in one straightforward product.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-6"
            >
              <item.icon className="size-5 text-[#C8FF00]" />
              <h3 className="mt-4 text-[18px] font-semibold">{item.title}</h3>
              <p className="mt-2 text-[14px] text-[#F5F7F1]/55">{item.body}</p>
            </article>
          ))}
        </div>
      </Shell>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-24 border-y border-white/[0.06] py-20 sm:py-24">
      <Shell className="text-center">
        <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
          Start free. Pay when you’re ready.
        </p>
        <h2
          className="mt-3 text-[40px] leading-[1.05] font-[560] sm:text-[56px]"
          style={{ letterSpacing: "-0.04em" }}
        >
          Simple credits.
          <br />
          No subscription maze.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] text-[#F5F7F1]/55">
          Try Prism before spending anything. Paid credit packs arrive at launch.
        </p>
        <div className="mx-auto mt-12 grid max-w-[920px] gap-4 text-left md:grid-cols-2">
          <article className="rounded-[28px] border border-[#C8FF00]/45 bg-gradient-to-b from-[#C8FF00]/[0.08] to-transparent p-7 shadow-[0_0_80px_-48px_rgba(200,255,0,0.8)] sm:p-8">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#C8FF00] uppercase">
              Start here
            </p>
            <p className="mt-3 text-[28px] font-semibold">Free</p>
            <p className="mt-1 text-[56px] leading-none font-semibold tracking-tight">₹0</p>
            <p className="mt-3 text-[14px] text-[#F5F7F1]/60">
              100 welcome credits. No card. No commitment.
            </p>
            <div className="my-6 h-px bg-white/10" />
            <ul className="space-y-2.5 text-[14px] text-[#F5F7F1]/8">
              {[
                "100 image credits",
                "Multiple image models",
                "Mobile and desktop",
                "No credit card",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 size-4 text-[#C8FF00]" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href={CLAIM} className={cn(limeBtn, "mt-8 w-full")}>
              Claim My 100 Free Credits
              <ArrowRight className="size-4" />
            </Link>
          </article>
          <article className="rounded-[28px] border border-white/[0.08] bg-[#10110f] p-7 sm:p-8">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#F5F7F1]/40 uppercase">
              Coming soon
            </p>
            <p className="mt-3 text-[28px] font-semibold">Creator credits</p>
            <p className="mt-1 text-[40px] leading-none font-semibold tracking-tight text-[#F5F7F1]/9">
              Launch pricing
            </p>
            <p className="mt-3 text-[14px] text-[#F5F7F1]/55">Buy more only when you need it.</p>
            <div className="my-6 h-px bg-white/10" />
            <ul className="space-y-2.5 text-[14px] text-[#F5F7F1]/6">
              {[
                "Image and video generation",
                "Shared credits across models",
                "Better value at higher packs",
                "No subscription juggling",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 size-4 text-[#C8FF00]/70" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full border border-white/12 text-[14px] text-[#F5F7F1]/45">
              Available at launch
            </p>
          </article>
        </div>
      </Shell>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-24 py-20 sm:py-24">
      <Shell className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
            Questions, answered.
          </p>
          <h2
            className="mt-3 text-[40px] leading-[1.05] font-[560] sm:text-[52px]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Before you
            <br />
            start creating.
          </h2>
          <p className="mt-4 text-[14px] text-[#F5F7F1]/55">
            Prism is new. Here’s what is ready now—and what is still being finalized for launch.
          </p>
        </div>
        <div className="space-y-2">
          {FAQ.map((item, index) => {
            const isOpen = open === index;
            return (
              <article
                key={item.q}
                className="overflow-hidden rounded-[18px] border border-white/[0.07] bg-white/[0.025]"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-[14px] font-medium"
                  onClick={() => setOpen(isOpen ? -1 : index)}
                >
                  <span>{item.q}</span>
                  <ChevronDown className={cn("size-4 shrink-0 transition", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <p className="border-t border-white/[0.06] px-5 py-4 text-[14px] leading-relaxed text-[#F5F7F1]/55">
                    {item.a}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </Shell>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 pb-10 sm:px-6">
      <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[32px] border border-[#C8FF00]/20 bg-[#0c0d0a] px-6 py-16 text-center sm:px-10 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(200,255,0,0.16),transparent_55%)]" />
        <div className="relative">
          <span className="mx-auto flex size-12 items-center justify-center rounded-[14px] bg-[#C8FF00] text-[18px] font-bold text-[#080908]">
            P
          </span>
          <p className="mt-6 text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
            100 credits. Zero excuses.
          </p>
          <h2
            className="mt-3 text-[40px] leading-[1.05] font-[560] sm:text-[56px]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Your first Prism creation
            <br />
            is already waiting.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] text-[#F5F7F1]/55">
            Choose a model, describe what you see in your head, and turn it into something real.
            Your first 100 image credits are on us.
          </p>
          <Link href={CLAIM} className={cn(limeBtn, "mt-8")}>
            Claim My 100 Free Credits
            <ArrowRight className="size-4" />
          </Link>
          <p className="mt-4 text-[13px] text-[#F5F7F1]/4">No card. No commitment. Just create.</p>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] px-4 pt-14 pb-28 sm:px-6 sm:pb-12">
      <Shell className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <a href="#top" className="flex items-center gap-2">
            <PrismMark className="size-5 text-[#C8FF00]" />
            <b>Prism</b>
          </a>
          <p className="mt-3 text-[13px] text-[#F5F7F1]/45">
            Built in India for creators everywhere.
          </p>
        </div>
        <div>
          <b className="text-[13px]">Product</b>
          <div className="mt-3 flex flex-col gap-2 text-[13px] text-[#F5F7F1]/5">
            <a href="#models">Models</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
        </div>
        <div>
          <b className="text-[13px]">Company</b>
          <div className="mt-3 flex flex-col gap-2 text-[13px] text-[#F5F7F1]/5">
            <a href="#why">Why Prism</a>
            <a href="#freedom">Responsible use</a>
            <a href="mailto:hello@prism.studio">Contact</a>
          </div>
        </div>
        <div>
          <b className="text-[13px]">Legal</b>
          <div className="mt-3 flex flex-col gap-2 text-[13px] text-[#F5F7F1]/5">
            <span>Terms</span>
            <span>Privacy</span>
          </div>
        </div>
      </Shell>
      <Shell className="mt-10 flex flex-col gap-2 border-t border-white/[0.06] pt-6 text-[12px] text-[#F5F7F1]/35 sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 Prism</span>
        <p>
          Adults-only features require separate 18+ verification and remain subject to consent,
          privacy and applicable law.
        </p>
      </Shell>
    </footer>
  );
}

function MobileClaimBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#080908]/95 px-4 py-3 backdrop-blur-md sm:hidden">
      <div className="flex items-center justify-between gap-3">
        <span>
          <b className="block text-[13px]">100 credits free</b>
          <small className="text-[11px] text-[#F5F7F1]/45">No card required</small>
        </span>
        <Link href={CLAIM} className={cn(limeBtn, "h-11 px-5 text-[13px]")}>
          Claim Free
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
