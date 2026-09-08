"use client";

/* eslint-disable @next/next/no-img-element -- canvas cards */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FolderOpen,
  MousePointer2,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { GenerateDock } from "@/components/studio/generate-dock";
import { ResultLightbox } from "@/components/studio/lightbox";
import { useStudio } from "@/context/studio-context";
import { EMPTY_BOARD, parseBoardState, type BoardNode, type BoardState } from "@/lib/board";
import type { FirstFrameRef, Job } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tool = "select" | "upload" | "asset" | "erase";

export function CanvasBoard() {
  const {
    jobs,
    characters,
    selectCharacter,
    setExtraReferences,
    setModality,
  } = useStudio();
  const [board, setBoard] = useState<BoardState>(EMPTY_BOARD);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tool, setTool] = useState<Tool>("select");
  const [assetOpen, setAssetOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const dragRef = useRef<{
    kind: "node" | "pan";
    id?: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<number | null>(null);
  const dockFocus = useRef<HTMLDivElement>(null);

  const persist = useCallback((mutator: (current: BoardState) => BoardState) => {
    setBoard((current) => {
      const next = mutator(current);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        void fetch("/api/board", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: next }),
        });
      }, 400);
      return next;
    });
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/board", { cache: "no-store" });
        const payload = (await response.json()) as { board?: { state?: unknown }; error?: string };
        if (!response.ok) throw new Error(payload.error || "Could not load board");
        setBoard(parseBoardState(payload.board?.state));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not load board");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  function addNode(partial: Omit<BoardNode, "id" | "x" | "y" | "width" | "height"> & Partial<BoardNode>) {
    const id = crypto.randomUUID();
    persist((current) => ({
      ...current,
      nodes: [
        ...current.nodes,
        {
          id,
          x: 120 + current.nodes.length * 28 - current.panX,
          y: 100 + current.nodes.length * 20 - current.panY,
          width: 200,
          height: 220,
          ...partial,
          type: partial.type,
        },
      ],
    }));
    setSelectedIds([id]);
    return id;
  }

  async function uploadToBoard(files: File[]) {
    for (const file of files) {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body });
      const payload = (await response.json()) as { key?: string; url?: string; error?: string };
      if (!response.ok || !payload.key) {
        toast.error(payload.error || "Upload failed");
        continue;
      }
      addNode({
        type: "ref",
        imageKey: payload.key,
        imageUrl: payload.url,
        label: file.name,
      });
    }
  }

  function onPointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (drag.kind === "pan") {
      persist((current) => ({ ...current, panX: drag.origX + dx, panY: drag.origY + dy }));
      return;
    }
    persist((current) => ({
      ...current,
      nodes: current.nodes.map((node) =>
        node.id === drag.id ? { ...node, x: drag.origX + dx, y: drag.origY + dy } : node,
      ),
    }));
  }

  useEffect(() => {
    if (!selectedIds.length) return;
    const nodes = board.nodes.filter((node) => selectedIds.includes(node.id));
    const characterNode = nodes.find((node) => node.type === "character" && node.characterId);
    if (characterNode?.characterId) selectCharacter(characterNode.characterId);
    const refs: FirstFrameRef[] = nodes
      .filter((node) => node.type !== "character")
      .filter((node) => node.imageKey || node.imageUrl)
      .map((node) => ({
        jobId: node.jobId || node.id,
        url: node.imageUrl || "",
        prompt: node.prompt || node.label || "",
        key: node.imageKey,
        source: "canvas",
        kind: "ref",
        characterId: node.characterId,
      }));
    setExtraReferences(refs);
    if (nodes.some((node) => node.type === "character")) setModality("video");
  }, [board.nodes, selectedIds, selectCharacter, setExtraReferences, setModality]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (event.key === "v") setTool("select");
      if (event.key === "i") {
        setTool("upload");
        fileRef.current?.click();
      }
      if (event.key === "g") {
        dockFocus.current?.querySelector("textarea")?.focus();
      }
      if ((event.key === "x" || event.key === "Backspace" || event.key === "Delete") && selectedIds.length) {
        persist((current) => ({
          ...current,
          nodes: current.nodes.filter((node) => !selectedIds.includes(node.id)),
        }));
        setSelectedIds([]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [persist, selectedIds]);

  const doneJobs = jobs.filter(
    (job) => job.status === "done" && (job.imageUrl || job.posterUrl || job.assetKey),
  );

  return (
    <div className="relative h-full min-h-0 bg-[#0b0b0b]">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void uploadToBoard(Array.from(event.target.files ?? []));
          event.target.value = "";
          setTool("select");
        }}
      />

      <div
        className="absolute inset-0 cursor-grab overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(255 255 255 / 8%) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
        onPointerDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (tool === "erase") {
            setSelectedIds([]);
            return;
          }
          dragRef.current = {
            kind: "pan",
            startX: event.clientX,
            startY: event.clientY,
            origX: board.panX,
            origY: board.panY,
          };
          setSelectedIds([]);
          (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={() => {
          dragRef.current = null;
        }}
      >
        <div
          className="absolute inset-0"
          style={{ transform: `translate(${board.panX}px, ${board.panY}px)` }}
        >
          {board.nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              className={cn(
                "absolute overflow-hidden rounded-2xl border bg-[#161616] text-left shadow-[0_18px_40px_-24px_black]",
                selectedIds.includes(node.id) ? "border-lime" : "border-white/10",
              )}
              style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
              onPointerDown={(event) => {
                event.stopPropagation();
                if (tool === "erase") {
                  persist((current) => ({
                    ...current,
                    nodes: current.nodes.filter((item) => item.id !== node.id),
                  }));
                  return;
                }
                dragRef.current = {
                  kind: "node",
                  id: node.id,
                  startX: event.clientX,
                  startY: event.clientY,
                  origX: node.x,
                  origY: node.y,
                };
                setSelectedIds((current) =>
                  event.shiftKey
                    ? current.includes(node.id)
                      ? current
                      : [...current, node.id]
                    : [node.id],
                );
                (event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId);
              }}
            >
              {node.imageUrl ? (
                <img src={node.imageUrl} alt="" className="h-[calc(100%-28px)] w-full object-cover" />
              ) : (
                <div className="flex h-[calc(100%-28px)] items-center justify-center text-xs text-muted-foreground">
                  {node.label || node.type}
                </div>
              )}
              <span className="block truncate px-2 py-1.5 text-[11px] text-white/70">
                {node.label || node.type}
              </span>
            </button>
          ))}
        </div>
        {!loaded ? (
          <p className="absolute top-20 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
            Loading board…
          </p>
        ) : board.nodes.length === 0 ? (
          <p className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-white/40">
            Upload or drop assets onto the board, then generate from the dock.
          </p>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-[#161616]/95 p-1.5 shadow-[0_18px_50px_-24px_black]">
          <StripButton
            label="Select"
            shortcut="V"
            active={tool === "select"}
            onClick={() => setTool("select")}
          >
            <MousePointer2 className="size-4" />
          </StripButton>
          <StripButton
            label="Upload"
            shortcut="I"
            active={tool === "upload"}
            onClick={() => {
              setTool("upload");
              fileRef.current?.click();
            }}
          >
            <Upload className="size-4" />
          </StripButton>
          <StripButton
            label="Assets"
            active={tool === "asset"}
            onClick={() => {
              setTool("asset");
              setAssetOpen((open) => !open);
            }}
          >
            <FolderOpen className="size-4" />
          </StripButton>
          <StripButton
            label="Erase"
            shortcut="X"
            active={tool === "erase"}
            onClick={() => setTool("erase")}
          >
            <Trash2 className="size-4" />
          </StripButton>
          <StripButton
            label="Generate"
            shortcut="G"
            onClick={() => dockFocus.current?.querySelector("textarea")?.focus()}
          >
            <Sparkles className="size-4" />
          </StripButton>
        </div>
      </div>

      {assetOpen && (
        <div className="absolute top-20 left-1/2 z-20 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#161616] p-3 shadow-2xl">
          <p className="px-1 text-[11px] tracking-wide text-muted-foreground uppercase">Place on board</p>
          <div className="mt-2 grid max-h-64 grid-cols-4 gap-2 overflow-y-auto">
            {characters.map((character) => (
              <button
                key={character.id}
                type="button"
                className="overflow-hidden rounded-xl border border-white/8"
                onClick={() => {
                  addNode({
                    type: "character",
                    characterId: character.id,
                    imageKey: character.images[0]?.key,
                    imageUrl: character.images[0]?.url,
                    label: character.name,
                  });
                  setAssetOpen(false);
                  setTool("select");
                }}
              >
                {character.images[0]?.url ? (
                  <img src={character.images[0].url} alt="" className="h-16 w-full object-cover" />
                ) : (
                  <span className="flex h-16 items-center justify-center">
                    <UserRound className="size-4" />
                  </span>
                )}
              </button>
            ))}
            {doneJobs.slice(0, 16).map((job) => (
              <button
                key={job.id}
                type="button"
                className="overflow-hidden rounded-xl border border-white/8"
                onClick={() => {
                  addJobNode(addNode, job);
                  setAssetOpen(false);
                  setTool("select");
                }}
              >
                <img
                  src={job.posterUrl || job.imageUrl}
                  alt=""
                  className="h-16 w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={dockFocus}>
        <GenerateDock />
      </div>
      <ResultLightbox />
    </div>
  );
}

function addJobNode(
  addNode: (partial: Omit<BoardNode, "id" | "x" | "y" | "width" | "height"> & Partial<BoardNode>) => void,
  job: Job,
) {
  addNode({
    type: "generation",
    jobId: job.id,
    imageKey: job.assetKey || job.firstFrameKey || job.referenceKeys?.[0],
    imageUrl: job.posterUrl || job.imageUrl,
    label: job.prompt,
    prompt: job.prompt,
  });
}

function StripButton({
  children,
  label,
  shortcut,
  active,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={shortcut ? `${label} (${shortcut})` : label}
      onClick={onClick}
      className={cn(
        "flex size-10 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white",
        active && "bg-white/12 text-white",
      )}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}
