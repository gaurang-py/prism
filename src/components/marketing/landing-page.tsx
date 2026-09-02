"use client";

/* eslint-disable @next/next/no-img-element -- marketing stills are local placeholders */

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Aperture,
  Check,
  ChevronDown,
  Clapperboard,
  Globe2,
  ImageIcon,
  Moon,
  Play,
  Plus,
  RectangleVertical,
  Shield,
  Smartphone,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrismMark } from "@/components/studio/prism-mark";
import { HoverVideo } from "@/components/studio/hover-video";
import {
  COMPARE_PRISM,
  COMPARE_STITCHED,
  FAQ,
  HERO_CHIPS,
  IMAGE_MODELS,
  LANDING_STATS,
  NSFW_MODEL_COUNT,
  PAIN_POINTS,
  PROMPT_PRESETS,
  SHOWCASE,
  STARTER_ENGINE_ID,
  STARTER_MODEL_ID,
  STEPS,
  URGENCY,
  USE_CASES,
  VIDEO_ENGINES,
  WELCOME_CREDITS,
  creditsFor,
  freeRunsFor,
} from "@/lib/landing-content";
import { saveGenerateDraft } from "@/lib/generate-draft";
import { getModel, type Modality } from "@/lib/models";
import { loginUrl, signupUrl } from "@/lib/paths";
import { generatePath } from "@/lib/types";
import { cn } from "@/lib/utils";

const BG = "#080908";

const CLAIM = signupUrl("/home");
const SIGN_IN = loginUrl("/home");

const limeBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#C8FF00] px-7 text-[15px] font-semibold text-[#080908] shadow-[0_0_40px_rgba(200,255,0,.22)] transition hover:bg-[#dcff54] sm:h-14 sm:px-8";
const ghostBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-transparent px-7 text-[15px] font-semibold text-[#F5F7F1] transition hover:border-[#C8FF00]/45 hover:bg-white/[.04] sm:h-14 sm:px-8";
/** Small lime button used inside the prompt docks. */
const dockBtn =
  "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#C8FF00] px-4 text-[14px] font-semibold text-[#080908] transition hover:bg-[#dcff54]";

const nf = new Intl.NumberFormat("en-IN");

/* ------------------------------------------------------------------ */
/* Shared landing state                                                */
/* ------------------------------------------------------------------ */

type ModalReason = "generate" | "exit";

interface LandingValue {
  prompt: string;
  setPrompt: (value: string) => void;
  modality: Modality;
  modelId: string;
  /** Point the docks at a model (and follow it to the matching modality). */
  selectModel: (id: string) => void;
  setModality: (modality: Modality) => void;
  /** Fill the docks from a card and go straight to the signup sheet. */
  startWith: (prompt: string, modelId?: string) => void;
  openModal: (reason?: ModalReason) => void;
}

const LandingContext = createContext<LandingValue | null>(null);

function useLanding(): LandingValue {
  const ctx = useContext(LandingContext);
  if (!ctx) throw new Error("useLanding must be used within LandingPage");
  return ctx;
}

/** Where a dock hands off to: signup, then straight into the studio. */
function continueHref(prompt: string, modality: Modality, modelId: string): string {
  const params = new URLSearchParams({ mode: modality, model: modelId });
  const trimmed = prompt.trim();
  if (trimmed) params.set("prompt", trimmed);
  return signupUrl(`/generate?${params.toString()}`);
}

export function LandingPage() {
  const [prompt, setPrompt] = useState("");
  const [modality, setModalityState] = useState<Modality>("image");
  const [modelId, setModelId] = useState<string>(STARTER_MODEL_ID);
  const [modal, setModal] = useState<{ open: boolean; reason: ModalReason }>({
    open: false,
    reason: "generate",
  });
  const [exitShown, setExitShown] = useState(false);

  const openModal = useCallback((reason: ModalReason = "generate") => {
    setModal({ open: true, reason });
  }, []);

  const selectModel = useCallback((id: string) => {
    const model = getModel(id);
    if (!model) return;
    setModelId(model.id);
    setModalityState(model.modality);
  }, []);

  const setModality = useCallback((next: Modality) => {
    setModalityState(next);
    setModelId((current) =>
      getModel(current)?.modality === next
        ? current
        : next === "image"
          ? STARTER_MODEL_ID
          : STARTER_ENGINE_ID,
    );
  }, []);

  const startWith = useCallback(
    (nextPrompt: string, nextModelId?: string) => {
      setPrompt(nextPrompt);
      if (nextModelId) selectModel(nextModelId);
      openModal("generate");
    },
    [openModal, selectModel],
  );

  // Exit intent: fires once, when the cursor leaves through the top of the window.
  useEffect(() => {
    if (exitShown) return;
    const onLeave = (event: MouseEvent) => {
      if (event.clientY > 0) return;
      setExitShown(true);
      setModal((current) => (current.open ? current : { open: true, reason: "exit" }));
    };
    document.addEventListener("mouseleave", onLeave);
    return () => document.removeEventListener("mouseleave", onLeave);
  }, [exitShown]);

  const value = useMemo<LandingValue>(
    () => ({
      prompt,
      setPrompt,
      modality,
      modelId,
      selectModel,
      setModality,
      startWith,
      openModal,
    }),
    [modality, modelId, openModal, prompt, selectModel, setModality, startWith],
  );

  return (
    <LandingContext.Provider value={value}>
      <div id="top" className="min-h-dvh overflow-x-clip font-sans text-[#F5F7F1]" style={{ background: BG }}>
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
        <SignupModal
          open={modal.open}
          reason={modal.reason}
          onOpenChange={(open) => setModal((current) => ({ ...current, open }))}
        />
      </div>
    </LandingContext.Provider>
  );
}

function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6", className)}>{children}</div>
  );
}

