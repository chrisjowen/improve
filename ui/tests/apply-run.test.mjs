// Applying an approved proposal from the UI: the guards before a run, the run
// itself against a stand-in agent, and Firstmate's shared and private paths.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import YAML from "yaml";

const standin = path.resolve(import.meta.dirname, "fixtures", "standin-agent.mjs");
const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "improve-apply-run-")));
const repo = path.join(scratch, "repo");
const home = path.join(scratch, "home");
fs.mkdirSync(repo);
fs.mkdirSync(home);
process.env.IMPROVE_PROJECT_DIR = repo;
process.env.CLAUDE_PLUGIN_DATA = path.join(scratch, "plugin-data");
process.env.IMPROVE_AGENT_COMMAND = standin;
// The suite may itself run inside a Firstmate lane.
delete process.env.FM_HOME;

const git = (cwd, ...args) => execFileSync("git", args, { cwd, stdio: "pipe" }).toString();
for (const dir of [repo, home]) {
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.email", "t@example.invalid");
  git(dir, "config", "user.name", "t");
}
fs.mkdirSync(path.join(repo, ".claude", "rules"), { recursive: true });
fs.writeFileSync(path.join(repo, "CLAUDE.md"), "# Project\n");
fs.writeFileSync(path.join(repo, ".claude", "rules", "format.md"), "# Format\n");
git(repo, "add", "-A");
git(repo, "commit", "-q", "-m", "base");

const { applyPlan, startApply, applyPrompt } = await import("../src/lib/server/apply-run.js");
const jobs = await import("../src/lib/server/jobs.js");
const { listDecisions, readProposal } = await import("../src/lib/server/proposals.js");
const { LAUNCH_TOKEN, hasLaunchToken } = await import("../src/lib/server/launch.js");
const { handle } = await import("../src/hooks.server.js");
const { pluginRoot } = await import("../src/lib/server/paths.js");
const check = (file) => `node ${path.join(pluginRoot(), "scripts", "proposal-check-cli.mjs")} .harness/proposals/${file}`;

function seed(root, file, { status = "approved", files = ["CLAUDE.md", ".claude/rules/format.md"], id = "IMP-20261025-format", evaluation = {} } = {}) {
  const dir = path.join(root, ".harness", "proposals");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, file), YAML.stringify({
    id,
    title: "Run the formatter before committing",
    status,
    scope: { files },
    evaluation: { pass_conditions: ["the formatter check finds nothing"], commands: ["node .harness/evals/check.mjs"], ...evaluation },
    approval: { approved_by: "ui", approved_at: "2026-10-25T10:00:00.000Z" }
  }));
}

