import assert from "node:assert/strict";
import test from "node:test";
import { clipJobError, refundAmountForFailedJob } from "../src/lib/credit-refund";

test("clipJobError truncates at 1000 characters", () => {
  const long = "x".repeat(1500);
  assert.equal(clipJobError(long).length, 1000);
  assert.equal(clipJobError("short"), "short");
});

test("refundAmountForFailedJob returns spend once, then zero", () => {
  assert.equal(refundAmountForFailedJob({ creditsSpent: 8, creditsRefunded: false }), 8);
  assert.equal(refundAmountForFailedJob({ creditsSpent: 8, creditsRefunded: true }), 0);
  assert.equal(refundAmountForFailedJob({ creditsSpent: 0, creditsRefunded: false }), 0);
  assert.equal(refundAmountForFailedJob({ creditsSpent: -1, creditsRefunded: false }), 0);
});
