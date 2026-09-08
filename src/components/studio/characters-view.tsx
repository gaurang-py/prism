"use client";

/* eslint-disable @next/next/no-img-element -- character thumbs */

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Plus, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudio } from "@/context/studio-context";
import type { Character } from "@/lib/types";

export function CharactersView() {
  const router = useRouter();
  const { characters, refreshCharacters, selectCharacter } = useStudio();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
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
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not save element");
      setName("");
      setFiles([]);
      setPreviews([]);
      setCreating(false);
      toast.success("Element saved");
      await refreshCharacters();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save element");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-canvas">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        <header className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] tracking-wide text-white/70 uppercase">
            <Star className="size-3" />
            Reference Elements
          </p>
          <h1 className="mt-4 text-[32px] leading-none font-semibold tracking-tight">
            CREATE YOUR REFERENCE ELEMENTS
          </h1>
          <p className="mt-3 text-[15px] text-white/55">
            A set of images of one character or object that keeps its look consistent across the
            whole video.
          </p>
        </header>

        <div className="flex flex-wrap gap-4">
          {creating ? (
            <section className="w-full max-w-md rounded-2xl border border-white/10 bg-card/70 p-4">
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
              <div className="mt-3 flex flex-wrap gap-2">
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
              <div className="mt-4 flex gap-2">
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
            </section>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex size-[140px] flex-col items-center justify-center gap-2 rounded-2xl bg-white/6 text-sm text-white/80 hover:bg-white/10"
            >
              <Plus className="size-6" />
              Create new element
            </button>
          )}

          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onUse={() => {
                selectCharacter(character.id);
                router.push("/generate?mode=video");
              }}
              onChange={() => void refreshCharacters()}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CharacterCard({
  character,
  onUse,
  onChange,
}: {
  character: Character;
  onUse: () => void;
  onChange: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      const response = await fetch(`/api/characters/${character.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not delete");
      toast.success("Element deleted");
      onChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  async function addFiles(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    try {
      const body = new FormData();
      for (const file of files) body.append("files", file);
      const response = await fetch(`/api/characters/${character.id}/images`, {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not attach");
      toast.success("Stills added");
      onChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not attach");
    } finally {
      setBusy(false);
    }
  }

  async function removeImage(imageId: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/characters/${character.id}/images/${imageId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not remove");
      onChange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="w-[220px] rounded-2xl border border-white/10 bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{character.name}</h3>
          <p className="text-xs text-muted-foreground">
            {character.images.length} still{character.images.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void remove()}
          className="text-muted-foreground hover:text-destructive"
          aria-label="Delete element"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {character.images.map((image) => (
          <div key={image.id} className="relative">
            <img src={image.url} alt="" className="size-14 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => void removeImage(image.id)}
              className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-black/80"
              aria-label="Remove still"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            void addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex size-14 items-center justify-center rounded-lg border border-dashed border-white/15 text-muted-foreground hover:text-white"
          aria-label="Add stills"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <Button type="button" variant="secondary" className="mt-4 h-9 w-full rounded-xl" onClick={onUse}>
        Use element
      </Button>
    </article>
  );
}
