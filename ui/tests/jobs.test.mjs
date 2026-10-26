// Regression tests for running evaluations and agents from the UI: plain
// errors, cancel, lanes, a log per job, and records that survive a restart.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const plugin = path.resolve(import.meta.dirname, "..", "..");
const repo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "improve-jobs-")));
process.env.IMPROVE_PROJECT_DIR = repo;
process.env.CLAUDE_PLUGIN_DATA = path.join(repo, ".plugin-data");

const git = (...args) => execFileSync("git", args, { cwd: repo, stdio: "pipe" });
git("init", "-q");
git("config", "user.email", "t@example.invalid");
git("config", "user.name", "t");
fs.writeFileSync(path.join(repo, "a.txt"), "a\n");
git("add", "-A");
git("commit", "-q", "-m", "a");

fs.cpSync(path.join(plugin, "assets", "eval-rig"), path.join(repo, ".harness", "evals"), {
  recursive: true,
  filter: (source) => !/(__pycache__|\/tests(\/|$))/.test(source)
});
const suites = path.join(repo, ".harness", "evals", "suites");
fs.writeFileSync(path.join(suites, "quick.yaml"), `version: 1
id: quick
objective: { id: tidy, success_criteria: [no markers] }
registries: [../registry.yaml]
steps:
  - id: no-markers
    evaluator: core.grep
    metadata: { paths_from: changed_files, pattern: "^<<<<<<<", regex: true, should_match: false }
aggregation: { threshold: 1.0 }
`);
const pidFile = path.join(repo, "sleeper.pid");
fs.writeFileSync(path.join(suites, "slow.yaml"), `version: 1
id: slow
objective: { id: tidy, success_criteria: [no markers] }
registries: [../registry.yaml]
steps:
  - id: waits
    evaluator: core.command
    timeout_ms: 60000
    metadata: { argv: ["sh", "-c", "sleep 30 & echo $! > '${pidFile}'; wait"] }
aggregation: { threshold: 1.0 }
`);

const { runEvaluation, expandHome, explainRigFailure } = await import("../src/lib/server/evaluate.js");
const jobs = await import("../src/lib/server/jobs.js");

