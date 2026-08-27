import { fal } from "@fal-ai/client";
import { assertFalKey, resolveFalCall, type GenerateRequest } from "./fal-map";

export interface FalMedia {
  url: string;
  contentType?: string;
  requestId?: string;
}

type FalResult = {
  data: unknown;
  requestId: string;
};

function extractMediaUrl(data: unknown, safetyOff: boolean): { url: string; contentType?: string } {
  if (!data || typeof data !== "object") {
    throw new Error("Fal returned an empty result.");
  }
  const payload = data as Record<string, unknown>;
  const flagged =
    Array.isArray(payload.has_nsfw_concepts) && payload.has_nsfw_concepts.some(Boolean);

  if (flagged && !safetyOff) {
    throw new Error(
      "Fal blocked this output as unsafe. Opt into NSFW models for adult work — SFW endpoints will not run that prompt.",
    );
  }

  const fromFile = (value: unknown): { url: string; contentType?: string } | null => {
    if (!value || typeof value !== "object") return null;
    const file = value as { url?: unknown; content_type?: unknown };
    if (typeof file.url !== "string" || !file.url) return null;
    return {
      url: file.url,
      contentType: typeof file.content_type === "string" ? file.content_type : undefined,
    };
  };

  const video = fromFile(payload.video);
  if (video) return video;

  if (Array.isArray(payload.images) && payload.images[0]) {
    const image = fromFile(payload.images[0]);
    if (image) return image;
  }

  const image = fromFile(payload.image);
  if (image) return image;

  throw new Error("Fal returned no image or video URL.");
}

function falMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const body = error as {
      message?: string;
      body?: { detail?: unknown; message?: string; type?: string };
      status?: number;
    };
    const detail = body.body?.detail;
    let detailText = "";
    if (typeof detail === "string") detailText = detail;
    if (Array.isArray(detail)) {
      const parts = detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: unknown }).msg);
          }
          return JSON.stringify(item);
        })
        .filter(Boolean);
      if (parts.length) detailText = parts.join("; ");
    }
    const raw =
      detailText ||
      (typeof body.body?.message === "string" ? body.body.message : "") ||
      (typeof body.message === "string" ? body.message : "");
    const lower = raw.toLowerCase();
    const policy =
      lower.includes("content_policy") ||
      lower.includes("content policy") ||
      lower.includes("safety checker") ||
      lower.includes("nsfw");
    if (raw && policy) {
      return `Fal rejected this run (${raw}). Adult work needs an NSFW model with NSFW turned on.`;
    }
    if (raw) return raw;
  }
  if (error instanceof Error) return error.message;
  return "Fal.ai request failed.";
}

export async function runFalGeneration(
  request: GenerateRequest,
  onProgress?: (update: { requestId?: string; progress: number }) => Promise<void> | void,
): Promise<FalMedia> {
  assertFalKey();
  fal.config({ credentials: process.env.FAL_KEY!.trim() });

  const call = resolveFalCall(request);
  const safetyOff = call.input.enable_safety_checker === false;

  try {
    const result = (await fal.subscribe(call.endpoint as never, {
      input: call.input,
      logs: true,
      onQueueUpdate: (update: { status: string; request_id: string; logs?: Array<{ message: string }> }) => {
        const requestId = update.request_id;
        if (update.status === "IN_QUEUE") {
          void onProgress?.({ requestId, progress: 18 });
        } else if (update.status === "IN_PROGRESS") {
          const n = update.logs?.length ?? 0;
          void onProgress?.({ requestId, progress: Math.min(82, 28 + n * 4) });
        }
      },
    } as never)) as FalResult;

    const media = extractMediaUrl(result.data, safetyOff);
    return {
      ...media,
      requestId: result.requestId,
    };
  } catch (error) {
    throw new Error(falMessage(error));
  }
}
