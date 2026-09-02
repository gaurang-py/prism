import assert from "node:assert/strict";
import test from "node:test";
import { MODELS, getModel, defaultModelId, cheapestVideoModel } from "../src/lib/models";
import {
  buildGoogleImageRequest,
  buildGoogleVideoRequest,
  googleMessage,
  googleModelId,
  veoAspect,
  veoDuration,
} from "../src/lib/providers/google";
import { providerForModel } from "../src/lib/providers";
import type { GenerateRequest } from "../src/lib/providers/types";
import { ASPECT_RATIOS } from "../src/lib/types";

const GOOGLE_IDS = MODELS.filter((m) => m.provider === "google").map((m) => m.id);

function req(over: Partial<GenerateRequest> = {}): GenerateRequest {
  return {
    modelId: "nano-banana-2",
    modality: "image",
    prompt: "a red umbrella in the rain",
    aspectRatio: "16:9",
    resolution: "1K",
    duration: null,
    firstFrameUrl: null,
    ...over,
  };
}

test("catalog: every model declares a provider and ids are unique", () => {
  const ids = MODELS.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate model id in catalog");
  for (const model of MODELS) {
    assert.ok(model.provider === "fal" || model.provider === "google", `${model.id} has no provider`);
    assert.ok(model.mockCredits > 0, `${model.id} must cost credits`);
  }
});

test("catalog: every google model maps to a Gemini model id", () => {
  assert.equal(GOOGLE_IDS.length, 6, "expected six Google models");
  for (const id of GOOGLE_IDS) {
    assert.ok(googleModelId(id), `${id} has no Gemini model id`);
    assert.equal(providerForModel(id), "google");
  }
});

test("catalog: fal models still route to fal", () => {
  assert.equal(providerForModel("flux-2-schnell"), "fal");
  assert.equal(providerForModel("ltx-2"), "fal");
  assert.equal(providerForModel("does-not-exist"), "fal", "unknown ids fall back to fal");
});

test("catalog: google models lead, so they are the defaults", () => {
  assert.equal(getModel(defaultModelId("image"))!.provider, "google");
  assert.equal(getModel(defaultModelId("video"))!.provider, "google");
});

test("catalog: adding Veo did not steal the cheapest-video home hero", () => {
  assert.equal(cheapestVideoModel().id, "ltx-2");
});

test("image: every studio aspect ratio passes through untouched", () => {
  // Verified against the API: Gemini image models accept 1:1, 3:4, 4:3, 9:16, 16:9.
  for (const ratio of ASPECT_RATIOS) {
    const call = buildGoogleImageRequest(req({ aspectRatio: ratio }));
    assert.equal(call.config.imageConfig.aspectRatio, ratio);
  }
});

test("image: resolution maps to imageSize, defaulting to 1K", () => {
  assert.equal(buildGoogleImageRequest(req({ resolution: "2K" })).config.imageConfig.imageSize, "2K");
  assert.equal(buildGoogleImageRequest(req({ resolution: "1K" })).config.imageConfig.imageSize, "1K");
  assert.equal(buildGoogleImageRequest(req({ resolution: null })).config.imageConfig.imageSize, "1K");
});

test("image: TEXT is allowed alongside IMAGE so Nano Banana Pro can think", () => {
  assert.deepEqual(buildGoogleImageRequest(req()).config.responseModalities, ["TEXT", "IMAGE"]);
});

test("image: a first frame is inlined ahead of the prompt", () => {
  const plain = buildGoogleImageRequest(req());
  assert.equal(plain.contents[0].parts.length, 1);
  assert.equal(plain.contents[0].parts[0].text, "a red umbrella in the rain");

  const edited = buildGoogleImageRequest(req(), { data: "QUJD", mimeType: "image/png" });
  assert.equal(edited.contents[0].parts.length, 2);
  assert.deepEqual(edited.contents[0].parts[0], {
    inlineData: { mimeType: "image/png", data: "QUJD" },
  });
  assert.equal(edited.contents[0].parts[1].text, "a red umbrella in the rain");
});

