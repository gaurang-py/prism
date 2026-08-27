"use client";

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
import { signupUrl } from "@/lib/paths";
import { generatePath } from "@/lib/types";
import { cn } from "@/lib/utils";

export const MODEL_ICONS: Record<string, LucideIcon> = {
  "flux-2-schnell": Zap,
  "flux-2-dev": Aperture,
  "seedream-5": Moon,
  sdxl: ImageIcon,
  "wan-2.6": Film,
  "seedance-fast": Clapperboard,
  "kling-2.6": Video,
  "ltx-2": Play,
};

export const NEW_MODEL_IDS = new Set(["seedance-fast", "flux-2-dev"]);

export function ModelToolCard({
  model,
  href,
}: {
  model: GenerationModel;
  href?: string;
}) {
  const Icon = MODEL_ICONS[model.id] ?? Sparkles;
  return (
    <Link
      href={href ?? generatePath(model.modality, model.id)}
      className="flex min-h-[148px] flex-col rounded-2xl bg-card p-4 text-left transition-colors hover:bg-[#222]"
    >
      <div className="flex items-start justify-between gap-3">
        <Icon className="size-5 text-white" strokeWidth={1.6} />
        <ModalityPill modality={model.modality} />
      </div>
      <div className="mt-auto pt-8">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-white">{model.name}</h3>
          {NEW_MODEL_IDS.has(model.id) && (
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

export function ModalityPill({ modality }: { modality: Modality }) {
  const Icon = modality === "video" ? Clapperboard : ImageIcon;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-zinc-300">
      <Icon className="size-3" />
      {modality === "video" ? "Video" : "Image"}
    </span>
  );
}

export function ModelExploreGrid({
  className,
  guest = false,
}: {
  className?: string;
  guest?: boolean;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4", className)}>
      {MODELS.map((model) => {
        const dest = generatePath(model.modality, model.id);
        return (
          <ModelToolCard
            key={model.id}
            model={model}
            href={guest ? signupUrl(dest) : dest}
          />
        );
      })}
    </div>
  );
}
