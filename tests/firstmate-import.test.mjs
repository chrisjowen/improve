import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { detectFirstmate } from "../adapters/firstmate/home.mjs";
import {
  foldDecisions,
  importEvidence,
  parseFindings,
  parseStatusLine,
  taskHistory,
  windowTask
} from "../adapters/firstmate/import.mjs";
import { inventory } from "../adapters/firstmate/inventory.mjs";

// Every record in the fixture is synthetic. Tests copy it to a temporary
// directory and never point the adapter at a real Firstmate home.
const pluginRoot = path.resolve(import.meta.dirname, "..");
const fixture = path.join(pluginRoot, "tests", "fixtures", "firstmate-home");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "improve-firstmate-import-"));
const home = path.join(temp, "home");
fs.cpSync(fixture, home, { recursive: true });

const cli = (args, env = {}) => spawnSync(
  process.execPath,
  [path.join(pluginRoot, "adapters", "firstmate", "cli.mjs"), ...args],
  { encoding: "utf8", env: { ...process.env, FM_HOME: "", CLAUDE_PROJECT_DIR: "", ...env } }
);
const enable = (dir, extra = {}) => {
  fs.mkdirSync(path.join(dir, ".harness"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".harness", "improve.json"), JSON.stringify({
    schema_version: 1,
    adapters: { firstmate: { enabled: true, ...extra } }
  }));
};

// --- detection --------------------------------------------------------------
// Present but not opted in: detected, never enabled, and the CLI refuses.
const before = detectFirstmate(home, { env: {} });
assert.equal(before.detected, true);
assert.equal(before.via, "AGENTS.md");
assert.equal(before.enabled, false, "the adapter is off until .harness/improve.json enables it");
assert.equal(before.code_root, home);
const refused = cli(["import", "--project", home]);
assert.equal(refused.status, 3, "import refuses while the adapter is off");
assert.match(refused.stderr, /adapter is off/);

// A repository that does not declare Firstmate is not a Firstmate home.
const plain = path.join(temp, "plain");
fs.mkdirSync(plain);
fs.writeFileSync(path.join(plain, "AGENTS.md"), "# Widget\n\nRun the tests.\n");
assert.equal(detectFirstmate(plain, { env: {} }).detected, false);

// FM_HOME is enough on its own: secondmate homes keep AGENTS.md in the code root.
const secondmate = path.join(temp, "secondmate-home");
fs.mkdirSync(path.join(secondmate, "state"), { recursive: true });
const viaEnv = detectFirstmate(plain, { env: { FM_HOME: secondmate } });
assert.equal(viaEnv.detected, true);
assert.equal(viaEnv.via, "FM_HOME");
assert.equal(viaEnv.home, secondmate);
assert.equal(viaEnv.code_root, null, "no bin/ scripts there, so review routing is unavailable");

enable(home);
assert.equal(detectFirstmate(home, { env: {} }).enabled, true);

// --- status line grammar -----------------------------------------------------
assert.deepEqual(parseStatusLine("needs-decision [at=12] [key=api-shape]: REST or GraphQL?"),
  { verb: "needs-decision", at: 12, key: "api-shape", text: "REST or GraphQL?" });
assert.deepEqual(parseStatusLine("needs-decision: [key=old-style] summary"),
  { verb: "needs-decision", at: null, key: "old-style", text: "summary" });
assert.equal(parseStatusLine("hello there: not a status line"), undefined);
// A time tag can hold colons, and a correlation token can follow the verb.
assert.deepEqual(parseStatusLine("blocked [at=10:30]: no network"),
  { verb: "blocked", at: null, key: null, text: "no network" });
assert.deepEqual(parseStatusLine("resolved corr=0123456789abcdef [key=k] [at=7]: answered: yes"),
  { verb: "resolved", at: 7, key: "k", text: "answered: yes" });
// Folded as bin/fm-classify-lib.sh folds: a keyed resolved closes its own
// opener, and a bare one closes only a keyless one.
const folded = foldDecisions([
  { verb: "needs-decision", key: "a", at: 1, text: "A?" },
  { verb: "blocked", key: null, at: 2, text: "stuck" },
  { verb: "resolved", key: "a", at: 3, text: "answered: yes" },
  { verb: "needs-decision", key: "b", at: 4, text: "B?" },
  { verb: "resolved", key: null, at: 5, text: "unstuck" }
]);
assert.equal(folded[0].resolution.text, "answered: yes");
assert.equal(folded[0].resolution.how, "answered", "firstmate recorded the answer");
assert.equal(folded[1].resolution.how, "resolved");
assert.equal(folded[2].resolution, null, "a bare resolved does not close a keyed decision");
// Raising the same key again replaces the open one; captain-held closes it;
// a ship task's done ends whatever is still open.
const refold = foldDecisions([
  { verb: "needs-decision", key: "r", at: 1, text: "look" },
  { verb: "needs-decision", key: "r", at: 2, text: "look again" },
  { verb: "captain-held", key: "r", at: 3, text: "held" },
  { verb: "needs-decision", key: "s", at: 4, text: "S?" },
  { verb: "done", key: null, at: 5, text: "PR green" }
]);
assert.deepEqual(refold.map((d) => d.resolution.how), ["superseded", "captain-held", "task-ended"]);
assert.equal(foldDecisions([
  { verb: "needs-decision", key: "s", at: 4, text: "S?" },
  { verb: "done", key: null, at: 5, text: "reported" }
], { kind: "secondmate" })[0].resolution, null, "a secondmate's done leaves its decisions open");

