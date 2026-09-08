import assert from "node:assert/strict";
import test from "node:test";
import {
  isAllowedReferenceKey,
  mergeReferenceKeys,
  normalizeReferenceKeys,
  referenceImageUrls,
} from "../src/lib/references";

test("only generations/ and characters/ keys are accepted", () => {
  assert.equal(isAllowedReferenceKey("generations/uploads/a.png"), true);
  assert.equal(isAllowedReferenceKey("characters/u/c/a.png"), true);
  assert.equal(isAllowedReferenceKey("avatars/u.png"), false);
  assert.equal(isAllowedReferenceKey("../etc/passwd"), false);
});

test("mergeReferenceKeys dedupes, keeps order, and caps at 8", () => {
  const keys = mergeReferenceKeys(
    ["characters/a.png", "generations/b.png"],
    ["generations/b.png", "generations/c.png"],
    Array.from({ length: 10 }, (_, i) => `generations/${i}.png`),
  );
  assert.equal(keys[0], "characters/a.png");
  assert.equal(keys.length, 8);
});

test("normalizeReferenceKeys drops illegal values", () => {
  assert.deepEqual(normalizeReferenceKeys(["generations/a.png", 1, null, "nope"]), ["generations/a.png"]);
});

test("referenceImageUrls puts firstFrameUrl first without duplicating", () => {
  assert.deepEqual(
    referenceImageUrls({
      firstFrameUrl: "https://a",
      referenceUrls: ["https://b", "https://a"],
    }),
    ["https://a", "https://b"],
  );
});
