import assert from "node:assert/strict";
import { detect, fingerprint } from "../scripts/detect.mjs";

// Corrections. These are the signal eight of the ten documented review triggers
// need and tool metadata cannot provide.
const CORRECTIONS = [
  "no, use the existing helper",
  "don't use axios here",
  "that's wrong, the timeout is in milliseconds",
  "actually, put it in the service layer",
  "instead of a new table, extend the existing one",
  "you shouldn't have committed that",
  "why did you add a dependency?",
  "I said use the repository pattern",
  "stop adding comments to every line"
];
for (const prompt of CORRECTIONS) {
  const found = detect(prompt);
  assert.equal(found.matched, true, `must detect: ${prompt}`);
  assert.ok(["correction", "directive"].includes(found.category), `${prompt} -> ${found.category}`);
}

// Directives are the highest-confidence signal: the human said it should persist.
for (const prompt of ["remember: always run the linter", "from now on use pnpm", "never deploy on a Friday"]) {
  const found = detect(prompt);
  assert.equal(found.matched, true, `must detect: ${prompt}`);
  assert.equal(found.category, "directive", prompt);
  assert.equal(found.confidence, 0.95);
}

for (const prompt of ["perfect, that's exactly right", "works now"]) {
  assert.equal(detect(prompt).category, "approval", prompt);
}

// Questions and pleasantries carry nothing reusable.
for (const prompt of [
  "how do I run the tests?",
  "what does this function do?",
  "can you explain the hook order?",
  "thanks",
  "ok",
  "add a login page"
]) {
  assert.equal(detect(prompt).matched, false, `must not detect: ${prompt}`);
}

// A directive phrased as a question is still a directive.
assert.equal(detect("remember: can you always run the linter?").matched, true);

assert.equal(detect("").matched, false);
assert.equal(detect(undefined).matched, false);

// A long prompt is truncated rather than stored whole.
const long = `no, use the helper ${"x".repeat(500)}`;
const truncated = detect(long);
assert.ok(truncated.excerpt.length <= 281, "excerpt is bounded");
assert.ok(truncated.excerpt.endsWith("…"));

// The fingerprint collapses wording so a repeat is recognisable.
assert.equal(
  fingerprint("no, use the existing helper"),
  fingerprint("Actually you should use the existing helper"),
  "the same correction reworded shares a fingerprint"
);
assert.notEqual(
  fingerprint("no, use the existing helper"),
  fingerprint("no, the timeout is in milliseconds")
);
assert.equal(fingerprint(undefined), "");

console.log("correction detection tests passed");

// Grouping near-identical fingerprints is what makes a repeat detectable at all.
const { similarity, topRepeatedCorrection } = await import("../scripts/lib.mjs");
assert.equal(similarity("a-b-c", "a-b-c"), 1);
assert.equal(similarity("a-b-c", "x-y-z"), 0);
assert.equal(similarity("", "a"), 0);
assert.ok(similarity("existing-helper-new-one", "existing-helper-one-writing") >= 0.6);

const grouped = topRepeatedCorrection({
  correction_fingerprints: {
    "existing-helper-new-one": 1,
    "existing-helper-one-writing": 1,
    "timeout-milliseconds": 1
  }
});
assert.equal(grouped.count, 2, "similar fingerprints group; an unrelated one does not");
assert.ok(grouped.members.length === 2);
assert.equal(topRepeatedCorrection({}), undefined);

console.log("fingerprint grouping tests passed");
