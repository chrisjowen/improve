import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Point the data modules at a scratch repository before importing them.
const repo = fs.mkdtempSync(path.join(os.tmpdir(), "improve-surface-"));
process.env.IMPROVE_PROJECT_DIR = repo;
delete process.env.CLAUDE_PLUGIN_DATA;

const proposalsDir = path.join(repo, ".harness", "proposals");
fs.mkdirSync(proposalsDir, { recursive: true });

const proposal = (id, files) => [
  `id: ${id}`,
  `title: ${id}`,
  "status: proposed",
  "scope:",
  "  files:",
  ...files.map((file) => `    - ${file}`),
  "intervention:",
  "  summary: Add a hook that runs the linter on edited files.",
  ""
].join("\n");

fs.writeFileSync(path.join(proposalsDir, "code.yaml"), proposal("code", ["apps/api/lib/x.ex"]));
fs.writeFileSync(path.join(proposalsDir, "hook.yaml"), proposal("hook", [".claude/settings.json", "CLAUDE.md"]));
fs.writeFileSync(path.join(proposalsDir, "mixed.yaml"), proposal("mixed", ["AGENTS.md", ".github/workflows/ci.yml"]));

const { listProposals } = await import("../src/lib/server/proposals.js");
const byId = Object.fromEntries(listProposals().map((p) => [p.id, p]));

// Every proposal carries the scope check, so the card can say what it touches.
assert.equal(byId.code.check.scope, "codebase");
assert.deepEqual(byId.code.check.outside, ["apps/api/lib/x.ex"]);
assert.ok(byId.code.check.findings.some((f) => f.rule === "scope-codebase"));
assert.equal(byId.hook.check.scope, "harness");
assert.equal(byId.hook.check.findings.length, 0);
assert.equal(byId.mixed.check.scope, "mixed");
assert.ok(Array.isArray(byId.hook.check.prose));

// Without CLAUDE_PLUGIN_DATA the hook data cannot be read. That must come back
// as null, not as zero, or "could not look" reads as "looked and saw nothing".
const { readStatus, projectDataDir } = await import("../src/lib/server/status.js");
assert.equal(projectDataDir(), undefined);
const blind = readStatus();
assert.equal(blind.observations, null);
assert.equal(blind.review_due_reasons, null);
assert.equal(blind.state, null);
assert.equal(blind.data_location, null);
assert.equal(blind.harness_initialized, true, "repository facts are still read");

// With a data directory that has nothing in it, the answer is a real zero.
const dataRoot = fs.mkdtempSync(path.join(os.tmpdir(), "improve-surface-data-"));
process.env.CLAUDE_PLUGIN_DATA = dataRoot;
const seen = readStatus();
assert.deepEqual(seen.review_due_reasons, []);
assert.equal(seen.observations.count, 0);
assert.equal(seen.observations.corrections, 0);
assert.ok(seen.data_location.startsWith(dataRoot));

fs.rmSync(repo, { recursive: true, force: true });
fs.rmSync(dataRoot, { recursive: true, force: true });
console.log("review surface tests passed");
