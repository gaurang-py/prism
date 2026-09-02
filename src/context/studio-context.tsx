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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  coerceDuration,
  coerceVideoResolution,
  defaultDurationFor,
  defaultModelId,
  getModel,
  modelsFor,
  videoResolutionsFor,
  type Modality,
} from "@/lib/models";
import { generateContinuePath, saveGenerateDraft } from "@/lib/generate-draft";
import { isAuthPath, isMarketingPath, loginUrl, signupUrl } from "@/lib/paths";
import { useAuth } from "@/context/auth-context";
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
  activeCost: number;
  batchCost: number;
  canAfford: boolean;
}

const StudioContext = createContext<StudioContextValue | null>(null);

function defaultResolution(
  modality: Modality,
  modelId?: string,
  duration?: VideoDuration | null,
): OutputResolution {
  if (modality === "image") return "1K";
  const id = modelId ?? defaultModelId("video");
  const allowed = videoResolutionsFor(id, duration ?? defaultDurationFor(id));
  return allowed.includes("1080p") ? "1080p" : allowed[0];
}

function snapResolution(
  modelId: string,
  duration: VideoDuration,
  current: OutputResolution,
): OutputResolution {
  return coerceVideoResolution(modelId, duration, current);
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
  const router = useRouter();
  const { user, setUser, loading: authLoading } = useAuth();

  const [credits, setCredits] = useState(user?.credits ?? STARTING_CREDITS);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creditError, setCreditError] = useState(false);
  const [modality, setModalityState] = useState<Modality>("image");
  const [selectedModelId, setSelectedModelId] = useState(defaultModelId("image"));
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("3:4");
  const [durationChoice, setDuration] = useState<VideoDuration>(() =>
    defaultDurationFor(defaultModelId("video")),
  );
  // Switching model can strand a length the new one rejects (Veo has no 5s), so
  // the exposed duration is always snapped to the selected model's own list.
  const duration = coerceDuration(selectedModelId, durationChoice);
  const [resolution, setResolution] = useState<OutputResolution>("1K");
  const [variationCount, setVariationCountState] = useState(1);
  const [firstFrame, setFirstFrame] = useState<FirstFrameRef | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [appliedRoute, setAppliedRoute] = useState("");

  const routeKey = `${pathname}?${searchParams.toString()}`;
  if (appliedRoute !== routeKey) {
    setAppliedRoute(routeKey);
    const routeMode = modeFromRoute(pathname, searchParams.get("mode"));
    const routeModel = getModel(searchParams.get("model") ?? "", true);
    if (routeModel && (!routeModel.nsfw || user?.nsfwEnabled)) {
      setModalityState(routeModel.modality);
      setSelectedModelId(routeModel.id);
      setResolution((current) =>
        snapResolution(
          routeModel.id,
          coerceDuration(routeModel.id, durationChoice),
          (routeModel.modality === "image" ? IMAGE_RESOLUTIONS : videoResolutionsFor(routeModel.id, durationChoice) as readonly string[]).includes(current)
            ? current
            : defaultResolution(routeModel.modality, routeModel.id, durationChoice),
        ),
      );
      if (routeModel.modality === "image") setFirstFrame(null);
    } else if (routeMode) {
      setModalityState(routeMode);
      setSelectedModelId((current) => {
        const model = getModel(current);
        if (model?.modality === routeMode) return current;
        return defaultModelId(routeMode, Boolean(user?.nsfwEnabled));
      });
      setResolution((current) => {
        const nextId = defaultModelId(routeMode, Boolean(user?.nsfwEnabled));
        return snapResolution(
          nextId,
          coerceDuration(nextId, durationChoice),
          current,
        );
      });
      if (routeMode === "image") setFirstFrame(null);
    }
  }

  const refresh = useCallback(async () => {
    if (isAuthPath(pathname) || isMarketingPath(pathname)) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/jobs", { cache: "no-store" });
      const payload = (await response.json()) as { jobs?: Job[]; credits?: number; error?: string };
      if (response.status === 401) {
        setJobs([]);
        return;
      }
      if (!response.ok) {
        throw new Error(payload.error || "Could not load jobs");
      }
      const nextJobs = payload.jobs ?? [];
      setJobs((previous) => {
        for (const job of nextJobs) {
          const prior = previous.find((row) => row.id === job.id);
          if (
            prior &&
            prior.status !== "error" &&
            job.status === "error" &&
            job.creditsRefunded &&
            job.creditsSpent > 0
          ) {
            toast.message(`${job.creditsSpent} credits returned`, {
              description: job.errorMessage || "Generation failed.",
            });
          }
        }
        return nextJobs;
      });
      if (typeof payload.credits === "number") {
        setCredits(payload.credits);
        setUser((current) => (current ? { ...current, credits: payload.credits ?? current.credits } : current));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [pathname, setUser]);

  useEffect(() => {
    if (typeof user?.credits === "number") setCredits(user.credits);
  }, [user?.credits]);

  useEffect(() => {
    setResolution((current) => snapResolution(selectedModelId, duration, current));
  }, [duration, selectedModelId]);

  useEffect(() => {
    const model = getModel(selectedModelId);
    if (model?.nsfw && !user?.nsfwEnabled) {
      setSelectedModelId(defaultModelId(model.modality, false));
    }
  }, [selectedModelId, user?.nsfwEnabled]);


  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (isAuthPath(pathname) || isMarketingPath(pathname)) return;
    const pending = jobs.some((job) => job.status === "queued" || job.status === "generating");
    const interval = window.setInterval(() => {
      void refresh();
    }, pending ? 2000 : 12000);
    return () => window.clearInterval(interval);
  }, [jobs, refresh, pathname]);

  const setModality = useCallback((next: Modality) => {
    setModalityState(next);
    setSelectedModelId((current) => {
      const model = getModel(current);
      if (model?.modality === next) return current;
      return defaultModelId(next, Boolean(user?.nsfwEnabled));
    });
    setResolution((current) =>
      snapResolution(
        defaultModelId(next, Boolean(user?.nsfwEnabled)),
        coerceDuration(defaultModelId(next, Boolean(user?.nsfwEnabled)), durationChoice),
        current,
      ),
    );
    if (next === "image") {
      setFirstFrame(null);
    }
  }, [user?.nsfwEnabled]);

  const selectModel = useCallback((id: string) => {
    const model = getModel(id);
    if (!model) return;
    setModalityState(model.modality);
    setSelectedModelId(model.id);
    setResolution((current) =>
      snapResolution(model.id, coerceDuration(model.id, durationChoice), current),
    );
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
      return defaultModelId("video", Boolean(user?.nsfwEnabled));
    });
    setResolution((current) =>
      snapResolution(
        defaultModelId("video", Boolean(user?.nsfwEnabled)),
        duration,
        (VIDEO_RESOLUTIONS as readonly string[]).includes(current) ? current : "720p",
      ),
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
  }, [user?.nsfwEnabled]);

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

      const model = getModel(selectedModelId) ?? modelsFor(modality, Boolean(user?.nsfwEnabled))[0];
      if (model.nsfw && !user?.nsfwEnabled) {
        toast.error("Turn on NSFW to use this model");
        return false;
      }
      if (!user && !authLoading) {
        const draft = {
          prompt,
          modality,
          modelId: model.id,
          aspectRatio,
          resolution,
          duration,
          variationCount,
        };
        saveGenerateDraft(draft);
        router.push(signupUrl(generateContinuePath(draft)));
        return false;
      }

      const batchCost = model.mockCredits * variationCount;
      if (user && credits < batchCost) {
        setCreditError(true);
        toast.error("Not enough credits", {
          description: `This run needs ${batchCost}. You have ${credits}.`,
          action: {
            label: "Buy",
            onClick: () => router.push("/credits"),
          },
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
        if (response.status === 401) {
          saveGenerateDraft({
            prompt,
            modality,
            modelId: model.id,
            aspectRatio,
            resolution,
            duration,
            variationCount,
          });
          router.push(loginUrl(generateContinuePath({ prompt, modality, modelId: model.id })));
          return false;
        }
        if (response.status === 402) {
          setCreditError(true);
          if (typeof payload.credits === "number") {
            setCredits(payload.credits);
            setUser((current) =>
              current ? { ...current, credits: payload.credits ?? current.credits } : current,
            );
          }
          toast.error("Not enough credits", {
            description: payload.error,
            action: {
              label: "Buy",
              onClick: () => router.push("/credits"),
            },
          });
          return false;
        }
        if (!response.ok) {
          throw new Error(payload.error || "Could not create job");
        }
        if (typeof payload.credits === "number") {
          setCredits(payload.credits);
          setUser((current) =>
            current ? { ...current, credits: payload.credits ?? current.credits } : current,
          );
        }
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
      authLoading,
      credits,
      duration,
      firstFrame,
      modality,
      resolution,
      router,
      selectedModelId,
      setUser,
      user,
      variationCount,
    ],
  );

  const openJob = useCallback((id: string) => setSelectedJobId(id), []);
  const closeJob = useCallback(() => setSelectedJobId(null), []);

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
