"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { defaultModelId, getModel, modelsFor, type Modality } from "@/lib/models";
import { mockDelayMs, pickReel, pickStill } from "@/lib/placeholders";
import {
  getServerStudioSnapshot,
  getStudioSnapshot,
  patchStudio,
  subscribeStudio,
} from "@/lib/studio-persist";
import {
  IMAGE_RESOLUTIONS,
  MAX_VARIATIONS,
  STARTING_CREDITS,
  VIDEO_RESOLUTIONS,
  type AspectRatio,
  type FirstFrameRef,
  type Job,
  type OutputResolution,
  type VideoDuration,
} from "@/lib/types";

interface GenerateInput {
  prompt: string;
}

interface StudioContextValue {
  credits: number;
  jobs: Job[];
  creditError: boolean;
  modality: Modality;
  setModality: (modality: Modality) => void;
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  selectModel: (id: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  duration: VideoDuration;
  setDuration: (duration: VideoDuration) => void;
  resolution: OutputResolution;
  setResolution: (resolution: OutputResolution) => void;
  variationCount: number;
  setVariationCount: (count: number) => void;
  firstFrame: FirstFrameRef | null;
  clearFirstFrame: () => void;
  attachAsVideoInput: (job: Job) => void;
  attachFile: (file: File) => void;
  generate: (input: GenerateInput) => boolean;
  selectedJobId: string | null;
  selectedJob: Job | null;
  openJob: (id: string) => void;
  closeJob: () => void;
  resetDemo: () => void;
  activeCost: number;
  batchCost: number;
  canAfford: boolean;
}

const StudioContext = createContext<StudioContextValue | null>(null);

function setCredits(updater: number | ((value: number) => number)) {
  patchStudio((current) => ({
    ...current,
    credits: typeof updater === "function" ? updater(current.credits) : updater,
  }));
}

function setJobs(updater: Job[] | ((value: Job[]) => Job[])) {
  patchStudio((current) => ({
    ...current,
    jobs: typeof updater === "function" ? updater(current.jobs) : updater,
  }));
}

function defaultResolution(modality: Modality): OutputResolution {
  return modality === "image" ? "1K" : "1080p";
}

function modeFromRoute(pathname: string, searchMode: string | null): Modality | null {
  if (pathname === "/video") return "video";
  if (pathname === "/image") return "image";
  if (pathname === "/generate") return searchMode === "video" ? "video" : "image";
  return null;
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const persisted = useSyncExternalStore(
    subscribeStudio,
    getStudioSnapshot,
    getServerStudioSnapshot,
  );
  const credits = persisted.credits;
  const jobs = persisted.jobs;

  const [creditError, setCreditError] = useState(false);
  const [modality, setModalityState] = useState<Modality>("image");
  const [selectedModelId, setSelectedModelId] = useState(defaultModelId("image"));
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("3:4");
  const [duration, setDuration] = useState<VideoDuration>(5);
  const [resolution, setResolution] = useState<OutputResolution>("1K");
  const [variationCount, setVariationCountState] = useState(1);
  const [firstFrame, setFirstFrame] = useState<FirstFrameRef | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [appliedRoute, setAppliedRoute] = useState("");
  const timeouts = useRef<number[]>([]);
  const intervals = useRef<number[]>([]);

  const routeKey = `${pathname}?${searchParams.toString()}`;
  if (appliedRoute !== routeKey) {
    setAppliedRoute(routeKey);
    const routeMode = modeFromRoute(pathname, searchParams.get("mode"));
    const routeModel = getModel(searchParams.get("model") ?? "");
    if (routeModel) {
      setModalityState(routeModel.modality);
      setSelectedModelId(routeModel.id);
      setResolution((current) => {
        const allowed = routeModel.modality === "image" ? IMAGE_RESOLUTIONS : VIDEO_RESOLUTIONS;
        return (allowed as readonly string[]).includes(current)
          ? current
          : defaultResolution(routeModel.modality);
      });
      if (routeModel.modality === "image") setFirstFrame(null);
    } else if (routeMode) {
      setModalityState(routeMode);
      setSelectedModelId((current) => {
        const model = getModel(current);
        if (model?.modality === routeMode) return current;
        return defaultModelId(routeMode);
      });
      setResolution((current) => {
        const allowed = routeMode === "image" ? IMAGE_RESOLUTIONS : VIDEO_RESOLUTIONS;
        return (allowed as readonly string[]).includes(current)
          ? current
          : defaultResolution(routeMode);
      });
      if (routeMode === "image") setFirstFrame(null);
    }
  }

  useEffect(() => {
    const timeoutIds = timeouts.current;
    const intervalIds = intervals.current;
    return () => {
      timeoutIds.forEach((id) => window.clearTimeout(id));
      intervalIds.forEach((id) => window.clearInterval(id));
    };
  }, []);

  const setModality = useCallback((next: Modality) => {
    setModalityState(next);
    setSelectedModelId((current) => {
      const model = getModel(current);
      if (model?.modality === next) return current;
      return defaultModelId(next);
    });
    setResolution((current) => {
      const allowed = next === "image" ? IMAGE_RESOLUTIONS : VIDEO_RESOLUTIONS;
      return (allowed as readonly string[]).includes(current)
        ? current
        : defaultResolution(next);
    });
    if (next === "image") {
      setFirstFrame(null);
    }
  }, []);

  const selectModel = useCallback((id: string) => {
    const model = getModel(id);
    if (!model) return;
    setModalityState(model.modality);
    setSelectedModelId(model.id);
    setResolution((current) => {
      const allowed = model.modality === "image" ? IMAGE_RESOLUTIONS : VIDEO_RESOLUTIONS;
      return (allowed as readonly string[]).includes(current)
        ? current
        : defaultResolution(model.modality);
    });
    if (model.modality === "image") {
      setFirstFrame(null);
    }
  }, []);

  const setVariationCount = useCallback((count: number) => {
    setVariationCountState(Math.min(MAX_VARIATIONS, Math.max(1, count)));
  }, []);

  const clearFirstFrame = useCallback(() => setFirstFrame(null), []);

  const attachAsVideoInput = useCallback((job: Job) => {
    if (job.modality !== "image" || !job.imageUrl) return;
    setModalityState("video");
    setSelectedModelId((current) => {
      const model = getModel(current);
      if (model?.modality === "video") return current;
      return defaultModelId("video");
    });
    setResolution((current) =>
      (VIDEO_RESOLUTIONS as readonly string[]).includes(current) ? current : "1080p",
    );
    setFirstFrame({
      jobId: job.id,
      url: job.imageUrl,
      prompt: job.prompt,
    });
    setAspectRatio(job.aspectRatio);
    setSelectedJobId(null);
    toast.success("Attached as first frame");
  }, []);

  const attachFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setFirstFrame({
      jobId: `upload-${Date.now()}`,
      url,
      prompt: "",
    });
    toast.success("Reference attached");
  }, []);

  const generate = useCallback(
    (input: GenerateInput) => {
      const prompt = input.prompt.trim();
      if (!prompt) {
        toast.error("Add a prompt first");
        return false;
      }

      const model = getModel(selectedModelId) ?? modelsFor(modality)[0];
      const batchCost = model.mockCredits * variationCount;
      if (credits < batchCost) {
        setCreditError(true);
        toast.error("Not enough credits", {
          description: `This run needs ${batchCost}. You have ${credits}.`,
        });
        return false;
      }

      setCreditError(false);
      setCredits((value) => value - batchCost);

      for (let index = 0; index < variationCount; index += 1) {
        const id = crypto.randomUUID();
        const createdAt = Date.now() + index;
        const delay = mockDelayMs() + index * 180;
        const seed = `${prompt}::${index}`;
        const placeholder = firstFrame?.url ?? pickStill(aspectRatio, seed).src;
        const queued: Job = {
          id,
          modality,
          modelId: model.id,
          prompt,
          aspectRatio,
          duration: modality === "video" ? duration : undefined,
          resolution,
          status: "queued",
          progress: 4,
          createdAt,
          creditsSpent: model.mockCredits,
          imageUrl: placeholder,
          posterUrl: placeholder,
          firstFrameUrl: firstFrame?.url,
        };

        setJobs((current) => [queued, ...current]);

        const toGenerating = window.setTimeout(() => {
          setJobs((current) =>
            current.map((job) =>
              job.id === id ? { ...job, status: "generating", progress: 14 } : job,
            ),
          );
        }, 380 + index * 80);

        const tick = window.setInterval(() => {
          setJobs((current) =>
            current.map((job) => {
              if (job.id !== id || job.status === "done") return job;
              const next = Math.min(job.progress + 6 + Math.random() * 9, 92);
              return { ...job, status: "generating", progress: next };
            }),
          );
        }, 280);

        const complete = window.setTimeout(() => {
          window.clearInterval(tick);
          setJobs((current) =>
            current.map((job) => {
              if (job.id !== id) return job;
              const still = job.firstFrameUrl
                ? { src: job.firstFrameUrl }
                : pickStill(job.aspectRatio, seed);
              const reel = job.firstFrameUrl
                ? undefined
                : pickReel(job.aspectRatio, seed);
              return {
                ...job,
                status: "done",
                progress: 100,
                completedAt: Date.now(),
                imageUrl: still.src,
                posterUrl: still.src,
                videoUrl: reel?.src,
              };
            }),
          );
        }, delay);

        timeouts.current.push(toGenerating, complete);
        intervals.current.push(tick);
      }

      return true;
    },
    [
      aspectRatio,
      credits,
      duration,
      firstFrame,
      modality,
      resolution,
      selectedModelId,
      variationCount,
    ],
  );

  const openJob = useCallback((id: string) => setSelectedJobId(id), []);
  const closeJob = useCallback(() => setSelectedJobId(null), []);

  const resetDemo = useCallback(() => {
    timeouts.current.forEach((id) => window.clearTimeout(id));
    intervals.current.forEach((id) => window.clearInterval(id));
    timeouts.current = [];
    intervals.current = [];
    setCredits(STARTING_CREDITS);
    setJobs([]);
    setCreditError(false);
    setFirstFrame(null);
    setSelectedJobId(null);
    toast.success("Demo reset", { description: "Credits restored. Board cleared." });
  }, []);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const activeCost = getModel(selectedModelId)?.mockCredits ?? 0;
  const batchCost = activeCost * variationCount;
  const canAfford = credits >= batchCost;

  const value = useMemo<StudioContextValue>(
    () => ({
      credits,
      jobs,
      creditError,
      modality,
      setModality,
      selectedModelId,
      setSelectedModelId,
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
      attachAsVideoInput,
      attachFile,
      generate,
      selectedJobId,
      selectedJob,
      openJob,
      closeJob,
      resetDemo,
      activeCost,
      batchCost,
      canAfford,
    }),
    [
      activeCost,
      aspectRatio,
      attachAsVideoInput,
      attachFile,
      batchCost,
      canAfford,
      clearFirstFrame,
      closeJob,
      creditError,
      credits,
      duration,
      firstFrame,
      generate,
      jobs,
      modality,
      openJob,
      resetDemo,
      resolution,
      selectModel,
      selectedJob,
      selectedJobId,
      selectedModelId,
      setModality,
      setVariationCount,
      variationCount,
    ],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within StudioProvider");
  return ctx;
}
