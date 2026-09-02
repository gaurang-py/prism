import { GoogleGenAI, type GenerateVideosOperation } from "@google/genai";
import { ProviderError, type GenerateRequest, type GeneratedMedia, type ProgressFn } from "./types";
import type { AspectRatio, VideoDuration } from "../types";

/**
 * Catalog id -> Gemini API model id.
 *
 * Verified against ListModels on the Gemini Developer API: the image models
 * serve `generateContent`, the Veo models serve `predictLongRunning`.
 * Imagen is not offered on this surface any more — the image models here are
 * the Gemini-native ("Nano Banana") ones.
 */
const GOOGLE_MODEL_IDS: Record<string, string> = {
  "nano-banana-2": "gemini-3.1-flash-image",
  "nano-banana-pro": "gemini-3-pro-image",
  "nano-banana": "gemini-2.5-flash-image",
  "veo-3.1-fast": "veo-3.1-fast-generate-preview",
  "veo-3.1": "veo-3.1-generate-preview",
  "veo-3.1-lite": "veo-3.1-lite-generate-preview",
};

/** Veo accepts 4, 6 or 8 seconds — anything else is a 400 from the API. */
export const VEO_DURATIONS = [4, 6, 8] as const;
const VEO_POLL_MS = 10_000;
const VEO_TIMEOUT_MS = 10 * 60_000;

export function googleModelId(catalogId: string): string | undefined {
  return GOOGLE_MODEL_IDS[catalogId];
}

function requireGoogleModelId(catalogId: string): string {
  const id = googleModelId(catalogId);
  if (!id) {
    throw new ProviderError(
      `No Google model is mapped for "${catalogId}". It stays in the catalog, but this run cannot start.`,
    );
  }
  return id;
}

export function googleApiKey(): string | undefined {
  return (
    process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim() || undefined
  );
}

export function googleKeyConfigured(): boolean {
  return Boolean(googleApiKey());
}

export function assertGoogleKey(): void {
  if (!googleKeyConfigured()) {
    throw new ProviderError(
      "GOOGLE_API_KEY is not set. Add your Gemini API key to .env — Google models cannot run without it.",
    );
  }
}

/**
 * Gemini image models accept every aspect ratio the studio offers, so this is
 * a pass-through. Veo only accepts 16:9 and 9:16, hence the separate mapper.
 */
function imageAspect(aspect: AspectRatio): string {
  return aspect;
}

export function veoAspect(aspect: AspectRatio): "16:9" | "9:16" {
  return aspect === "9:16" || aspect === "3:4" ? "9:16" : "16:9";
}

export function veoDuration(duration: VideoDuration | null | undefined): number {
  return duration === 10 ? 8 : 6;
}

// ---------------------------------------------------------------------------
// Request building — pure, so it can be asserted without touching the network.
// ---------------------------------------------------------------------------

export interface GoogleImageRequest {
  model: string;
  contents: Array<{ role: string; parts: Array<Record<string, unknown>> }>;
  config: {
    responseModalities: string[];
    imageConfig: { aspectRatio: string; imageSize: string };
  };
}

export function buildGoogleImageRequest(
  req: GenerateRequest,
  frame?: { data: string; mimeType: string } | null,
): GoogleImageRequest {
  const parts: Array<Record<string, unknown>> = [];
  if (frame) {
    parts.push({ inlineData: { mimeType: frame.mimeType, data: frame.data } });
  }
  parts.push({ text: req.prompt });

  return {
    model: requireGoogleModelId(req.modelId),
    contents: [{ role: "user", parts }],
    config: {
      // Nano Banana Pro thinks out loud before it draws, so TEXT has to be
      // allowed alongside IMAGE or the model has nowhere to put that.
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: imageAspect(req.aspectRatio),
        imageSize: req.resolution === "2K" ? "2K" : "1K",
      },
    },
  };
}

export interface GoogleVideoRequest {
  model: string;
  source: { prompt: string; image?: { imageBytes: string; mimeType: string } };
  config: {
    numberOfVideos: number;
    aspectRatio: string;
    resolution: string;
    durationSeconds: number;
  };
}

export function buildGoogleVideoRequest(
  req: GenerateRequest,
  frame?: { data: string; mimeType: string } | null,
): GoogleVideoRequest {
  return {
    model: requireGoogleModelId(req.modelId),
    // `prompt`/`image` as top-level args are deprecated in @google/genai — the
    // SDK warns and will drop them. `source` is the supported shape.
    source: {
      prompt: req.prompt,
      ...(frame ? { image: { imageBytes: frame.data, mimeType: frame.mimeType } } : {}),
    },
    config: {
      // sampleCount must be exactly 1 on the Developer API.
      numberOfVideos: 1,
      aspectRatio: veoAspect(req.aspectRatio),
      resolution: req.resolution === "1080p" ? "1080p" : "720p",
      durationSeconds: veoDuration(req.duration),
      // generateAudio is rejected outside Gemini Enterprise Agent Platform,
      // and personGeneration:"allow_adult" is not supported here either.
    },
  };
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export function googleMessage(error: unknown): string {
  const raw =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : error instanceof Error
        ? error.message
        : "";

  // The SDK stringifies the API envelope into .message; pull the human part out.
  let text = raw;
  const jsonStart = raw.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart)) as { error?: { message?: string; status?: string } };
      if (parsed.error?.message) text = parsed.error.message;
    } catch {
      // leave `text` as the raw message
    }
  }

  const lower = text.toLowerCase();
  if (lower.includes("quota") || lower.includes("resource_exhausted") || lower.includes("billing")) {
    return "Google rejected this run for quota. Image and video generation are not on the Gemini API free tier — enable billing on the project behind GOOGLE_API_KEY, then retry.";
  }
  if (lower.includes("api key") || lower.includes("unauthenticated") || lower.includes("permission")) {
    return "Google rejected the API key. Check GOOGLE_API_KEY in .env.";
  }
  if (lower.includes("safety") || lower.includes("blocked") || lower.includes("prohibited")) {
    return `Google blocked this prompt (${text}). Google models are SFW only — adult work needs an NSFW model with NSFW turned on.`;
  }
  return text || "Google generation failed.";
}

