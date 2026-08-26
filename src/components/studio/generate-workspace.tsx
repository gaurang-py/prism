"use client";

import { useEffect } from "react";
import { Composer } from "./composer";
import { JobGallery } from "./job-gallery";
import { ResultLightbox } from "./lightbox";
import { useStudio } from "@/context/studio-context";
import type { Modality } from "@/lib/models";

export function GenerateWorkspace({
  forcedMode,
}: {
  forcedMode?: Modality;
}) {
  const { jobs, setModality } = useStudio();

  useEffect(() => {
    if (forcedMode) setModality(forcedMode);
  }, [forcedMode, setModality]);

  const inFlight = jobs.filter((job) => job.status !== "done").length;

  return (
    <div className="flex h-full min-h-0">
      <Composer />
      <div className="flex min-w-0 flex-1 flex-col bg-canvas">
        <div className="flex items-end justify-between gap-4 px-5 pt-5 pb-3">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
              Board
            </p>
            <h2 className="font-display text-2xl italic">Recent runs</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {inFlight > 0
              ? `${inFlight} on the bench`
              : `${jobs.length} on the board`}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
          <JobGallery
            jobs={jobs}
            emptyTitle="The board is clear"
            emptyBody="Write a prompt, pick a model, and generate. Mocked jobs land here in a few seconds."
          />
        </div>
      </div>
      <ResultLightbox />
    </div>
  );
}