async function settle(id, ms = 30_000) {
  const end = Date.now() + ms;
  for (;;) {
    const job = jobs.getJob(id);
    if (job.status !== "running") return job;
    if (Date.now() > end) throw new Error(`job ${id} still running`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

// --- a good run, with step progress ----------------------------------------
{
  const updates = [];
  const result = await runEvaluation({ suiteFile: "quick.yaml", progress: (p) => updates.push(p) });
  assert.equal(result.ok, true, result.error);
  assert.equal(result.run.score, 1);
  assert.ok(updates.some((p) => p.total === 1 && /Grading step 1 of 1/.test(p.message)), JSON.stringify(updates));
}

// --- a mistyped revision says so, instead of "build_context failed" ---------
{
  const result = await runEvaluation({ suiteFile: "quick.yaml", base: "nope~3" });
  assert.equal(result.ok, false);
  assert.match(result.error, /base revision "nope~3" does not exist/);
  assert.ok(result.hint);
}

// --- a tilde path is a home path, as the form suggests ----------------------
assert.equal(expandHome("~/x/y.jsonl"), path.join(os.homedir(), "x", "y.jsonl"));
assert.equal(expandHome("/abs"), "/abs");
{
  const result = await runEvaluation({ suiteFile: "quick.yaml", transcript: "~/surely-not-here.jsonl" });
  assert.match(result.error, new RegExp(`no transcript at ~/surely-not-here`));
}

// --- rig failures in plain words, with the next step ------------------------
{
  const missing = explainRigFailure("grade", { code: 1, stderr: "Traceback (most recent call last):\n  File x\nModuleNotFoundError: No module named 'yaml'\n" });
  assert.match(missing.error, /needs the Python package "yaml"/);
  assert.match(missing.hint, /pip install -r \.harness\/evals\/requirements\.txt/);

  process.env.IMPROVE_PYTHON = path.join(repo, "no-such-python");
  const result = await runEvaluation({ suiteFile: "quick.yaml" });
  delete process.env.IMPROVE_PYTHON;
  assert.match(result.error, /Python was not found/);
  assert.match(result.hint, /IMPROVE_PYTHON/);
}

// --- a run is a job with a log; cancel ends the evaluator's whole tree -----
{
  const started = jobs.startJob("evaluate", { title: "Evaluate slow" }, (context) => runEvaluation({ suiteFile: "slow.yaml", ...context }));
  assert.ok(started.job, started.error);

  // One running job per lane: a second evaluation is refused and names the
  // job in the way, but an agent job is not blocked by it.
  const second = jobs.startJob("evaluate", { title: "Evaluate quick" }, () => ({ ok: true }));
  assert.equal(second.status, 409);
  assert.match(second.error, /"Evaluate slow" is still running/);
  assert.equal(second.running.id, started.job.id);
  const agent = jobs.startJob("draft-skill", { title: "Draft" }, () => ({ ok: true }));
  assert.ok(agent.job, "an agent job runs alongside an evaluation");
  await settle(agent.job.id);

  const end = Date.now() + 20_000;
  while (!(fs.existsSync(pidFile) && fs.readFileSync(pidFile, "utf8").trim()) && Date.now() < end) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const sleeper = Number(fs.readFileSync(pidFile, "utf8"));
  assert.equal(jobs.cancelJob(started.job.id).ok, true);
  const finished = await settle(started.job.id);
  assert.equal(finished.status, "cancelled");
  for (let i = 0; i < 40 && alive(sleeper); i += 1) await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(alive(sleeper), false, "the evaluator's sleep must not outlive a cancel");

  const log = jobs.readLog(started.job.id);
  assert.match(log.text, /eval_runner\.py/);
  assert.match(log.text, /cancel requested/);
}

// --- failures carry the hint through to the job ----------------------------
{
  const started = jobs.startJob("evaluate", { title: "Bad base" }, (context) => runEvaluation({ suiteFile: "quick.yaml", base: "nope", ...context }));
  const job = await settle(started.job.id);
  assert.equal(job.status, "failed");
  assert.match(job.error, /does not exist/);
  assert.ok(job.hint);
}

// --- records survive a restart; a run cut off by one says so ----------------
{
  const dir = jobs.jobsDir();
  fs.writeFileSync(path.join(dir, "orphan.json"), JSON.stringify({
    id: "orphan", kind: "evaluate", lane: "evaluate", title: "Cut off", status: "running",
    started_at: new Date().toISOString(), server_pid: 999_999_999
  }));
  jobs.resetForTests();
  const listed = jobs.listJobs();
  assert.ok(listed.length >= 4, "earlier jobs are still listed after a reload");
  const orphan = jobs.getJob("orphan");
  assert.equal(orphan.status, "interrupted");
  assert.match(orphan.error, /stopped while this was running/);
  // An interrupted run does not hold its lane.
  assert.equal(jobs.runningIn("evaluate"), undefined);
}

// --- approve and reject record a reason; approving changes no harness file --
{
  const proposals = path.join(repo, ".harness", "proposals");
  fs.mkdirSync(proposals, { recursive: true });
  fs.writeFileSync(path.join(proposals, "p.yaml"), "id: IMP-1\ntitle: Add a hook\nstatus: proposed\nscope:\n  files: [.claude/settings.json]\n");
  fs.writeFileSync(path.join(proposals, "q.yaml"), "id: IMP-2\ntitle: Add a rule\nstatus: proposed\n");
  const { approveProposal, rejectProposal } = await import("../src/lib/server/skills.js");
  const { readProposal, listDecisions } = await import("../src/lib/server/proposals.js");

  const approved = approveProposal("p.yaml", { rationale: "Tests keep breaking." });
  assert.equal(approved.ok, true, approved.error);
  assert.match(approved.next, /\/improve apply IMP-1/);
  assert.equal(readProposal("p.yaml").status, "approved");
  assert.ok(readProposal("p.yaml").approval.digest, "the approval pins the reviewed bytes");
  assert.equal(fs.existsSync(path.join(repo, ".claude")), false, "approval must not change the harness");
  assert.equal(approveProposal("p.yaml", {}).status, 409, "approving twice is refused");

  assert.equal(rejectProposal("q.yaml", { rationale: "" }).status, 400, "a rejection needs a reason");
  assert.equal(readProposal("q.yaml").status, "proposed");
  assert.equal(rejectProposal("q.yaml", { rationale: "Already covered by CLAUDE.md." }).ok, true);

  const decisions = listDecisions();
  assert.deepEqual(decisions.map((d) => d.decision).sort(), ["approved", "rejected"]);
  assert.equal(listDecisions({ file: "q.yaml" })[0].rationale, "Already covered by CLAUDE.md.");
}

console.log("job tests passed");
