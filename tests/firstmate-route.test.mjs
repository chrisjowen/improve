import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { classifySurface, deliveryFor, isFirstmateHarnessPath } from "../adapters/firstmate/surfaces.mjs";
import { isHarnessPath } from "../scripts/proposal-check.mjs";
import { displayCommand, taskIdFor } from "../adapters/firstmate/route.mjs";

// The fixture's bin/fm-tasks-axi.sh and bin/fm-captain-hold.sh are stubs that
// only log their arguments to FM_STUB_LOG, so no test reaches a real backlog.
const pluginRoot = path.resolve(import.meta.dirname, "..");
const fixture = path.join(pluginRoot, "tests", "fixtures", "firstmate-home");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "improve-firstmate-route-"));
const home = path.join(temp, "home");
fs.cpSync(fixture, home, { recursive: true });
const stubLog = path.join(temp, "stub.log");
const showDir = path.join(temp, "show");
fs.mkdirSync(showDir);

const baseEnv = { ...process.env, FM_HOME: "", CLAUDE_PROJECT_DIR: home, FM_STUB_LOG: stubLog, FM_STUB_SHOW_DIR: showDir };
const cli = (args, env = {}) => spawnSync(
  process.execPath,
  [path.join(pluginRoot, "adapters", "firstmate", "cli.mjs"), ...args, "--project", home],
  { encoding: "utf8", env: { ...baseEnv, ...env } }
);
const writeConfig = (firstmate) => {
  fs.mkdirSync(path.join(home, ".harness"), { recursive: true });
  fs.writeFileSync(path.join(home, ".harness", "improve.json"), JSON.stringify({
    schema_version: 1,
    adapters: { firstmate }
  }));
};
const proposal = (file, { id, title, status = "proposed", files }) => {
  fs.mkdirSync(path.join(home, ".harness", "proposals"), { recursive: true });
  fs.writeFileSync(path.join(home, ".harness", "proposals", file), [
    `id: ${id}`,
    `title: ${title}`,
    "layer: instructions",
    `status: ${status}`,
    "scope:",
    "  files:",
    ...files.map((f) => `    - ${f}`),
    "  systems: []",
    "  permissions_changed: false",
    ""
  ].join("\n"));
};
const stubCalls = () => (fs.existsSync(stubLog) ? fs.readFileSync(stubLog, "utf8") : "");

// --- surfaces ----------------------------------------------------------------
const expectations = {
  "AGENTS.md": ["contract", "shared-tracked"],
  "CLAUDE.md": ["contract", "shared-tracked"],
  ".agents/skills/bearings/SKILL.md": ["skill", "shared-tracked"],
  "bin/fm-spawn.sh": ["script", "shared-tracked"],
  "bin/fm-brief.sh": ["brief-scaffold", "shared-tracked"],
  "docs/configuration.md": ["docs", "shared-tracked"],
  "data/captain.md": ["captain-preferences", "captain-private"],
  "data/learnings.md": ["learnings", "captain-private"],
  "config/brief-include.md": ["brief-include", "captain-private"],
  "config/crew-dispatch.json": ["home-config", "captain-private"],
  ".harness/objectives.yaml": ["improve-record", "captain-private"],
  "state/task.status": ["runtime-state", "runtime"],
  "CLAUDE.local.md": ["contract", "captain-private"],
  ".claude/settings.local.json": ["claude-config", "captain-private"],
  ".claude/settings.json": ["claude-config", "shared-tracked"],
  "state/.claude/settings.local.json": ["runtime-state", "runtime"],
  ".mcp.json": ["agent-config", "shared-tracked"],
  "packages/web/CLAUDE.md": ["agent-config", "shared-tracked"],
  "data/task-alpha/AGENTS.md": ["home-data", "captain-private"],
  "tests/fm-spawn.test.sh": [null, null],
  ".github/workflows/ci.yml": [null, null]
};
for (const [file, [surface, visibility]] of Object.entries(expectations)) {
  assert.deepEqual([classifySurface(file).surface, classifySurface(file).visibility], [surface, visibility], file);
}
assert.equal(isFirstmateHarnessPath("bin/fm-watch.sh"), true, "bin/ scripts are Firstmate's harness");
assert.equal(isFirstmateHarnessPath("state/.wake-queue"), false, "runtime records are never a proposal target");
assert.equal(deliveryFor(["data/captain.md"]).delivery, "local-apply");
assert.equal(deliveryFor(["AGENTS.md", "bin/fm-brief.sh"]).delivery, "upstream-pr");
assert.equal(deliveryFor(["data/learnings.md", "AGENTS.md"]).delivery, "split");
assert.equal(deliveryFor([]).delivery, "refuse");
assert.equal(deliveryFor(["state/x.status"]).delivery, "refuse");
assert.equal(deliveryFor(["tests/x.test.sh"]).delivery, "refuse");
// The adapter widens the default harness; it never narrows it.
for (const file of [".mcp.json", "CLAUDE.local.md", "sub/CLAUDE.md", "sub/AGENTS.md", "GEMINI.md", ".cursorrules",
  ".codex/config.toml", ".github/copilot-instructions.md", "sub/.claude/settings.json", ".harness/x.yaml"]) {
  assert.equal(isHarnessPath(file), true, file);
  assert.equal(isFirstmateHarnessPath(file), true, `${file} stays harness with the adapter on`);
}
assert.equal(deliveryFor([".mcp.json"]).delivery, "upstream-pr");
assert.equal(deliveryFor(["CLAUDE.local.md", "data/captain.md"]).delivery, "local-apply");
assert.equal(deliveryFor([".claude/settings.local.json", "data/captain.md"]).delivery, "local-apply");
assert.equal(taskIdFor("IMP-20261026-Keep AGENTS small"), "improve-imp-20261026-keep-agents-small");
assert.match(taskIdFor("x".repeat(200)), /^[a-z0-9._-]{1,80}$/);
assert.equal(displayCommand({ argv: ["a", "b c"], env: { FM_HOME: "/h" } }), "FM_HOME=/h a 'b c'");