// A finished task's history lives only in the ledger. A ledger copy of a
// line still in the status log, and a redelivered record, count once.
const history = taskHistory("needs-decision [key=q] [at=10]: Q?\n", [
  { event: "task.status", ts: 11, state: "needs-decision", key: "q", text: " Q?" },
  { event: "task.status", ts: 12, state: "resolved", key: "q", text: " answered: yes" },
  { event: "task.status", ts: 13, state: "resolved", key: "q", text: " answered: yes" }
]);
assert.deepEqual(history.map((e) => `${e.verb}:${e.source}`), ["needs-decision:status", "resolved:ledger"]);

// Watcher windows and marker keys name the task they watch.
assert.equal(windowTask("firstmate:fm-task-gamma"), "task-gamma");
assert.equal(windowTask("firstmate_fm-task_v2", new Set(["task.v2"])), "task.v2");
assert.equal(windowTask("task-gamma"), "task-gamma");

// --- findings snapshots ------------------------------------------------------
assert.equal(parseFindings('[{"id":"x","description":"d"}]')[0].id, "x");
assert.equal(parseFindings('{"id":"a","description":"one"}\n{"id":"b","description":"two"}').length, 2);
const blocks = parseFindings("- id: f1\n  severity: high\n  description: first line\n    continues here\n- id: f2\n  description: second");
assert.equal(blocks.length, 2);
assert.equal(blocks[0].description, "first line continues here");
assert.equal(parseFindings("free text finding one\n\nfree text finding two").length, 2);

// --- import ------------------------------------------------------------------
// A line naming the home's absolute path must not carry it out.
fs.appendFileSync(path.join(home, "state", "task-beta.status"),
  `note [at=1790013100]: recovered after relaunch; log at ${home}/data/task-beta/report.md\n`);

function snapshot(dir) {
  const files = {};
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else {
        const stat = fs.statSync(full);
        files[path.relative(dir, full)] = `${stat.size}:${stat.mtimeMs}:${crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex")}`;
      }
    }
  };
  walk(dir);
  return files;
}
const untouched = snapshot(home);

const result = importEvidence(home);
assert.equal(result.source, "firstmate");
assert.equal(result.trust, "observation", "imported evidence is an observation, never a rule");
assert.deepEqual(result.counts, {
  tasks: 5,
  ask_user_findings: 4,
  decisions: 9,
  blockers: 2,
  open: 1,
  answered: 1,
  review_gates: 3,
  captain_held: 1,
  stale_wakes: 3,
  stale_workers: 3,
  stuck_workers: 1,
  wedge_escalations: 2,
  teardown_refusals: 1,
  spawn_failures: 2,
  recoveries: 3,
  relaunches: 1,
  process_event_launch_failures: 1,
  captain_preferences: 4,
  learnings: 3
});
assert.deepEqual(result.history, { status_logs: 3, ledger_tasks: 4, tasks_without_history: 0 });

// task-delta finished, so teardown retired its status log: everything about
// it comes from the ledger's task.status records.
const delta = result.tasks.find((task) => task.task === "task-delta");
assert.equal(delta.status_log, false);
assert.equal(delta.status_lines, 12, "the redelivered gate record counts once");
assert.equal(delta.decisions, 4);
assert.equal(delta.blockers, 1);
assert.equal(delta.answered, 1);
assert.equal(delta.open_decisions, 0, "done ended the README question");
assert.equal(delta.relaunches, 1, "one progress note, in both the brief and its launch copy");
assert.equal(delta.wedge_escalations, 2);
assert.equal(delta.stale_detections, 2, "absorbed stale panes; busy-turn resets are not stale");
const d201 = result.findings.find((finding) => finding.id === "d-201");
assert.equal(d201.gate_key, "nm-r9-review");
assert.match(d201.decided, /^answered: Decision for key nm-r9-review/);
// A failed line before the worker ever reported is a failed launch.
assert.ok(result.failures.some((f) => f.task === "task-epsilon" && f.kind === "spawn-failure"));
assert.ok(result.failures.some((f) => f.task === "task-delta" && f.via === "relaunch-note"));

// The same ask-user finding in two tasks is one repeated finding, with the
// answers the captain gave each time.
assert.equal(result.repeated.ask_user_findings.length, 1);
const repeated = result.repeated.ask_user_findings[0];
assert.deepEqual(repeated.tasks, ["task-alpha", "task-beta", "task-delta"]);
assert.ok(repeated.decided_answers.some((answer) => /use defaults/.test(answer)));
// The same question asked in two tasks, answered differently, is a repeat too.
assert.equal(result.repeated.decisions.length, 1);
assert.deepEqual(result.repeated.decisions[0].tasks, ["task-alpha", "task-gamma"]);
assert.equal(result.repeated.decisions[0].answers.length, 2);

