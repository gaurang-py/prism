"use client";

/* eslint-disable @next/next/no-img-element -- element thumbs */

import { useRef, useState } from "react";
import { Plus, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useStudio } from "@/context/studio-context";
import type { Character } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CharacterLibraryDialog({
  open,
  onOpenChange,
  onUse,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUse?: (character: Character) => void;
}) {
  const { characters, refreshCharacters, selectCharacter } = useStudio();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function saveElement() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name this element");
      return;
    }
    if (!files.length) {
      toast.error("Add at least one still");
      return;
    }
    setSaving(true);
    try {
      const body = new FormData();
      body.set("name", trimmed);
      for (const file of files) body.append("files", file);
      const response = await fetch("/api/characters", { method: "POST", body });
      const payload = (await response.json()) as { character?: Character; error?: string };
      if (!response.ok || !payload.character) {
        throw new Error(payload.error || "Could not save element");
      }
      setName("");
      setFiles([]);
      setPreviews([]);
      setCreating(false);
      setPickedId(payload.character.id);
      toast.success("Element saved");
      await refreshCharacters();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save element");
    } finally {
      setSaving(false);
    }
  }

  const picked = characters.find((item) => item.id === pickedId) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[88vh] w-[min(920px,calc(100%-2rem))] max-w-none overflow-y-auto rounded-2xl border border-white/10 bg-[#111] p-6 sm:max-w-none"
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] tracking-wide text-white/70 uppercase">
              <Star className="size-3" />
              Reference Elements
            </p>
            <DialogTitle className="mt-4 text-[28px] leading-none font-semibold tracking-tight">
              CREATE YOUR REFERENCE ELEMENTS
            </DialogTitle>
            <DialogDescription className="mt-3 text-[15px] text-white/55">
              A set of images of one character or object that keeps its look consistent across the
              whole video.
            </DialogDescription>

            {creating ? (
              <div className="mt-5 space-y-3">
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Element name"
                  className="h-11 rounded-xl"
                />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    const next = Array.from(event.target.files ?? []);
                    setFiles((current) => [...current, ...next]);
                    setPreviews((current) => [
                      ...current,
                      ...next.map((file) => URL.createObjectURL(file)),
                    ]);
                    event.target.value = "";
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {previews.map((src, index) => (
                    <div key={src} className="relative">
                      <img src={src} alt="" className="size-[88px] rounded-xl object-cover" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/75"
                        onClick={() => {
                          setFiles((current) => current.filter((_, i) => i !== index));
                          setPreviews((current) => current.filter((_, i) => i !== index));
                        }}
                        aria-label="Remove still"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex size-[88px] items-center justify-center rounded-xl border border-dashed border-white/20 text-white/50 hover:text-white"
                  >
                    <Plus className="size-5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={() => void saveElement()}
                    className="bg-lime font-semibold text-lime-foreground hover:bg-lime/90"
                  >
                    Save element
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="mt-6 flex size-[120px] flex-col items-center justify-center gap-2 rounded-2xl bg-white/6 text-sm text-white/80 hover:bg-white/10"
              >
                <Plus className="size-6" />
                Create new element
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {characters.map((character) => (
              <button
                key={character.id}
                type="button"
                onClick={() => setPickedId(character.id)}
                className={cn(
                  "relative overflow-hidden rounded-2xl border",
                  pickedId === character.id ? "border-white" : "border-white/10",
                )}
              >
                {character.images[0]?.url ? (
                  <img src={character.images[0].url} alt="" className="size-[140px] object-cover" />
                ) : (
                  <span className="flex size-[140px] items-center justify-center bg-white/5 text-sm">
                    {character.name}
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-2 py-1 text-[11px]">
                  {character.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <p className="text-sm text-lime">You can use a named element to keep identity consistent.</p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!picked}
              className="bg-white text-black hover:bg-white/90 disabled:bg-white/15 disabled:text-white/35"
              onClick={() => {
                if (!picked) return;
                selectCharacter(picked.id);
                onUse?.(picked);
                onOpenChange(false);
              }}
            >
              Use element
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
