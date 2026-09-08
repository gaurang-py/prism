"use client";

/* eslint-disable @next/next/no-img-element -- dock reference thumb */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Diamond,
  Minus,
  Plus,
  RectangleVertical,
  Sparkles,
  Star,
  UserRound,
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
import { CharacterLibraryDialog } from "@/components/studio/character-library-dialog";
import { useAuth } from "@/context/auth-context";
import { useStudio } from "@/context/studio-context";
import { clearGenerateDraft, readGenerateDraft } from "@/lib/generate-draft";
import { durationsFor, getModel, modelsFor, videoResolutionsFor } from "@/lib/models";
import { MAX_REFERENCE_IMAGES } from "@/lib/references";
import {
  ASPECT_RATIOS,
  IMAGE_RESOLUTIONS,
  MAX_VARIATIONS,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function GenerateDock({
  embedded = false,
}: {
  embedded?: boolean;
}) {
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
    referenceFrames,
    firstFrame,
    clearFirstFrame,
    removeReference,
    attachFiles,
    attachReferences,
    generate,
    batchCost,
    canAfford,
    submitting,
    characters,
    selectedCharacterId,
    selectedCharacter,
    selectCharacter,
  } = useStudio();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [prompt, setPrompt] = useState("");
  const [filledFor, setFilledFor] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const restored = useRef(false);
  const styleRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLInputElement>(null);
  const model = getModel(selectedModelId);
  const nsfwEnabled = Boolean(user?.nsfwEnabled);
  const models = modelsFor(modality, nsfwEnabled);
  const durations = durationsFor(selectedModelId);
  const resolutions =
    modality === "image" ? IMAGE_RESOLUTIONS : videoResolutionsFor(selectedModelId, duration);

  const extras = referenceFrames.filter((frame) => frame.kind !== "character" && frame.source !== "character");
  const atQuery = useMemo(() => {
    const match = prompt.match(/@([\w-]*)$/);
    return match ? match[1].toLowerCase() : null;
  }, [prompt]);
  const atSuggestions =
    atQuery == null
      ? []
      : characters.filter((item) => item.name.toLowerCase().includes(atQuery)).slice(0, 6);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const fromQuery = searchParams.get("prompt");
    const draft = readGenerateDraft();
    if (fromQuery?.trim()) {
      setPrompt(fromQuery);
    } else if (draft?.prompt) {
      setPrompt(draft.prompt);
    }
    if (draft) {
      if (!searchParams.get("model")) selectModel(draft.modelId);
      setAspectRatio(draft.aspectRatio);
      setResolution(draft.resolution);
      setDuration(draft.duration);
      setVariationCount(draft.variationCount);
      if (draft.characterId) selectCharacter(draft.characterId);
      if (draft.references?.length) attachReferences(draft.references);
      clearGenerateDraft();
    }
  }, [
    searchParams,
    selectModel,
    setAspectRatio,
    setDuration,
    setResolution,
    setVariationCount,
  ]);

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

  function insertMention(name: string, id: string) {
    setPrompt((current) => current.replace(/@([\w-]*)$/, `@${name} `));
    selectCharacter(id);
  }

  return (
    <div
      className={cn(
        "z-20 flex justify-center",
        embedded
          ? "relative w-full px-0"
          : "pointer-events-none absolute inset-x-0 bottom-5 px-4",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto w-full rounded-2xl border border-white/10 bg-[#161616] p-3 shadow-[0_20px_60px_-24px_black]",
          embedded ? "max-w-none" : "max-w-[980px]",
        )}
      >
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">References</p>
          <p className="text-[11px] tabular-nums text-white/45">
            {referenceFrames.length}/{MAX_REFERENCE_IMAGES}
          </p>
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <input
            ref={styleRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              attachFiles(Array.from(event.target.files ?? []), "style");
              event.target.value = "";
            }}
          />
          <input
            ref={addRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              attachFiles(Array.from(event.target.files ?? []), "ref");
              event.target.value = "";
            }}
          />
          <ChipButton
            icon={<Star className="size-3.5" />}
            label="Style"
            active={extras.some((frame) => frame.kind === "style")}
            onClick={() => styleRef.current?.click()}
          />
          <ChipButton
            icon={<UserRound className="size-3.5" />}
            label={selectedCharacter?.name ?? "Character"}
            active={Boolean(selectedCharacterId)}
            onClick={() => setLibraryOpen(true)}
          />
          <ChipButton
            icon={<Plus className="size-3.5" />}
            label="Add"
            onClick={() => addRef.current?.click()}
          />

          {referenceFrames.map((frame) => (
            <div key={frame.jobId} className="relative">
              <img src={frame.url} alt="" className="size-9 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => {
                  if (frame.source === "character" || frame.kind === "character") {
                    selectCharacter(null);
                    return;
                  }
                  removeReference(frame.jobId);
                }}
                className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-black/80"
                aria-label="Remove reference"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {referenceFrames.length > 0 && (
            <button
              type="button"
              onClick={clearFirstFrame}
              className="text-[11px] text-white/40 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {modality === "video" && (
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 text-[10px] text-white/70 hover:bg-white/8"
            >
              <span className="relative">
                <UserRound className="size-4" />
                <Plus className="absolute -right-1.5 -bottom-1.5 size-3 rounded-full bg-lime text-lime-foreground" />
              </span>
              Add element
            </button>
            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              className={cn(
                "flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border",
                selectedCharacter ? "border-white/30" : "border-dashed border-white/15",
              )}
            >
              {selectedCharacter?.images[0]?.url ? (
                <img src={selectedCharacter.images[0].url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] text-white/35">Slot</span>
              )}
            </button>
            <input
              ref={startRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) attachFiles([file], "ref");
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => startRef.current?.click()}
              className="relative flex h-16 w-12 flex-col items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 text-[9px] tracking-wide text-white/45 uppercase"
            >
              {extras[0]?.url ? (
                <img src={extras[0].url} alt="" className="h-full w-full object-cover" />
              ) : (
                <>
                  <Plus className="mb-1 size-3.5" />
                  Start
                </>
              )}
            </button>
          </div>
        )}

        <div className="relative flex items-end gap-2">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={
              embedded
                ? "Describe the scene you imagine — try @ to add a character"
                : "Describe your image—try @ to add references"
            }
            className="min-h-11 max-h-28 flex-1 resize-none rounded-xl border-0 bg-transparent px-2 py-2.5 text-[15px] leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                onGenerate();
              }
            }}
          />
          {atSuggestions.length > 0 && (
            <div className="absolute bottom-full left-2 z-30 mb-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#1b1b1b] py-1 shadow-xl">
              {atSuggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/8"
                  onClick={() => insertMention(item.name, item.id)}
                >
                  {item.images[0]?.url ? (
                    <img src={item.images[0].url} alt="" className="size-7 rounded-md object-cover" />
                  ) : (
                    <UserRound className="size-4 text-white/50" />
                  )}
                  @{item.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <DockMenu label={model?.name ?? "Model"} icon={<Sparkles className="size-3.5" />}>
            {models.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => selectModel(item.id)}
                className="flex items-start justify-between gap-3"
              >
                <span>
                  <span className="block">
                    {item.name}
                    {item.nsfw ? " · Adult" : ""}
                  </span>
                  <span className="block text-xs text-muted-foreground">{item.tagline}</span>
                </span>
                <span className="tabular-nums text-lime">{item.mockCredits}</span>
              </DropdownMenuItem>
            ))}
          </DockMenu>

          <DockMenu label={aspectRatio} icon={<RectangleVertical className="size-3.5" />}>
            {ASPECT_RATIOS.map((ratio) => (
              <DropdownMenuItem key={ratio} onClick={() => setAspectRatio(ratio)}>
                {ratio}
              </DropdownMenuItem>
            ))}
          </DockMenu>

          <DockMenu label={resolution} icon={<Diamond className="size-3.5" />}>
            {resolutions.map((value) => (
              <DropdownMenuItem key={value} onClick={() => setResolution(value)}>
                {value}
              </DropdownMenuItem>
            ))}
          </DockMenu>

          {modality === "video" && (
            <DockMenu label={`${duration}s`}>
              {durations.map((value) => (
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
            {!canAfford && user && (
              <p className="hidden text-xs text-destructive sm:block">Need {batchCost} credits</p>
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
      <CharacterLibraryDialog open={libraryOpen} onOpenChange={setLibraryOpen} />
    </div>
  );
}

function ChipButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm",
        active
          ? "border-white/25 bg-white/10 text-white"
          : "border-white/10 bg-white/5 text-white/80 hover:bg-white/8",
      )}
    >
      {icon}
      {label}
    </button>
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
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/6 px-3 text-sm text-white hover:bg-white/10"
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
