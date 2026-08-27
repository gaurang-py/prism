"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { defaultModelId, getModel, modelsFor, type Modality } from "@/lib/models";
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
  loading: boolean;
  submitting: boolean;
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
  generate: (input: GenerateInput) => Promise<boolean>;
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

  const [credits, setCredits] = useState(STARTING_CREDITS);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/jobs", { cache: "no-store" });
      const payload = (await response.json()) as { jobs?: Job[]; credits?: number; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Could not load jobs");
      }
      setJobs(payload.jobs ?? []);
      if (typeof payload.credits === "number") setCredits(payload.credits);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const pending = jobs.some((job) => job.status === "queued" || job.status === "generating");
    const interval = window.setInterval(() => {
      void refresh();
    }, pending ? 2000 : 12000);
    return () => window.clearInterval(interval);
  }, [jobs, refresh]);

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
    if (job.modality !== "image") return;
    const url = job.imageUrl || job.posterUrl;
    if (!url && !job.assetKey) return;
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
      url: url || "",
      prompt: job.prompt,
      key: job.assetKey,
    });
    setAspectRatio(job.aspectRatio);
    setSelectedJobId(null);
    toast.success("Attached as first frame");
  }, []);

  const attachFile = useCallback((file: File) => {
    const preview = URL.createObjectURL(file);
    const tempId = `upload-${Date.now()}`;
    setFirstFrame({
      jobId: tempId,
      url: preview,
      prompt: "",
    });
    toast.message("Uploading reference…");
    void (async () => {
      try {
        const body = new FormData();
        body.set("file", file);
        const response = await fetch("/api/uploads", { method: "POST", body });
        const payload = (await response.json()) as { key?: string; url?: string; error?: string };
        if (!response.ok || !payload.key) {
          throw new Error(payload.error || "Upload failed");
        }
        setFirstFrame((current) =>
          current?.jobId === tempId
            ? { jobId: tempId, url: payload.url || preview, prompt: "", key: payload.key }
            : current,
        );
        toast.success("Reference attached");
      } catch (error) {
        setFirstFrame((current) => (current?.jobId === tempId ? null : current));
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    })();
  }, []);

  const generate = useCallback(
    async (input: GenerateInput) => {
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

      if (firstFrame && !firstFrame.key) {
        toast.error("Still uploading the reference image");
        return false;
      }

      setCreditError(false);
      setSubmitting(true);
      try {
        const response = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            modality,
            modelId: model.id,
            aspect: aspectRatio,
            resolution,
            duration: modality === "video" ? duration : undefined,
            count: variationCount,
            firstFrameKey: firstFrame?.key,
          }),
        });
        const payload = (await response.json()) as {
          jobs?: Job[];
          credits?: number;
          error?: string;
        };
        if (response.status === 402) {
          setCreditError(true);
          if (typeof payload.credits === "number") setCredits(payload.credits);
          toast.error("Not enough credits", { description: payload.error });
          return false;
        }
        if (!response.ok) {
          throw new Error(payload.error || "Could not create job");
        }
        if (typeof payload.credits === "number") setCredits(payload.credits);
        if (payload.jobs?.length) {
          setJobs((current) => {
            const incoming = payload.jobs ?? [];
            const ids = new Set(incoming.map((job) => job.id));
            return [...incoming, ...current.filter((job) => !ids.has(job.id))];
          });
        }
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not create job");
        return false;
      } finally {
        setSubmitting(false);
      }
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
    void (async () => {
      try {
        const response = await fetch("/api/wallet/reset", { method: "POST" });
        const payload = (await response.json()) as { credits?: number; error?: string };
        if (!response.ok) throw new Error(payload.error || "Reset failed");
        if (typeof payload.credits === "number") setCredits(payload.credits);
        setCreditError(false);
        setFirstFrame(null);
        setSelectedJobId(null);
        toast.success("Credits restored", {
          description: "Wallet reset to 1,240. History jobs are unchanged.",
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Reset failed");
      }
    })();
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
      loading,
      submitting,
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
      loading,
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
      submitting,
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