// --- proposal check ----------------------------------------------------------
// Without the adapter, bin/ is application code to the checker, as before.
proposal("IMP-1.yaml", { id: "IMP-1", title: "Add a delivery preference to data/captain.md", files: ["data/captain.md"] });
proposal("IMP-2.yaml", {
  id: "IMP-2",
  title: "Say in AGENTS.md when to load the bearings skill",
  files: ["AGENTS.md", ".agents/skills/bearings/SKILL.md"]
});
proposal("IMP-3.yaml", { id: "IMP-3", title: "Mixed change", files: ["data/learnings.md", "bin/fm-brief.sh"] });
proposal("IMP-4.yaml", { id: "IMP-4", title: "Draft change", status: "draft", files: ["data/captain.md"] });
proposal("IMP-5.yaml", { id: "IMP-5", title: "Fix a test", files: ["tests/fm-spawn.test.sh"] });
proposal("IMP-6.yaml", { id: "IMP-6", title: "Edit a status log", files: ["state/task-alpha.status"] });
const check = (file) => spawnSync(process.execPath, [
  path.join(pluginRoot, "scripts", "proposal-check-cli.mjs"),
  path.join(home, ".harness", "proposals", file)
], { encoding: "utf8", cwd: home, env: baseEnv });

writeConfig({ enabled: false });
const offCheck = check("IMP-3.yaml");
assert.equal(offCheck.status, 1);
assert.equal(JSON.parse(offCheck.stdout).scope, "codebase", "bin/ and data/ are not harness to the default checker");
assert.equal(JSON.parse(offCheck.stdout).firstmate, undefined);

// --- disabled adapter --------------------------------------------------------
const off = cli(["route"]);
assert.equal(off.status, 3, "routing refuses while the adapter is off");
assert.equal(stubCalls(), "", "nothing ran");

writeConfig({ enabled: true });
const upstream = check("IMP-2.yaml");
assert.equal(upstream.status, 0, upstream.stdout);
const upstreamReport = JSON.parse(upstream.stdout);
assert.equal(upstreamReport.scope, "harness");
assert.equal(upstreamReport.firstmate.delivery, "upstream-pr");
assert.deepEqual(upstreamReport.firstmate.surfaces, ["contract", "skill"]);
assert.equal(JSON.parse(check("IMP-1.yaml").stdout).firstmate.delivery, "local-apply");
const split = check("IMP-3.yaml");
assert.equal(split.status, 1, "a proposal mixing private and shared files fails the check");
assert.equal(JSON.parse(split.stdout).firstmate.findings[0].rule, "firstmate-split");
assert.equal(check("IMP-6.yaml").status, 1, "runtime state is never a proposal target");

