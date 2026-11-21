// Replay A/B before approval, the gate's verdict on the proposal, regression
// checks on kept changes, and the measured outcome after a change lands.
// `claude plugin eval` is played by tests/fixtures/standin-eval.mjs.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { checkProposal } from "../scripts/proposal-check.mjs";
import { fingerprint } from "../scripts/detect.mjs";
import { projectId } from "../scripts/lib.mjs";
import {
  complies,
  keptProposals,
  maybeMeasureOutcomes,
  maybeStartRegression,
  measureOutcome,
  packageCandidate,
  readCandidate,
  regress,
  regressionDue,
  replayStatus,
  resolveProposal,
  scoreProposal
} from "../scripts/replay.mjs";
import { transcript } from "./fixtures/transcript.mjs";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const standin = path.join(pluginRoot, "tests", "fixtures", "standin-eval.mjs");
const temp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "improve-replay-")));
const root = path.join(temp, "repo");
const log = path.join(temp, "standin.jsonl");
const dataDir = path.join(temp, "data", "projects", projectId(root));
fs.mkdirSync(dataDir, { recursive: true });
process.env.IMPROVE_REPLAY_COMMAND = standin;
process.env.STANDIN_LOG = log;
const calls = () => (fs.existsSync(log) ? fs.readFileSync(log, "utf8").trim().split("\n").map((l) => JSON.parse(l)) : []);
const harness = (...p) => path.join(root, ".harness", ...p);
const write = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};

// A suite of four cases: three validation, one test.
const suite = {
  schema_version: 1,
  generated_at: "2026-11-20T00:00:00Z",
  cases: [
    { name: "correction-bun", kind: "correction", split: "validation", label: "Use bun", fingerprints: [fingerprint("use bun instead of npm")], graders: "deterministic", needs: [],
      checks: [{ type: "tool_used", name: "avoids-npm", tool: "Bash", input_match: "(^|[\\s;&|(\"])npm([\\s;&|)\"]|$)", max: 0 }] },
    { name: "correction-preview", kind: "correction", split: "validation", label: "Publish a preview", fingerprints: [], graders: "llm", needs: [], checks: [] },
    { name: "failure-read", kind: "tool-failure", split: "validation", label: "Read failed", fingerprints: [], graders: "deterministic", needs: [], checks: [] },
    { name: "correction-push", kind: "correction", split: "test", label: "No force push", fingerprints: [], graders: "deterministic", needs: [], checks: [] },
    { name: "needs-bash", kind: "tool-failure", split: "validation", label: "Bash failed", fingerprints: [], graders: "deterministic", needs: ["Bash"], checks: [] }
  ]
};
write(harness("evals", "replay", "suite.json"), JSON.stringify(suite));
for (const c of suite.cases) {
  write(harness("evals", "replay", "cases", c.name, "case.yaml"), `schema_version: "1.0"\nname: "${c.name}"\ncontext:\n  history_file: "history.jsonl"\nexecution:\n  prompt: "go"\nruns: 3\ngraders:\n  - type: "regex"\n    name: "x"\n    pattern: "x"\n`);
  write(harness("evals", "replay", "cases", c.name, "history.jsonl"), "{}\n");
}
write(harness("improve.json"), JSON.stringify({ replay: { max_cost_usd: 3, regression: { max_cost_usd: 1, min_interval_minutes: 60 } } }));

const proposal = (id, status, extra = "") => `id: ${id}
title: "Tell the agent to use bun"
layer: instructions
status: ${status}
owner: chris
scope:
  files:
    - CLAUDE.md
evaluation:
  pass_conditions:
    - "the replay gate passes"
rollback: "Remove the bun line from CLAUDE.md."
outcome:
  measurements: []
  conclusion: null
  applied_at: null
  applied_by: null
${extra}`;

