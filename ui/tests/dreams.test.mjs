import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";

const repo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "improve-dreams-")));
const dataDir = path.join(repo, "plugin-data");
process.env.IMPROVE_PROJECT_DIR = repo;
process.env.CLAUDE_PLUGIN_DATA = dataDir;

const projectHash = crypto.createHash("sha256").update(repo).digest("hex").slice(0, 20);
const dreamsDir = path.join(dataDir, "projects", projectHash, "dreams");
fs.mkdirSync(dreamsDir, { recursive: true });
fs.mkdirSync(path.join(repo, ".harness", "proposals"), { recursive: true });

fs.writeFileSync(path.join(dreamsDir, "2026-09-30T10-00-00.000Z.json"), JSON.stringify({
  schema_version: 1,
  produced_at: "2026-09-30T10:00:00.000Z",
  status: "completed",
  cost_usd: 0.04,
  findings: [
    {
      title: "Cache the dependency install in CI",
      objective: "fast-feedback",
      hypothesis: "Most CI time is spent reinstalling unchanged dependencies",
      evidence: [{ source: "ci logs", observation: "install takes 90s of a 130s run" }],
      intervention: "Add a lockfile-keyed cache step",
      evaluation: "Compare wall-clock CI duration over ten runs",
      risks: ["a stale cache could mask a dependency change"],
      reasons_to_reject: ["CI duration may not be the bottleneck anyone cares about"]
    },
    {
      title: "Leaky finding",
      hypothesis: "The token ghp_1234567890abcdefghijklmnopqrstuvwx is hardcoded",
      evidence: [],
      intervention: "Rotate it"
    }
  ]
}));

// A report that cannot be parsed must be reported, not swallowed.
fs.writeFileSync(path.join(dreamsDir, "2026-09-29T10-00-00.000Z.json"), "{ truncated");

const { listDreams, importDream, dismissDream } = await import("../src/lib/server/dreams.js");
const { listProposals } = await import("../src/lib/server/proposals.js");

const reports = listDreams();
assert.equal(reports.length, 2);
const [newest, broken] = reports;
assert.equal(newest.status, "completed", "reports are newest first");
assert.equal(newest.findings.length, 2);
assert.equal(broken.status, "unreadable");
assert.ok(broken.error);

// The operating model requires a reviewer to look for reasons to reject, so the
// field must survive to the surface.
assert.deepEqual(newest.findings[0].reasons_to_reject, [
  "CI duration may not be the bottleneck anyone cares about"
]);

// Listing must not write to the repository: a background job may draft but
// never edit.
assert.equal(listProposals().length, 0, "listing a dream writes no proposal");

// Importing is the human act that brings it into the repository.
const imported = importDream(newest.file, 0);
assert.equal(imported.ok, true, imported.error);
const proposals = listProposals();
assert.equal(proposals.length, 1);
const written = YAML.parse(
  fs.readFileSync(path.join(repo, ".harness", "proposals", imported.proposal), "utf8")
);
assert.equal(written.status, "draft", "an imported dream has no approval");
assert.equal(written.confidence, "low");
assert.equal(written.provenance.kind, "background-dream");
assert.equal(written.provenance.report, newest.file);
assert.match(written.provenance.trust, /untrusted/);
assert.equal(written.approval.approved_by, null);
assert.deepEqual(written.reasons_to_reject, newest.findings[0].reasons_to_reject);

// The worker read the repository, so its text passes the egress rules.
const leaky = importDream(newest.file, 1);
assert.equal(leaky.ok, true, leaky.error);
const leakyText = fs.readFileSync(path.join(repo, ".harness", "proposals", leaky.proposal), "utf8");
assert.ok(!leakyText.includes("ghp_1234567890abcdefghijklmnopqrstuvwx"), "a secret must not be imported");
assert.match(leakyText, /REDACTED/);

// Bad references fail cleanly.
assert.equal(importDream("nope.json", 0).ok, false);
assert.equal(importDream(newest.file, 99).ok, false);

// A dream may be deleted without action.
const dismissed = dismissDream(broken.file);
assert.equal(dismissed.ok, true, dismissed.error);
assert.equal(listDreams().length, 1);
assert.equal(dismissDream("../../escape.json").ok, false, "the path must stay in the dreams directory");

fs.rmSync(repo, { recursive: true, force: true });
console.log("dream import tests passed");
