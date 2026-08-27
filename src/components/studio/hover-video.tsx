"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function HoverVideo({
  src,
  poster,
  className,
  autoPlay = false,
  active = false,
}: {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  active?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || autoPlay) return;
    if (active) {
      void node.play().catch(() => undefined);
    } else {
      node.pause();
      node.currentTime = 0;
    }
  }, [active, autoPlay]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload={autoPlay ? "auto" : "metadata"}
      autoPlay={autoPlay}
      className={cn("pointer-events-none absolute inset-0 size-full object-cover", className)}
    />
  );
}