/* ------------------------------------------------------------------ */
/* Sticky banner + nav                                                 */
/* ------------------------------------------------------------------ */

/** Live countdown to a fixed deadline. Null until mounted, so SSR stays stable. */
function useCountdown(deadline: string): string | null {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const target = new Date(deadline).getTime();
    if (Number.isNaN(target)) return;
    const pad = (value: number) => String(value).padStart(2, "0");
    const tick = () => {
      const total = Math.max(0, Math.floor((target - Date.now()) / 1000));
      const days = Math.floor(total / 86400);
      const hours = Math.floor((total % 86400) / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      setLabel(`${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(total % 60)}s`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [deadline]);
  return label;
}

function useScrolledPast(threshold: number): boolean {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return past;
}

function TopBanner() {
  const countdown = useCountdown(URGENCY.deadline);
  if (URGENCY.mode === "none") return null;
  const tail = URGENCY.mode === "countdown" ? countdown : "launch week";
  return (
    <div className="border-b border-white/[0.06] bg-[#0b0c0a] px-4 py-2.5 text-center text-[13px] text-[#F5F7F1]/70">
      <span className="mr-2 inline-block size-1.5 rounded-full bg-[#C8FF00] shadow-[0_0_8px_#C8FF00] align-middle" />
      Founding-creator bonus:{" "}
      <span className="font-medium text-[#F5F7F1]">
        {WELCOME_CREDITS} free image credits
      </span>{" "}
      for the first {nf.format(URGENCY.capacity)} sign-ups ·{" "}
      <span className="font-semibold text-[#C8FF00] tabular-nums">
        {nf.format(LANDING_STATS.spotsLeft)} spots left
      </span>
      {tail ? (
        <>
          {" "}
          · ends in <span className="font-semibold text-[#F5F7F1] tabular-nums">{tail}</span>
        </>
      ) : null}
    </div>
  );
}

function MarketingNav() {
  const [open, setOpen] = useState(false);
  const scrolled = useScrolledPast(560);
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
        <a href="#top" className="flex shrink-0 items-center gap-2.5">
          <PrismMark className="size-[22px] text-[#C8FF00]" />
          <span className="text-[17px] font-semibold tracking-tight">Prism</span>
        </a>

        {/* Once the hero scrolls away the links give up their space to a prompt dock. */}
        {scrolled ? <NavDock /> : (
          <nav className="hidden items-center gap-7 text-[14px] text-[#F5F7F1]/72 lg:flex">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="transition hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={SIGN_IN}
            className="hidden h-10 items-center rounded-full px-3 text-[14px] text-[#F5F7F1]/85 transition hover:bg-white/[0.05] sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href={CLAIM}
            className="hidden h-10 items-center gap-1.5 rounded-full bg-[#C8FF00] px-4 text-[13px] font-semibold text-[#080908] shadow-[0_0_28px_rgba(200,255,0,.2)] transition hover:bg-[#dcff54] sm:inline-flex"
          >
            Claim {WELCOME_CREDITS} Free Credits
            <ArrowRight className="size-3.5" />
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-white/12 lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
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
              Claim {WELCOME_CREDITS} Free Credits
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/** Inline prompt dock that replaces the nav links after the hero scrolls out. */
function NavDock() {
  const { prompt, setPrompt, openModal } = useLanding();
  return (
    <div className="hidden max-w-[520px] flex-1 items-center gap-1.5 rounded-full border border-white/10 bg-[#161616] py-1 pr-1 pl-3.5 lg:flex">
      <Sparkles className="size-3.5 shrink-0 text-[#C8FF00]" />
      <input
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Describe an image… it’s free"
        aria-label="Describe an image"
        className="min-w-0 flex-1 border-0 bg-transparent py-1.5 text-[14px] text-white outline-none placeholder:text-[#F5F7F1]/40"
      />
      <button
        type="button"
        onClick={() => openModal("generate")}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#C8FF00] px-3.5 text-[13px] font-semibold text-[#080908] transition hover:bg-[#dcff54]"
      >
        Generate free
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 lg:pt-[72px] lg:pb-[88px]">
      <div className="pointer-events-none absolute top-[-20%] right-[-10%] h-[70%] w-[55%] rounded-full bg-[radial-gradient(circle,rgba(200,255,0,0.18),transparent_68%)] blur-2xl" />
      <Shell className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-8 [&>*]:min-w-0">
        <div className="relative">
          <p className="text-[12px] font-semibold tracking-[0.2em] text-[#C8FF00] uppercase">
            For the next wave of AI creators · Built in India
          </p>
          <h1
            className="mt-5 text-[44px] leading-[0.98] font-[560] text-[#F5F7F1] sm:text-[64px] lg:text-[78px]"
            style={{ letterSpacing: "-0.06em" }}
          >
            Want to be
            <br />
            an AI creator?
            <br />
            <span className="text-[#C8FF00]">Start here.</span>
            <br />
            <span className="text-[#C8FF00]">Today.</span>
          </h1>
          <p className="mt-6 max-w-[440px] text-[16px] leading-relaxed text-[#F5F7F1]/65 sm:text-[17px]">
            Stop comparing tools. Prism puts the best image and video models in one studio, in
            plain language, with {WELCOME_CREDITS} free credits to make your first pieces today.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={CLAIM} className={limeBtn}>
              Make My First AI Image — Free
              <ArrowRight className="size-4" />
            </Link>
            <a href="#video" className={ghostBtn}>
              <Play className="size-4 fill-current" />
              How creators use Prism
            </a>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#F5F7F1]/55">
            {["No card required", "No prompt skills needed to start", "Works on phone and desktop"].map(
              (item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-[#C8FF00]" />
                  {item}
                </span>
              ),
            )}
          </div>
          <SocialProof />
        </div>
        <HeroStudioMock />
      </Shell>
    </section>
  );
}

function SocialProof() {
  const faces = [
    "/placeholders/portrait-gold.jpg",
    "/placeholders/neon-rain.jpg",
    "/placeholders/dune-gold.jpg",
  ];
  return (
    <div className="mt-7 inline-flex max-w-full flex-wrap items-center gap-3.5 rounded-[20px] border border-white/[0.08] bg-white/[0.03] py-2 pr-4 pl-2 sm:rounded-full">
      <div className="flex">
        {faces.map((src, index) => (
          <span
            key={src}
            className={cn(
              "size-7 rounded-full border-2 border-[#080908] bg-cover bg-center",
              index > 0 && "-ml-2.5",
            )}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <span className="-ml-2.5 flex size-7 items-center justify-center rounded-full border-2 border-[#080908] bg-[#C8FF00] text-[10px] font-bold text-[#080908]">
          +
        </span>
      </div>
      <span className="text-[13px] text-[#F5F7F1]/70">
        <b className="text-[#F5F7F1] tabular-nums">{nf.format(LANDING_STATS.creatorsThisWeek)}</b>{" "}
        new creators started this week ·{" "}
        <b className="text-[#F5F7F1] tabular-nums">{nf.format(LANDING_STATS.imagesToday)}</b> images
        generated today
      </span>
    </div>
  );
}

function HeroStudioMock() {
  const { modality, setModality, selectModel, modelId } = useLanding();
  const tiles = [
    "object-[18%_22%]",
    "object-[72%_28%]",
    "object-[28%_78%]",
    "object-[78%_72%]",
  ];

  return (
    <div className="relative mx-auto w-full max-w-[540px] min-w-0">
      <div className="absolute -inset-6 rounded-[36px] bg-[radial-gradient(circle_at_30%_20%,rgba(200,255,0,0.16),transparent_55%)]" />
      <div className="relative rounded-[28px] border border-white/[0.1] bg-[#10110f] shadow-[0_40px_120px_-48px_rgba(0,0,0,0.9)]">
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
                    "h-8 rounded-full px-3.5 text-[13px] font-medium capitalize transition",
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
            {WELCOME_CREDITS} free credits
          </span>
        </div>

        <div className="relative px-4 pt-4 pb-3">
          <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-xl">
            {tiles.map((position) => (
              <div key={position} className="aspect-[4/3] overflow-hidden bg-black/40">
                <img
                  src="/prism-hero.png"
                  alt=""
                  className={cn("size-full scale-110 object-cover opacity-95", position)}
                />
              </div>
            ))}
          </div>
          {HERO_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => selectModel(chip.id)}
              className={cn(
                "absolute z-10 rounded-xl border px-2.5 py-1.5 text-left shadow-lg backdrop-blur-md transition",
                chip.pos,
                modelId === chip.id
                  ? "border-[#C8FF00]/50 bg-[#C8FF00] text-[#080908]"
                  : "border-white/10 bg-[#141514]/92 text-[#F5F7F1]",
              )}
            >
              <span className="block text-[12px] font-semibold">{chip.label}</span>
              <span className="block text-[10px] opacity-60">{chip.kind}</span>
            </button>
          ))}
        </div>

        <div className="rounded-b-[28px] border-t border-white/[0.06] p-3">
          <HeroDock />
        </div>
      </div>
    </div>
  );
}

/**
 * The hero's prompt dock. Everything here is live except the model and ratio
 * pills, which mirror the studio's chrome — the chips above set the model.
 */
function HeroDock() {
  const { prompt, setPrompt, modelId, openModal } = useLanding();
  const model = getModel(modelId);
  return (
    <div className="w-full rounded-2xl border border-[#C8FF00]/35 bg-[#161616] p-3 shadow-[0_20px_60px_-24px_#000,0_0_0_4px_rgba(200,255,0,.08)]">
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => openModal("generate")}
          aria-label="Attach a reference image"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white transition hover:bg-white/10"
        >
          <Plus className="size-5" />
        </button>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={1}
          aria-label="Describe your image"
          placeholder="Describe anything in your own words. Your first image is free."
          className="max-h-28 min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-[15px] leading-relaxed text-white outline-none placeholder:text-[#F5F7F1]/40"
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PROMPT_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => setPrompt(preset.prompt)}
            className="inline-flex h-7 items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[12px] text-[#F5F7F1]/75 transition hover:border-[#C8FF00]/50 hover:text-white"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 text-[14px] text-white">
          <Sparkles className="size-3.5" />
          {model?.name ?? "Flux 2 Schnell"}
          <ChevronDown className="size-3.5 text-gray-400" />
        </span>
        <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 text-[14px] text-white">
          <RectangleVertical className="size-3.5" />
          3:4
          <ChevronDown className="size-3.5 text-gray-400" />
        </span>
        <div className="ml-auto flex items-center gap-2.5">
          <span className="text-[12px] text-[#F5F7F1]/50 tabular-nums">
            {creditsFor(modelId)} of {WELCOME_CREDITS} free credits
          </span>
          <button
            type="button"
            onClick={() => openModal("generate")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#C8FF00] px-5 text-[14px] font-semibold text-[#080908] shadow-[0_0_24px_rgba(200,255,0,.25)] transition hover:bg-[#dcff54]"
          >
            Generate free
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Showcase                                                            */
/* ------------------------------------------------------------------ */

function Showcase() {
  const { startWith } = useLanding();
  return (
    <section id="showcase" className="scroll-mt-24 py-20 sm:py-24">
      <Shell>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
              What creators are making
            </p>
            <h2
              className="mt-3 max-w-[640px] text-[40px] leading-[1.05] font-[560] sm:text-[56px]"
              style={{ letterSpacing: "-0.04em" }}
            >
              Your first ten posts
              <br />
              are already in here.
            </h2>
          </div>
          <div className="lg:text-right">
            <p className="max-w-sm text-[14px] leading-relaxed text-[#F5F7F1]/55">
              Not sure what to make? Pick a card. Remix it and it lands in your studio, prompt
              pre-filled.
            </p>
            <p className="mt-2.5 text-[13px] font-semibold text-[#C8FF00] tabular-nums">
              {nf.format(LANDING_STATS.remixesToday)} remixes today
            </p>
          </div>
        </div>
      </Shell>
      <div className="mt-10 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex w-max gap-3 px-4 sm:px-6 lg:pl-[max(1.5rem,calc((100vw-1200px)/2+1.5rem))]">
          {SHOWCASE.map((item) => (
            <article
              key={`${item.title}-${item.prompt}`}
              className="group relative h-[320px] w-[240px] shrink-0 overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#10110f] sm:h-[360px] sm:w-[260px]"
            >
              <img
                src={item.src}
                alt=""
                className="size-full object-cover transition duration-700 group-hover:scale-[1.04] group-focus-within:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-[#C8FF00] uppercase">
                  {item.model}
                </p>
                <p className="mt-1 text-[17px] font-semibold">{item.title}</p>
                <p className="mt-0.5 text-[12px] text-[#F5F7F1]/60 opacity-0 transition duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                  {item.prompt}
                </p>
                <button
                  type="button"
                  onClick={() => startWith(`${item.title}: ${item.prompt}`)}
                  className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.08] px-3.5 text-[13px] font-semibold text-[#F5F7F1] transition group-hover:border-[#C8FF00] group-hover:bg-[#C8FF00] group-hover:text-[#080908] group-focus-within:border-[#C8FF00] group-focus-within:bg-[#C8FF00] group-focus-within:text-[#080908]"
                >
                  Remix free
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Image → Video                                                       */
/* ------------------------------------------------------------------ */

function ImageToVideo() {
  const { prompt, setPrompt, selectModel, openModal } = useLanding();
  const [active, setActive] = useState<string>(STARTER_ENGINE_ID);
  const engine = VIDEO_ENGINES.find((item) => item.id === active) ?? VIDEO_ENGINES[0];
  const engineCredits = creditsFor(engine.id);
  const starterName = getModel(STARTER_ENGINE_ID)?.name ?? "LTX 2";
  const strip = [
    "/placeholders/neon-rain.jpg",
    "/placeholders/dune-gold.jpg",
    "/placeholders/portrait-gold.jpg",
    "/placeholders/chrome-car.jpg",
    "/placeholders/fog-woods.jpg",
    "/placeholders/star-ridge.jpg",
  ];

  /** Carry the chosen engine into the signup sheet, not just the local preview. */
  const animate = () => {
    selectModel(engine.id);
    openModal("generate");
  };

  return (
    <section id="video" className="scroll-mt-24 border-y border-white/[0.06] py-20 sm:py-24">
      <Shell className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] [&>*]:min-w-0">
        <div className="relative">
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
            Pick a motion engine, drop a still, and get a 5-second clip from the same credit
            balance. Your first clip on {starterName} costs {creditsFor(STARTER_ENGINE_ID)} credits.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {VIDEO_ENGINES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                className={cn(
                  "h-10 rounded-full border px-4 text-[13px] font-semibold whitespace-nowrap transition",
                  active === item.id
                    ? "border-[#C8FF00] bg-[#C8FF00] text-[#080908]"
                    : "border-white/12 bg-white/[0.03] text-[#F5F7F1]/65 hover:text-white",
                )}
              >
                {item.name} · {creditsFor(item.id)}
              </button>
            ))}
          </div>

          <div className="mt-7 rounded-2xl border border-white/10 bg-[#161616] p-2.5 shadow-[0_20px_60px_-24px_#000]">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="size-10 shrink-0 rounded-[10px] bg-cover bg-center"
                style={{ backgroundImage: "url(/placeholders/portrait-gold.jpg)" }}
              />
              <input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                aria-label="Describe the motion"
                placeholder="Describe the motion: slow push-in, wind in hair…"
                className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-2 text-[14px] text-white outline-none placeholder:text-[#F5F7F1]/40"
              />
              <button
                type="button"
                onClick={animate}
                className={cn(dockBtn, "w-full justify-center sm:w-auto")}
              >
                <span className="whitespace-nowrap">Animate this · {engineCredits}</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
            <p className="mt-2 ml-1 text-[12px] text-[#F5F7F1]/45">
              Sign up to run it — the frame and prompt carry over.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#10110f] p-3 shadow-[0_0_80px_-40px_rgba(200,255,0,0.35)]">
          <div className="relative aspect-video overflow-hidden rounded-[20px] bg-black">
            {/* Remount on engine change so the new loop actually starts playing. */}
            <HoverVideo key={engine.id} src={engine.loop} poster={engine.poster} autoPlay active />
            <div className="absolute inset-0 flex items-center justify-center bg-black/25">
              <span className="flex size-16 items-center justify-center rounded-full bg-[#C8FF00] text-[#080908] shadow-[0_0_40px_rgba(200,255,0,.35)]">
                <Play className="size-6 fill-current" />
              </span>
            </div>
            <span className="absolute top-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] tabular-nums">
              00:05
            </span>
            <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] whitespace-nowrap">
              {engine.name} · {engineCredits} credits
            </span>
          </div>
          <div className="relative mt-3 flex gap-2 overflow-x-auto pb-1">
            {strip.map((src, index) => (
              <div
                key={src}
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
        </div>
      </Shell>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Why new creators stall                                              */
/* ------------------------------------------------------------------ */

function PainPoints() {
  return (
    <section id="why" className="scroll-mt-24 py-20 sm:py-24">
      <Shell>
        <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
          Why new creators stall
        </p>
        <h2
          className="mt-3 max-w-2xl text-[40px] leading-[1.05] font-[560] sm:text-[52px]"
          style={{ letterSpacing: "-0.04em" }}
        >
          You don’t need ten tools.
          <br />
          You need one that makes sense.
        </h2>
        <p className="mt-4 max-w-xl text-[15px] text-[#F5F7F1]/55">
          Most people never publish their first AI piece because they get stuck choosing tools,
          plans and models. Prism removes that step.
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
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link href={CLAIM} className={limeBtn}>
            Start Free — {WELCOME_CREDITS} Credits
            <ArrowRight className="size-4" />
          </Link>
          <span className="text-[13px] text-[#F5F7F1]/50">Takes 30 seconds. No card.</span>
        </div>
      </Shell>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Models                                                              */
/* ------------------------------------------------------------------ */

const MODEL_ICONS = {
  "flux-2-schnell": Zap,
  "flux-2-dev": Aperture,
  "seedream-5": Moon,
  sdxl: ImageIcon,
} as const;

function ModelPicker() {
  const { modelId, selectModel } = useLanding();
  const [tab, setTab] = useState<Modality>("image");
  const [picked, setPicked] = useState<string>(STARTER_MODEL_ID);
  const pickedName = getModel(picked)?.name ?? "Flux 2 Schnell";
  const starterName = getModel(STARTER_MODEL_ID)?.name ?? "Flux 2 Schnell";

  return (
    <section id="models" className="scroll-mt-24 border-y border-white/[0.06] py-20 sm:py-24">
      <Shell>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
              Confused by model names? We picked for you.
            </p>
            <h2
              className="mt-3 max-w-xl text-[40px] leading-[1.05] font-[560] sm:text-[56px]"
              style={{ letterSpacing: "-0.04em" }}
            >
              The best models,
              <br />
              explained in one line each.
            </h2>
          </div>
          <div className="flex shrink-0 rounded-full border border-white/10 bg-white/[0.03] p-1">
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
                  "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition",
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
              const active = picked === model.id;
              const Icon = MODEL_ICONS[model.id as keyof typeof MODEL_ICONS] ?? Sparkles;
              return (
                <button
                  key={model.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setPicked(model.id);
                    selectModel(model.id);
                  }}
                  className={cn(
                    "relative flex min-h-[220px] flex-col rounded-[22px] border p-5 text-left transition",
                    active
                      ? "border-[#C8FF00] bg-[#C8FF00] text-[#080908] shadow-[0_0_48px_rgba(200,255,0,.18)]"
                      : "border-white/[0.07] bg-[#10110f] text-[#F5F7F1] hover:border-white/20",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Icon className="size-5 shrink-0" strokeWidth={1.7} />
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase",
                        active ? "bg-black/10 text-[#080908]" : "bg-white/[0.08] text-white/50",
                      )}
                    >
                      {creditsFor(model.id)} credits · {freeRunsFor(model.id)} free
                    </span>
                  </div>
                  <div className="mt-auto pt-10">
                    <h3 className="text-[18px] font-semibold">{model.name}</h3>
                    <p className={cn("mt-1 text-[13px]", active ? "text-black/65" : "text-white/50")}>
                      {model.tagline}
                    </p>
                    <span
                      className={cn(
                        "mt-3.5 inline-flex h-[34px] items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold whitespace-nowrap",
                        active ? "bg-[#080908] text-[#C8FF00]" : "bg-white/[0.06] text-white/80",
                      )}
                    >
                      Try {model.name} free
                      <ArrowRight className="size-3.5" />
                    </span>
                  </div>
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
                className="relative flex min-h-[220px] flex-col rounded-[22px] border border-white/[0.07] bg-[#10110f] p-5 transition hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <Clapperboard className="size-5 shrink-0 text-[#F5F7F1]" strokeWidth={1.7} />
                  <span className="rounded-md bg-white/[0.08] px-2 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap text-white/50 uppercase">
                    {creditsFor(model.id)} credits / clip
                  </span>
                </div>
                <div className="mt-auto pt-10">
                  <h3 className="text-[18px] font-semibold">{model.name}</h3>
                  <p className="mt-1 text-[13px] text-white/50">{model.blurb}</p>
                  <span className="mt-3.5 inline-flex h-[34px] items-center gap-1.5 rounded-full bg-white/[0.06] px-3 text-[12px] font-semibold text-white/80">
                    Make a clip
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[14px] text-[#F5F7F1]/45">
            Not sure? Start with {starterName} — fast, cheap and hard to get wrong.
          </p>
          <Link
            href={
              tab === "image"
                ? signupUrl(generatePath("image", picked))
                : signupUrl(generatePath("video", STARTER_ENGINE_ID))
            }
            className={limeBtn}
          >
            <span className="whitespace-nowrap">
              Try {tab === "image" ? pickedName : getModel(STARTER_ENGINE_ID)?.name} Free
            </span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
        {/* Keeps the hero dock in step when someone picks a card up here. */}
        <span className="sr-only">Selected model: {getModel(modelId)?.name}</span>
      </Shell>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Three steps                                                         */
/* ------------------------------------------------------------------ */

function ThreeSteps() {
  const { prompt, setPrompt, openModal } = useLanding();
  return (
    <section className="py-20 sm:py-24">
      <Shell>
        <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
          Your first hour as an AI creator
        </p>
        <h2
          className="mt-3 text-[40px] leading-[1.05] font-[560] sm:text-[52px]"
          style={{ letterSpacing: "-0.04em" }}
        >
          Three steps. No tutorials required.
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
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-[22px] border border-[#C8FF00]/30 bg-gradient-to-b from-[#C8FF00]/[0.06] to-transparent px-6 py-5">
          <div className="w-full lg:w-auto lg:shrink-0">
            <p className="text-[12px] font-semibold text-[#C8FF00]">Step 01 starts here</p>
            <p className="mt-1 text-[15px] font-semibold">
              Describe it in plain words — we’ll pick the engine.
            </p>
          </div>
          <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#161616] py-1.5 pr-1.5 pl-3.5">
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              aria-label="Describe your image"
              placeholder="A monsoon street in Kochi, film still…"
              className="min-w-0 flex-1 border-0 bg-transparent py-2 text-[14px] text-white outline-none placeholder:text-[#F5F7F1]/40"
            />
            <button type="button" onClick={() => openModal("generate")} className={dockBtn}>
              Generate free
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </Shell>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Use cases                                                           */
/* ------------------------------------------------------------------ */

function UseCases() {
  const { startWith } = useLanding();
  return (
    <section className="border-y border-white/[0.06] py-20 sm:py-24">
      <Shell>
        <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
          Pick a lane
        </p>
        <h2
          className="mt-3 text-[40px] leading-[1.05] font-[560] sm:text-[52px]"
          style={{ letterSpacing: "-0.04em" }}
        >
          What kind of creator do you want to be?
        </h2>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {USE_CASES.map((item) => (
            <article
              key={item.title}
              className="group relative min-h-[320px] overflow-hidden rounded-[22px] border border-white/[0.06]"
            >
              <img
                src={item.src}
                alt=""
                className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
              <div className="relative flex h-full min-h-[320px] flex-col justify-end p-5">
                <p className="text-[11px] font-semibold tracking-wide text-[#C8FF00] uppercase">
                  {item.model}
                </p>
                <h3 className="mt-1 text-[24px] font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-[12px] text-[#F5F7F1]/60 italic">“{item.prompt}”</p>
                <button
                  type="button"
                  onClick={() => startWith(item.prompt, item.modelId)}
                  className="mt-3.5 inline-flex h-10 items-center justify-center gap-1.5 self-start rounded-full border border-white/20 bg-white/[0.08] px-4 text-[13px] font-semibold text-[#F5F7F1] backdrop-blur-sm transition hover:border-[#C8FF00] hover:bg-[#C8FF00] hover:text-[#080908]"
                >
                  Start with this prompt
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </Shell>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Compare                                                             */
/* ------------------------------------------------------------------ */

function Compare() {
  return (
    <section className="py-20 sm:py-24">
      <Shell>
        <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
          Why Prism, in one glance
        </p>
        <h2
          className="mt-3 max-w-2xl text-[40px] leading-[1.05] font-[560] sm:text-[52px]"
          style={{ letterSpacing: "-0.04em" }}
        >
          The honest comparison new creators ask for.
        </h2>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          <article className="rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-6">
            <p className="text-[12px] tracking-wide text-[#F5F7F1]/40 uppercase">
              Stitching tools together
            </p>
            <ul className="mt-5 space-y-3 text-[14px] text-[#F5F7F1]/55">
              {COMPARE_STITCHED.map((item) => (
                <li key={item}>– {item}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-[22px] border border-[#C8FF00]/35 bg-[#C8FF00]/[0.07] p-6 shadow-[0_0_60px_-40px_rgba(200,255,0,0.55)]">
            <p className="text-[12px] font-semibold tracking-wide text-[#C8FF00] uppercase">
              Prism · everything a new creator needs
            </p>
            <ul className="mt-5 space-y-3 text-[14px] text-[#F5F7F1]/85">
              {COMPARE_PRISM.map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#C8FF00]" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={CLAIM}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#C8FF00] px-5 text-[14px] font-semibold text-[#080908] transition hover:bg-[#dcff54]"
            >
              Start My Creator Journey — Free
              <ArrowRight className="size-3.5" />
            </Link>
          </article>
        </div>
      </Shell>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 18+ freedom                                                         */
/* ------------------------------------------------------------------ */

function Freedom() {
  const chips = [
    "Private opt-in mode",
    "Images + video",
    `${NSFW_MODEL_COUNT} uncensored models`,
    "Age verification required",
  ];
  const rules = [
    "Strictly no minors",
    "No non-consensual intimate imagery",
    "No explicit deepfakes of identifiable people",
    "Consent and privacy safeguards",
  ];
  return (
    <section id="freedom" className="scroll-mt-24 bg-[#C8FF00] py-16 text-[#080908] sm:py-20">
      <Shell className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-[#080908]/15 bg-[#080908]/[0.06]">
            <Shield className="size-5" strokeWidth={1.75} />
          </div>
          <p className="text-[12px] font-semibold tracking-[0.18em] text-[#080908]/65 uppercase">
            Verified 18+ · NSFW creative mode
          </p>
          <h2
            className="mt-3 max-w-xl text-[40px] leading-[1.02] font-[560] sm:text-[52px]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Adult creativity,
            <br />
            without pretending
            <br />
            adults don’t exist.
          </h2>
        </div>
        <div>
          <p className="text-[15px] leading-relaxed text-[#080908]/90">
            Verified adults can opt in to broader NSFW image and video creation—with age gates,
            consent rules and strict safeguards. Off by default; switch it on from your studio in
            one tap.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            {chips.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#080908]/25 bg-[#080908]/[0.08] px-3.5 py-2 text-center text-[12px] font-semibold"
              >
                {item}
              </span>
            ))}
          </div>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {rules.map((item) => (
              <li key={item} className="flex gap-2 text-[13px] font-medium">
                <Check className="mt-0.5 size-4 shrink-0" strokeWidth={2.25} />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={CLAIM}
              className="inline-flex h-13 items-center gap-2 rounded-full bg-[#080908] px-6 text-[15px] font-semibold text-[#C8FF00] transition hover:bg-[#1a1b18]"
            >
              Sign up &amp; verify 18+
              <ArrowRight className="size-4" />
            </Link>
            <span className="text-[13px] font-medium text-[#080908]/70">
              Same {WELCOME_CREDITS} free credits · verification takes ~1 minute
            </span>
          </div>
        </div>
      </Shell>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Built in India                                                      */
/* ------------------------------------------------------------------ */

function BuiltInIndia() {
  const cards = [
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
  ];
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
          {cards.map((item) => (
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

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

function Pricing() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const schnellRuns = freeRunsFor("flux-2-schnell");
  const sdxlRuns = freeRunsFor("sdxl");

  return (
    <section id="pricing" className="scroll-mt-24 border-y border-white/[0.06] py-20 sm:py-24">
      <Shell className="text-center">
        <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
          Start free. Upgrade only once you’re publishing.
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
          Try Prism before spending anything. Paid credit packs arrive at launch — founding
          creators lock in launch pricing.
        </p>
        <div className="mx-auto mt-12 grid max-w-[920px] gap-4 text-left md:grid-cols-2">
          <article className="rounded-[28px] border border-[#C8FF00]/45 bg-gradient-to-b from-[#C8FF00]/[0.08] to-transparent p-7 shadow-[0_0_80px_-48px_rgba(200,255,0,0.8)] sm:p-8">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#C8FF00] uppercase">
              Start here
            </p>
            <p className="mt-3 text-[28px] font-semibold">Free</p>
            <p className="mt-1 text-[56px] leading-none font-semibold tracking-tight">₹0</p>
            <p className="mt-3 text-[14px] text-[#F5F7F1]/60">
              {WELCOME_CREDITS} welcome credits ≈ {schnellRuns} Flux Schnell images or {sdxlRuns}{" "}
              SDXL images. No card.
            </p>
            <div className="my-6 h-px bg-white/10" />
            <ul className="space-y-2.5 text-[14px] text-[#F5F7F1]/80">
              {[
                `${WELCOME_CREDITS} image credits`,
                `All ${IMAGE_MODELS.length} image models`,
                "Mobile and desktop",
                "No credit card",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#C8FF00]" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href={CLAIM} className={cn(limeBtn, "mt-8 w-full")}>
              Claim My {WELCOME_CREDITS} Free Credits
              <ArrowRight className="size-4" />
            </Link>
            <p className="mt-3 text-center text-[12px] text-[#F5F7F1]/45">
              Joined by{" "}
              <b className="text-[#F5F7F1]/80 tabular-nums">
                {nf.format(LANDING_STATS.totalCreators)}
              </b>{" "}
              creators so far
            </p>
          </article>

          <article className="rounded-[28px] border border-white/[0.08] bg-[#10110f] p-7 sm:p-8">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#F5F7F1]/40 uppercase">
              Launching soon
            </p>
            <p className="mt-3 text-[28px] font-semibold">Creator credits</p>
            <p className="mt-1 text-[40px] leading-none font-semibold tracking-tight text-[#F5F7F1]/90">
              From ₹399
            </p>
            <p className="mt-3 text-[14px] text-[#F5F7F1]/55">
              Founding creators get launch pricing locked for 12 months.
            </p>
            <div className="my-6 h-px bg-white/10" />
            <ul className="space-y-2.5 text-[14px] text-[#F5F7F1]/60">
              {[
                "Image and video generation",
                "Shared credits across models",
                "Better value at higher packs",
                "No subscription juggling",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-[#C8FF00]/70" />
                  {item}
                </li>
              ))}
            </ul>
            {joined ? (
              <p className="mt-8 flex h-12 items-center justify-center gap-2 rounded-full border border-[#C8FF00]/40 bg-[#C8FF00]/[0.08] text-[14px] text-[#C8FF00]">
                <Check className="size-4" />
                You’re on the list. Launch pricing locked.
              </p>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  // TODO: POST to a real waitlist endpoint — nothing is persisted yet.
                  setJoined(true);
                }}
              >
                <div className="mt-8 flex gap-1.5 rounded-full border border-white/12 py-1 pr-1 pl-4">
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    required
                    aria-label="Email address"
                    placeholder="you@studio.in"
                    className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-white outline-none placeholder:text-[#F5F7F1]/40"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-4 text-[13px] font-semibold text-[#F5F7F1] transition hover:border-[#C8FF00] hover:text-[#C8FF00]"
                  >
                    Lock launch price
                  </button>
                </div>
                <p className="mt-2.5 text-center text-[12px] text-[#F5F7F1]/45">
                  <b className="text-[#F5F7F1]/80 tabular-nums">
                    {nf.format(LANDING_STATS.waitlistCount)}
                  </b>{" "}
                  on the launch list
                </p>
              </form>
            )}
          </article>
        </div>
      </Shell>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

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
          <div className="mt-7 rounded-[20px] border border-white/[0.08] bg-white/[0.025] p-5">
            <p className="text-[15px] font-semibold">Still deciding?</p>
            <p className="mt-1 mb-3 text-[13px] text-[#F5F7F1]/55">
              The fastest way to know if this is for you is your first image. It costs nothing.
            </p>
            <Link
              href={CLAIM}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#C8FF00] px-5 text-[14px] font-semibold text-[#080908] transition hover:bg-[#dcff54]"
            >
              Try it free
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
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
                  <ChevronDown
                    className={cn("size-4 shrink-0 transition", isOpen && "rotate-180")}
                  />
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

/* ------------------------------------------------------------------ */
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

function FinalCta() {
  const { prompt, setPrompt, openModal } = useLanding();
  return (
    <section className="px-4 pb-10 sm:px-6">
      <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[32px] border border-[#C8FF00]/20 bg-[#0c0d0a] px-6 py-16 text-center sm:px-10 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(200,255,0,0.16),transparent_55%)]" />
        <div className="relative">
          <span className="mx-auto flex size-12 items-center justify-center rounded-[14px] bg-[#C8FF00] text-[18px] font-bold text-[#080908]">
            P
          </span>
          <p className="mt-6 text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
            {WELCOME_CREDITS} credits. Zero excuses.
          </p>
          <h2
            className="mt-3 text-[40px] leading-[1.05] font-[560] sm:text-[56px]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Your first piece as an
            <br />
            AI creator starts here.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] text-[#F5F7F1]/55">
            Type what you see in your head. Sign up on the next screen and it renders while you
            finish.
          </p>
          <div className="mx-auto mt-8 flex max-w-[640px] gap-1.5 rounded-2xl border border-[#C8FF00]/35 bg-[#161616] py-1.5 pr-1.5 pl-4 shadow-[0_0_0_4px_rgba(200,255,0,.08)]">
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              aria-label="Describe your image"
              placeholder="Describe what you see in your head…"
              className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-left text-[15px] text-white outline-none placeholder:text-[#F5F7F1]/40"
            />
            <button
              type="button"
              onClick={() => openModal("generate")}
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-[#C8FF00] px-5 text-[15px] font-semibold text-[#080908] transition hover:bg-[#dcff54]"
            >
              Generate free
              <ArrowRight className="size-4" />
            </button>
          </div>
          <p className="mt-4 text-[13px] text-[#F5F7F1]/45">
            No card. No commitment. Just create.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

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
          <Link
            href={CLAIM}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full border border-[#C8FF00]/40 px-3.5 text-[13px] font-semibold text-[#C8FF00] transition hover:bg-[#C8FF00]/10"
          >
            Claim {WELCOME_CREDITS} free credits
          </Link>
        </div>
        <div>
          <b className="text-[13px]">Product</b>
          <div className="mt-3 flex flex-col gap-2 text-[13px] text-[#F5F7F1]/50">
            <a href="#models" className="transition hover:text-white">
              Models
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </div>
        </div>
        <div>
          <b className="text-[13px]">Company</b>
          <div className="mt-3 flex flex-col gap-2 text-[13px] text-[#F5F7F1]/50">
            <a href="#why" className="transition hover:text-white">
              Why Prism
            </a>
            <a href="#freedom" className="transition hover:text-white">
              Responsible use
            </a>
            <a href="mailto:hello@prism.studio" className="transition hover:text-white">
              Contact
            </a>
          </div>
        </div>
        <div>
          <b className="text-[13px]">Legal</b>
          <div className="mt-3 flex flex-col gap-2 text-[13px] text-[#F5F7F1]/50">
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
          <b className="block text-[13px]">{WELCOME_CREDITS} credits free</b>
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

/* ------------------------------------------------------------------ */
/* Signup / exit-intent sheet                                          */
/* ------------------------------------------------------------------ */

function SignupModal({
  open,
  reason,
  onOpenChange,
}: {
  open: boolean;
  reason: ModalReason;
  onOpenChange: (open: boolean) => void;
}) {
  const { prompt, modality, modelId } = useLanding();
  const trimmed = prompt.trim();
  const exit = reason === "exit";
  const model = getModel(modelId);
  const cost = creditsFor(modelId);

  /** Persist everything the dock collected so /generate picks it back up. */
  const carryOver = () => {
    saveGenerateDraft({
      prompt: trimmed,
      modality,
      modelId,
      aspectRatio: "3:4",
      resolution: modality === "image" ? "1K" : "1080p",
      duration: 5,
      variationCount: 1,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/70 supports-backdrop-filter:backdrop-blur-md"
        className="w-full max-w-[520px] gap-0 rounded-[28px] border border-[#C8FF00]/30 bg-[#10110f] p-8 text-[#F5F7F1] ring-0 shadow-[0_40px_120px_-30px_rgba(0,0,0,1),0_0_80px_-40px_rgba(200,255,0,.5)] sm:max-w-[520px] sm:p-9"
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-white/[0.06] text-[16px] text-[#F5F7F1]/70 transition hover:bg-white/10"
        >
          ×
        </button>
        <p className="text-[12px] font-semibold tracking-[0.18em] text-[#C8FF00] uppercase">
          {exit ? "Before you go" : "One step from your first image"}
        </p>
        <DialogTitle
          className="mt-3 text-[28px] leading-[1.05] font-[560] sm:text-[34px]"
          style={{ letterSpacing: "-0.04em" }}
        >
          {exit
            ? `Leave with your ${WELCOME_CREDITS} free credits.`
            : trimmed
              ? "Save this prompt and render it."
              : "Create a free account to generate."}
        </DialogTitle>
        {trimmed && (
          <div className="mt-5 flex gap-2.5 rounded-[14px] border border-white/10 bg-[#161616] px-3.5 py-3 text-[14px] text-[#F5F7F1]/85">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-[#C8FF00]" />
            <span>
              “{trimmed}” · {model?.name} · {cost} credits
            </span>
          </div>
        )}
        <DialogDescription className="mt-4 text-[15px] leading-relaxed text-[#F5F7F1]/60">
          {exit
            ? `Create an account in 30 seconds and the credits are yours whenever you come back. No card, nothing expires for a week.`
            : "Your prompt, model and settings carry into the studio. The first render starts while you finish signing up."}
        </DialogDescription>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href={continueHref(trimmed, modality, modelId)}
            onClick={carryOver}
            className="flex h-13 items-center justify-center gap-2 rounded-full bg-[#C8FF00] text-[15px] font-semibold text-[#080908] shadow-[0_0_40px_rgba(200,255,0,.22)] transition hover:bg-[#dcff54]"
          >
            {exit ? `Claim my ${WELCOME_CREDITS} credits` : "Create account & generate"}
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href={SIGN_IN}
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 text-[14px] font-medium text-[#F5F7F1] transition hover:bg-white/[0.04]"
          >
            I already have an account
          </Link>
        </div>
        <p className="mt-4 text-center text-[12px] text-[#F5F7F1]/45">
          No card · {WELCOME_CREDITS} credits land instantly ·{" "}
          <Link href={SIGN_IN} className="text-[#F5F7F1]/70 underline underline-offset-[3px]">
            Sign in instead
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}