// --- dry run -----------------------------------------------------------------
const dry = cli(["route"]);
assert.equal(dry.status, 0, dry.stderr);
assert.match(dry.stderr, /dry run/);
const plan = JSON.parse(dry.stdout);
const byFile = Object.fromEntries(plan.map((entry) => [entry.file, entry]));
assert.equal(byFile["IMP-1.yaml"].outcome, "dry-run");
assert.equal(byFile["IMP-1.yaml"].delivery, "local-apply");
assert.equal(byFile["IMP-2.yaml"].delivery, "upstream-pr");
assert.equal(byFile["IMP-3.yaml"].outcome, "skipped");
assert.match(byFile["IMP-3.yaml"].why, /split it/);
assert.match(byFile["IMP-4.yaml"].why, /status is draft/);
assert.match(byFile["IMP-5.yaml"].why, /outside Firstmate's harness/);
assert.match(byFile["IMP-6.yaml"].why, /runtime records/);
// The printed commands are the home's own scripts, addressed at the home.
assert.match(dry.stderr, /would run: FM_HOME=\S+ \S+\/bin\/fm-tasks-axi\.sh show improve-imp-1 --full\n/);
assert.match(dry.stderr, /would run: FM_HOME=\S+ \S+\/bin\/fm-captain-hold\.sh hold improve-imp-1 --title 'Improve: Add a delivery preference to data\/captain\.md' --reason /);
assert.match(dry.stderr, /--repo firstmate/);
assert.match(dry.stderr, /captain-private/);
assert.match(dry.stderr, /goes upstream as a Firstmate pull request/);
assert.equal(stubCalls(), "", "a dry run runs nothing");
assert.equal(fs.existsSync(path.join(home, ".harness", "firstmate", "routed.json")), false, "a dry run writes no ledger");

// --- live routing through the stubs ------------------------------------------
const live = cli(["route", "--apply"]);
assert.equal(live.status, 0, live.stderr);
const calls = stubCalls();
assert.match(calls, /fm-tasks-axi\.sh FM_HOME=\S.* show improve-imp-1/);
assert.match(calls, /fm-captain-hold\.sh FM_HOME=\S/);
assert.match(calls, /\n {2}hold\n {2}improve-imp-1\n {2}--title\n {2}Improve: Add a delivery preference/);
assert.match(calls, /\n {2}improve-imp-2\n/);
assert.ok(!/improve-imp-[3456]/.test(calls), "skipped proposals are never filed");
assert.ok(!/\b(answer|done|unhold|release)\b/.test(calls.split("\n").filter((l) => /^ {2}\S+$/.test(l)).join(" ")),
  "routing only holds; it never answers, closes, or releases");
const ledger = JSON.parse(fs.readFileSync(path.join(home, ".harness", "firstmate", "routed.json"), "utf8"));
assert.deepEqual(Object.keys(ledger.proposals).sort(), ["IMP-1.yaml", "IMP-2.yaml"]);
assert.equal(ledger.proposals["IMP-2.yaml"].delivery, "upstream-pr");

// Routing an unchanged proposal again files nothing new.
const holdsBefore = (stubCalls().match(/fm-captain-hold\.sh/g) ?? []).length;
const again = JSON.parse(cli(["route", "--apply"]).stdout);
assert.match(again.find((entry) => entry.file === "IMP-1.yaml").why, /already filed as improve-imp-1/);
assert.equal((stubCalls().match(/fm-captain-hold\.sh/g) ?? []).length, holdsBefore);

// A task the captain already closed is not re-held.
proposal("IMP-7.yaml", { id: "IMP-7", title: "Another private change", files: ["data/learnings.md"] });
fs.writeFileSync(path.join(showDir, "improve-imp-7"), "task:\n  id: improve-imp-7\n  state: done\n");
const closed = JSON.parse(cli(["route", "--apply"]).stdout);
assert.equal(closed.find((entry) => entry.file === "IMP-7.yaml").outcome, "already-closed");
assert.equal((stubCalls().match(/fm-captain-hold\.sh/g) ?? []).length, holdsBefore);

// An edited proposal is re-held by id, without the old title hold would refuse.
proposal("IMP-2.yaml", {
  id: "IMP-2",
  title: "Say in AGENTS.md when to load the bearings and stow skills",
  files: ["AGENTS.md", ".agents/skills/bearings/SKILL.md"]
});
fs.writeFileSync(path.join(showDir, "improve-imp-2"), "task:\n  id: improve-imp-2\n  state: queued\n  held: yes\n");
fs.writeFileSync(stubLog, "");
const reheld = JSON.parse(cli(["route", "--apply"]).stdout);
assert.equal(reheld.find((entry) => entry.file === "IMP-2.yaml").outcome, "held");
assert.match(stubCalls(), /\n {2}hold\n {2}improve-imp-2\n {2}--reason\n/);
assert.doesNotMatch(stubCalls(), /--title/);
const holdsAfterEdit = (stubCalls().match(/fm-captain-hold\.sh/g) ?? []).length;
assert.equal(holdsAfterEdit, 1);

// A refused hold is reported, exits nonzero, and is not recorded as filed.
proposal("IMP-8.yaml", { id: "IMP-8", title: "FAIL on purpose", files: ["data/captain.md"] });
const failed = cli(["route", "--apply"]);
assert.equal(failed.status, 1);
assert.match(failed.stderr, /failed IMP-8\.yaml: fm-captain-hold: refused/);
const afterFail = JSON.parse(fs.readFileSync(path.join(home, ".harness", "firstmate", "routed.json"), "utf8"));
assert.equal(afterFail.proposals["IMP-8.yaml"], undefined);

// --- reading answers back ----------------------------------------------------
const dryDecisions = cli(["decisions"]);
assert.equal(dryDecisions.status, 0, dryDecisions.stderr);
assert.match(dryDecisions.stderr, /would run: FM_HOME=\S+ \S+\/bin\/fm-tasks-axi\.sh show improve-imp-1 --full/);
fs.writeFileSync(path.join(showDir, "improve-imp-1"), [
  "task:",
  "  id: improve-imp-1",
  "  state: done",
  "  held: no",
  `  body: ${JSON.stringify("Resolution recorded by fm-captain-hold.\nCaptain decision:\nApproved IMP-1, apply it.\n\nCaptain hold set: 2026-10-26T00:00:00Z")}`,
  ""
].join("\n"));
const decisions = JSON.parse(cli(["decisions", "--apply"]).stdout);
const imp1 = decisions.find((entry) => entry.file === "IMP-1.yaml");
assert.equal(imp1.state, "done");
assert.equal(imp1.captain_decision, "Approved IMP-1, apply it.");
const imp2 = decisions.find((entry) => entry.file === "IMP-2.yaml");
assert.equal(imp2.state, "queued");
assert.equal(imp2.captain_decision, null, "a call still held has no answer, and none is invented");
assert.equal(imp2.proposal_changed_since_filing, false);

// An answer to an earlier version is never reported for the re-filed one.
// fm-captain-hold.sh answer puts the newest decision first, so answers are newest first.
const imp2Show = (...answers) => fs.writeFileSync(path.join(showDir, "improve-imp-2"), [
  "task:",
  "  id: improve-imp-2",
  "  state: queued",
  "  held: yes",
  `  body: ${JSON.stringify(answers.map((a) => `Captain decision:\n${a}\n`).join("\n"))}`,
  ""
].join("\n"));
imp2Show("Approved IMP-2.");
assert.equal(JSON.parse(cli(["decisions", "--apply"]).stdout).find((e) => e.file === "IMP-2.yaml").captain_decision,
  "Approved IMP-2.");
proposal("IMP-2.yaml", {
  id: "IMP-2",
  title: "Say in AGENTS.md when to load the bearings, stow, and helm skills",
  files: ["AGENTS.md", ".agents/skills/bearings/SKILL.md"]
});
const edited = JSON.parse(cli(["decisions", "--apply"]).stdout).find((e) => e.file === "IMP-2.yaml");
assert.equal(edited.proposal_changed_since_filing, true, "an edit after filing is flagged");
assert.equal(JSON.parse(cli(["route", "--apply"]).stdout).find((e) => e.file === "IMP-2.yaml").outcome, "held");
const refiled = JSON.parse(cli(["decisions", "--apply"]).stdout).find((e) => e.file === "IMP-2.yaml");
assert.equal(refiled.proposal_changed_since_filing, false);
assert.equal(refiled.captain_decision, null, "the answer to the earlier version is not the captain's answer now");
imp2Show("Rejected IMP-2.", "Approved IMP-2.");
assert.equal(JSON.parse(cli(["decisions", "--apply"]).stdout).find((e) => e.file === "IMP-2.yaml").captain_decision,
  "Rejected IMP-2.");
fs.writeFileSync(path.join(home, ".harness", "firstmate", "routed.json"), JSON.stringify({
  schema_version: 1,
  proposals: { "IMP-9.yaml": { proposal: "IMP-9", task_id: "improve-imp-9" } }
}));
assert.equal(JSON.parse(cli(["decisions", "--apply"]).stdout)[0].outcome, "unreadable");
// Reading answers changed no proposal: approval still happens in /improve apply.
assert.match(fs.readFileSync(path.join(home, ".harness", "proposals", "IMP-1.yaml"), "utf8"), /^status: proposed$/m);

// --- periodic review ---------------------------------------------------------
const hookData = path.join(temp, "plugin-data");
const sessionStart = () => spawnSync(process.execPath, [path.join(pluginRoot, "scripts", "session-start.mjs")], {
  input: JSON.stringify({ session_id: "s1", source: "startup" }),
  encoding: "utf8",
  env: { ...baseEnv, CLAUDE_PLUGIN_DATA: hookData }
});
assert.equal(cli(["due"]).status, 1, "off by default");
writeConfig({ enabled: true, periodic_review: { enabled: true, every_tasks: 2, every_days: 7 } });
const reviewState = path.join(home, ".harness", "firstmate", "review-state.json");
assert.equal(cli(["due"]).status, 1, "briefs written before periodic review was enabled do not count");
assert.ok(JSON.parse(fs.readFileSync(reviewState, "utf8")).enabled_at, "the first check records when it started");

// Turning it off forgets the start, so turning it on again months later is not overdue.
fs.writeFileSync(reviewState, JSON.stringify({ enabled_at: new Date(Date.now() - 90 * 86_400_000).toISOString() }));
writeConfig({ enabled: true, periodic_review: { enabled: false, every_tasks: 2, every_days: 7 } });
assert.equal(sessionStart().status, 0);
assert.equal(JSON.parse(fs.readFileSync(reviewState, "utf8")).enabled_at, undefined);
writeConfig({ enabled: true, periodic_review: { enabled: true, every_tasks: 2, every_days: 7 } });
assert.equal(cli(["due"]).status, 1, "re-enabling starts afresh");
const later = new Date(Date.now() + 60_000);
for (const task of ["task-alpha", "task-beta", "task-gamma"]) {
  fs.utimesSync(path.join(home, "data", task, "brief.md"), later, later);
}
const due = cli(["due"]);
assert.equal(due.status, 0, due.stdout);
assert.match(JSON.parse(due.stdout).reasons[0], /3 Firstmate tasks dispatched/);

const reminded = sessionStart();
assert.equal(reminded.status, 0, reminded.stderr);
assert.match(reminded.stdout, /review is due \(3 Firstmate tasks dispatched/);

// After a review, older briefs no longer count, and days are a long-stop.
const past = new Date(Date.now() - 3_600_000);
for (const task of ["task-alpha", "task-beta", "task-gamma"]) {
  fs.utimesSync(path.join(home, "data", task, "brief.md"), past, past);
}
assert.equal(cli(["reviewed"]).status, 0);
assert.equal(cli(["due"]).status, 1);
assert.doesNotMatch(sessionStart().stdout, /review is due/);
fs.writeFileSync(reviewState, JSON.stringify({ last_reviewed_at: new Date(Date.now() - 8 * 86_400_000).toISOString() }));
assert.match(JSON.parse(cli(["due"]).stdout).reasons.join(" "), /7 days since the last Firstmate harness review/);

console.log("firstmate route tests passed");
