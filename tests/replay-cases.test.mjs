// The replay suite: graders derived from a correction, and one history_file
// case per correction group and per recurring tool failure.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { deriveGraders, exportSuite, failureGroups, graderNeeds, readSuite, repeatMatch, splitFor } from "../scripts/replay-cases.mjs";
import { fingerprint } from "../scripts/detect.mjs";
import { transcript } from "./fixtures/transcript.mjs";

// --- graders from the correction --------------------------------------------
const kinds = (text, options = {}) => deriveGraders({ text, ...options }).graders.map((g) => [g.type, g.tool ?? g.target ?? null, g.input_match ?? g.pattern ?? g.path ?? null, g.min ?? g.max ?? null]);

assert.deepEqual(kinds("use bun instead of npm"), [
  ["tool_used", "Bash", "bun", 1],
  ["regex", "last_message", "bun", null],
  ["tool_used", "Bash", "(^|[\\s;&|(\"])npm([\\s;&|)\"]|$)", 0]
]);
assert.deepEqual(kinds("never run git push --force, ask first"), [["tool_used", "Bash", "(^|[\\s;&|(\"])git push --force([\\s;&|)\"]|$)", 0]],
  "a command with its arguments, ending at punctuation");
assert.deepEqual(kinds("always run `mix credo --strict` before you finish").map((g) => g[0]), ["tool_used", "regex"]);
assert.deepEqual(deriveGraders({ text: "run npm test before git commit" }).graders.map((g) => [g.type, g.before?.input_match, g.after?.input_match]),
  [["tool_order", "npm test", "git commit"]]);
assert.deepEqual(kinds("please create docs/notes.md with the summary"), [["file_exists", null, "docs/notes.md", null]]);
assert.equal(graderNeeds({ type: "file_exists", path: "a.md" })[0], "Write");
assert.deepEqual(graderNeeds({ type: "tool_used", tool: "Read" }), [], "Read is never withheld");
assert.deepEqual(graderNeeds({ type: "tool_used", tool: "mcp__docs__search" }), ["mcp__docs__search"], "an MCP tool is");

// Nothing a check can see: an LLM grader carries the standing rule.
const judged = deriveGraders({ text: "you never publish the live preview", guidance: "Publish a live preview for every UI change" });
assert.equal(judged.method, "llm");
assert.equal(judged.graders[0].type, "llm");
assert.match(judged.graders[0].criteria, /Publish a live preview for every UI change\./);

// A forbidden word that is not a command is not checked in the reply, which
// may name it to say it will not use it.
assert.equal(deriveGraders({ text: "don't use em dashes" }).method, "llm");

// No grader ever reads the whole trace: it holds the lesson a hook added.
for (const text of ["use bun instead of npm", "always use Claude for UI work", "never run git push --force"]) {
  assert.ok(deriveGraders({ text }).graders.every((g) => g.target !== "trace" && g.focus !== "trace"), text);
}

// Without a grant, a grader that needs Bash is left out; checks keep it.
const granted = deriveGraders({ text: "use bun instead of npm", grants: [] });
assert.deepEqual(granted.graders.map((g) => g.name), ["mentions-bun"]);
assert.deepEqual(granted.dropped, ["runs-bun", "avoids-npm"]);
assert.equal(granted.checks.length, 3);
const onlyBash = deriveGraders({ text: "never run git push --force", grants: [] });
assert.equal(onlyBash.method, "llm", "nothing runnable is left, so an LLM grader stands in");
assert.equal(onlyBash.checks[0].type, "tool_used", "the transcript check survives");

// A failing shell command repeats when the command does.
const bashRepeat = new RegExp(repeatMatch({ name: "Bash", input: { command: "npm run build" } }));
assert.ok(bashRepeat.test(JSON.stringify({ command: "npm run build", description: "build" })));
assert.ok(!bashRepeat.test(JSON.stringify({ command: "bun run build" })));

