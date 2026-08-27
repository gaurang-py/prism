"use client";

/* eslint-disable @next/next/no-img-element -- masonry cards use intrinsic aspect boxes */

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getModel } from "@/lib/models";
import { formatRelative } from "@/lib/format";
import { aspectCss, type Job } from "@/lib/types";
import { cn } from "@/lib/utils";

export function JobCard({
  job,
  onOpen,
}: {
  job: Job;
  onOpen: (id: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);
  const model = getModel(job.modelId);
  const pending = job.status === "queued" || job.status === "generating";
  const failed = job.status === "error";
  const isVideo = job.modality === "video";
  const preview = job.posterUrl || job.imageUrl || job.firstFrameUrl;
  const canPlayVideo = Boolean(isVideo && job.videoUrl && job.status === "done");

  return (
    <button
      type="button"
      onClick={() => onOpen(job.id)}
      onMouseEnter={() => {
        setHovering(true);
        videoRef.current?.play().catch(() => undefined);
      }}
      onMouseLeave={() => {
        setHovering(false);
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
      className="group mb-3 w-full break-inside-avoid text-left"
    >
      <article
        className="overflow-hidden rounded-xl border border-white/8 bg-card transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:border-white/16"
        style={{ aspectRatio: aspectCss(job.aspectRatio) }}
      >
        <div className="relative h-full w-full overflow-hidden bg-[#111]">
          {canPlayVideo ? (
            <video
              ref={videoRef}
              src={job.videoUrl}
              poster={preview || undefined}
              muted
              loop
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          ) : preview && !failed ? (
            <img
              src={preview}
              alt=""
              className={cn(
                "h-full w-full object-cover",
                isVideo && job.status === "done" && "kenburns",
              )}
            />
          ) : null}

          {pending && (
            <div className="absolute inset-0 flex flex-col justify-end bg-black/45 film-shimmer">
              <div className="space-y-2 p-3">
                <div className="flex items-center justify-between text-[11px] tracking-wide text-lime uppercase">
                  <span>{job.status === "queued" ? "In queue" : "Generating"}</span>
                  <span className="tabular-nums">{Math.round(job.progress)}%</span>
                </div>
                <Progress value={job.progress} className="h-0.5 bg-white/10" />
              </div>
            </div>
          )}

          {failed && (
            <div className="absolute inset-0 flex flex-col justify-end bg-black/70">
              <div className="space-y-1 p-3">
                <p className="text-[11px] tracking-wide text-destructive uppercase">Failed</p>
                <p className="line-clamp-3 text-[12px] leading-snug text-white/85">
                  {job.errorMessage || "Generation failed."}
                </p>
              </div>
            </div>
          )}

          {job.status === "done" && isVideo && (
            <span
              className={cn(
                "absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] tracking-wide text-foreground backdrop-blur-sm",
                hovering && job.videoUrl && "opacity-0",
              )}
            >
              <Play className="size-2.5 fill-current" />
              {job.duration ?? 5}s
            </span>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 pt-10 opacity-0 transition-opacity group-hover:opacity-100">
            <p className="line-clamp-2 text-[12px] leading-snug text-foreground/95">
              {job.prompt}
            </p>
            <p className="mt-1 text-[10px] tracking-wide text-lime/90 uppercase">
              {model?.name ?? job.modelId} · {formatRelative(job.createdAt)}
            </p>
          </div>
        </div>
      </article>
    </button>
  );
}
