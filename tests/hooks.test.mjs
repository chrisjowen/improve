import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "improve-plugin-"));
const project = path.join(temp, "project");
const data = path.join(temp, "data");
fs.mkdirSync(project, { recursive: true });

// A person's session, whatever lane the suite itself runs in.
const PERSON = { FM_TASK_ID: "", CLAUDE_CODE_ENTRYPOINT: "cli", CLAUDE_CODE_SESSION_ATTENDED: "1", IMPROVE_AGENT_CHILD: "", IMPROVE_DREAM_CHILD: "" };

function run(script, args, input, extraEnv = {}) {
  return spawnSync(process.execPath, [path.join(pluginRoot, "scripts", script), ...args], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: {
      ...process.env,
      ...PERSON,
      CLAUDE_PROJECT_DIR: project,
      CLAUDE_PLUGIN_DATA: data,
      ...extraEnv
    }
  });
}
const status = () => JSON.parse(run("status.mjs", [project], {}).stdout);

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

const summary = status();
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
assert.equal(status().state.tool_failures_since_review, 1);

// --- review due: rates, not totals --------------------------------------------
// Three failures used to make a review due for good, whatever the work around
// them. A failure rate needs enough calls to mean anything: 300 by default.
for (let attempt = 2; attempt <= 30; attempt += 1) {
  run("capture-event.mjs", ["PostToolUseFailure"], { session_id: "s1", tool_name: "Bash", error: `Command failed ${attempt}` });
}
assert.doesNotMatch(run("session-start.mjs", [], { session_id: "s2" }).stdout, /review is due/, "30 failures in 31 calls is too little work to judge");

const stateFile = path.join(summary.data_location, "state.json");
const setState = (patch) => fs.writeFileSync(stateFile, JSON.stringify({ ...JSON.parse(fs.readFileSync(stateFile, "utf8")), ...patch }));
setState({ tool_calls_since_review: 1000, tool_failures_since_review: 30 });
assert.doesNotMatch(run("session-start.mjs", [], { session_id: "s3" }).stdout, /review is due/, "3% of calls failing is ordinary");
setState({ tool_calls_since_review: 400, tool_failures_since_review: 30 });
const triggered = run("session-start.mjs", [], { session_id: "s4", source: "startup" });
assert.equal(triggered.status, 0, triggered.stderr);
assert.match(triggered.stdout, /review is due \(8% of tool calls failed since the last harness review \(30 of 400\)\)/);

// A session a program launched is counted as work, but nobody there can be
// offered a review, so it gets no nudge.
for (const env of [{ CLAUDE_CODE_ENTRYPOINT: "sdk-cli" }, { CLAUDE_CODE_SESSION_ATTENDED: "0" }, { FM_TASK_ID: "fix-login" }]) {
  const quiet = run("session-start.mjs", [], { session_id: "auto" }, env);
  assert.equal(quiet.status, 0, quiet.stderr);
  assert.equal(quiet.stdout, "", `no nudge for ${JSON.stringify(env)}`);
}
// An interactive front end built on the SDK has a person typing into it.
const sdkHosted = run("session-start.mjs", [], { session_id: "ide" }, { CLAUDE_CODE_ENTRYPOINT: "sdk-ts" });
assert.match(sdkHosted.stdout, /review is due/, "an SDK-hosted interactive session is a person's");
const counted = status().state;
assert.equal(counted.sessions_since_review, 8, "every session is work done");
assert.equal(counted.human_sessions_since_review, 5, "only a person's sessions are opportunities to correct");

// `review-cli.mjs reviewed` records the review and starts every count again.
const reviewed = spawnSync(process.execPath, [path.join(pluginRoot, "scripts", "review-cli.mjs"), "reviewed", project], {
  encoding: "utf8", env: { ...process.env, ...PERSON, CLAUDE_PLUGIN_DATA: data }
});
assert.equal(reviewed.status, 0, reviewed.stderr);
assert.equal(JSON.parse(reviewed.stdout).counts.tool_failures, 30);
const afterReview = status().state;
assert.ok(afterReview.last_reviewed_at, "a review is on record");
assert.equal(afterReview.tool_calls_since_review, 0);
assert.equal(afterReview.tool_failures_since_review, 0);
assert.equal(afterReview.last_review.tool_calls, 400);
assert.deepEqual(status().review_due_reasons, []);

// --- corrections ---------------------------------------------------------------
// Tool metadata cannot show that the same correction repeats, which is a trigger
// the skill documents. A prompt hook supplies it, as a candidate.
const correction = run("capture-prompt.mjs", [], {
  session_id: "s3",
  prompt: "no, use the existing helper instead of a new one"
});
assert.equal(correction.status, 0, correction.stderr);

const afterCorrection = status();
assert.equal(afterCorrection.observations.corrections, 1);
assert.equal(afterCorrection.state.candidates_since_review, 1);
const recorded = JSON.parse(fs.readFileSync(path.join(afterCorrection.data_location, "corrections.jsonl"), "utf8").trim());
assert.equal(recorded.status, "candidate", "a model confirms it at review time");

// A question is not a correction and must not be stored.
run("capture-prompt.mjs", [], { session_id: "s3", prompt: "how do I run the tests?" });
assert.equal(status().observations.corrections, 1, "a question must not be captured");