// Splits are stable and about a third go to test.
assert.equal(splitFor("correction-x"), splitFor("correction-x"));
const tests = Array.from({ length: 300 }, (_, i) => splitFor(`case-${i}`)).filter((s) => s === "test").length;
assert.ok(tests > 70 && tests < 130, `${tests} of 300 in test`);

// --- exporting the suite -----------------------------------------------------
const temp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "improve-replay-cases-")));
const root = path.join(temp, "repo");
const configDir = path.join(temp, "claude");
fs.mkdirSync(root);

// Session 1: the agent used npm, the person corrected it mid-turn.
const s1 = transcript("sess-one-0001", "2026-11-01T10:00:00.000Z")
  .user("set up the repo")
  .say("ok")
  .user("add a login page")
  .tool("Bash", { command: "npm install left-pad" }, "added 1 package")
  .queued("use bun instead of npm, always")
  .say("Switching to bun.");
s1.write(configDir);
const s1Correction = s1.rows.find((r) => r.type === "attachment" && r.attachment.type === "queued_command");

// Session 2: a Read of a missing file, twice in two sessions.
const s2 = transcript("sess-two-0002", "2026-11-02T10:00:00.000Z")
  .user("summarise the config")
  .tool("Read", { file_path: "/repo/config/app.yml" }, "File does not exist.", { error: true })
  .say("It is missing.");
s2.write(configDir);
const s3 = transcript("sess-three-03", "2026-11-03T10:00:00.000Z")
  .user("check the config again")
  .tool("Read", { file_path: "/repo/config/app.yml" }, "File does not exist.", { error: true })
  .say("Still missing.");
s3.write(configDir);

const clusters = [
  {
    label: "Use bun, not npm.",
    guidance: "Run bun for installs and scripts.",
    members: [
      { session_id: "sess-one-0001", occurred_at: s1Correction.timestamp, excerpt: "use bun instead of npm, always", fingerprint: fingerprint("use bun instead of npm, always") },
      { session_id: "gone-session-0009", occurred_at: "2026-10-01T00:00:00.000Z", excerpt: "bun please", fingerprint: fingerprint("bun please") }
    ]
  },
  { label: "Only in a pruned session.", guidance: null, members: [{ session_id: "pruned-0000-0000", occurred_at: "2026-10-01T00:00:00Z", excerpt: "x", fingerprint: "x" }] },
  { label: "Recorded before members were kept.", guidance: null, examples: ["y"] }
];
const events = [
  { event: "PostToolUseFailure", session_id: "sess-two-0002", tool_name: "Read", error_type: "File does not exist.", occurred_at: s2.rows[2].timestamp },
  { event: "PostToolUseFailure", session_id: "sess-three-03", tool_name: "Read", error_type: "File does not exist.", occurred_at: s3.rows[2].timestamp },
  { event: "PostToolUseFailure", session_id: "sess-two-0002", tool_name: "Bash", error_type: "exit 1", occurred_at: s2.rows[2].timestamp }
];

assert.equal(failureGroups(events).length, 1, "a failure in one session is not recurring");
assert.equal(failureGroups(events, { minSessions: 1 }).length, 2);

const report = exportSuite({ root, clusters, events, configDir, now: new Date("2026-11-21T00:00:00Z") });
assert.equal(report.written.length, 2);
assert.deepEqual(report.skipped.map((s) => s.reason), [
  "no member's session transcript is on this machine any more",
  "the group records no session to replay; run review-cli cluster again"
]);
assert.equal(report.counts.cases, 2);
assert.ok(report.counts.validation >= 1, "at least one case stays in validation");

