import { STARTING_CREDITS, STORAGE_KEY, type Job } from "./types";

export interface PersistedStudio {
  credits: number;
  jobs: Job[];
}

const FALLBACK: PersistedStudio = {
  credits: STARTING_CREDITS,
  jobs: [],
};

let snapshot: PersistedStudio = FALLBACK;
let hydratedFromDisk = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function parsePersisted(raw: string | null): PersistedStudio {
  if (!raw) return FALLBACK;
  try {
    const parsed = JSON.parse(raw) as PersistedStudio;
    if (!Array.isArray(parsed.jobs) || typeof parsed.credits !== "number") {
      return FALLBACK;
    }
    const jobs = parsed.jobs.map((job) =>
      job.status === "queued" || job.status === "generating"
        ? {
            ...job,
            status: "done" as const,
            progress: 100,
            completedAt: job.completedAt ?? Date.now(),
          }
        : job,
    );
    return { credits: parsed.credits, jobs };
  } catch {
    return FALLBACK;
  }
}

export function subscribeStudio(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getStudioSnapshot(): PersistedStudio {
  if (!hydratedFromDisk && typeof window !== "undefined") {
    hydratedFromDisk = true;
    snapshot = parsePersisted(window.localStorage.getItem(STORAGE_KEY));
  }
  return snapshot;
}

export function getServerStudioSnapshot(): PersistedStudio {
  return FALLBACK;
}

export function writeStudio(next: PersistedStudio) {
  snapshot = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  emit();
}

export function patchStudio(
  patch: Partial<PersistedStudio> | ((current: PersistedStudio) => PersistedStudio),
) {
  const current = getStudioSnapshot();
  const next = typeof patch === "function" ? patch(current) : { ...current, ...patch };
  writeStudio(next);
}
