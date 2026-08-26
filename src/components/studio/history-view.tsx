"use client";

import { useMemo, useState } from "react";
import { JobGallery } from "./job-gallery";
import { ResultLightbox } from "./lightbox";
import { useStudio } from "@/context/studio-context";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "image", "video"] as const;

export function HistoryView() {
  const { jobs } = useStudio();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const visible = useMemo(() => {
    if (filter === "all") return jobs;
    return jobs.filter((job) => job.modality === filter);
  }, [filter, jobs]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <div className="flex items-end justify-between gap-4 px-8 pt-8 pb-4">
        <div>
          <p className="text-sm text-muted-foreground">History</p>
          <h1 className="text-2xl font-semibold tracking-tight">Your runs</h1>
        </div>
        <div className="flex rounded-lg bg-white/5 p-0.5">
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                filter === value ? "bg-lime text-lime-foreground" : "text-muted-foreground hover:text-white",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-10">
        <JobGallery
          jobs={visible}
          emptyTitle="Nothing yet"
          emptyBody="Generate from Image or Video and finished stills and clips will collect here."
          className="xl:columns-4"
        />
      </div>
      <ResultLightbox />
    </div>
  );
}