test("image: model id resolves to the real Gemini endpoint", () => {
  assert.equal(buildGoogleImageRequest(req({ modelId: "nano-banana" })).model, "gemini-2.5-flash-image");
  assert.equal(buildGoogleImageRequest(req({ modelId: "nano-banana-2" })).model, "gemini-3.1-flash-image");
  assert.equal(buildGoogleImageRequest(req({ modelId: "nano-banana-pro" })).model, "gemini-3-pro-image");
});

test("image: an unmapped model fails loudly instead of guessing", () => {
  assert.throws(() => buildGoogleImageRequest(req({ modelId: "flux-2-schnell" })), /No Google model is mapped/);
});

test("veo: only 16:9 and 9:16 exist, so portrait ratios fold to 9:16", () => {
  // The API rejects 4:3 outright, so the mapper has to collapse it.
  assert.equal(veoAspect("9:16"), "9:16");
  assert.equal(veoAspect("3:4"), "9:16");
  assert.equal(veoAspect("16:9"), "16:9");
  assert.equal(veoAspect("4:3"), "16:9");
  assert.equal(veoAspect("1:1"), "16:9");
});

test("veo: duration clamps to the 4/6/8 the API accepts", () => {
  // The studio offers 5s and 10s; 5 and 10 are both 400s from Veo.
  assert.equal(veoDuration(5), 6);
  assert.equal(veoDuration(10), 8);
  assert.equal(veoDuration(null), 6);
  for (const d of [5, 10, null, undefined] as const) {
    assert.ok([4, 6, 8].includes(veoDuration(d)), `${d} produced an out-of-range duration`);
  }
});

test("veo: request uses `source`, asks for one sample, and omits generateAudio", () => {
  const call = buildGoogleVideoRequest(req({ modelId: "veo-3.1", modality: "video", duration: 10, resolution: "1080p" }));
  assert.equal(call.model, "veo-3.1-generate-preview");
  assert.equal(call.source.prompt, "a red umbrella in the rain");
  assert.equal(call.config.numberOfVideos, 1, "sampleCount must be exactly 1");
  assert.equal(call.config.durationSeconds, 8);
  assert.equal(call.config.resolution, "1080p");
  assert.equal(call.config.aspectRatio, "16:9");
  assert.ok(!("generateAudio" in call.config), "generateAudio is rejected on the Developer API");
  assert.ok(!("personGeneration" in call.config), "allow_adult is rejected on the Developer API");
});

test("veo: resolution defaults to 720p", () => {
  const call = buildGoogleVideoRequest(req({ modelId: "veo-3.1-lite", modality: "video", resolution: null }));
  assert.equal(call.config.resolution, "720p");
});

test("veo: a first frame becomes source.image bytes", () => {
  const call = buildGoogleVideoRequest(
    req({ modelId: "veo-3.1-fast", modality: "video" }),
    { data: "QUJD", mimeType: "image/jpeg" },
  );
  assert.deepEqual(call.source.image, { imageBytes: "QUJD", mimeType: "image/jpeg" });
});

test("errors: quota is reported as a billing problem, not a mystery", () => {
  const raw = 'got status: 429. {"error":{"code":429,"message":"You exceeded your current quota","status":"RESOURCE_EXHAUSTED"}}';
  assert.match(googleMessage(new Error(raw)), /enable billing/i);
});

test("errors: a bad key is reported as a key problem", () => {
  const raw = '{"error":{"code":401,"message":"API key not valid"}}';
  assert.match(googleMessage(new Error(raw)), /GOOGLE_API_KEY/);
});

test("errors: safety blocks name the NSFW route", () => {
  const raw = '{"error":{"code":400,"message":"blocked by safety filters"}}';
  assert.match(googleMessage(new Error(raw)), /NSFW/);
});
