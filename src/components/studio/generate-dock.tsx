"use client";

/* eslint-disable @next/next/no-img-element -- dock reference thumb */

import { useRef, useState, type ReactNode } from "react";
import {
  ChevronDown,
  Diamond,
  Minus,
  Plus,
  RectangleVertical,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useStudio } from "@/context/studio-context";
import { getModel, modelsFor } from "@/lib/models";
import {
  ASPECT_RATIOS,
  IMAGE_RESOLUTIONS,
  MAX_VARIATIONS,
  VIDEO_DURATIONS,
  VIDEO_RESOLUTIONS,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function GenerateDock() {
  const {
    modality,
    selectedModelId,
    selectModel,
    aspectRatio,
    setAspectRatio,
    duration,
    setDuration,
    resolution,
    setResolution,
    variationCount,
    setVariationCount,
    firstFrame,
    clearFirstFrame,
    attachFile,
    generate,
    batchCost,
    canAfford,
    submitting,
  } = useStudio();

  const [prompt, setPrompt] = useState("");
  const [filledFor, setFilledFor] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const model = getModel(selectedModelId);
  const models = modelsFor(modality);
  const resolutions = modality === "image" ? IMAGE_RESOLUTIONS : VIDEO_RESOLUTIONS;

  if (firstFrame && filledFor !== firstFrame.jobId && !prompt.trim() && firstFrame.prompt) {
    setFilledFor(firstFrame.jobId);
    setPrompt(firstFrame.prompt);
  }
  if (!firstFrame && filledFor !== null) {
    setFilledFor(null);
  }

  function onGenerate() {
    void generate({ prompt });
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-[920px] rounded-2xl border border-white/10 bg-[#161616] p-3 shadow-[0_20px_60px_-24px_black]">
        {firstFrame && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-white/5 px-2 py-1.5">
            <img
              src={firstFrame.url}
              alt=""
              className="size-9 rounded-md object-cover"
            />
            <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {modality === "video" ? "First frame attached" : "Reference attached"}
            </p>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={clearFirstFrame}
              aria-label="Remove attachment"
            >
              <X />
            </Button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) attachFile(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/6 text-xl text-white hover:bg-white/10"
            aria-label="Attach reference"
          >
            +
          </button>
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe the scene you imagine."
            className="min-h-11 max-h-28 flex-1 resize-none rounded-xl border-0 bg-transparent px-2 py-2.5 text-[15px] leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                onGenerate();
              }
            }}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <DockMenu
            label={model?.name ?? "Model"}
            icon={<Sparkles className="size-3.5" />}
          >
            {models.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => selectModel(item.id)}
                className="flex items-start justify-between gap-3"
              >
                <span>
                  <span className="block">{item.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {item.tagline}
                  </span>
                </span>
                <span className="tabular-nums text-lime">{item.mockCredits}</span>
              </DropdownMenuItem>
            ))}
          </DockMenu>

          <DockMenu
            label={aspectRatio}
            icon={<RectangleVertical className="size-3.5" />}
          >
            {ASPECT_RATIOS.map((ratio) => (
              <DropdownMenuItem key={ratio} onClick={() => setAspectRatio(ratio)}>
                {ratio}
              </DropdownMenuItem>
            ))}
          </DockMenu>

          <DockMenu
            label={resolution}
            icon={<Diamond className="size-3.5" />}
          >
            {resolutions.map((value) => (
              <DropdownMenuItem key={value} onClick={() => setResolution(value)}>
                {value}
              </DropdownMenuItem>
            ))}
          </DockMenu>

          {modality === "video" && (
            <DockMenu label={`${duration}s`}>
              {VIDEO_DURATIONS.map((value) => (
                <DropdownMenuItem key={value} onClick={() => setDuration(value)}>
                  {value}s
                </DropdownMenuItem>
              ))}
            </DockMenu>
          )}

          <div className="flex h-9 items-center rounded-lg bg-white/6">
            <button
              type="button"
              className="flex size-9 items-center justify-center text-muted-foreground hover:text-white"
              onClick={() => setVariationCount(variationCount - 1)}
              aria-label="Fewer variations"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="min-w-10 text-center text-sm tabular-nums">
              {variationCount}/{MAX_VARIATIONS}
            </span>
            <button
              type="button"
              className="flex size-9 items-center justify-center text-muted-foreground hover:text-white"
              onClick={() => setVariationCount(variationCount + 1)}
              aria-label="More variations"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {!canAfford && (
              <p className="hidden text-xs text-destructive sm:block">
                Need {batchCost} credits
              </p>
            )}
            <Button
              type="button"
              onClick={onGenerate}
              disabled={!prompt.trim() || submitting}
              className="h-10 gap-2 rounded-lg bg-lime px-5 text-sm font-semibold text-lime-foreground hover:bg-lime/90"
            >
              Generate
              <Sparkles className="size-3.5" />
              <span className="tabular-nums">{batchCost}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DockMenu({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/6 px-3 text-sm text-white hover:bg-white/10",
          )}
        >
          {icon}
          <span>{label}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
