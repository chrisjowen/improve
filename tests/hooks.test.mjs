import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "improve-plugin-"));
const project = path.join(temp, "project");
const data = path.join(temp, "data");
fs.mkdirSync(project, { recursive: true });

function run(script, args, input, extraEnv = {}) {
  return spawnSync(process.execPath, [path.join(pluginRoot, "scripts", script), ...args], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: project,
      CLAUDE_PLUGIN_DATA: data,
      ...extraEnv
    }
  });
}

// A repository that has never been reviewed is not overdue for review. Nudging on
// a cold start trains the user to ignore the only channel we have.
const start = run("session-start.mjs", [], { session_id: "s1", source: "startup" });
assert.equal(start.status, 0, start.stderr);
assert.doesNotMatch(start.stdout, /review is due/);

const capture = run("capture-event.mjs", ["PostToolUse"], {
  session_id: "s1",
  tool_name: "Write",
  tool_input: {
    file_path: path.join(project, "src", "safe.js"),
    content: "SECRET_SHOULD_NOT_BE_CAPTURED"
  },
  tool_response: "SECRET_RESPONSE_SHOULD_NOT_BE_CAPTURED"
});
assert.equal(capture.status, 0, capture.stderr);

const status = run("status.mjs", [project], {});
assert.equal(status.status, 0, status.stderr);
const summary = JSON.parse(status.stdout);
assert.equal(summary.observations.by_event.PostToolUse, 1);
assert.ok(summary.observations.by_event.SessionStart >= 1);

const events = fs.readFileSync(path.join(summary.data_location, "events.jsonl"), "utf8");
assert.ok(!events.includes("SECRET_SHOULD_NOT_BE_CAPTURED"));
assert.ok(!events.includes("SECRET_RESPONSE_SHOULD_NOT_BE_CAPTURED"));
assert.ok(events.includes("src/safe.js"));

const failure = run("capture-event.mjs", ["PostToolUseFailure"], {
  session_id: "s1",
  tool_name: "Bash",
  error: "Command failed"
});
assert.equal(failure.status, 0, failure.stderr);

const statusAfterFailure = run("status.mjs", [project], {});
const after = JSON.parse(statusAfterFailure.stdout);
assert.equal(after.state.tool_failures_since_review, 1);

// Once a real trigger fires, the nudge must still appear. Default threshold is 3.
for (const attempt of [2, 3]) {
  const repeated = run("capture-event.mjs", ["PostToolUseFailure"], {
    session_id: "s1",
    tool_name: "Bash",
    error: `Command failed ${attempt}`
  });
  assert.equal(repeated.status, 0, repeated.stderr);
}

const triggered = run("session-start.mjs", [], { session_id: "s2", source: "startup" });
assert.equal(triggered.status, 0, triggered.stderr);
assert.match(triggered.stdout, /review is due/);
assert.match(triggered.stdout, /3 captured tool failures/);

// --- corrections -------------------------------------------------------------
// Tool metadata cannot show that the same correction repeats, which is a trigger
// the skill documents. A prompt hook supplies it.
const correction = run("capture-prompt.mjs", [], {
  session_id: "s3",
  prompt: "no, use the existing helper instead of a new one"
});
assert.equal(correction.status, 0, correction.stderr);

const afterCorrection = JSON.parse(run("status.mjs", [project], {}).stdout);
assert.equal(afterCorrection.observations.corrections, 1);
assert.equal(afterCorrection.state.corrections_since_review, 1);

// A question is not a correction and must not be stored.
run("capture-prompt.mjs", [], { session_id: "s3", prompt: "how do I run the tests?" });
assert.equal(
  JSON.parse(run("status.mjs", [project], {}).stdout).observations.corrections,
  1,
  "a question must not be captured"
);

// A credential in a captured prompt must not reach disk.
run("capture-prompt.mjs", [], {
  session_id: "s3",
  prompt: "no, use the token ghp_1234567890abcdefghijklmnopqrstuvwx instead"
});
const correctionsFile = path.join(
  JSON.parse(run("status.mjs", [project], {}).stdout).data_location,
  "corrections.jsonl"
);
const capturedText = fs.readFileSync(correctionsFile, "utf8");
assert.ok(!capturedText.includes("ghp_1234567890abcdefghijklmnopqrstuvwx"), "the token must be redacted");
// Which rule fires depends on which match starts first; "token ghp_..." is
// caught by generic_assignment before github_token sees it. What matters is
// that a secret rule fired and the value did not reach disk.
assert.match(capturedText, /REDACTED:secret:/);

// The same correction reworded must be recognised as a repeat, which is what
// makes "the same correction repeats" a usable trigger.
for (const phrasing of [
  "actually you should use the existing helper instead",
  "no, use the existing helper instead of writing one"
]) {
  run("capture-prompt.mjs", [], { session_id: "s4", prompt: phrasing });
}
const repeats = JSON.parse(run("status.mjs", [project], {}).stdout);
assert.ok(repeats.repeated_correction, "a repeated correction is reported");
// Grouping is by word overlap, so heavy rewording can still split a group.
// Two of the three phrasings above group; that is enough to fire the trigger.
assert.ok(repeats.repeated_correction.count >= 2, `expected >= 2, got ${repeats.repeated_correction.count}`);
assert.ok(
  repeats.review_due_reasons.some((reason) => /same correction/.test(reason)),
  "a repeated correction makes a review due"
);

// --- transcript availability -------------------------------------------------
// Observed evaluation reads session JSONL, and Claude Code prunes it, so the
// substrate can disappear silently.
assert.ok("transcripts" in repeats, "status reports transcript availability");
assert.equal(typeof repeats.transcripts.count, "number");

// Each repository keeps its own copy of the eval rig, so status has to show when
// that copy has fallen behind the plugin's.
const available = fs.readFileSync(
  path.join(pluginRoot, "assets", "eval-rig", "VERSION"), "utf8"
).trim();

const noRig = JSON.parse(run("status.mjs", [project], {}).stdout);
assert.equal(noRig.eval_rig.installed, null, "no installed copy yet");
assert.equal(noRig.eval_rig.available, available);
assert.equal(noRig.eval_rig.drifted, false, "absent is not drifted");

const evalsDir = path.join(project, ".harness", "evals");
fs.mkdirSync(evalsDir, { recursive: true });

fs.writeFileSync(path.join(evalsDir, "VERSION"), `${available}\n`);
const current = JSON.parse(run("status.mjs", [project], {}).stdout);
assert.equal(current.eval_rig.installed, available);
assert.equal(current.eval_rig.drifted, false, "matching versions are not drifted");

fs.writeFileSync(path.join(evalsDir, "VERSION"), "0.0.1\n");
const stale = JSON.parse(run("status.mjs", [project], {}).stdout);
assert.equal(stale.eval_rig.installed, "0.0.1");
assert.equal(stale.eval_rig.drifted, true, "an older copy must be reported as drifted");

console.log("hook tests passed");
