"use client";

/* eslint-disable @next/next/no-img-element -- featured still is a local placeholder */

import Link from "next/link";
import {
  Aperture,
  Clapperboard,
  Film,
  ImageIcon,
  Moon,
  Play,
  Sparkles,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { MODELS, type GenerationModel, type Modality } from "@/lib/models";
import { generatePath } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  "flux-2-schnell": Zap,
  "flux-2-dev": Aperture,
  "seedream-5": Moon,
  sdxl: ImageIcon,
  "wan-2.6": Film,
  "seedance-fast": Clapperboard,
  "kling-2.6": Video,
  "ltx-2": Play,
};

const NEW_IDS = new Set(["seedance-fast", "flux-2-dev"]);

export function HomeHub() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-8 py-8">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(340px,1.05fr)_minmax(0,1.45fr)]">
          <FeaturedCard />
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {MODELS.map((model) => (
              <ModelToolCard key={model.id} model={model} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedCard() {
  return (
    <Link
      href={generatePath("video", "seedance-fast")}
      className="group relative isolate min-h-[360px] overflow-hidden rounded-2xl bg-card"
    >
      <img
        src="/placeholders/dune-gold.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
      <div className="relative flex h-full min-h-[360px] flex-col justify-end p-6">
        <span className="mb-3 w-fit rounded-md bg-lime px-2 py-0.5 text-[11px] font-semibold tracking-wide text-lime-foreground uppercase">
          New
        </span>
        <h2 className="max-w-sm text-3xl leading-tight font-semibold text-white">
          Generate video with Seedance Fast
        </h2>
        <p className="mt-2 max-w-sm text-sm text-white/70">
          Quick cuts for tests. Opens Generate in video mode with Seedance selected.
        </p>
        <span className="mt-5 inline-flex w-fit items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">
          Start generating
        </span>
      </div>
    </Link>
  );
}

function ModelToolCard({ model }: { model: GenerationModel }) {
  const Icon = ICONS[model.id] ?? Sparkles;
  return (
    <Link
      href={generatePath(model.modality, model.id)}
      className="flex min-h-[148px] flex-col rounded-2xl bg-card p-4 text-left transition-colors hover:bg-[#222]"
    >
      <div className="flex items-start justify-between gap-3">
        <Icon className="size-5 text-white" strokeWidth={1.6} />
        <ModalityPill modality={model.modality} />
      </div>
      <div className="mt-auto pt-8">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-white">{model.name}</h3>
          {NEW_IDS.has(model.id) && (
            <span className="rounded-md bg-lime px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-lime-foreground uppercase">
              New
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{model.tagline}</p>
      </div>
    </Link>
  );
}

function ModalityPill({ modality }: { modality: Modality }) {
  const Icon = modality === "video" ? Clapperboard : ImageIcon;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-zinc-300">
      <Icon className="size-3" />
      {modality === "video" ? "Video" : "Image"}
    </span>
  );
}