async function settle(id, ms = 30_000) {
  const end = Date.now() + ms;
  for (;;) {
    const job = jobs.getJob(id);
    if (job.status !== "running") return job;
    if (Date.now() > end) throw new Error(`job ${id} still running`);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/** Plan, confirm exactly what the plan shows, and run to the end. */
async function apply(file) {
  const plan = await applyPlan(file);
  assert.equal(plan.ok, true, plan.error);
  const started = await startApply(file, { digest: plan.digest, files: plan.files, commands: plan.commands, branch: plan.branch });
  assert.equal(started.ok, true, started.error);
  return { plan, job: await settle(started.job.id) };
}

const read = (root, file) => fs.readFileSync(path.join(root, file), "utf8");

// --- guards: state, confirm --------------------------------------------------
{
  seed(repo, "proposed.yaml", { status: "proposed" });
  const plan = await applyPlan("proposed.yaml");
  assert.equal(plan.ok, false);
  assert.equal(plan.status, 409);
  assert.match(plan.error, /Only an approved proposal can be applied\. This one is proposed/);

  for (const status of ["validated", "rejected", "draft", "applying"]) {
    seed(repo, "other.yaml", { status });
    assert.equal((await applyPlan("other.yaml")).status, 409, `${status} cannot be applied`);
  }

  seed(repo, "nofiles.yaml", { files: [] });
  assert.equal((await applyPlan("nofiles.yaml")).status, 422);

  seed(repo, "code.yaml", { files: ["src/app.js"] });
  const code = await applyPlan("code.yaml");
  assert.equal(code.status, 422, "a proposal that changes application code is refused");

  seed(repo, "escape.yaml", { files: ["../outside.md"] });
  assert.equal((await applyPlan("escape.yaml")).ok, false, "a path outside the repository is refused");

  assert.equal((await applyPlan("missing.yaml")).status, 404);

  seed(repo, "p.yaml");
  const good = await applyPlan("p.yaml");
  assert.equal(good.ok, true);
  assert.equal(good.mode, "local-apply");
  assert.equal(good.action, "Apply");
  assert.deepEqual(good.files, ["CLAUDE.md", ".claude/rules/format.md"]);
  assert.deepEqual(good.commands, [check("p.yaml"), "node .harness/evals/check.mjs"], "the declared commands and improve's own check");

  // Starting needs the confirm: digest, the exact file list and the exact commands.
  const { digest, files, commands } = good;
  assert.equal((await startApply("p.yaml", {})).status, 400, "no confirm, no run");
  assert.equal((await startApply("p.yaml", { digest, files })).status, 400, "no confirmed commands, no run");
  assert.equal((await startApply("p.yaml", { digest: "0".repeat(64), files, commands })).status, 409, "a stale digest is refused");
  assert.equal((await startApply("p.yaml", { digest, files: ["CLAUDE.md"], commands })).status, 409, "a partial file list is refused");
  assert.equal((await startApply("p.yaml", { digest, files: [...files, "x.md"], commands })).status, 409, "an extra file is refused");
  assert.equal((await startApply("p.yaml", { digest, files, commands: [commands[0]] })).status, 409, "a missing command is refused");
  assert.equal((await startApply("p.yaml", { digest, files, commands: [...commands, "rm -rf /"] })).status, 409, "an extra command is refused");

  // Editing the proposal after the confirm invalidates it.
  seed(repo, "p.yaml", { files: ["CLAUDE.md", ".claude/rules/format.md"], id: "IMP-20261025-format-v2" });
  assert.equal((await startApply("p.yaml", { digest, files, commands })).status, 409);
  assert.equal(jobs.listJobs({ kind: "apply" }).length, 0, "no refused request started a run");
  assert.equal(read(repo, "CLAUDE.md"), "# Project\n", "no refused request changed a file");
}

// --- guards: the per-launch token and same origin ----------------------------
{
  const request = (headers) => new Request("http://127.0.0.1:4413/api/proposals/p.yaml/apply-run", { method: "POST", headers });
  assert.equal(hasLaunchToken(request({})), false, "no token");
  assert.equal(hasLaunchToken(request({ "x-improve-token": "nope" })), false, "a wrong token");
  assert.equal(hasLaunchToken(request({ "x-improve-token": LAUNCH_TOKEN })), true, "this launch's token");

  // Cross-origin is refused before the route, token or not.
  const url = new URL("http://127.0.0.1:4413/api/proposals/p.yaml/apply-run");
  let reached = false;
  const response = await handle({
    event: { request: new Request(url, { method: "POST", headers: { host: url.host, origin: "http://evil.example", "x-improve-token": LAUNCH_TOKEN } }), url },
    resolve: async () => { reached = true; return new Response("{}"); }
  });
  assert.equal(response.status, 403);
  assert.equal(reached, false);

  // A page this server renders carries the token.
  let transformed = "";
  await handle({
    event: { request: new Request("http://127.0.0.1:4413/proposals", { headers: { host: "127.0.0.1:4413" } }), url: new URL("http://127.0.0.1:4413/proposals") },
    resolve: async (_event, options) => {
      transformed = await options.transformPageChunk({ html: '<meta name="improve-token" content="%improve.token%" />', done: true });
      return new Response(transformed);
    }
  });
  assert.ok(transformed.includes(`content="${LAUNCH_TOKEN}"`), transformed);
}

// --- the prompt is /improve apply, with the confirm --------------------------
{
  seed(repo, "p.yaml");
  const plan = await applyPlan("p.yaml");
  const prompt = applyPrompt(plan, read(repo, ".harness/proposals/p.yaml"), "2026-10-25T10:00:00.000Z");
  assert.match(prompt, /^\/improve apply IMP-20261025-format\n/, "the run is the same command a person types");
  assert.match(prompt, / {2}- CLAUDE\.md\n {2}- \.claude\/rules\/format\.md\n/);
  assert.match(prompt, new RegExp(`sha256 ${plan.digest}`));
  assert.ok(prompt.includes(`only commands you may run, exactly as written:\n  - ${check("p.yaml")}\n  - node .harness/evals/check.mjs\n`), prompt);
}

// --- a passing run: applied, evaluated, recorded -----------------------------
{
  const argsFile = path.join(scratch, "args.json");
  process.env.IMPROVE_STANDIN_ARGS_FILE = argsFile;
  seed(repo, "p.yaml");
  const { job } = await apply("p.yaml");
  delete process.env.IMPROVE_STANDIN_ARGS_FILE;

  assert.equal(job.status, "completed", job.error);
  assert.equal(job.kind, "apply");
  assert.equal(job.lane, "agent", "an apply run shares the agent lane");
  assert.equal(job.result.evaluation.passed, true);
  assert.equal(job.result.evaluation.checks.length, 2);
  assert.deepEqual(job.result.files.map((f) => f.change), ["modified", "modified"]);
  assert.match(read(repo, "CLAUDE.md"), /Run the formatter/);

  const args = JSON.parse(fs.readFileSync(argsFile, "utf8"));
  assert.ok(args.includes("acceptEdits"), "the apply agent may edit");
  assert.ok(!args.includes("--disallowed-tools"));
  assert.deepEqual(args.slice(args.indexOf("--allowedTools") + 1), [`Bash(${check("p.yaml")})`, "Bash(node .harness/evals/check.mjs)"], "exactly the declared commands");

  const proposal = readProposal("p.yaml");
  assert.equal(proposal.status, "validated");
  assert.equal(proposal.outcome.applied_by, "ui");
  const decision = listDecisions({ file: "p.yaml" })[0];
  assert.deepEqual(decision.applied_files, ["CLAUDE.md", ".claude/rules/format.md"]);

  const changes = jobs.readChanges(job.id);
  assert.equal(changes.files[0].before, "# Project\n");
  assert.match(changes.files[0].after, /Run the formatter/);
  assert.ok(fs.readFileSync(jobs.logFile(job.id), "utf8").includes("confirmed files: CLAUDE.md, .claude/rules/format.md"));

  // Applied once; the same proposal cannot run again.
  assert.equal((await applyPlan("p.yaml")).status, 409);
  git(repo, "checkout", "-q", "--", "CLAUDE.md", ".claude/rules/format.md");
}

// --- a failing evaluation puts the files back --------------------------------
{
  process.env.IMPROVE_STANDIN = "fail-eval";
  seed(repo, "p.yaml");
  // An uncommitted edit the person made must survive the restore.
  fs.writeFileSync(path.join(repo, "CLAUDE.md"), "# Project\n\nwork in progress\n");
  const { job } = await apply("p.yaml");
  delete process.env.IMPROVE_STANDIN;

  assert.equal(job.status, "failed");
  assert.match(job.error, /The evaluation failed: The check still finds unformatted commits/);
  assert.match(job.hint, /put back as they were/);
  assert.equal(job.result.restored, true);
  assert.equal(job.result.evaluation.passed, false);
  assert.equal(read(repo, "CLAUDE.md"), "# Project\n\nwork in progress\n");
  assert.equal(read(repo, ".claude/rules/format.md"), "# Format\n");
  const proposal = readProposal("p.yaml");
  assert.equal(proposal.status, "approved", "a failed run leaves it approved");
  assert.equal(YAML.parse(read(repo, ".harness/proposals/p.yaml")).last_apply.status, "failed");
  // The record keeps what the run tried, for the person to read.
  assert.match(jobs.readChanges(job.id).files[0].after, /Run the formatter/);
  assert.equal(jobs.readChanges(job.id).restored, true);
  git(repo, "checkout", "-q", "--", "CLAUDE.md");
}

// --- a change outside the confirmed files fails the run and is named ----------
{
  process.env.IMPROVE_STANDIN = "stray";
  seed(repo, "p.yaml");
  const { job } = await apply("p.yaml");
  delete process.env.IMPROVE_STANDIN;
  assert.equal(job.status, "failed");
  assert.match(job.error, /outside the ones you confirmed: stray\.txt/);
  assert.match(job.hint, /Inspect these.*stray\.txt/);
  assert.deepEqual(job.result.stray, ["stray.txt"]);
  assert.equal(read(repo, "CLAUDE.md"), "# Project\n", "confirmed files are put back");
  assert.ok(fs.existsSync(path.join(repo, "stray.txt")), "a stray file is reported, not deleted");
  fs.unlinkSync(path.join(repo, "stray.txt"));
}

// --- a further edit to a file that was already uncommitted is stray too ------
{
  fs.writeFileSync(path.join(repo, "stray.txt"), "the person's own work\n");
  process.env.IMPROVE_STANDIN = "stray";
  seed(repo, "p.yaml");
  const { job } = await apply("p.yaml");
  delete process.env.IMPROVE_STANDIN;
  assert.equal(job.status, "failed");
  assert.deepEqual(job.result.stray, ["stray.txt"]);
  assert.equal(job.result.unchecked, null);
  assert.equal(read(repo, "CLAUDE.md"), "# Project\n", "confirmed files are put back");
  fs.unlinkSync(path.join(repo, "stray.txt"));
}

// --- an evaluation that needs an undeclared command fails, naming it ----------
{
  process.env.IMPROVE_STANDIN = "undeclared";
  seed(repo, "p.yaml");
  const { job } = await apply("p.yaml");
  delete process.env.IMPROVE_STANDIN;
  assert.equal(job.status, "failed");
  assert.match(job.error, /needs a command the proposal does not declare: python3 \.harness\/evals\/run\.py\. The run does not widen its own permissions/);
  assert.equal(readProposal("p.yaml").status, "approved");
}

// --- the recheck can stop the run ---------------------------------------------
{
  process.env.IMPROVE_STANDIN = "refuse";
  seed(repo, "p.yaml");
  const { job } = await apply("p.yaml");
  delete process.env.IMPROVE_STANDIN;
  assert.equal(job.status, "failed");
  assert.match(job.error, /recheck stopped the run: the file already contains this rule/);
  assert.match(job.hint, /No confirmed file was changed/);
}

// --- cancel, and one agent run at a time ------------------------------------
{
  process.env.IMPROVE_STANDIN = "slow";
  seed(repo, "p.yaml");
  const plan = await applyPlan("p.yaml");
  const started = await startApply("p.yaml", { digest: plan.digest, files: plan.files, commands: plan.commands });
  assert.equal(started.ok, true);
  const second = await startApply("p.yaml", { digest: plan.digest, files: plan.files, commands: plan.commands });
  assert.equal(second.status, 409, "a second run waits for the first");
  assert.equal(second.running.id, started.job.id);
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal(jobs.cancelJob(started.job.id).ok, true);
  const job = await settle(started.job.id);
  delete process.env.IMPROVE_STANDIN;
  assert.equal(job.status, "cancelled");
  assert.equal(read(repo, "CLAUDE.md"), "# Project\n");
  assert.equal(readProposal("p.yaml").status, "approved");
}

// --- a project in a subdirectory of a git repository -------------------------
{
  const mono = path.join(scratch, "mono");
  const pkg = path.join(mono, "pkg");
  fs.mkdirSync(pkg, { recursive: true });
  git(mono, "init", "-q", "-b", "main");
  git(mono, "config", "user.email", "t@example.invalid");
  git(mono, "config", "user.name", "t");
  fs.writeFileSync(path.join(pkg, "CLAUDE.md"), "# Package\n");
  fs.mkdirSync(path.join(pkg, ".claude", "rules"), { recursive: true });
  fs.writeFileSync(path.join(pkg, ".claude", "rules", "format.md"), "# Format\n");
  git(mono, "add", "-A");
  git(mono, "commit", "-q", "-m", "base");
  process.env.IMPROVE_PROJECT_DIR = pkg;
  seed(pkg, "p.yaml");
  const { job } = await apply("p.yaml");
  assert.equal(job.status, "completed", job.error);
  assert.deepEqual(job.result.stray, []);
  assert.match(read(pkg, "CLAUDE.md"), /Run the formatter/);
}

// --- outside git, the result says changes elsewhere were not checked ----------
{
  const plain = path.join(scratch, "plain");
  fs.mkdirSync(plain);
  fs.writeFileSync(path.join(plain, "CLAUDE.md"), "# Plain\n");
  process.env.IMPROVE_PROJECT_DIR = plain;
  seed(plain, "p.yaml", { files: ["CLAUDE.md"] });
  const { job } = await apply("p.yaml");
  assert.equal(job.status, "completed", job.error);
  assert.match(job.result.unchecked, /not a git repository, so changes outside the confirmed files could not be checked/);
}

// --- Firstmate: private files apply here, shared files go to a branch --------
{
  process.env.IMPROVE_PROJECT_DIR = home;
  fs.writeFileSync(path.join(home, "AGENTS.md"), "# Firstmate\n\nSupervisor contract.\n");
  fs.mkdirSync(path.join(home, "bin"));
  fs.writeFileSync(path.join(home, "bin", "fm-check.sh"), "#!/bin/sh\necho ok\n");
  fs.mkdirSync(path.join(home, "data"));
  fs.writeFileSync(path.join(home, "data", "learnings.md"), "# Learnings\n");
  fs.writeFileSync(path.join(home, ".gitignore"), "data/\nstate/\nconfig/\n.harness/\n");
  fs.mkdirSync(path.join(home, ".harness", "evals"), { recursive: true });
  fs.writeFileSync(path.join(home, ".harness", "improve.json"), JSON.stringify({ adapters: { firstmate: { enabled: true } } }));
  fs.writeFileSync(path.join(home, ".harness", "evals", "suite.yaml"), "cases: []\n");
  fs.writeFileSync(path.join(home, ".harness", "evals", "other.yaml"), "cases: []\n");
  fs.writeFileSync(path.join(scratch, "secret.txt"), "not for the worktree\n");
  git(home, "add", "-A");
  git(home, "commit", "-q", "-m", "home");

  // Captain-private: applied in place, like any repository.
  seed(home, "private.yaml", { files: ["data/learnings.md"], id: "IMP-20261025-learning" });
  const privatePlan = await applyPlan("private.yaml");
  assert.equal(privatePlan.mode, "local-apply");
  assert.equal(privatePlan.action, "Apply");
  const privateRun = await apply("private.yaml");
  assert.equal(privateRun.job.status, "completed", privateRun.job.error);
  assert.match(read(home, "data/learnings.md"), /Run the formatter/);
  assert.equal(readProposal("private.yaml").status, "validated");

  // Mixed sides cannot be one decision.
  seed(home, "mixed.yaml", { files: ["data/learnings.md", "AGENTS.md"], id: "IMP-20261025-mixed" });
  const mixed = await applyPlan("mixed.yaml");
  assert.equal(mixed.status, 422);
  assert.match(mixed.error, /split it/);

  // Shared-tracked: never edited in place; prepared on a branch.
  seed(home, "shared.yaml", {
    files: ["AGENTS.md", "bin/fm-check.sh"],
    id: "IMP-20261025-brief-port",
    evaluation: { commands: ["python3 .harness/evals/run.py --suite .harness/evals/suite.yaml"], baseline: "also .harness/../../secret.txt and .harness/../AGENTS.md" }
  });
  const sharedPlan = await applyPlan("shared.yaml");
  assert.equal(sharedPlan.mode, "upstream-pr");
  assert.equal(sharedPlan.action, "Prepare upstream change");
  assert.equal(sharedPlan.branch, "improve/imp-20261025-brief-port");
  assert.equal((await startApply("shared.yaml", { digest: sharedPlan.digest, files: sharedPlan.files, commands: sharedPlan.commands, branch: "main" })).status, 409, "the branch is part of the confirm");

  const headBefore = git(home, "rev-parse", "HEAD").trim();
  const seenFile = path.join(scratch, "seen.json");
  process.env.IMPROVE_STANDIN_SEEN_FILE = seenFile;
  const { job } = await apply("shared.yaml");
  delete process.env.IMPROVE_STANDIN_SEEN_FILE;
  assert.equal(job.status, "completed", job.error);
  assert.deepEqual(JSON.parse(fs.readFileSync(seenFile, "utf8")), [
    { path: ".harness/evals/suite.yaml", mode: 0o444 },
    { path: ".harness/improve.json", mode: 0o444 },
    { path: ".harness/proposals/shared.yaml", mode: 0o444 }
  ], "the worktree gets only this proposal, improve.json and the named eval files, read-only");
  assert.equal(read(home, "AGENTS.md"), "# Firstmate\n\nSupervisor contract.\n", "the shared file is not edited here");
  assert.equal(git(home, "rev-parse", "HEAD").trim(), headBefore, "the checkout stays on its branch");
  assert.equal(git(home, "status", "--porcelain"), "", "the checkout is unchanged");
  assert.equal(job.result.branch, "improve/imp-20261025-brief-port");
  assert.match(git(home, "show", `${job.result.branch}:AGENTS.md`), /Run the formatter/);
  assert.deepEqual(git(home, "diff", "--name-only", `main..${job.result.branch}`).trim().split("\n").sort(), ["AGENTS.md", "bin/fm-check.sh"]);
  assert.match(job.result.next, /Nothing was pushed.*git push -u origin improve\/imp-20261025-brief-port/);
  assert.equal(git(home, "worktree", "list").trim().split("\n").length, 1, "the worktree is removed");
  const proposal = readProposal("shared.yaml");
  assert.equal(proposal.status, "approved", "it is applied only when the pull request merges");
  assert.equal(YAML.parse(read(home, ".harness/proposals/shared.yaml")).upstream_change.branch, job.result.branch);

  // The next plan picks a free branch name.
  assert.equal((await applyPlan("shared.yaml")).branch, "improve/imp-20261025-brief-port-2");

  // A failed upstream run deletes its branch.
  process.env.IMPROVE_STANDIN = "fail-eval";
  const failed = await apply("shared.yaml");
  delete process.env.IMPROVE_STANDIN;
  assert.equal(failed.job.status, "failed");
  assert.match(failed.job.hint, /Branch improve\/imp-20261025-brief-port-2 was deleted; this repository is unchanged/);
  assert.equal(git(home, "branch", "--list", "improve/imp-20261025-brief-port-2"), "");
  assert.equal(git(home, "worktree", "list").trim().split("\n").length, 1);
  assert.equal(git(home, "status", "--porcelain"), "");
}

fs.rmSync(scratch, { recursive: true, force: true });
console.log("apply-run tests passed");
