"use client";

/* eslint-disable @next/next/no-img-element -- lightbox needs unconstrained media sizing */

import { Clapperboard, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStudio } from "@/context/studio-context";
import { formatTimestamp } from "@/lib/format";
import { getModel } from "@/lib/models";
import { aspectCss } from "@/lib/types";

export function ResultLightbox() {
  const router = useRouter();
  const { selectedJob, closeJob, attachAsVideoInput } = useStudio();
  const job = selectedJob;
  const model = job ? getModel(job.modelId) : undefined;
  const open = Boolean(job);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeJob()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/80 supports-backdrop-filter:backdrop-blur-sm"
        className="flex max-h-[92vh] w-[min(1120px,calc(100%-2rem))] max-w-none gap-0 overflow-hidden rounded-2xl border border-border bg-canvas p-0 sm:max-w-none"
      >
        {job && (
          <>
            <DialogTitle className="sr-only">{job.prompt}</DialogTitle>
            <DialogDescription className="sr-only">
              Generation result for {model?.name ?? job.modelId}
            </DialogDescription>

            <div className="relative flex min-h-[420px] min-w-0 flex-1 items-center justify-center bg-black">
              {job.modality === "video" && job.videoUrl && job.status === "done" ? (
                <video
                  key={job.id}
                  src={job.videoUrl}
                  poster={job.posterUrl ?? job.imageUrl}
                  className="max-h-[92vh] w-full object-contain"
                  style={{ aspectRatio: aspectCss(job.aspectRatio) }}
                  muted
                  loop
                  autoPlay
                  playsInline
                  controls
                />
              ) : (
                <img
                  src={job.posterUrl ?? job.imageUrl}
                  alt={job.prompt}
                  className={
                    job.modality === "video" && job.status === "done"
                      ? "kenburns max-h-[92vh] w-full object-contain"
                      : "max-h-[92vh] w-full object-contain"
                  }
                />
              )}
              {job.modality === "video" && !job.videoUrl && job.status === "done" && (
                <span className="absolute right-4 bottom-4 rounded-full bg-black/60 px-3 py-1 text-xs tracking-wide text-gold uppercase">
                  {job.duration ?? 5}s push-in
                </span>
              )}
            </div>

            <aside className="flex w-[320px] shrink-0 flex-col border-l border-border bg-card/40">
              <div className="flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="text-[10px] tracking-[0.18em] text-gold uppercase">
                    {job.modality} · {job.status}
                  </p>
                  <p className="mt-1 font-medium">{model?.name ?? job.modelId}</p>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={closeJob}
                  aria-label="Close"
                >
                  <X />
                </Button>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
                <div>
                  <p className="mb-1 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                    Prompt
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/90">{job.prompt}</p>
                </div>
                {job.negativePrompt && (
                  <div>
                    <p className="mb-1 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                      Negative
                    </p>
                    <p className="text-sm text-muted-foreground">{job.negativePrompt}</p>
                  </div>
                )}
                {job.firstFrameUrl && (
                  <div>
                    <p className="mb-1 text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
                      First frame
                    </p>
                    <img
                      src={job.firstFrameUrl}
                      alt=""
                      className="h-16 rounded-lg object-cover"
                    />
                  </div>
                )}
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Created</dt>
                    <dd>{formatTimestamp(job.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Aspect</dt>
                    <dd>{job.aspectRatio}</dd>
                  </div>
                  {job.duration != null && (
                    <div>
                      <dt className="text-muted-foreground">Duration</dt>
                      <dd>{job.duration}s</dd>
                    </div>
                  )}
                  {job.resolution && (
                    <div>
                      <dt className="text-muted-foreground">Resolution</dt>
                      <dd>{job.resolution}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-muted-foreground">Spend</dt>
                    <dd>{job.creditsSpent} cr</dd>
                  </div>
                </dl>
              </div>

              {job.modality === "image" && job.status === "done" && (
                <div className="border-t border-border p-4">
                  <Button
                    type="button"
                    className="h-10 w-full rounded-full bg-gold text-gold-foreground hover:bg-gold/90"
                    onClick={() => {
                      attachAsVideoInput(job);
                      router.push("/video");
                    }}
                  >
                    <Clapperboard className="size-4" />
                    Use as video input
                  </Button>
                </div>
              )}
            </aside>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
