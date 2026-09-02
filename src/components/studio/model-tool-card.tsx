"use client";

import { useState } from "react";
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
import { HoverVideo } from "@/components/studio/hover-video";
import {
  visibleModels,
  type GenerationModel,
  type HomeFilter,
  type Modality,
} from "@/lib/models";
import { signupUrl } from "@/lib/paths";
import { generatePath } from "@/lib/types";
import { cn } from "@/lib/utils";

export const MODEL_ICONS: Record<string, LucideIcon> = {
  "nano-banana-2": Zap,
  "nano-banana-pro": Aperture,
  "nano-banana": ImageIcon,
  "veo-3.1-fast": Clapperboard,
  "veo-3.1": Video,
  "veo-3.1-lite": Play,
  "flux-2-schnell": Zap,
  "flux-2-dev": Aperture,
  "seedream-5": Moon,
  sdxl: ImageIcon,
  "wan-2.6": Film,
  "seedance-fast": Clapperboard,
  "kling-2.6": Video,
  "ltx-2": Play,
  "flux-uncensored": Zap,
  "pony-v7": Sparkles,
  "sdxl-uncensored": ImageIcon,
  "hunyuan-video": Clapperboard,
};

export const NEW_MODEL_IDS = new Set(["nano-banana-2", "veo-3.1-lite"]);

export function ModelToolCard({
  model,
  href,
}: {
  model: GenerationModel;
  href?: string;
}) {
  const Icon = MODEL_ICONS[model.id] ?? Sparkles;
  const playable = model.modality === "video" && Boolean(model.previewLoop);
  const [hot, setHot] = useState(false);
  return (
    <Link
      href={href ?? generatePath(model.modality, model.id)}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      className="group relative flex min-h-[148px] flex-col overflow-hidden rounded-2xl bg-card p-4 text-left transition-colors hover:bg-[#222]"
    >
      {playable && model.previewLoop ? (
        <HoverVideo
          src={model.previewLoop}
          poster={model.previewPoster}
          active={hot}
          className={cn(
            "transition-opacity duration-300",
            hot ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
      {playable ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      ) : null}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <Icon className="size-5 text-white" strokeWidth={1.6} />
        <div className="flex items-center gap-1.5">
          {model.nsfw ? <NsfwPill /> : null}
          <ModalityPill modality={model.modality} />
        </div>
      </div>
      <div className="relative z-10 mt-auto pt-8">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-white">{model.name}</h3>
          {NEW_MODEL_IDS.has(model.id) && (
            <span className="rounded-md bg-lime px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-lime-foreground uppercase">
              New
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{model.tagline}</p>
        {playable ? (
          <p className="mt-1 text-[11px] text-white/45">Hover to play</p>
        ) : null}
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

export function NsfwPill() {
  return (
    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] tracking-wide text-white/80 uppercase">
      Adult
    </span>
  );
}

export function ModelExploreGrid({
  className,
  guest = false,
  nsfwEnabled = false,
  filter = "all",
}: {
  className?: string;
  guest?: boolean;
  nsfwEnabled?: boolean;
  filter?: HomeFilter;
}) {
  const models = visibleModels({
    nsfwEnabled: guest ? false : nsfwEnabled,
    filter: guest ? "all" : filter,
  });
  if (models.length === 0) {
    return (
      <div className={cn("rounded-2xl bg-card px-4 py-10 text-sm text-muted-foreground", className)}>
        {filter === "nsfw"
          ? "Turn NSFW on to see adult models."
          : "No models in this filter."}
      </div>
    );
  }
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4", className)}>
      {models.map((model) => {
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
