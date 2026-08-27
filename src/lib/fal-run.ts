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

function extractMediaUrl(data: unknown): { url: string; contentType?: string } {
  if (!data || typeof data !== "object") {
    throw new Error("Fal returned an empty result.");
  }
  const payload = data as Record<string, unknown>;

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
      body?: { detail?: unknown; message?: string };
      status?: number;
    };
    const detail = body.body?.detail;
    if (typeof detail === "string") return detail;
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
      if (parts.length) return parts.join("; ");
    }
    if (typeof body.body?.message === "string") return body.body.message;
    if (typeof body.message === "string") return body.message;
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

    const media = extractMediaUrl(result.data);
    return {
      ...media,
      requestId: result.requestId,
    };
  } catch (error) {
    throw new Error(falMessage(error));
  }
}