write(harness("proposals", "IMP-20261120-bun.yaml"), proposal("IMP-20261120-bun", "proposed"));
write(harness("proposals", "IMP-20261120-bun.candidate", "lesson.md"), "Use bun for installs and scripts, never npm.\n");
write(harness("proposals", "IMP-20261120-bun.candidate", "candidate.json"), JSON.stringify({ targets: ["correction-bun"] }));
write(harness("proposals", "IMP-20261120-bun.candidate", "skills", "bun", "SKILL.md"), "---\nname: bun\ndescription: use bun\n---\nUse bun.\n");

// --- the candidate -----------------------------------------------------------
assert.equal(resolveProposal(root, "IMP-20261120-bun"), "IMP-20261120-bun.yaml");
assert.equal(resolveProposal(root, "IMP-20261120-bun.yaml"), "IMP-20261120-bun.yaml");
assert.equal(resolveProposal(root, "nope"), undefined);
const candidate = readCandidate(root, "IMP-20261120-bun.yaml");
assert.deepEqual(candidate.kinds, ["lesson", "skills"]);
assert.deepEqual(candidate.targets, ["correction-bun"]);
assert.match(candidate.digest, /^[0-9a-f]{64}$/);

const pkg = fs.mkdtempSync(path.join(temp, "pkg-"));
packageCandidate(root, "IMP-20261120-bun.yaml", pkg);
assert.ok(fs.existsSync(path.join(pkg, "skills", "bun", "SKILL.md")), "skills are copied as they are");
assert.ok(!fs.existsSync(path.join(pkg, "candidate.json")) && !fs.existsSync(path.join(pkg, "lesson.md")));
const hooks = JSON.parse(fs.readFileSync(path.join(pkg, "hooks", "hooks.json"), "utf8"));
assert.deepEqual(hooks.hooks.SessionStart[0].hooks[0].args, ["${CLAUDE_PLUGIN_ROOT}/improve-replay/lesson.mjs"], "a lesson rides as a SessionStart hook");
// The lesson hook prints the lesson as SessionStart additionalContext.
const lessonOut = spawnSync(process.execPath, [path.join(pkg, "improve-replay", "lesson.mjs")], { encoding: "utf8" });
assert.deepEqual(JSON.parse(lessonOut.stdout), { hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: "Use bun for installs and scripts, never npm.\n" } });

