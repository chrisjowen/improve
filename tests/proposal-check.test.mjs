import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  checkProposal,
  classifyScope,
  isHarnessPath,
  lintProse,
  readScopeFiles
} from "../scripts/proposal-check.mjs";

const pluginRoot = path.resolve(import.meta.dirname, "..");

// What shapes the agent is harness; what the agent works on is not.
for (const file of [
  "CLAUDE.md", "apps/api/CLAUDE.md", "AGENTS.md", ".claude/settings.json",
  ".claude/skills/release/SKILL.md", ".harness/proposals/", ".mcp.json", "./.claude/hooks/x.sh"
]) {
  assert.equal(isHarnessPath(file), true, file);
}
for (const file of [
  "apps/api/lib/crowd_solve/contributions.ex", ".github/workflows/ci.yml", "package.json",
  "docs/CLAUDE.md.bak", "src/claude.ts", ""
]) {
  assert.equal(isHarnessPath(file), false, file);
}

// The proposal that prompted this: two Elixir alias fixes offered as a harness change.
assert.deepEqual(classifyScope(["apps/api/lib/a.ex", "apps/api/lib/b.ex"]), {
  scope: "codebase",
  outside: ["apps/api/lib/a.ex", "apps/api/lib/b.ex"]
});
assert.equal(classifyScope(["AGENTS.md", ".github/workflows/ci.yml"]).scope, "mixed");
assert.equal(classifyScope([".claude/settings.json"]).scope, "harness");
// No files is not harness. A proposal nobody can scope must not pass as safe.
assert.equal(classifyScope([]).scope, "unknown");
assert.equal(classifyScope(undefined).scope, "unknown");

const codebase = checkProposal({ scope: { files: ["lib/a.ex"] } });
assert.equal(codebase.findings[0].rule, "scope-codebase");
assert.equal(checkProposal({ scope: { files: ["CLAUDE.md"] } }).findings.length, 0);
assert.equal(checkProposal({}).findings[0].rule, "scope-unknown");

// Prose rules fire on the tells and stay quiet on plain engineering prose.
const rules = (text) => lintProse(text).map((f) => f.rule);
assert.deepEqual(rules("The hook runs credo on each edited file — then blocks."), ["unslop-13-em-dash"]);
// Findings come back in reading order.
assert.deepEqual(rules("This serves as a crucial gate."), ["unslop-8-fancy-is", "unslop-7-ai-vocabulary"]);
assert.deepEqual(rules("We leverage the substrate in order to win."), [
  "unslop-31-plain-word", "unslop-26-metaphor-noun", "unslop-23-filler"
]);
assert.deepEqual(rules("Parser rejects bad date -> exit 2"), ["unslop-33-arrow"]);
assert.deepEqual(rules("Add a PostToolUse hook that runs mix credo on edited .ex files. It exits 2 on a finding."), []);
// Hyphenated words and CLI flags are not dashes.
assert.deepEqual(rules("Run mix compile --warnings-as-errors on a well-known path."), []);

const long = Array.from({ length: 31 }, (_, i) => `word${i}`).join(" ") + ".";
assert.deepEqual(rules(long), ["unslop-28-long-sentence"]);
assert.deepEqual(rules(`${long.split(" ").slice(0, 30).join(" ")}.`), []);

// Findings name the field so the UI can point at it.
const located = checkProposal({ title: "Fix it", intervention: { summary: "Utilize the hook." }, scope: { files: ["CLAUDE.md"] } });
assert.deepEqual(located.prose.map((f) => [f.field, f.rule]), [["intervention.summary", "unslop-31-plain-word"]]);

// The YAML reader handles the block form the proposal format prescribes, and
// the inline form, and nothing else.
assert.deepEqual(readScopeFiles([
  "id: x",
  "scope:",
  "  files:",
  "    - .claude/settings.json",
  "    - \"CLAUDE.md\"",
  "  systems: []",
  "  permissions_changed: false",
  "intervention:",
  "  files:",
  "    - not/this.md"
].join("\n")), [".claude/settings.json", "CLAUDE.md"]);
assert.deepEqual(readScopeFiles("scope:\n  files: [CLAUDE.md, 'lib/a.ex']\n"), ["CLAUDE.md", "lib/a.ex"]);
assert.deepEqual(readScopeFiles("scope:\n  files: []\n"), []);
assert.deepEqual(readScopeFiles("title: no scope\n"), []);

// The CLI exits 1 on a codebase proposal and 0 on a harness one.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "improve-check-"));
const write = (name, files) => {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `title: t\nscope:\n  files:\n${files.map((f) => `    - ${f}`).join("\n")}\n`);
  return file;
};
const cli = (file) => spawnSync(process.execPath, [path.join(pluginRoot, "scripts", "proposal-check-cli.mjs"), file], {
  encoding: "utf8"
});
const bad = cli(write("bad.yaml", ["apps/api/lib/a.ex"]));
assert.equal(bad.status, 1);
assert.equal(JSON.parse(bad.stdout).scope, "codebase");
const good = cli(write("good.yaml", [".claude/settings.json"]));
assert.equal(good.status, 0, good.stderr);
assert.equal(JSON.parse(good.stdout).scope, "harness");
fs.rmSync(dir, { recursive: true, force: true });