// Each finding is tied to the gate that escalated it and the answer it got.
const f001 = result.findings.find((finding) => finding.id === "f-001");
assert.equal(f001.gate_key, "nm-r1-review");
assert.match(f001.decided, /f-001 use defaults/);
assert.equal(f001.file, "data/task-alpha/nm-r1-findings.txt");
assert.equal(result.findings.find((finding) => finding.id === "b-101").target, "lib/load.js:10");

// Review rounds and durations, using the fleet ledger where it has the times.
const alpha = result.tasks.find((task) => task.task === "task-alpha");
assert.equal(alpha.review_rounds, 1);
assert.equal(alpha.blockers, 1);
assert.equal(alpha.duration_s, 9100, "dispatch to merge, from state/fleet-ledger.jsonl");
assert.equal(alpha.merged, true);
const gamma = result.tasks.find((task) => task.task === "task-gamma");
assert.equal(gamma.open_decisions, 1, "the ledger's copy of a live status line is not a second decision");
assert.equal(gamma.decisions, 2);
const gammaWorker = result.stale_workers.find((worker) => worker.task === "task-gamma");
assert.equal(gammaWorker.queued_stale_wakes, 2, "check wakes are not stale wakes");
assert.equal(gammaWorker.stale_marker, true);
assert.deepEqual(result.failures.map((failure) => failure.kind).sort(),
  ["recovery", "recovery", "recovery", "recovery", "spawn-failure", "spawn-failure", "teardown-refusal"]);
assert.equal(result.learnings[0].date, "2026-09-01");
assert.equal(result.captain_preferences[0].category, "directive");

// Sanitized: no secrets, emails, or absolute paths, and every path is relative.
const serialized = JSON.stringify(result);
for (const forbidden of ["captain@example.com", "hunter2hunter2", "fixturevalue123", home, temp]) {
  assert.ok(!serialized.includes(forbidden), `the import must not carry ${forbidden}`);
}
assert.match(serialized, /<home>\/data\/task-beta\/report\.md/);
assert.match(serialized, /REDACTED:personal:email_address/);
for (const item of [...result.findings, ...result.captain_preferences, ...result.learnings]) {
  assert.ok(!path.isAbsolute(item.file), `${item.file} is relative to the home`);
}
// No status log or preference file is copied whole.
for (const item of [...result.decisions, ...result.failures]) {
  assert.ok((item.question ?? item.excerpt ?? "").length <= 161);
}

// Read-only: the home is byte-for-byte unchanged, with no file added.
assert.deepEqual(snapshot(home), untouched, "import wrote nothing into the home");

// --- CLI ---------------------------------------------------------------------
const data = path.join(temp, "plugin-data");
const saved = cli(["import", "--project", home, "--save"], { CLAUDE_PLUGIN_DATA: data });
assert.equal(saved.status, 0, saved.stderr);
assert.equal(JSON.parse(saved.stdout).counts.tasks, 5);
assert.deepEqual(snapshot(home), untouched, "--save writes to the plugin data directory, not the home");
const status = spawnSync(process.execPath, [path.join(pluginRoot, "scripts", "status.mjs"), home], {
  encoding: "utf8",
  env: { ...process.env, FM_HOME: "", CLAUDE_PROJECT_DIR: home, CLAUDE_PLUGIN_DATA: data }
});
assert.equal(status.status, 0, status.stderr);
const summary = JSON.parse(status.stdout);
assert.equal(summary.firstmate.enabled, true);
assert.equal(summary.firstmate.review_routing, true);
assert.equal(summary.firstmate.last_import.counts.ask_user_findings, 4);
assert.deepEqual(summary.firstmate.periodic_review_due_reasons, [], "periodic review is off by default");

// A project with no Firstmate home reports null, not a disabled adapter.
const plainStatus = spawnSync(process.execPath, [path.join(pluginRoot, "scripts", "status.mjs"), plain], {
  encoding: "utf8",
  env: { ...process.env, FM_HOME: "", CLAUDE_PROJECT_DIR: plain, CLAUDE_PLUGIN_DATA: data }
});
assert.equal(JSON.parse(plainStatus.stdout).firstmate, null);

// --- inventory ---------------------------------------------------------------
const measured = inventory({ home, codeRoot: home });
assert.equal(measured.contract.file, "AGENTS.md");
assert.equal(measured.contract.startup_memory_budget_tokens, 7500);
assert.ok(measured.contract.estimated_tokens > 0);
assert.equal(measured.skills.count, 1);
assert.equal(measured.skills.largest[0].file, ".agents/skills/example-skill/SKILL.md");
assert.ok(measured.skills.largest[0].description_words > 0);
assert.equal(measured.scripts.count, 2);
assert.equal(measured.private_files.find((f) => f.file === "data/captain.md").visibility, "captain-private");
assert.equal(measured.private_files.find((f) => f.file === "config/brief-include.md").missing, true);

console.log("firstmate import tests passed");
