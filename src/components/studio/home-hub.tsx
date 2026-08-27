"use client";

/* eslint-disable @next/next/no-img-element -- featured still is a local placeholder */

import Link from "next/link";
import { ModelExploreGrid } from "@/components/studio/model-tool-card";
import { generatePath } from "@/lib/types";

export function HomeHub() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-8 py-8">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(340px,1.05fr)_minmax(0,1.45fr)]">
          <FeaturedCard />
          <ModelExploreGrid className="md:grid-cols-2 xl:grid-cols-3" />
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
