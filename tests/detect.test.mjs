import assert from "node:assert/strict";
import { detect, fingerprint, machinePrompt } from "../scripts/detect.mjs";

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

// --- prompts a program wrote -------------------------------------------------
// On one machine 3,636 of 3,784 "corrections" were two launch templates. These
// are the shapes they and their kin take; none is a person correcting an agent.
const MACHINE = {
  "Workspace boundary (important):\n- Confine source, project, user-data, and system file changes to this worktree. Do not modify files anywhere else.": "a pipeline launch template",
  "You are collecting evidence for the docket from a stretch of a Claude Code session.\nThe docket never uses ...": "an agent role prompt",
  "You are reviewing a finished stretch of a Claude Code session for durable project knowledge.": "an agent role prompt",
  "You are drafting a Claude Code skill from an improvement proposal.\n\nReturn ONLY a JSON object": "an agent role prompt",
  "You are given a Question, a Model Prediction with Explanation for the\nprediction": "an agent role prompt",
  "<task-notification>\n<task-id>a6de8a7884a0992d1</task-id>\n<status>completed</status>\nActually, never mind": "a Claude Code notification",
  "<system-reminder>\nStop hook blocking error</system-reminder>": "a Claude Code notification",
  "\u2063FIRSTMATE_OP: v1 launch-brief: # Current worker role contract": "a Firstmate launch",
  "Firstmate operational input waiting: read '/x/y.msg' and handle its contents": "a Firstmate launch",
  "After reading the complete session-start digest, reply with exactly CYCLE0 and stop. Never run anything else.": "a Firstmate launch",
  "Question: what secrets in this app?\n\nExhibits:\n\n[agent.ada] AgentCore agent": "a retrieval prompt",
  "Question: What does the Neo4j adapter depend on?\nAsked: 2026-11-03T03:06:23.828Z": "a retrieval prompt",
  "Decided: Yes — for: “Build second-mate visibility into Wheelhouse core instead of a plugin?”": "a decision button"
};
for (const [prompt, reason] of Object.entries(MACHINE)) {
  assert.equal(machinePrompt(prompt), reason, prompt.slice(0, 40));
}

// What a person types stays, including relayed words and pasted text.
for (const prompt of [
  "no you run the build to publish",
  "You are wrong, the timeout is in milliseconds",
  "Actually hold of on that, deploy as live preview (setup the plugin)",
  "> Replying to Firstmate: “Captain, the core platform is merged.” never merge without asking",
  "[project time-capsule] actually, maybe we should allow all to see the stream",
  "<pasted_content id=\"4ceb\">\nI think docket may suck a bit, its a bit slow",
  "Decided: Go — for: “Start the video?”\n\nI actually do want a voice over",
  "Question for you: should we always use pnpm?"
]) {
  assert.equal(machinePrompt(prompt), undefined, prompt.slice(0, 40));
}

assert.equal(machinePrompt(undefined), undefined);

console.log("machine prompt tests passed");

// Grouping near-identical fingerprints is what makes a repeat detectable at all.
const { similarity, topRepeatedCorrection } = await import("../scripts/lib.mjs");
assert.equal(similarity("a-b-c", "a-b-c"), 1);
assert.equal(similarity("a-b-c", "x-y-z"), 0);
assert.equal(similarity("", "a"), 0);
assert.ok(similarity("existing-helper-new-one", "existing-helper-one-writing") >= 0.6);

const grouped = topRepeatedCorrection({
  candidate_groups: {
    "existing-helper-new-one": { count: 1, sessions: ["a"] },
    "existing-helper-one-writing": { count: 2, sessions: ["b", "c"] },
    "timeout-milliseconds": { count: 1, sessions: ["a"] }
  }
});
assert.equal(grouped.count, 3, "similar fingerprints group; an unrelated one does not");
assert.equal(grouped.sessions, 3, "a group counts the separate sessions it was seen in");
assert.ok(grouped.members.length === 2);
assert.equal(topRepeatedCorrection({}), undefined);
// The older word-set counts were mostly launch templates; they no longer count.
assert.equal(topRepeatedCorrection({ correction_fingerprints: { "a-b": 9 } }), undefined);

console.log("fingerprint grouping tests passed");
