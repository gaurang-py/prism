"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HoverVideo } from "@/components/studio/hover-video";
import { ModelExploreGrid } from "@/components/studio/model-tool-card";
import { NsfwToggle } from "@/components/studio/nsfw-toggle";
import { useAuth } from "@/context/auth-context";
import {
  cheapestVideoModel,
  type HomeFilter,
} from "@/lib/models";
import { generatePath } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTERS: { id: HomeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
  { id: "nsfw", label: "NSFW" },
];

export function HomeHub() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<HomeFilter>("all");
  const nsfwEnabled = Boolean(user?.nsfwEnabled);

  useEffect(() => {
    if (!nsfwEnabled && filter === "nsfw") setFilter("all");
  }, [nsfwEnabled, filter]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex flex-wrap items-center gap-1">
            {FILTERS.map((item) => {
              const disabled = item.id === "nsfw" && !nsfwEnabled;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "h-8 rounded-lg px-3 text-sm font-medium",
                    filter === item.id
                      ? "bg-white/10 text-white"
                      : "text-muted-foreground hover:bg-white/6 hover:text-white",
                    disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted-foreground",
                  )}
                  title={disabled ? "Turn NSFW on to see adult models" : undefined}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
          <NsfwToggle />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(340px,1.05fr)_minmax(0,1.45fr)]">
          <FeaturedCard />
          <ModelExploreGrid
            className="md:grid-cols-2 xl:grid-cols-3"
            nsfwEnabled={nsfwEnabled}
            filter={filter}
          />
        </div>
      </div>
    </div>
  );
}

function FeaturedCard() {
  const model = cheapestVideoModel();
  return (
    <Link
      href={generatePath("video", model.id)}
      className="group relative isolate min-h-[360px] overflow-hidden rounded-2xl bg-card"
    >
      {model.previewLoop ? (
        <HoverVideo
          src={model.previewLoop}
          poster={model.previewPoster}
          autoPlay
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/15" />
      <div className="relative flex h-full min-h-[360px] flex-col justify-end p-6">
        <span className="mb-3 w-fit rounded-md bg-lime px-2 py-0.5 text-[11px] font-semibold tracking-wide text-lime-foreground uppercase">
          Cheapest video · {model.mockCredits} credits
        </span>
        <h2 className="max-w-sm text-3xl leading-tight font-semibold text-white">
          Generate video with {model.name}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-white/70">
          Lowest pack cost in the catalog. Opens Generate in video mode with {model.name}{" "}
          selected. Hover a video card to preview a loop.
        </p>
        <span className="mt-5 inline-flex w-fit items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">
          Start generating · {model.mockCredits}
        </span>
      </div>
    </Link>
  );
}
