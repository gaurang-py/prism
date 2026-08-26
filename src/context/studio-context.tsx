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
import { toast } from "sonner";
import { defaultModelId, getModel, modelsFor, type Modality } from "@/lib/models";
import { mockDelayMs, pickReel, pickStill } from "@/lib/placeholders";
import { SEED_JOBS } from "@/lib/seed-jobs";
import {
  getServerStudioSnapshot,
  getStudioSnapshot,
  patchStudio,
  subscribeStudio,
} from "@/lib/studio-persist";
import { STARTING_CREDITS, type AspectRatio, type FirstFrameRef, type Job, type VideoDuration, type VideoResolution } from "@/lib/types";

interface GenerateInput {
  prompt: string;
  negativePrompt: string;
}

interface StudioContextValue {
  credits: number;
  jobs: Job[];
  creditError: boolean;
  modality: Modality;
  setModality: (modality: Modality) => void;
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  duration: VideoDuration;
  setDuration: (duration: VideoDuration) => void;
  resolution: VideoResolution;
  setResolution: (resolution: VideoResolution) => void;
  firstFrame: FirstFrameRef | null;
  clearFirstFrame: () => void;
  attachAsVideoInput: (job: Job) => void;
  generate: (input: GenerateInput) => boolean;
  selectedJobId: string | null;
  selectedJob: Job | null;
  openJob: (id: string) => void;
  closeJob: () => void;
  resetDemo: () => void;
  activeCost: number;
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

export function StudioProvider({ children }: { children: ReactNode }) {
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
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [duration, setDuration] = useState<VideoDuration>(5);
  const [resolution, setResolution] = useState<VideoResolution>("1080p");
  const [firstFrame, setFirstFrame] = useState<FirstFrameRef | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const timeouts = useRef<number[]>([]);
  const intervals = useRef<number[]>([]);

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
    if (next === "image") {
      setFirstFrame(null);
    }
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
    setFirstFrame({
      jobId: job.id,
      url: job.imageUrl,
      prompt: job.prompt,
    });
    setAspectRatio(job.aspectRatio);
    setSelectedJobId(null);
    toast.success("Attached as first frame", {
      description: "Video mode is ready. Generate to animate this still.",
    });
  }, []);

  const generate = useCallback(
    (input: GenerateInput) => {
      const prompt = input.prompt.trim();
      if (!prompt) {
        toast.error("Add a prompt first");
        return false;
      }

      const model = getModel(selectedModelId) ?? modelsFor(modality)[0];
      const cost = model.mockCredits;
      if (credits < cost) {
        setCreditError(true);
        toast.error("Not enough credits", {
          description: `This run needs ${cost}. You have ${credits}.`,
        });
        return false;
      }

      setCreditError(false);
      setCredits((value) => value - cost);

      const id = crypto.randomUUID();
      const createdAt = Date.now();
      const delay = mockDelayMs();
      const placeholder = firstFrame?.url ?? pickStill(aspectRatio, prompt).src;
      const queued: Job = {
        id,
        modality,
        modelId: model.id,
        prompt,
        negativePrompt: input.negativePrompt.trim() || undefined,
        aspectRatio,
        duration: modality === "video" ? duration : undefined,
        resolution: modality === "video" ? resolution : undefined,
        status: "queued",
        progress: 4,
        createdAt,
        creditsSpent: cost,
        imageUrl: placeholder,
        posterUrl: placeholder,
        firstFrameUrl: modality === "video" ? firstFrame?.url : undefined,
      };

      setJobs((current) => [queued, ...current]);

      const toGenerating = window.setTimeout(() => {
        setJobs((current) =>
          current.map((job) =>
            job.id === id ? { ...job, status: "generating", progress: 14 } : job,
          ),
        );
      }, 380);

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
              : pickStill(job.aspectRatio, job.prompt);
            const reel = job.firstFrameUrl
              ? undefined
              : pickReel(job.aspectRatio, job.prompt);
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
      return true;
    },
    [aspectRatio, credits, duration, firstFrame, modality, resolution, selectedModelId],
  );

  const openJob = useCallback((id: string) => setSelectedJobId(id), []);
  const closeJob = useCallback(() => setSelectedJobId(null), []);

  const resetDemo = useCallback(() => {
    timeouts.current.forEach((id) => window.clearTimeout(id));
    intervals.current.forEach((id) => window.clearInterval(id));
    timeouts.current = [];
    intervals.current = [];
    setCredits(STARTING_CREDITS);
    setJobs(SEED_JOBS);
    setCreditError(false);
    setFirstFrame(null);
    setSelectedJobId(null);
    toast.success("Demo reset", { description: "Credits and library restored." });
  }, []);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const activeCost = getModel(selectedModelId)?.mockCredits ?? 0;
  const canAfford = credits >= activeCost;

  const value = useMemo<StudioContextValue>(
    () => ({
      credits,
      jobs,
      creditError,
      modality,
      setModality,
      selectedModelId,
      setSelectedModelId,
      aspectRatio,
      setAspectRatio,
      duration,
      setDuration,
      resolution,
      setResolution,
      firstFrame,
      clearFirstFrame,
      attachAsVideoInput,
      generate,
      selectedJobId,
      selectedJob,
      openJob,
      closeJob,
      resetDemo,
      activeCost,
      canAfford,
    }),
    [
      activeCost,
      aspectRatio,
      attachAsVideoInput,
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
      selectedJob,
      selectedJobId,
      selectedModelId,
      setModality,
    ],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within StudioProvider");
  return ctx;
}
