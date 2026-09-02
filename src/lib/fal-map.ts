import { ProviderError } from "./providers/types";
import type { GenerateRequest } from "./providers/types";
import type { AspectRatio, OutputResolution, VideoDuration } from "./types";

export { ProviderError };
export type { GenerateRequest };

interface FalCall {
  endpoint: string;
  input: Record<string, unknown>;
}

function fluxImageSize(aspect: AspectRatio, resolution: OutputResolution | null | undefined): string {
  const hd = resolution !== "1K";
  switch (aspect) {
    case "1:1":
      return hd ? "square_hd" : "square";
    case "16:9":
      return "landscape_16_9";
    case "9:16":
      return "portrait_16_9";
    case "4:3":
      return "landscape_4_3";
    case "3:4":
      return "portrait_4_3";
    default:
      return "landscape_4_3";
  }
}

function videoAspect(aspect: AspectRatio): "16:9" | "9:16" | "1:1" | "4:3" | "3:4" {
  return aspect;
}

function durationSeconds(duration: VideoDuration | null | undefined): number {
  // The dock only offers lengths the model declares, so pass the choice through.
  return duration ?? 5;
}

function buildImageCall(req: GenerateRequest): FalCall {
  const imageSize = fluxImageSize(req.aspectRatio, req.resolution);
  const frame = req.firstFrameUrl ?? undefined;

  switch (req.modelId) {
    case "flux-2-schnell":
      return {
        endpoint: "fal-ai/flux-2/turbo",
        input: {
          prompt: req.prompt,
          image_size: imageSize,
          num_images: 1,
          output_format: "png",
          ...(frame ? { image_urls: [frame] } : {}),
        },
      };
    case "flux-2-dev":
      return {
        endpoint: "fal-ai/flux-2",
        input: {
          prompt: req.prompt,
          image_size: imageSize,
          num_images: 1,
          output_format: "png",
          ...(frame ? { image_urls: [frame] } : {}),
        },
      };
    case "seedream-5":
      return {
        endpoint: frame
          ? "bytedance/seedream/v5/pro/edit"
          : "bytedance/seedream/v5/pro/text-to-image",
        input: {
          prompt: req.prompt,
          image_size: req.resolution === "2K" ? "2K" : "1K",
          aspect_ratio: req.aspectRatio,
          ...(frame ? { image_urls: [frame] } : {}),
        },
      };
    case "sdxl":
      return {
        endpoint: "fal-ai/fast-sdxl",
        input: {
          prompt: req.prompt,
          image_size: imageSize,
          num_images: 1,
          enable_safety_checker: true,
          ...(frame ? { image_url: frame, strength: 0.55 } : {}),
        },
      };
    case "flux-uncensored":
      return {
        endpoint: "fal-ai/flux/dev",
        input: {
          prompt: req.prompt,
          image_size: imageSize,
          num_images: 1,
          output_format: "png",
          enable_safety_checker: false,
          ...(frame ? { image_url: frame } : {}),
        },
      };
    case "pony-v7":
      return {
        endpoint: "fal-ai/pony-v7",
        input: {
          prompt: req.prompt,
          image_size: imageSize,
          num_images: 1,
          output_format: "png",
          enable_safety_checker: false,
        },
      };
    case "sdxl-uncensored":
      return {
        endpoint: frame ? "fal-ai/fast-sdxl/image-to-image" : "fal-ai/fast-sdxl",
        input: {
          prompt: req.prompt,
          image_size: imageSize,
          num_images: 1,
          enable_safety_checker: false,
          ...(frame ? { image_url: frame, strength: 0.55 } : {}),
        },
      };
    default:
      throw new ProviderError(
        `No Fal.ai endpoint is mapped for image model "${req.modelId}". It stays in the catalog, but this run cannot start.`,
      );
  }
}

function buildVideoCall(req: GenerateRequest): FalCall {
  const duration = durationSeconds(req.duration);
  const aspect = videoAspect(req.aspectRatio);
  const resolution = req.resolution === "720p" ? "720p" : "1080p";
  const frame = req.firstFrameUrl ?? undefined;

  switch (req.modelId) {
    case "wan-2.6":
      return {
        endpoint: frame ? "wan/v2.6/image-to-video" : "wan/v2.6/text-to-video",
        input: {
          prompt: req.prompt,
          duration: String(duration),
          resolution,
          aspect_ratio: aspect,
          ...(frame ? { image_url: frame } : {}),
        },
      };
    case "seedance-fast":
      return {
        endpoint: frame
          ? "bytedance/seedance-2.0/fast/image-to-video"
          : "bytedance/seedance-2.0/fast/text-to-video",
        input: {
          prompt: req.prompt,
          duration,
          resolution,
          aspect_ratio: aspect,
          ...(frame ? { image_url: frame } : {}),
        },
      };
    case "kling-2.6":
      return {
        endpoint: frame
          ? "fal-ai/kling-video/v2.6/pro/image-to-video"
          : "fal-ai/kling-video/v2.6/pro/text-to-video",
        input: {
          prompt: req.prompt,
          duration: duration >= 10 ? "10" : "5",
          aspect_ratio: aspect === "4:3" || aspect === "3:4" ? (aspect === "3:4" ? "9:16" : "16:9") : aspect,
          ...(frame ? { start_image_url: frame } : {}),
        },
      };
    case "ltx-2": {
      const ltxDuration = duration >= 10 ? 10 : 6;
      const ltxAspect = aspect === "9:16" ? "9:16" : "16:9";
      return {
        endpoint: frame
          ? "fal-ai/ltx-2.3/image-to-video/fast"
          : "fal-ai/ltx-2.3/text-to-video/fast",
        input: {
          prompt: req.prompt,
          duration: ltxDuration,
          resolution: "1080p",
          aspect_ratio: frame ? "auto" : ltxAspect,
          generate_audio: true,
          ...(frame ? { image_url: frame } : {}),
        },
      };
    }
    case "hunyuan-video": {
      const hunyuanAspect = aspect === "9:16" ? "9:16" : "16:9";
      return {
        endpoint: "fal-ai/hunyuan-video",
        input: {
          prompt: req.prompt,
          aspect_ratio: hunyuanAspect,
          resolution: "720p",
          num_frames: duration >= 10 ? 129 : 85,
          enable_safety_checker: false,
        },
      };
    }
    default:
      throw new ProviderError(
        `No Fal.ai endpoint is mapped for video model "${req.modelId}". It stays in the catalog, but this run cannot start.`,
      );
  }
}

export function resolveFalCall(req: GenerateRequest): FalCall {
  if (req.modality === "image") return buildImageCall(req);
  return buildVideoCall(req);
}

export function falKeyConfigured(): boolean {
  return Boolean(process.env.FAL_KEY?.trim());
}

export function assertFalKey(): void {
  if (!falKeyConfigured()) {
    throw new ProviderError(
      "FAL_KEY is not set. Add your Fal.ai API key to .env — generation cannot run without it.",
    );
  }
}