const suite = readSuite(root);
const correction = suite.cases.find((c) => c.kind === "correction");
const failure = suite.cases.find((c) => c.kind === "tool-failure");
assert.equal(correction.label, "Use bun, not npm.");
assert.equal(correction.session_id, "sess-one-0001", "the member whose transcript exists");
assert.deepEqual(correction.fingerprints.length, 2, "every member's fingerprint, to count the correction coming back");
assert.equal(correction.graders, "deterministic");
assert.deepEqual(correction.needs, [], "nothing is granted, so nothing withheld is needed");
assert.deepEqual(correction.dropped_graders, ["runs-bun", "avoids-npm"]);
assert.equal(correction.checks.length, 3);

const caseDir = path.join(root, ".harness", "evals", "replay", "cases", correction.name);
const caseYaml = fs.readFileSync(path.join(caseDir, "case.yaml"), "utf8");
assert.match(caseYaml, /^schema_version: "1\.0"$/m);
assert.match(caseYaml, /^ {2}history_file: "history\.jsonl"$/m);
assert.match(caseYaml, /^ {2}prompt: "add a login page"$/m, "the turn the person had to correct is the prompt");
assert.match(caseYaml, /^ {2}allowed_tools:\n {4}- "Read"\n {4}- "Glob"\n {4}- "Grep"$/m);
assert.match(caseYaml, /type: "regex"/);
const history = fs.readFileSync(path.join(caseDir, "history.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
assert.deepEqual(history.map((r) => r.type), ["user", "assistant"], "the conversation up to the replayed turn");
assert.equal(history[0].message.content, "set up the repo");

assert.equal(failure.graders, "deterministic");
assert.deepEqual(failure.failing_call, { tool: "Read", input: "/repo/config/app.yml" });
const failureYaml = fs.readFileSync(path.join(root, ".harness", "evals", "replay", "cases", failure.name, "case.yaml"), "utf8");
assert.match(failureYaml, /tool: "Read"/);
const repeat = new RegExp(JSON.parse(/input_match: (".*")$/m.exec(failureYaml)[1]));
assert.ok(repeat.test(JSON.stringify({ file_path: "/repo/config/app.yml" })), "the same call again is a repeat");
assert.ok(!repeat.test(JSON.stringify({ file_path: "/repo/config/app.yml", offset: 1, limit: 200 })), "reading it in parts is not");
assert.ok(!repeat.test(JSON.stringify({ file_path: "/repo/config/other.yml" })));
assert.match(failureYaml, /max: 0/);
assert.match(failureYaml, /prompt: "check the config again"/, "the newest occurrence");

// Exporting again keeps every case and its split; a test case never moves.
const splits = Object.fromEntries(readSuite(root).cases.map((c) => [c.name, c.split]));
fs.writeFileSync(path.join(caseDir, "case.yaml"), `${caseYaml}# reviewed\n`);
const again = exportSuite({ root, clusters, events, configDir });
assert.deepEqual(again.written, []);
assert.deepEqual(again.kept.sort(), Object.keys(splits).sort());
assert.match(fs.readFileSync(path.join(caseDir, "case.yaml"), "utf8"), /# reviewed/, "an edited case is left alone");
assert.deepEqual(Object.fromEntries(readSuite(root).cases.map((c) => [c.name, c.split])), splits);
const refreshed = exportSuite({ root, clusters, events, configDir, refresh: true });
assert.equal(refreshed.written.length, 2);
assert.deepEqual(Object.fromEntries(readSuite(root).cases.map((c) => [c.name, c.split])), splits, "a refresh keeps splits");

// With Bash granted, the command checks are graders, and the case needs Bash.
const grantedRoot = path.join(temp, "granted");
fs.mkdirSync(grantedRoot);
exportSuite({ root: grantedRoot, clusters: clusters.slice(0, 1), configDir, grants: ["Bash"] });
const withBash = readSuite(grantedRoot).cases[0];
assert.deepEqual(withBash.needs, ["Bash"]);
assert.match(fs.readFileSync(path.join(grantedRoot, ".harness", "evals", "replay", "cases", withBash.name, "case.yaml"), "utf8"), /- "Bash"/);

fs.rmSync(temp, { recursive: true, force: true });
console.log("replay cases ok");
