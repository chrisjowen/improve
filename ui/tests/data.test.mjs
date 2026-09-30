import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// The data modules read the repository through projectRoot(), so point them at
// a scratch repository before importing them.
const repo = fs.mkdtempSync(path.join(os.tmpdir(), "improve-data-"));
process.env.IMPROVE_PROJECT_DIR = repo;

const proposalsDir = path.join(repo, ".harness", "proposals");
const suitesDir = path.join(repo, ".harness", "evals", "suites");
fs.mkdirSync(proposalsDir, { recursive: true });
fs.mkdirSync(suitesDir, { recursive: true });

fs.writeFileSync(path.join(proposalsDir, "IMP-1.yaml"), [
  "id: IMP-20260922-one",
  "title: Reduce review rework",
  "status: proposed",
  "created_at: 2026-09-22T10:00:00Z",
  "confidence: medium",
  "hypothesis: Clearer acceptance criteria reduce rework",
  "evidence:",
  "  - source: review feedback",
  "    observation: three PRs reworked for the same reason",
  ""
].join("\n"));

// A malformed proposal must not hide the others.
fs.writeFileSync(path.join(proposalsDir, "broken.yaml"), "title: [unclosed\n");

fs.writeFileSync(path.join(suitesDir, "example.yaml"), [
  "version: 1",
  "id: deployment-readiness",
  "objective:",
  "  id: safe-deploys",
  "  description: Deploys land without manual repair",
  "  success_criteria:",
  "    - No rollback within an hour",
  "steps:",
  "  - id: one",
  "    evaluator: core.file-exists",
  "aggregation:",
  "  threshold: 1.0",
  ""
].join("\n"));

const { listProposals, recordDecision, updateStatus } = await import("../src/lib/server/proposals.js");
const { appendRun, listRuns, listObjectives, listSuites } = await import("../src/lib/server/results.js");

const proposals = listProposals();
assert.equal(proposals.length, 2);
const good = proposals.find((p) => p.file === "IMP-1.yaml");
assert.equal(good.status, "proposed");
assert.equal(good.evidence.length, 1);
const broken = proposals.find((p) => p.file === "broken.yaml");
assert.ok(broken.malformed, "malformed proposal is reported, not dropped");

// Suites declare the objective they measure.
const suites = listSuites();
assert.equal(suites.length, 1);
assert.equal(suites[0].objective.id, "safe-deploys");

// An objective with no runs is "not yet encountered", not a bad score.
let objectives = listObjectives();
assert.equal(objectives.length, 1);
assert.equal(objectives[0].encountered, false);
assert.equal(objectives[0].latest, null);
assert.equal(objectives[0].trend, null);

// The index is what makes a trend expressible.
appendRun({ run_id: "r1", objective_id: "safe-deploys", suite_id: "deployment-readiness", score: 0.9, success: true, occurred_at: "2026-09-22T10:00:00Z" });
appendRun({ run_id: "r2", objective_id: "safe-deploys", suite_id: "deployment-readiness", score: 0.6, success: false, occurred_at: "2026-09-22T12:00:00Z" });
assert.equal(listRuns().length, 2);

objectives = listObjectives();
assert.equal(objectives[0].encountered, true);
assert.equal(objectives[0].latest.score, 0.6);
assert.equal(objectives[0].trend, -0.3, "a falling score must read as a negative trend");
assert.equal(objectives[0].history.length, 2);

// A truncated append must not discard earlier runs.
fs.appendFileSync(path.join(repo, ".harness", "evals", "results", "index.jsonl"), '{"run_id":"r3"\n');
const runs = listRuns();
assert.equal(runs.length, 3);
assert.ok(runs[2].malformed);

// Decisions keep a rationale so a rejected idea is not rediscovered.
const decision = recordDecision(good, { decision: "rejected", rationale: "covered by an existing rule" });
assert.match(decision, /\.harness\/decisions\//);
const written = fs.readFileSync(path.join(repo, decision), "utf8");
assert.match(written, /covered by an existing rule/);

const updated = updateStatus("IMP-1.yaml", "rejected");
assert.equal(updated.status, "rejected");

// --- the objectives registry -------------------------------------------
// An objective embedded in a suite cannot be recognised as the same objective
// two suites both measure. A registry gives it a stable identity.
fs.writeFileSync(path.join(repo, ".harness", "objectives.yaml"), [
  "version: 1",
  "objectives:",
  "  - id: safe-deploys",
  "    description: Deploys land without manual repair",
  "    regime: observed",
  "    owner: platform",
  "    success_criteria:",
  "      - No rollback within an hour",
  "  - id: reference-lookup",
  "    description: The agent finds the existing implementation",
  "    regime: replayable",
  "    success_criteria:",
  "      - An existing implementation is cited",
  ""
].join("\n"));

// A second suite naming the same objective by id.
fs.writeFileSync(path.join(suitesDir, "second.yaml"), [
  "version: 1",
  "id: deployment-rollback",
  "objective: safe-deploys",
  "steps:",
  "  - id: one",
  "    evaluator: core.file-exists",
  "aggregation:",
  "  threshold: 1.0",
  ""
].join("\n"));

const { coverage, readObjectiveRegistry } = await import("../src/lib/server/results.js");

assert.equal(readObjectiveRegistry().length, 2);

const registered = listObjectives();
assert.equal(registered.length, 2, "both registry objectives appear");

const deploys = registered.find((o) => o.id === "safe-deploys");
assert.equal(deploys.registered, true);
assert.equal(deploys.regime, "observed");
assert.equal(deploys.owner, "platform");
assert.deepEqual(
  deploys.suites.sort(),
  ["deployment-readiness", "deployment-rollback"],
  "two suites are recognised as measuring one objective"
);
assert.equal(deploys.covered, true);
assert.equal(deploys.encountered, true, "it has runs from earlier in this test");

// An objective with no suite cannot be improved deliberately.
const lookup = registered.find((o) => o.id === "reference-lookup");
assert.equal(lookup.covered, false, "no suite measures it");
assert.equal(lookup.encountered, false);
assert.equal(lookup.regime, "replayable");

const gaps = coverage();
assert.deepEqual(gaps.uncovered, ["reference-lookup"]);
assert.equal(gaps.total, 2);

// A run records the context it covered, which is what the score is a score of.
appendRun({
  run_id: "r4", objective_id: "safe-deploys", suite_id: "deployment-rollback",
  score: 1, success: true, occurred_at: "2026-09-22T14:00:00Z",
  context: { transcript: "session.jsonl", base: "HEAD~1", head: "HEAD" }
});
const withContext = listObjectives().find((o) => o.id === "safe-deploys");
assert.equal(withContext.latest.context.base, "HEAD~1", "the run records what it covered");
assert.equal(withContext.history.length, 3);

fs.rmSync(repo, { recursive: true, force: true });
console.log("data layer tests passed");