// ---------------------------------------------------------------------------
// Running
// ---------------------------------------------------------------------------

function client(): GoogleGenAI {
  assertGoogleKey();
  return new GoogleGenAI({ apiKey: googleApiKey()! });
}

/** Google takes inline bytes, not URLs, so a first frame has to be pulled down first. */
async function fetchFrame(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new ProviderError(`Could not read the first frame (${res.status}).`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  return {
    data: bytes.toString("base64"),
    mimeType: res.headers.get("content-type")?.split(";")[0]?.trim() || "image/png",
  };
}

async function runImage(req: GenerateRequest, onProgress?: ProgressFn): Promise<GeneratedMedia> {
  const ai = client();
  const frame = req.firstFrameUrl ? await fetchFrame(req.firstFrameUrl) : null;
  const call = buildGoogleImageRequest(req, frame);

  await onProgress?.({ progress: 30 });
  const res = await ai.models.generateContent(call as never);
  await onProgress?.({ progress: 80 });

  const parts = res.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part.inlineData;
    if (inline?.data && inline.mimeType?.startsWith("image/")) {
      return {
        source: "bytes",
        bytes: Buffer.from(inline.data, "base64"),
        contentType: inline.mimeType,
      };
    }
  }

  const blockReason = res.promptFeedback?.blockReason;
  if (blockReason) {
    throw new ProviderError(`Google blocked this prompt (${blockReason}).`);
  }
  const text = parts.find((part) => part.text)?.text;
  throw new ProviderError(
    text
      ? `Google returned text instead of an image: ${text.slice(0, 200)}`
      : "Google returned no image.",
  );
}

async function runVideo(req: GenerateRequest, onProgress?: ProgressFn): Promise<GeneratedMedia> {
  const ai = client();
  const frame = req.firstFrameUrl ? await fetchFrame(req.firstFrameUrl) : null;
  const call = buildGoogleVideoRequest(req, frame);

  let operation = (await ai.models.generateVideos(call as never)) as GenerateVideosOperation;
  await onProgress?.({ requestId: operation.name, progress: 20 });

  const startedAt = Date.now();
  let polls = 0;
  while (!operation.done) {
    if (Date.now() - startedAt > VEO_TIMEOUT_MS) {
      throw new ProviderError("Veo did not finish within 10 minutes. Try a shorter clip.");
    }
    await new Promise((resolve) => setTimeout(resolve, VEO_POLL_MS));
    operation = await ai.operations.getVideosOperation({ operation });
    polls += 1;
    await onProgress?.({
      requestId: operation.name,
      progress: Math.min(82, 24 + polls * 4),
    });
  }

  if (operation.error) {
    throw new ProviderError(googleMessage(operation.error));
  }

  const response = operation.response;
  if (response?.raiMediaFilteredCount) {
    const reason = response.raiMediaFilteredReasons?.[0] ?? "safety filters";
    throw new ProviderError(`Veo filtered this generation (${reason}).`);
  }

  const video = response?.generatedVideos?.[0]?.video;
  if (!video) throw new ProviderError("Veo returned no video.");

  const mimeType = video.mimeType || "video/mp4";
  if (video.videoBytes) {
    return {
      source: "bytes",
      bytes: Buffer.from(video.videoBytes, "base64"),
      contentType: mimeType,
      requestId: operation.name,
    };
  }
  if (!video.uri) throw new ProviderError("Veo returned no video URI.");

  // Files URIs are private — they need the API key to read.
  const download = await fetch(video.uri, {
    headers: { "x-goog-api-key": googleApiKey()! },
  });
  if (!download.ok) {
    throw new ProviderError(`Could not download the Veo output (${download.status}).`);
  }
  return {
    source: "bytes",
    bytes: Buffer.from(await download.arrayBuffer()),
    contentType: download.headers.get("content-type")?.split(";")[0]?.trim() || mimeType,
    requestId: operation.name,
  };
}

export async function runGoogleGeneration(
  request: GenerateRequest,
  onProgress?: ProgressFn,
): Promise<GeneratedMedia> {
  try {
    return request.modality === "video"
      ? await runVideo(request, onProgress)
      : await runImage(request, onProgress);
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError(googleMessage(error));
  }
}
