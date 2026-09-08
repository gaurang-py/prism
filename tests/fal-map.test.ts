import assert from "node:assert/strict";
import test from "node:test";
import { resolveFalCall } from "../src/lib/fal-map";
import type { GenerateRequest } from "../src/lib/providers/types";

function req(over: Partial<GenerateRequest> = {}): GenerateRequest {
  return {
    modelId: "flux-2-schnell",
    modality: "image",
    prompt: "a red umbrella",
    aspectRatio: "1:1",
    resolution: "1K",
    duration: null,
    firstFrameUrl: null,
    referenceUrls: null,
    ...over,
  };
}

test("flux image_urls receives every reference", () => {
  const call = resolveFalCall(
    req({
      firstFrameUrl: "https://a.example/1.png",
      referenceUrls: ["https://a.example/1.png", "https://b.example/2.png"],
    }),
  );
  assert.deepEqual(call.input.image_urls, ["https://a.example/1.png", "https://b.example/2.png"]);
});

test("kling image-to-video degrades to the primary frame", () => {
  const call = resolveFalCall(
    req({
      modelId: "kling-2.6",
      modality: "video",
      duration: 5,
      aspectRatio: "16:9",
      resolution: "720p",
      firstFrameUrl: "https://a.example/1.png",
      referenceUrls: ["https://a.example/1.png", "https://b.example/2.png"],
    }),
  );
  assert.equal(call.endpoint, "fal-ai/kling-video/v2.6/pro/image-to-video");
  assert.equal(call.input.start_image_url, "https://a.example/1.png");
  assert.equal(call.input.image_urls, undefined);
});
