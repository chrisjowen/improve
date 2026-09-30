import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { skillFromPath } from "../scripts/lib.mjs";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const project = fs.mkdtempSync(path.join(os.tmpdir(), "improve-usage-"));
const data = path.join(project, "data");

function run(input) {
  return spawnSync(process.execPath, [path.join(pluginRoot, "scripts", "skill-usage.mjs")], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: project, CLAUDE_PLUGIN_DATA: data }
  });
}

function sidecar(name) {
  return path.join(project, ".claude", "skills", name, ".improve.json");
}

function read(name) {
  return JSON.parse(fs.readFileSync(sidecar(name), "utf8"));
}

// Only skills this plugin applied carry a sidecar, and only those are counted.
fs.mkdirSync(path.join(project, ".claude", "skills", "release-check"), { recursive: true });
fs.writeFileSync(sidecar("release-check"), JSON.stringify({
  schema_version: 1, created_by: "improve", use: 0, view: 0, patch: 0
}));
fs.mkdirSync(path.join(project, ".claude", "skills", "hand-written"), { recursive: true });
fs.writeFileSync(sidecar("hand-written"), JSON.stringify({ created_by: "human", use: 0, view: 0 }));

// Path extraction
assert.equal(skillFromPath("/repo/.claude/skills/release-check/SKILL.md"), "release-check");
assert.equal(skillFromPath(".claude/skills/release-check/references/a.md"), "release-check");
assert.equal(skillFromPath("\\repo\\.claude\\skills\\release-check\\SKILL.md"), "release-check");
assert.equal(skillFromPath("/repo/src/a.js"), undefined);
assert.equal(skillFromPath(".claude/skills/.archive/x/SKILL.md"), undefined, "the archive is not a skill");
assert.equal(skillFromPath(undefined), undefined);

// Invocation counts as use.
assert.equal(run({ tool_name: "Skill", tool_input: { skill: "release-check" } }).status, 0);
assert.equal(read("release-check").use, 1);
assert.equal(read("release-check").view, 0, "an invocation is not a view");

// A plugin-qualified name resolves to the skill.
run({ tool_name: "Skill", tool_input: { skill: "improve:release-check" } });
assert.equal(read("release-check").use, 2);

// Reading the skill counts as a view, never as a use.
run({ tool_name: "Read", tool_input: { file_path: path.join(project, ".claude/skills/release-check/SKILL.md") } });
const afterRead = read("release-check");
assert.equal(afterRead.view, 1, "reading is a view");
assert.equal(afterRead.use, 2, "reading must not increment use");
assert.ok(afterRead.view_last_at, "the view is timestamped");

// Unrelated tool use touches nothing.
run({ tool_name: "Read", tool_input: { file_path: path.join(project, "src/a.js") } });
assert.equal(read("release-check").view, 1);

// A skill the plugin did not author is never counted.
run({ tool_name: "Skill", tool_input: { skill: "hand-written" } });
assert.equal(read("hand-written").use, 0, "only plugin-authored skills are counted");

// A missing sidecar is not an error.
assert.equal(run({ tool_name: "Skill", tool_input: { skill: "does-not-exist" } }).status, 0);

fs.rmSync(project, { recursive: true, force: true });
console.log("skill usage tests passed");