// A prompt a program wrote is skipped, however much it sounds like a rule. This
// boilerplate alone was 2,954 of 3,805 recorded corrections on one machine.
const boilerplate = "Workspace boundary (important):\n- Confine changes to this worktree. Do not modify files elsewhere; never use git push.";
run("capture-prompt.mjs", [], { session_id: "w", prompt: boilerplate });
run("capture-prompt.mjs", [], { session_id: "w", prompt: "<task-notification>\n<status>completed</status>\nnever use the cache</task-notification>" });
// So is any prompt in a session a program launched.
run("capture-prompt.mjs", [], { session_id: "p", prompt: "never deploy on a Friday" }, { CLAUDE_CODE_ENTRYPOINT: "sdk-cli" });
run("capture-prompt.mjs", [], { session_id: "f", prompt: "never deploy on a Friday" }, { FM_TASK_ID: "fix-login" });
const skipped = status();
assert.equal(skipped.observations.corrections, 1, "no prompt from a program is recorded");
assert.deepEqual(skipped.state.machine_prompts_skipped, {
  "a pipeline launch template": 1,
  "a Claude Code notification": 1,
  "a print-mode session": 1,
  "a Firstmate worker": 1
});
// A person typing into an SDK-hosted front end is recorded.
run("capture-prompt.mjs", [], { session_id: "s3", prompt: "no, use the existing helper rather than a new one" }, { CLAUDE_CODE_ENTRYPOINT: "sdk-py" });
assert.equal(status().observations.corrections, 2, "an SDK-hosted person's correction is recorded");

// A credential in a captured prompt must not reach disk.
run("capture-prompt.mjs", [], {
  session_id: "s3",
  prompt: "no, use the token ghp_1234567890abcdefghijklmnopqrstuvwx instead"
});
const correctionsFile = path.join(status().data_location, "corrections.jsonl");
assert.equal(status().observations.corrections, 3);
const capturedText = fs.readFileSync(correctionsFile, "utf8");
assert.ok(!capturedText.includes("ghp_1234567890abcdefghijklmnopqrstuvwx"), "the token must be redacted");
// Which rule fires depends on which match starts first; "token ghp_..." is
// caught by generic_assignment before github_token sees it. What matters is
// that a secret rule fired and the value did not reach disk.
assert.match(capturedText, /REDACTED:secret:/);

// The same correction, reworded, in one session is one conversation, not a
// pattern. In three separate sessions it makes a review due.
for (const phrasing of [
  "actually you should use the existing helper instead",
  "no, use the existing helper instead of writing one"
]) {
  run("capture-prompt.mjs", [], { session_id: "s4", prompt: phrasing });
}
const oneSession = status();
assert.ok(oneSession.repeated_correction, "a repeated correction is reported");
assert.ok(!oneSession.review_due_reasons.some((reason) => /same correction/.test(reason)), "two sessions are not yet a pattern");
run("capture-prompt.mjs", [], { session_id: "s5", prompt: "no, use the existing helper instead of a new one" });
const repeats = status();
assert.equal(repeats.repeated_correction.sessions, 3);
assert.ok(
  repeats.review_due_reasons.some((reason) => /same correction came up in 3 separate sessions/.test(reason)),
  "a correction in three separate sessions makes a review due"
);

// --- approved, not applied ----------------------------------------------------
// Approval changes no file. A person's session is told what waits, so the
// change can land there with their own login.
const proposals = path.join(project, ".harness", "proposals");
fs.mkdirSync(proposals, { recursive: true });
fs.writeFileSync(path.join(proposals, "IMP-1.yaml"), "id: IMP-1\ntitle: Run the linter after edits\nstatus: approved\noutcome:\n  measurements: []\n  conclusion: null\n");
fs.writeFileSync(path.join(proposals, "IMP-2.yaml"), "id: IMP-2\ntitle: Applied\nstatus: validated\noutcome:\n  applied_at: 2026-11-01T00:00:00Z\n");
fs.writeFileSync(path.join(proposals, "IMP-3.yaml"), "id: IMP-3\ntitle: On a branch\nstatus: approved\nupstream_change:\n  branch: improve/imp-3\n");
const pending = run("session-start.mjs", [], { session_id: "s6" });
assert.match(pending.stdout, /1 approved harness proposal is not applied yet: IMP-1\./);
assert.match(pending.stdout, /\/improve apply <id>/);
assert.equal(run("session-start.mjs", [], { session_id: "s7" }, { FM_TASK_ID: "w" }).stdout, "", "not in a worker");
fs.rmSync(path.join(project, ".harness", "proposals"), { recursive: true });

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

const noRig = status();
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

// --- concurrent updates to the shared state -----------------------------------
// Every worktree of a repository writes one state.json. Updates that race must
// all count, and a review recorded among them must not be undone.
{
  const before = status().state;
  const runAsync = (script, args, input) => new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(pluginRoot, "scripts", script), ...args], {
      env: { ...process.env, ...PERSON, CLAUDE_PROJECT_DIR: project, CLAUDE_PLUGIN_DATA: data }
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (code) => resolve({ code, stderr }));
    child.stdin.end(JSON.stringify(input));
  });
  const calls = 24;
  const results = await Promise.all([
    ...Array.from({ length: calls }, (_, index) => runAsync("capture-event.mjs", ["PostToolUse"], { session_id: `c${index}`, tool_name: "Read" })),
    runAsync("review-cli.mjs", ["reviewed", project], {})
  ]);
  for (const result of results) {
    assert.equal(result.code, 0, result.stderr);
    assert.doesNotMatch(result.stderr, /skipped/, result.stderr);
  }
  const after = status().state;
  assert.notEqual(after.last_reviewed_at, before.last_reviewed_at, "the review stays recorded");
  assert.equal(
    after.tool_calls_since_review + after.last_review.tool_calls,
    before.tool_calls_since_review + calls,
    "every call is counted, before the review or after it"
  );
}

console.log("hook tests passed");