// A candidate with a symbolic link is refused; a proposal without one is told where it goes.
write(harness("proposals", "IMP-x.yaml"), proposal("IMP-x", "proposed"));
fs.mkdirSync(harness("proposals", "IMP-x.candidate"));
fs.symlinkSync("/etc/hosts", harness("proposals", "IMP-x.candidate", "lesson.md"));
assert.throws(() => readCandidate(root, "IMP-x.yaml"), /symbolic link/);
fs.rmSync(harness("proposals", "IMP-x.candidate"), { recursive: true });
assert.throws(() => packageCandidate(root, "IMP-x.yaml", fs.mkdtempSync(path.join(temp, "pkg-"))), /no candidate to replay: put the change, as it would land, in \.harness\/proposals\/IMP-x\.candidate\//);
await assert.rejects(scoreProposal({ root, file: "IMP-x.yaml", dataDir }), /no candidate to replay/);

// --- scoring: WITH beats WITHOUT on validation -------------------------------
process.env.STANDIN_SCORES = JSON.stringify({ "*": { with: [1, 1, 1], without: [0, 0, 1] } });
const scored = await scoreProposal({ root, file: "IMP-20261120-bun.yaml", dataDir, now: () => new Date("2026-11-21T00:00:00Z") });
assert.equal(scored.gate.verdict, "pass");
assert.equal(scored.validation.cases, 3);
assert.equal(scored.validation.with, 1);
assert.equal(scored.validation.without, 0.3333);
assert.equal(scored.validation.delta, 0.6667);
assert.deepEqual(scored.validation.cases_skipped, [{ case: "needs-bash", reason: "needs Bash, which replay.allow_tools does not grant" }]);
assert.equal(scored.test.cases, 1, "the gate passed, so the sealed test split ran");
assert.equal(scored.test.confirms, true);

const [validationCall, testCall] = calls();
assert.deepEqual(validationCall.args.slice(0, 2), ["plugin", "eval"]);
for (const flag of ["--ablation", "--runs", "--json", "--max-cost-usd", "--threshold", "--trust-plugin", "--no-publish"]) assert.ok(validationCall.args.includes(flag), flag);
assert.equal(validationCall.args[validationCall.args.indexOf("--ablation") + 1], "with-without");
assert.equal(validationCall.args[validationCall.args.indexOf("--runs") + 1], "3");
assert.equal(validationCall.args[validationCall.args.indexOf("--max-cost-usd") + 1], "3", "replay.max_cost_usd caps the run");
assert.ok(!validationCall.args.includes("--allow-tools"), "nothing withheld is granted");
assert.deepEqual(validationCall.cases, ["correction-bun", "correction-preview", "failure-read"]);
assert.equal(validationCall.lesson, "Use bun for installs and scripts, never npm.\n");
assert.equal(validationCall.env.IMPROVE_AGENT_CHILD, "1", "eval sessions do not count as a person's");
assert.deepEqual(testCall.cases, ["correction-push"]);
assert.ok(Number(testCall.args[testCall.args.indexOf("--max-cost-usd") + 1]) < 3, "the test split gets what is left of the ceiling");

// The verdict is recorded with the proposal.
const scoredText = fs.readFileSync(harness("proposals", "IMP-20261120-bun.yaml"), "utf8");
assert.match(scoredText, /^replay:$/m);
assert.match(scoredText, /^ {2}gate:\n {4}verdict: "pass"/m);
assert.match(scoredText, /^ {4}delta: 0\.6667$/m);
assert.match(scoredText, /^status: proposed$/m, "scoring approves nothing");
assert.ok(fs.readdirSync(harness("evals", "replay", "results", "IMP-20261120-bun")).length === 2, "both eval results are kept");
assert.equal(JSON.parse(fs.readFileSync(harness("evals", "replay", "sealed.json"), "utf8")).scored.length, 1);

// Scoring again re-runs validation but never the sealed test split.
fs.rmSync(log);
const rescored = await scoreProposal({ root, file: "IMP-20261120-bun.yaml", dataDir });
assert.equal(calls().length, 1, "only validation ran");
assert.match(rescored.test.note, /scored once for this proposal already/);
assert.equal((fs.readFileSync(harness("proposals", "IMP-20261120-bun.yaml"), "utf8").match(/^replay:$/gm) ?? []).length, 1, "the block is replaced, not repeated");

// A change that does not beat the baseline fails the gate and the test split stays sealed.
write(harness("proposals", "IMP-20261120-flat.yaml"), proposal("IMP-20261120-flat", "proposed"));
write(harness("proposals", "IMP-20261120-flat.candidate", "lesson.md"), "Be careful.\n");
process.env.STANDIN_SCORES = JSON.stringify({ "*": { with: [1, 0, 1], without: [1, 1, 0] }, "failure-read": { with: [0, 0, 0], without: [1, 1, 1] } });
fs.rmSync(log);
const flat = await scoreProposal({ root, file: "IMP-20261120-flat.yaml", dataDir });
assert.equal(flat.gate.verdict, "fail");
assert.deepEqual(flat.gate.regressions, ["failure-read"]);
assert.equal(flat.test, null);
assert.equal(calls().length, 1, "the test split did not run");

// A run the cost ceiling stopped is incomplete, never a pass.
process.env.STANDIN_SCORES = JSON.stringify({ "*": { with: [1, 1, 1], without: [0, 0, 0] } });
process.env.STANDIN_PARTIAL = "1";
assert.equal((await scoreProposal({ root, file: "IMP-20261120-flat.yaml", dataDir })).gate.verdict, "incomplete");
delete process.env.STANDIN_PARTIAL;

// Replay happens before approval.
write(harness("proposals", "IMP-approved.yaml"), proposal("IMP-approved", "approved"));
write(harness("proposals", "IMP-approved.candidate", "lesson.md"), "x\n");
await assert.rejects(scoreProposal({ root, file: "IMP-approved.yaml", dataDir }), /is approved\. Replay scores a proposal before it is approved/);

// A change that needs a real workspace runs each case in a fresh checkout.
write(harness("proposals", "IMP-lint.yaml"), proposal("IMP-lint", "proposed"));
write(harness("proposals", "IMP-lint.candidate", "candidate.json"), JSON.stringify({ workspace: true, cases: ["correction-bun"] }));
write(harness("proposals", "IMP-lint.candidate", "hooks", "hooks.json"), JSON.stringify({ hooks: { PostToolUse: [{ matcher: "Edit", hooks: [{ type: "command", command: "npx eslint ." }] }] } }));
fs.rmSync(log);
await scoreProposal({ root, file: "IMP-lint.yaml", dataDir });
const [lintCall] = calls();
assert.ok(lintCall.args.includes("--scaffold"));
assert.deepEqual(lintCall.cases, ["correction-bun"], "candidate.json narrows the cases");
assert.match(lintCall.caseYaml["correction-bun"], /^ {2}scaffold_script: "scaffold\.sh"$/m);
assert.ok(lintCall.files.includes(path.join("evals", "correction-bun", "scaffold.sh")));
assert.equal(lintCall.hooks.hooks.PostToolUse[0].hooks[0].command, "npx eslint .", "hooks are packaged as they are");
assert.equal(lintCall.lesson, null);

// --- regression checks on kept changes ---------------------------------------
assert.equal(regressionDue(root, dataDir).due, false, "nothing was kept yet");
const keptText = fs.readFileSync(harness("proposals", "IMP-20261120-bun.yaml"), "utf8")
  .replace(/^status: proposed$/m, "status: validated")
  .replace("  applied_at: null", "  applied_at: \"2026-11-21T01:00:00.000Z\"");
fs.writeFileSync(harness("proposals", "IMP-20261120-bun.yaml"), keptText);
assert.deepEqual(keptProposals(root).map((k) => k.id), ["IMP-20261120-bun"]);
assert.deepEqual(regressionDue(root, dataDir), { due: true, reason: "the kept changes were never checked" });

// The kept change now loses: a rollback proposal is drafted, nothing applied.
process.env.STANDIN_SCORES = JSON.stringify({ "*": { with: [0, 0, 0], without: [1, 1, 1] } });
const report = await regress({ root, dataDir, trigger: "manual", now: () => new Date("2026-11-22T00:00:00Z") });
assert.equal(report.changes.length, 1);
assert.equal(report.changes[0].losing, true);
assert.equal(report.changes[0].rollback_proposal, "IMP-20261122-rollback-bun.yaml");
assert.equal(fs.readFileSync(harness("proposals", "IMP-20261120-bun.yaml"), "utf8"), keptText, "the kept change is untouched");
const rollbackText = fs.readFileSync(harness("proposals", "IMP-20261122-rollback-bun.yaml"), "utf8");
assert.match(rollbackText, /^status: "proposed"$/m);
assert.match(rollbackText, /^rollback_of: "IMP-20261120-bun"$/m);
assert.match(rollbackText, /^ {4}- "CLAUDE\.md"$/m, "it reverts the files the change touched");
assert.match(rollbackText, /Remove the bun line from CLAUDE\.md/, "and says how, in the change's own words");
assert.match(rollbackText, /^ {2}approved_by: null$/m);
// The draft reads as a proposal: harness scope, no writing findings.
const YAML = await yamlParser();
if (YAML) {
  const parsed = YAML.parse(rollbackText);
  const check = checkProposal(parsed);
  assert.equal(check.scope, "harness");
  assert.deepEqual(check.prose, [], JSON.stringify(check.prose));
  assert.deepEqual(check.findings, []);
}
assert.ok(fs.existsSync(harness("evals", "replay", "regression.json")));
assert.equal(regressionDue(root, dataDir).due, false, "checked since anything changed");

// Losing again does not draft a second rollback while the first is open.
const second = await regress({ root, dataDir, trigger: "manual", now: () => new Date("2026-11-23T00:00:00Z") });
assert.equal(second.changes[0].rollback_proposal, "IMP-20261122-rollback-bun.yaml");
assert.ok(!fs.existsSync(harness("proposals", "IMP-20261123-rollback-bun.yaml")));

// A kept change that still wins drafts nothing.
fs.rmSync(harness("proposals", "IMP-20261122-rollback-bun.yaml"));
process.env.STANDIN_SCORES = JSON.stringify({ "*": { with: [1, 1, 1], without: [0, 0, 0] } });
const winning = await regress({ root, dataDir, trigger: "manual" });
assert.equal(winning.changes[0].losing, false);
assert.equal(winning.changes[0].rollback_proposal, null);

// A configuration change makes it due again; the hook starts it in the background, once.
fs.writeFileSync(path.join(dataDir, "state.json"), JSON.stringify({ last_config_change_at: new Date(Date.now() + 1000).toISOString() }));
assert.equal(regressionDue(root, dataDir).reason, "the harness configuration changed since the last check");
const started = [];
assert.equal(maybeStartRegression({ root, dataDir, start: (args) => started.push(args) }).started, true);
assert.deepEqual(started[0], ["regress", root, dataDir, "config-change"]);
assert.equal(maybeStartRegression({ root, dataDir, start: (args) => started.push(args) }).started, false, "not twice within the interval");
assert.equal(started.length, 1);

// Before a later proposal is scored, a due regression check runs first.
fs.writeFileSync(path.join(dataDir, "state.json"), JSON.stringify({ last_config_change_at: new Date(Date.now() + 5000).toISOString() }));
write(harness("proposals", "IMP-later.yaml"), proposal("IMP-later", "draft"));
write(harness("proposals", "IMP-later.candidate", "lesson.md"), "Later lesson.\n");
fs.rmSync(log);
const later = await scoreProposal({ root, file: "IMP-later.yaml", dataDir });
assert.ok(later.regression_check, "the regression check ran first");
assert.equal(calls()[0].lesson, "Use bun for installs and scripts, never npm.\n", "the kept change was replayed before the new one");

// The ConfigChange hook, end to end: it records the change and the worker it
// starts writes a fresh regression report.
const hookData = path.join(temp, "hookdata");
const before = JSON.parse(fs.readFileSync(harness("evals", "replay", "regression.json"), "utf8")).ran_at;
const hook = spawnSync(process.execPath, [path.join(pluginRoot, "scripts", "capture-event.mjs"), "ConfigChange"], {
  input: JSON.stringify({ session_id: "s-config", source: "project_settings" }),
  encoding: "utf8",
  env: { ...process.env, FM_TASK_ID: "", IMPROVE_AGENT_CHILD: "", IMPROVE_DREAM_CHILD: "", CLAUDE_PROJECT_DIR: root, CLAUDE_PLUGIN_DATA: hookData }
});
assert.equal(hook.status, 0, hook.stderr);
const hookState = JSON.parse(fs.readFileSync(path.join(hookData, "projects", projectId(root), "state.json"), "utf8"));
assert.ok(hookState.last_config_change_at);
assert.equal(hookState.replay_regression_running, true);
for (let i = 0; i < 100; i += 1) {
  const now = JSON.parse(fs.readFileSync(harness("evals", "replay", "regression.json"), "utf8"));
  if (now.ran_at !== before && now.trigger === "config-change") break;
  await new Promise((r) => setTimeout(r, 100));
}
assert.equal(JSON.parse(fs.readFileSync(harness("evals", "replay", "regression.json"), "utf8")).trigger, "config-change");

// --- the measured outcome ----------------------------------------------------
// Sessions a person ran: four in the month before the change, five since.
const applied = Date.parse("2026-11-21T01:00:00.000Z");
const day = 86_400_000;
const session = (id, at, automated) => JSON.stringify({ event: "SessionStart", session_id: id, occurred_at: new Date(at).toISOString(), automated });
fs.writeFileSync(path.join(dataDir, "events.jsonl"), [
  session("b1", applied - 3 * day), session("b2", applied - 2 * day), session("b3", applied - day), session("b4", applied - day / 2),
  session("old", applied - 60 * day),
  session("auto", applied - day, "a Firstmate worker"),
  session("a1", applied + day), session("a2", applied + 2 * day), session("a3", applied + 2 * day + 1), session("a4", applied + 3 * day), session("a5", applied + 3 * day + 1)
].join("\n"));
const correctionRow = (at, excerpt) => JSON.stringify({ occurred_at: new Date(at).toISOString(), session_id: "x", excerpt, fingerprint: fingerprint(excerpt) });
fs.writeFileSync(path.join(dataDir, "corrections.jsonl"), [
  correctionRow(applied - 2 * day, "use bun instead of npm"),
  correctionRow(applied - day, "use bun instead of npm please"),
  correctionRow(applied + day, "use bun instead of npm"),
  correctionRow(applied + day, "make the button blue")
].join("\n"));
// Transcripts: before, sessions ran npm; since, only one did.
const configDir = path.join(temp, "claude");
transcript("b1").user("go").tool("Bash", { command: "npm install" }, "ok").write(configDir);
transcript("b2").user("go").tool("Bash", { command: "npm test" }, "ok").write(configDir);
transcript("b3").user("go").tool("Bash", { command: "bun test" }, "ok").write(configDir);
transcript("a1").user("go").tool("Bash", { command: "bun install" }, "ok").write(configDir);
transcript("a2").user("go").tool("Bash", { command: "bun test" }, "ok").write(configDir);
transcript("a3").user("go").tool("Bash", { command: "npm ci" }, "ok").write(configDir);
transcript("a4").user("go").tool("Read", { file_path: "x" }, "ok").write(configDir);

process.env.STANDIN_SCORES = "";
const settings = { root, dataDir, file: "IMP-20261120-bun.yaml", configDir, now: new Date(applied + 4 * day) };
write(harness("improve.json"), JSON.stringify({ replay: { outcome: { per_sessions: 10 } } }));
const outcome = measureOutcome(settings);
assert.equal(outcome.written, true);
const [recurrence, compliance] = outcome.measurements;
assert.equal(recurrence.before, 5, "2 corrections in 4 sessions, per 10 sessions");
assert.equal(recurrence.after, 2, "1 in 5 sessions since (an unrelated one does not count)");
assert.match(recurrence.detail, /2 in 4 sessions before the change, 1 in 5 sessions since/);
assert.equal(compliance.before, 0.33, "1 of 3 sessions that ran Bash kept off npm");
assert.equal(compliance.after, 0.67);
assert.match(outcome.conclusion, /^Measuring: 5 of 10 sessions since the change/);
assert.match(outcome.conclusion, /came back less often/);
assert.match(outcome.conclusion, /followed the rule more often/);
const measuredText = fs.readFileSync(harness("proposals", "IMP-20261120-bun.yaml"), "utf8");
assert.match(measuredText, /^ {2}measurements:\n {4}- name: "correction recurrence per 10 sessions"$/m);
assert.match(measuredText, /^ {2}applied_at: "2026-11-21T01:00:00\.000Z"$/m, "the rest of the outcome block is kept");
assert.match(measuredText, /^ {2}applied_by: null$/m);
assert.equal(measureOutcome(settings).written, false, "unchanged numbers write nothing");

// Once enough sessions ran since, the outcome is settled and left alone.
write(harness("improve.json"), JSON.stringify({ replay: { outcome: { per_sessions: 5 } } }));
const settled = measureOutcome({ ...settings, now: new Date(applied + 5 * day) });
assert.equal(settled.settled, true);
assert.match(settled.conclusion, /^Settled after 5 sessions\./);
assert.deepEqual(measureOutcome(settings), { file: "IMP-20261120-bun.yaml", written: false, reason: "the outcome is settled" });
if (YAML) {
  const parsed = YAML.parse(fs.readFileSync(harness("proposals", "IMP-20261120-bun.yaml"), "utf8"));
  assert.equal(parsed.outcome.applied_at, "2026-11-21T01:00:00.000Z");
  assert.equal(parsed.outcome.settled, true);
  assert.equal(parsed.outcome.measurements.length, 2);
  assert.equal(parsed.replay.gate.verdict, "pass");
}

// A kept change that names no target is told why it was not measured.
write(harness("proposals", "IMP-untargeted.yaml"), proposal("IMP-untargeted", "validated").replace("  applied_at: null", "  applied_at: \"2026-11-21T00:00:00Z\""));
const untargeted = measureOutcome({ root, dataDir, file: "IMP-untargeted.yaml" });
assert.match(untargeted.conclusion, /^Not measured: the proposal names no replay case it targets/);
assert.equal(measureOutcome({ root, dataDir, file: "IMP-later.yaml" }).reason, "the change has not landed: outcome.applied_at is empty");

// The session-start hook starts the measurement in the background, at most every few hours.
const measured = [];
assert.equal(maybeMeasureOutcomes({ root, dataDir, start: (a) => measured.push(a) }).started, true);
assert.equal(maybeMeasureOutcomes({ root, dataDir, start: (a) => measured.push(a) }).started, false);
assert.deepEqual(measured, [["outcome", root, dataDir]]);

// --- reading tool calls against a check --------------------------------------
const bash = (command) => ({ name: "Bash", input: { command } });
assert.equal(complies({ type: "tool_used", tool: "Bash", input_match: "npm", max: 0 }, [bash("npm i")]), false);
assert.equal(complies({ type: "tool_used", tool: "Bash", input_match: "npm", max: 0 }, [bash("bun i")]), true);
assert.equal(complies({ type: "tool_used", tool: "Bash", input_match: "npm", max: 0 }, [{ name: "Read", input: {} }]), null, "no Bash call: the rule did not apply");
assert.equal(complies({ type: "tool_order", before: { tool: "Bash", input_match: "test" }, after: { tool: "Bash", input_match: "commit" } }, [bash("npm test"), bash("git commit")]), true);
assert.equal(complies({ type: "tool_order", before: { tool: "Bash", input_match: "test" }, after: { tool: "Bash", input_match: "commit" } }, [bash("git commit")]), false);
assert.equal(complies({ type: "tool_order", before: { tool: "Bash", input_match: "test" }, after: { tool: "Bash", input_match: "commit" } }, [bash("ls")]), null);
assert.equal(complies({ type: "llm", criteria: "x" }, []), null);

// --- status ------------------------------------------------------------------
const status = replayStatus(root);
assert.deepEqual({ cases: status.suite.cases, validation: status.suite.validation, test: status.suite.test }, { cases: 5, validation: 4, test: 1 });
assert.equal(status.regression.trigger, "config-change");

// --- the CLI -----------------------------------------------------------------
const cli = spawnSync(process.execPath, [path.join(pluginRoot, "scripts", "replay-cli.mjs"), "status", root], { encoding: "utf8", env: { ...process.env, CLAUDE_PLUGIN_DATA: path.join(temp, "data") } });
assert.equal(cli.status, 0, cli.stderr);
assert.equal(JSON.parse(cli.stdout).suite.cases, 5);
const usage = spawnSync(process.execPath, [path.join(pluginRoot, "scripts", "replay-cli.mjs"), "bogus"], { encoding: "utf8" });
assert.equal(usage.status, 2);
assert.match(usage.stderr, /usage: replay-cli\.mjs/);

fs.rmSync(temp, { recursive: true, force: true });
console.log("replay ok");

async function yamlParser() {
  try {
    return (await import(path.join(pluginRoot, "ui", "node_modules", "yaml", "dist", "index.js"))).default;
  } catch {
    return undefined;
  }
}
