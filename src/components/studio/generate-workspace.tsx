"use client";

import { useRouter } from "next/navigation";
import { GenerateDock } from "./generate-dock";
import { JobGallery } from "./job-gallery";
import { ResultLightbox } from "./lightbox";
import { useStudio } from "@/context/studio-context";
import type { Modality } from "@/lib/models";
import { generatePath } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatCredits } from "@/lib/format";

export function GenerateWorkspace() {
  const router = useRouter();
  const { jobs, modality, setModality, credits, creditError } = useStudio();
  const visible = jobs.filter((job) => job.modality === modality);

  function switchMode(next: Modality) {
    setModality(next);
    router.replace(generatePath(next));
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-canvas">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 px-6">
        <nav className="flex items-center gap-5 text-sm font-medium">
          {(["image", "video"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => switchMode(mode)}
              className={cn(
                "capitalize transition-colors",
                modality === mode ? "text-lime" : "text-white/45 hover:text-white",
              )}
            >
              {mode}
            </button>
          ))}
        </nav>
        <div
          className={cn(
            "text-sm tabular-nums text-lime",
            creditError && "credit-error text-destructive",
          )}
        >
          {formatCredits(credits)} credits
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-44">
        <JobGallery
          jobs={visible}
          emptyTitle="Describe the scene you imagine"
          emptyBody="Pick a model in the dock, write a prompt, and generate. Jobs persist in Postgres and land here when Fal finishes."
        />
      </div>

      <GenerateDock />
      <ResultLightbox />
    </div>
  );
}
