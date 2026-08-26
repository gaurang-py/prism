"use client";

/* eslint-disable @next/next/no-img-element -- local placeholders in a compact composer chip */

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { useStudio } from "@/context/studio-context";
import { ASPECT_RATIOS, VIDEO_DURATIONS, VIDEO_RESOLUTIONS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ModelPicker } from "./model-picker";

export function Composer() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    modality,
    setModality,
    aspectRatio,
    setAspectRatio,
    duration,
    setDuration,
    resolution,
    setResolution,
    firstFrame,
    clearFirstFrame,
    generate,
    activeCost,
    canAfford,
    creditError,
  } = useStudio();

  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [negativeOpen, setNegativeOpen] = useState(false);
  const attachedFrameId = useRef<string | null>(null);

  useEffect(() => {
    if (!firstFrame) {
      attachedFrameId.current = null;
      return;
    }
    if (attachedFrameId.current === firstFrame.jobId) return;
    attachedFrameId.current = firstFrame.jobId;
    setPrompt((current) => (current.trim() ? current : firstFrame.prompt));
  }, [firstFrame]);

  function switchMode(next: "image" | "video") {
    setModality(next);
    if (pathname === "/image" || pathname === "/video") {
      router.replace(next === "image" ? "/image" : "/video");
    }
  }

  function onGenerate() {
    generate({ prompt, negativePrompt });
  }

  return (
    <section className="flex h-full min-h-0 w-[400px] shrink-0 flex-col border-r border-border/80 bg-card/30">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            Composer
          </p>
          <h1 className="font-display text-xl italic">Generate</h1>
        </div>
        <div className="flex rounded-full border border-border bg-background/60 p-0.5">
          {(["image", "video"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => switchMode(mode)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium tracking-wide capitalize transition-colors",
                modality === mode
                  ? "bg-gold text-gold-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {modality === "video" && firstFrame && (
          <div className="flex items-center gap-3 rounded-xl border border-gold/30 bg-gold/8 p-2">
            <img
              src={firstFrame.url}
              alt="First frame reference"
              className="size-14 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] tracking-[0.16em] text-gold uppercase">
                First frame
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Still attached as video input
              </p>
            </div>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={clearFirstFrame}
              aria-label="Remove first frame"
            >
              <X />
            </Button>
          </div>
        )}

        <label className="block">
          <span className="mb-1.5 block text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Prompt
          </span>
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={
              modality === "video"
                ? "A slow push-in through candlelight, 35mm, no dialogue…"
                : "Rain on a black sedan, sodium street lamps, anamorphic still…"
            }
            className="min-h-[132px] resize-none border-border/80 bg-background/50 px-3 py-3 text-[15px] leading-relaxed dark:bg-background/50"
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                onGenerate();
              }
            }}
          />
        </label>

        <Collapsible open={negativeOpen} onOpenChange={setNegativeOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between text-[11px] tracking-[0.16em] text-muted-foreground uppercase hover:text-foreground">
            Negative prompt
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform",
                negativeOpen && "rotate-180",
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <Textarea
              value={negativePrompt}
              onChange={(event) => setNegativePrompt(event.target.value)}
              placeholder="watermark, extra fingers, plastic skin…"
              className="min-h-[72px] resize-none border-border/80 bg-background/50 dark:bg-background/50"
            />
          </CollapsibleContent>
        </Collapsible>

        <div>
          <p className="mb-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Model
          </p>
          <ModelPicker />
        </div>

        <div>
          <p className="mb-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Frame
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => setAspectRatio(ratio)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] tabular-nums transition-colors",
                  aspectRatio === ratio
                    ? "border-gold/50 bg-gold/15 text-gold"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {modality === "video" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Duration
              </p>
              <div className="flex gap-1.5">
                {VIDEO_DURATIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDuration(value)}
                    className={cn(
                      "flex-1 rounded-full border py-1 text-[11px] transition-colors",
                      duration === value
                        ? "border-gold/50 bg-gold/15 text-gold"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {value}s
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Resolution
              </p>
              <div className="flex gap-1.5">
                {VIDEO_RESOLUTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setResolution(value)}
                    className={cn(
                      "flex-1 rounded-full border py-1 text-[11px] transition-colors",
                      resolution === value
                        ? "border-gold/50 bg-gold/15 text-gold"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border/70 p-4">
        {!canAfford && (
          <p className="mb-2 text-center text-xs text-destructive">
            Need {activeCost} credits for this model.
          </p>
        )}
        {creditError && canAfford && (
          <p className="mb-2 text-center text-xs text-destructive">
            Generation blocked — credits would go negative.
          </p>
        )}
        <Button
          type="button"
          onClick={onGenerate}
          disabled={!prompt.trim()}
          className="h-11 w-full gap-2 rounded-full bg-gold text-[13px] font-medium tracking-wide text-gold-foreground hover:bg-gold/90"
        >
          <Sparkles className="size-4" />
          Generate
          <span className="opacity-70">·</span>
          <span className="tabular-nums">{activeCost} cr</span>
        </Button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          ⌘ Enter · mocked run, no API
        </p>
      </div>
    </section>
  );
}
