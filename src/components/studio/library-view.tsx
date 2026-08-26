"use client";

import { useMemo, useState } from "react";
import { JobGallery } from "./job-gallery";
import { ResultLightbox } from "./lightbox";
import { useStudio } from "@/context/studio-context";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "image", "video"] as const;

export function LibraryView() {
  const { jobs } = useStudio();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const visible = useMemo(() => {
    if (filter === "all") return jobs;
    return jobs.filter((job) => job.modality === filter);
  }, [filter, jobs]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <div className="flex items-end justify-between gap-4 px-6 pt-6 pb-4">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Library
          </p>
          <h1 className="font-display text-3xl italic">Everything you&apos;ve run</h1>
        </div>
        <div className="flex rounded-full border border-border bg-background/50 p-0.5">
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                filter === value
                  ? "bg-gold text-gold-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10">
        <JobGallery
          jobs={visible}
          emptyTitle="Nothing filed yet"
          emptyBody="Generate from the studio and finished stills and clips will collect here."
          className="xl:columns-4"
        />
      </div>
      <ResultLightbox />
    </div>
  );
}
