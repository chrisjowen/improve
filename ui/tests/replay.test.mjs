// Replay A/B from the review UI: a proposal shows its candidate, scoring runs
// as a background job, and the verdict comes back on the proposal.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const repo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "improve-ui-replay-")));
const standin = path.resolve(import.meta.dirname, "..", "..", "tests", "fixtures", "standin-eval.mjs");
process.env.IMPROVE_PROJECT_DIR = repo;
process.env.CLAUDE_PLUGIN_DATA = path.join(repo, "plugin-data");
process.env.IMPROVE_REPLAY_COMMAND = standin;
process.env.STANDIN_SCORES = JSON.stringify({ "*": { with: [1, 1, 1], without: [0, 0, 0] } });

const write = (rel, text) => {
  fs.mkdirSync(path.dirname(path.join(repo, rel)), { recursive: true });
  fs.writeFileSync(path.join(repo, rel), text);
};
write(".harness/evals/replay/suite.json", JSON.stringify({ cases: [{ name: "c1", split: "validation", needs: [] }, { name: "c2", split: "test", needs: [] }] }));
for (const name of ["c1", "c2"]) {
  write(`.harness/evals/replay/cases/${name}/case.yaml`, `schema_version: "1.0"\nname: "${name}"\nexecution:\n  prompt: "go"\ngraders:\n  - type: "regex"\n    name: "x"\n    pattern: "x"\n`);
}
const proposal = (status) => `id: IMP-1\ntitle: Use bun\nstatus: ${status}\nscope:\n  files: [CLAUDE.md]\n`;
write(".harness/proposals/IMP-1.yaml", proposal("proposed"));
write(".harness/proposals/IMP-1.candidate/lesson.md", "Use bun.\n");
write(".harness/proposals/IMP-2.yaml", proposal("proposed").replace("IMP-1", "IMP-2"));

const { readProposal, listProposals } = await import("../src/lib/server/proposals.js");
const { requestReplay } = await import("../src/lib/server/replay.js");
const jobs = await import("../src/lib/server/jobs.js");

// The candidate is listed with the proposal; one without a candidate has none.
const before = readProposal("IMP-1.yaml");
assert.deepEqual(before.candidate.kinds, ["lesson"]);
assert.equal(before.replay, null);
assert.equal(readProposal("IMP-2.yaml").candidate, null);

// The route refuses a proposal without a candidate, and one already approved.
const refused = requestReplay("IMP-2.yaml");
assert.equal(refused.status, 409);
assert.match(refused.hint, /\.candidate\//);
write(".harness/proposals/IMP-3.yaml", proposal("approved").replace("IMP-1", "IMP-3"));
write(".harness/proposals/IMP-3.candidate/lesson.md", "x\n");
const approved = requestReplay("IMP-3.yaml");
assert.equal(approved.status, 409);
assert.match(approved.error, /before it is approved/);
assert.equal(requestReplay("IMP-9.yaml").status, 404);
assert.equal(requestReplay("../x.yaml").status, 400, "a path is never a proposal");

// Scoring runs as a job and records WITH, WITHOUT, the delta and the gate.
const started = requestReplay("IMP-1.yaml");
assert.ok(started.job, started.error);
const end = Date.now() + 20_000;
let job;
for (;;) {
  job = jobs.getJob(started.job.id);
  if (job.status !== "running") break;
  if (Date.now() > end) throw new Error("replay job still running");
  await new Promise((resolve) => setTimeout(resolve, 50));
}
assert.equal(job.status, "completed", job.error);
assert.equal(job.kind, "replay");
assert.deepEqual({ verdict: job.result.verdict, delta: job.result.delta }, { verdict: "pass", delta: 1 });

const after = readProposal("IMP-1.yaml");
assert.equal(after.status, "proposed", "scoring approves nothing");
assert.equal(after.replay.gate.verdict, "pass");
assert.deepEqual([after.replay.validation.with, after.replay.validation.without, after.replay.validation.delta], [1, 0, 1]);
assert.equal(after.replay.test.cases, 1);
assert.ok(listProposals().find((p) => p.file === "IMP-1.yaml").replay, "the list carries it too");

fs.rmSync(repo, { recursive: true, force: true });
console.log("ui replay tests passed");
