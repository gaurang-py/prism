import "../src/lib/load-env";
import assert from "node:assert/strict";
import test from "node:test";
import { MODELS, durationsFor } from "../src/lib/models";
import { googleKeyConfigured } from "../src/lib/providers/google";
import { runGeneration } from "../src/lib/providers";
import type { AspectRatio, OutputResolution, VideoDuration } from "../src/lib/types";

/**
 * These hit the real Gemini API.
 *
 * Google validates the request body BEFORE it checks quota — a malformed
 * payload comes back 400 INVALID_ARGUMENT, a well-formed one comes back 429
 * once the project has no image/video quota. So on a free-tier key, "billing"
 * in the error is proof the payload we build is one Google accepts. The moment
 * billing is on, these same calls generate for real.
 */
const GOOGLE_MODELS = MODELS.filter((m) => m.provider === "google");

const CASES: Array<{ aspectRatio: AspectRatio; resolution: OutputResolution }> = [
  { aspectRatio: "16:9", resolution: "1K" },
  { aspectRatio: "9:16", resolution: "2K" },
  { aspectRatio: "1:1", resolution: "1K" },
  { aspectRatio: "4:3", resolution: "2K" },
  { aspectRatio: "3:4", resolution: "1K" },
];

const skip = googleKeyConfigured() ? false : "GOOGLE_API_KEY is not set";

for (const model of GOOGLE_MODELS) {
  // Send every clip length the dock actually offers for this model.
  const durations: Array<VideoDuration | null> =
    model.modality === "video" ? [...durationsFor(model.id)] : [null];
  for (const shape of CASES) {
   for (const duration of durations) {
    const label = `${model.id} ${shape.aspectRatio} ${shape.resolution}${duration ? ` ${duration}s` : ""}`;
    test(`live: Google accepts the payload for ${label}`, { skip, concurrency: false }, async () => {
      let message = "";
      try {
        await runGeneration({
          modelId: model.id,
          modality: model.modality,
          prompt: "A lone red umbrella on a rain-soaked street at night, cinematic",
          aspectRatio: shape.aspectRatio,
          resolution: model.modality === "video"
            ? (shape.resolution === "2K" ? "1080p" : "720p")
            : shape.resolution,
          duration,
          firstFrameUrl: null,
        });
        return; // billing is on and it actually generated — also a pass
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }

      assert.doesNotMatch(
        message,
        /invalid|out of bound|does not support|must be one of|unknown name|not supported/i,
        `Google rejected our request shape for ${label}: ${message}`,
      );
      assert.match(
        message,
        /billing|quota/i,
        `expected a quota/billing gate for ${label}, got: ${message}`,
      );
    });
   }
  }
}
