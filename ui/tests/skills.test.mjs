import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const repo = fs.mkdtempSync(path.join(os.tmpdir(), "improve-skills-"));
process.env.IMPROVE_PROJECT_DIR = repo;
fs.mkdirSync(path.join(repo, ".harness", "proposals"), { recursive: true });
fs.writeFileSync(path.join(repo, ".harness", "proposals", "p.yaml"), [
  "id: IMP-1",
  "title: Codify the deploy procedure",
  "status: proposed",
  ""
].join("\n"));

// A stub agent that behaves like `claude -p --output-format json`: it ignores
// its arguments and prints the envelope the real CLI would print.
const stub = path.join(repo, "fake-agent");
const payload = JSON.stringify({
  name: "deploy-check",
  description: "Use when deploying",
  body: ["---", "name: deploy-check", "description: Use when deploying", "---", "", "# Deploy check", "", "1. Run tests"].join("\n")
});
const envelope = JSON.stringify({ result: "```json\n" + payload + "\n```", total_cost_usd: 0.01 });
fs.writeFileSync(stub, `#!/bin/sh\ncat <<'JSON'\n${envelope}\nJSON\n`, { mode: 0o755 });

const { draftSkill, skillDiff, applySkill, skillPath } = await import("../src/lib/server/skills.js");

// A skill name becomes a directory, so it must be kebab-case and contained.
assert.ok(skillPath("deploy-check").endsWith(path.join(".claude", "skills", "deploy-check", "SKILL.md")));
for (const bad of ["../escape", "Deploy_Check", "a/b", "UPPER"]) {
  assert.throws(() => skillPath(bad), /kebab-case|escapes/, `must refuse ${bad}`);
}

// Drafting stores the draft on the proposal and writes nothing to the repo.
const drafted = await draftSkill("p.yaml", { command: stub });
assert.equal(drafted.ok, true, drafted.error);
assert.equal(drafted.draft.name, "deploy-check");
assert.equal(fs.existsSync(skillPath("deploy-check")), false, "drafting must not write the skill");

const diff = skillDiff("p.yaml");
assert.equal(diff.ok, true);
assert.equal(diff.exists, false, "new file");
assert.equal(diff.current, "");
assert.match(diff.proposed, /# Deploy check/);

// Applying is the only step that mutates the repository.
const applied = applySkill("p.yaml", { rationale: "matches how we actually deploy" });
assert.equal(applied.ok, true, applied.error);
assert.equal(applied.written, path.join(".claude", "skills", "deploy-check", "SKILL.md"));
const onDisk = fs.readFileSync(skillPath("deploy-check"), "utf8");
assert.match(onDisk, /name: deploy-check/);
assert.ok(onDisk.endsWith("\n"), "file ends with a newline");

const decision = fs.readFileSync(path.join(repo, applied.decision), "utf8");
assert.match(decision, /decision: approved/);
assert.match(decision, /matches how we actually deploy/);

// Re-diffing now shows an overwrite rather than a new file.
const second = skillDiff("p.yaml");
assert.equal(second.exists, true);
assert.match(second.current, /# Deploy check/);

fs.rmSync(repo, { recursive: true, force: true });
console.log("skill draft and apply tests passed");
