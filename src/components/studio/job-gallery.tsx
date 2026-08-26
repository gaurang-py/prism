"use client";

import { JobCard } from "./job-card";
import { useStudio } from "@/context/studio-context";
import type { Job } from "@/lib/types";
import { cn } from "@/lib/utils";

export function JobGallery({
  jobs,
  emptyTitle,
  emptyBody,
  className,
}: {
  jobs: Job[];
  emptyTitle: string;
  emptyBody: string;
  className?: string;
}) {
  const { openJob } = useStudio();

  if (jobs.length === 0) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-8 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <span className="text-lg font-semibold text-lime">P</span>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">{emptyTitle}</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {emptyBody}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("columns-2 gap-3 xl:columns-3", className)}>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onOpen={openJob} />
      ))}
    </div>
  );
}
