import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import YAML from "yaml";
import { runAgent } from "../../../../scripts/spawn-agent.mjs";
import { runProcess } from "../../../../scripts/run-process.mjs";
import { detectFirstmate } from "../../../../adapters/firstmate/home.mjs";
import { deliveryFor } from "../../../../adapters/firstmate/surfaces.mjs";
import { contain, pluginRoot, projectId, projectRoot, readTextSafe } from "./paths.js";
import { jobsDir, startJob } from "./jobs.js";
import { readProposal, readProposalText, recordDecision, updateStatus } from "./proposals.js";
import { assertRealPathInside, digestOf, writeAtomic } from "./write.js";

/**
 * Apply an approved proposal from the review UI.
 *
 * This runs `/improve apply <id>` in a background agent, the same flow a person
 * runs in Claude Code: recheck the proposal, make the change, run its
 * evaluation. What this module adds is the boundary around it, because the
 * agent holds edit tools:
 *
 * - only an approved proposal whose files are all harness files can run;
 * - the request must name the proposal bytes, the exact files and the exact
 *   commands the person confirmed, so a proposal edited after the confirm is
 *   refused;
 * - the agent may run only the commands the proposal's evaluation declares,
 *   plus improve's own proposal check;
 * - afterwards the server compares the files itself. A run that fails, fails
 *   its evaluation, or changes anything outside the confirmed files puts the
 *   confirmed files back and reports what else changed.
 *
 * In a Firstmate home, shared-tracked files are never edited in place. The
 * run works in a separate git worktree on a new branch, and a passing change
 * is committed there for the captain to open a pull request from. Nothing is
 * pushed.
 */

const TIMEOUT_MS = 30 * 60_000;
const GIT_TIMEOUT_MS = 60_000;
// Kept per file in the change record; harness files are far smaller.
const MAX_TEXT = 200_000;
// Evaluation input files a run guards, at most; more refuses the plan.
const MAX_ASSETS = 500;
const RESULTS = ".harness/evals/results/";

/**
 * @typedef {{
 *   ok: true, file: string, id: string, title: string,
 *   mode: "local-apply" | "upstream-pr", action: string, files: string[],
 *   commands: string[], digest: string, branch: string | null, explanation: string
 * }} ApplyPlan
 * @typedef {{ ok: false, status: number, error: string }} Refusal
 * @typedef {{ path: string, before: string | null, after: string | null, change: string, truncated?: boolean }} FileChange
 */

/**
 * @param {string[]} args
 * @param {string} cwd
 * @param {{ logFile?: string, signal?: AbortSignal }} [options]
 */
function git(args, cwd, { logFile, signal } = {}) {
  return runProcess("git", args, { cwd, timeoutMs: GIT_TIMEOUT_MS, logFile, signal });
}

/**
 * @param {string | undefined} logFile
 * @param {string} line
 */
function note(logFile, line) {
  if (!logFile) return;
  try {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.appendFileSync(logFile, `${new Date().toISOString()} ${line}\n`, { encoding: "utf8", mode: 0o600 });
  } catch {
    // a log failure must not fail the run
  }
}

/** @param {string} id */
function branchSlug(id) {
  return `improve/${id.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "proposal"}`;
}

/**
 * The first `improve/<id>` branch name not already taken.
 * @param {string} root
 * @param {string} id
 */
async function freeBranch(root, id) {
  const base = branchSlug(id);
  for (let n = 1; n < 100; n += 1) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const taken = await git(["rev-parse", "--verify", "--quiet", `refs/heads/${candidate}`], root);
    if (taken.code !== 0) return candidate;
  }
  throw new Error(`every branch name from ${base} to ${base}-99 is taken`);
}

/**
 * What applying `file` would do, or why it cannot.
 *
 * The confirm dialog shows this, and starting a run requires the same files
 * and digest back, so the person confirms exactly what runs.
 *
 * @param {string} file
 * @returns {Promise<ApplyPlan | Refusal>}
 */
export async function applyPlan(file) {
  const proposal = readProposal(file);
  if (!proposal) return { ok: false, status: 404, error: `no such proposal: ${file}` };
  if (proposal.status !== "approved") {
    return { ok: false, status: 409, error: `Only an approved proposal can be applied. This one is ${proposal.status}.` };
  }
  /** @type {unknown[]} */
  const listed = proposal.scope?.files ?? [];
  const files = [...new Set(listed.filter((f) => typeof f === "string" && f.trim() !== "").map((f) => String(f).trim()))];
  if (files.length === 0) {
    return { ok: false, status: 422, error: "This proposal lists no files, so nobody can confirm what it changes." };
  }
  if (proposal.check?.scope !== "harness") {
    return {
      ok: false,
      status: 422,
      error: proposal.check?.findings?.[0]?.detail ?? "This proposal changes files outside the harness."
    };
  }

  const root = projectRoot();
  for (const candidate of files) {
    try {
      assertRealPathInside(root, contain(root, candidate));
    } catch (error) {
      return { ok: false, status: 422, error: /** @type {Error} */ (error).message };
    }
  }

  /** @type {unknown[]} */
  const declared = Array.isArray(proposal.evaluation?.commands) ? proposal.evaluation.commands : [];
  const commands = [...new Set([
    `node ${path.join(pluginRoot(), "scripts", "proposal-check-cli.mjs")} .harness/proposals/${file}`,
    ...declared.filter((c) => typeof c === "string" && c.trim() !== "").map((c) => String(c).trim())
  ])];
  const { overflow, invalid } = harnessAssets(root, { file }, proposal.evaluation);
  if (invalid) {
    return { ok: false, status: 422, error: `evaluation.outputs lists ${invalid}, which is not under .harness/. Only .harness/ files can be evaluation outputs.` };
  }
  if (overflow) {
    return { ok: false, status: 422, error: `The evaluation names ${overflow}, which holds more than ${MAX_ASSETS} files, too many to guard during a run. Name the files it reads instead.` };
  }

  const digest = digestOf(readProposalText(file) ?? "");
  const firstmate = detectFirstmate(root);
  if (firstmate.detected && firstmate.enabled) {
    const derived = deliveryFor(files);
    if (derived.delivery === "refuse" || derived.delivery === "split") {
      return { ok: false, status: 422, error: `This proposal ${derived.reason}.` };
    }
    if (derived.delivery === "upstream-pr") {
      const repo = await git(["rev-parse", "--show-toplevel"], root);
      if (repo.code !== 0) {
        return { ok: false, status: 422, error: "These are shared Firstmate files, and preparing an upstream change needs this home to be a git repository." };
      }
      const branch = await freeBranch(root, proposal.id);
      return {
        ok: true,
        file,
        id: proposal.id,
        title: proposal.title,
        mode: "upstream-pr",
        action: "Prepare upstream change",
        files,
        commands,
        digest,
        branch,
        explanation: `These are shared Firstmate files, so they are not edited here. The run makes the change on a new branch, ${branch}, in a separate worktree, runs the evaluation there, and commits it if it passes. Nothing is pushed: you open the pull request.`
      };
    }
  }
  return {
    ok: true,
    file,
    id: proposal.id,
    title: proposal.title,
    mode: "local-apply",
    action: "Apply",
    files,
    commands,
    digest,
    branch: null,
    explanation: "The run edits these files in this repository and runs the proposal's evaluation. If it fails, the files are put back as they were."
  };
}

/**
 * @param {unknown} given
 * @param {string[]} expected
 */
function sameSet(given, expected) {
  if (!Array.isArray(given)) return false;
  const a = [...new Set(given)].sort();
  const b = [...expected].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * Start the apply run as a background job, after the guards.
 *
 * @param {string} file
 * @param {{ digest?: unknown, files?: unknown, commands?: unknown, branch?: unknown, command?: string }} confirm
 */
export async function startApply(file, { digest, files, commands, branch, command } = {}) {
  const plan = await applyPlan(file);
  if (!plan.ok) return plan;
  if (typeof digest !== "string" || !Array.isArray(files) || !Array.isArray(commands)) {
    return { ok: false, status: 400, error: "Confirm the files first: the request must carry the proposal digest and the confirmed files and commands." };
  }
  if (digest !== plan.digest) {
    return { ok: false, status: 409, error: "The proposal changed after you confirmed. Review it again." };
  }
  if (!sameSet(files, plan.files)) {
    return { ok: false, status: 409, error: "The files you confirmed are not the files this proposal changes. Review it again." };
  }
  if (!sameSet(commands, plan.commands)) {
    return { ok: false, status: 409, error: "The commands you confirmed are not the commands this run may use. Review it again." };
  }
  if (plan.mode === "upstream-pr" && branch !== plan.branch) {
    return { ok: false, status: 409, error: `The branch you confirmed is not free any more; it would now be ${plan.branch}. Review it again.` };
  }
  const started = startJob(
    "apply",
    {
      title: `${plan.action}: ${plan.title}`,
      detail: { proposal: file, id: plan.id, mode: plan.mode, files: plan.files, commands: plan.commands, branch: plan.branch }
    },
    (context) => runApply(plan, { ...context, command })
  );
  if ("error" in started) return { ok: false, status: started.status, error: started.error, running: started.running };
  return { ok: true, job: started.job, plan };
}

/**
 * The words that start the run: the same command a person types, then what
 * the UI already established, so the agent does not stop to ask.
 *
 * @param {ApplyPlan} plan
 * @param {string} proposalText
 * @param {string | null} approvedAt
 */
export function applyPrompt(plan, proposalText, approvedAt) {
  const where = plan.mode === "upstream-pr"
    ? [
        `- You are in a separate git worktree on the new branch ${plan.branch}. These are shared Firstmate files; this branch becomes a pull request.`,
        "- The proposal, .harness/improve.json and the .harness/ files its evaluation reads were copied here read-only. Nothing else from .harness/ is here; the evaluation may write its results.",
        "- Do not commit, push, or open a pull request. The UI commits the branch if the evaluation passes, and the captain opens the pull request."
      ]
    : ["- Work in place in this repository."];
  return [
    `/improve apply ${plan.id}`,
    "",
    `This run was started from the improve review UI. The proposal was approved${approvedAt ? ` at ${approvedAt}` : ""}, and when starting this run the person confirmed that exactly these files may change:`,
    ...plan.files.map((f) => `  - ${f}`),
    "That confirmation is the explicit approval apply requires. Nobody is watching this session to answer a question, so do not stop to ask.",
    "",
    "Rules for this run:",
    "- Recheck the proposal and the repository first. If an assumption no longer holds, change nothing and answer with applied false and the reason.",
    "- Change only the confirmed files. A change to any other file fails the run.",
    "- Do not edit anything under .harness/: a change to this proposal, improve.json or an evaluation file fails the run. The UI records the decision and the outcome from your answer.",
    "- These are the only commands you may run, exactly as written:",
    ...plan.commands.map((c) => `  - ${c}`),
    "  If the evaluation needs any other command, stop: do not run it or a substitute, and answer with applied false and that command as undeclared_command.",
    ...where,
    "- After the change, run the proposal's evaluation and report what you measured, not what you expect.",
    "",
    `The proposal as reviewed (sha256 ${plan.digest}):`,
    "```yaml",
    proposalText.trimEnd(),
    "```",
    "",
    "Finish with ONLY a JSON object with these keys:",
    '  "applied": true if you changed the files, false if the recheck stopped you',
    '  "reason": why you stopped, when applied is false',
    '  "undeclared_command": the exact command the evaluation needs that is not listed above, if that is why you stopped',
    '  "evaluation": { "passed": true or false, "summary": one sentence, "checks": [ { "name": "...", "passed": true or false, "detail": "..." } ] }'
  ].join("\n");
}

/** @param {string} file */
function hashOf(file) {
  try {
    return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  } catch {
    return null;
  }
}

/**
 * The project's path inside its git repository, such as "pkg/", or null
 * outside git.
 * @param {string} cwd
 */
async function gitPrefix(cwd) {
  const result = await git(["rev-parse", "--show-prefix"], cwd);
  return result.code === 0 ? result.stdout.trim() : null;
}

/**
 * Every path git reports as changed or untracked under `cwd`, relative to
 * `cwd`, with a hash of its content now, or null outside git.
 * @param {string} cwd
 */
async function dirtyPaths(cwd) {
  const prefix = await gitPrefix(cwd);
  if (prefix === null) return null;
  const result = await git(["status", "--porcelain=v1", "-z", "--untracked-files=all", "--", "."], cwd);
  if (result.code !== 0) return null;
  const entries = result.stdout.split("\0");
  /** @type {Map<string, string | null>} */
  const paths = new Map();
  /** @param {string} p git prints paths from the repository root */
  const add = (p) => {
    if (p.startsWith(prefix)) paths.set(p.slice(prefix.length), hashOf(path.join(cwd, p.slice(prefix.length))));
  };
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry.length < 4) continue;
    add(entry.slice(3));
    // A rename is followed by its source path.
    if (entry[0] === "R" || entry[0] === "C") add(entries[(index += 1)]);
  }
  return paths;
}

/**
 * @param {string} root
 * @param {string[]} files
 * @returns {Map<string, string | null>}
 */
function snapshot(root, files) {
  return new Map(files.map((f) => [f, readTextSafe(contain(root, f)) ?? null]));
}

/** @param {string | null} text */
function cap(text) {
  return text !== null && text.length > MAX_TEXT ? { text: text.slice(0, MAX_TEXT), truncated: true } : { text, truncated: false };
}

/**
 * @param {Map<string, string | null>} before
 * @param {Map<string, string | null>} after
 * @returns {FileChange[]}
 */
function compare(before, after) {
  return [...before.keys()].map((f) => {
    const was = before.get(f) ?? null;
    const now = after.get(f) ?? null;
    const change = was === now ? "unchanged" : was === null ? "added" : now === null ? "deleted" : "modified";
    const a = cap(was);
    const b = cap(now);
    return { path: f, before: a.text, after: b.text, change, ...(a.truncated || b.truncated ? { truncated: true } : {}) };
  });
}

/**
 * Paths outside the confirmed files whose content the run changed, including
 * files that were already uncommitted before it. Only records the UI writes
 * while a run is going are exempt: other proposals, decisions, evaluation
 * results and its job directory. This proposal, improve.json and evaluation
 * assets are not.
 *
 * @param {Map<string, string | null>} before
 * @param {Map<string, string | null>} after
 * @param {ApplyPlan} plan
 * @param {string} root
 */
function strayPaths(before, after, plan, root) {
  const jobs = path.relative(root, jobsDir());
  const ownJobs = jobs && !jobs.startsWith("..") && !path.isAbsolute(jobs) ? `${jobs.split(path.sep).join("/")}/` : null;
  /** @param {string} p */
  const record = (p) => (p.startsWith(".harness/proposals/") && p !== `.harness/proposals/${plan.file}`)
    || p.startsWith(".harness/decisions/")
    || p.startsWith(RESULTS)
    || Boolean(ownJobs && p.startsWith(ownJobs));
  return [...new Set([...before.keys(), ...after.keys()])]
    .filter((p) => before.get(p) !== after.get(p))
    .filter((p) => !plan.files.includes(p) && !record(p))
    .sort();
}

/**
 * Content hashes of `paths` under `cwd`.
 * @param {string} cwd
 * @param {string[]} paths
 */
function hashes(cwd, paths) {
  return new Map(paths.map((p) => [p, hashOf(contain(cwd, p))]));
}

/**
 * Put the confirmed files back as they were.
 * @param {string} root
 * @param {Map<string, string | null>} before
 * @param {FileChange[]} changes
 * @param {string | undefined} logFile
 */
function restore(root, before, changes, logFile) {
  /** @type {string[]} */
  const failed = [];
  for (const change of changes) {
    if (change.change === "unchanged") continue;
    const target = contain(root, change.path);
    const original = before.get(change.path) ?? null;
    try {
      if (original === null) fs.rmSync(target, { force: true });
      else writeAtomic(target, original);
      note(logFile, `restored ${change.path}`);
    } catch (error) {
      failed.push(`${change.path}: ${/** @type {Error} */ (error).message}`);
      note(logFile, `could not restore ${change.path}: ${/** @type {Error} */ (error).message}`);
    }
  }
  return failed;
}

/**
 * The agent's own account of the evaluation, kept small.
 * @param {any} payload
 */
function readEvaluation(payload) {
  const evaluation = payload?.evaluation;
  if (!evaluation || typeof evaluation !== "object") return null;
  const checks = Array.isArray(evaluation.checks) ? evaluation.checks.slice(0, 50) : [];
  return {
    passed: evaluation.passed === true,
    summary: typeof evaluation.summary === "string" ? evaluation.summary.slice(0, 1000) : null,
    checks: checks.map((/** @type {any} */ check) => ({
      name: String(check?.name ?? "check").slice(0, 200),
      passed: check?.passed === true,
      detail: typeof check?.detail === "string" ? check.detail.slice(0, 1000) : null
    }))
  };
}

/**
 * `.harness/` paths named anywhere in `value`.
 * @param {unknown} value
 */
function namedPaths(value) {
  return (JSON.stringify(value ?? {}).match(/\.harness\/[^\s"'`()<>,;|&\\]+/g) ?? []).map((p) => p.replace(/[.:]+$/, ""));
}

/**
 * The .harness/ files a run reads and must not change: this proposal,
 * improve.json, and the .harness/ files its evaluation names, including the
 * files under a directory it names. Outputs the evaluation writes are not
 * inputs: anything under .harness/evals/results/, and the paths listed in
 * evaluation.outputs. A name that resolves outside .harness/, or to .harness/
 * itself, is skipped. `overflow` names a directory holding more than
 * MAX_ASSETS files, which are then not all listed; `invalid` names an
 * evaluation.outputs entry outside .harness/.
 *
 * @param {string} root
 * @param {{ file: string }} plan
 * @param {any} evaluation
 * @returns {{ assets: Map<string, string>, overflow: string | null, invalid: string | null }} project-relative path to its real source
 */
function harnessAssets(root, plan, evaluation) {
  const harness = contain(root, ".harness");
  const wanted = [`.harness/proposals/${plan.file}`, ".harness/improve.json", ...namedPaths(evaluation)];
  /** @type {string[]} */
  const outputs = [];
  /** @type {string | null} */
  let invalid = null;
  for (const name of Array.isArray(evaluation?.outputs) ? evaluation.outputs : []) {
    let rel = null;
    try {
      rel = path.relative(root, contain(root, String(name))).split(path.sep).join("/");
    } catch {
      // reported below
    }
    if (rel?.startsWith(".harness/")) outputs.push(rel);
    else invalid ??= String(name);
  }
  /** @param {string} rel */
  const output = (rel) => rel.startsWith(RESULTS) || outputs.some((o) => rel === o || rel.startsWith(`${o}/`));
  /** @type {Map<string, string>} */
  const assets = new Map();
  /** @type {string | null} */
  let overflow = null;
  for (const name of wanted) {
    let source;
    try {
      source = assertRealPathInside(harness, contain(root, name));
    } catch {
      continue;
    }
    const rel = path.relative(root, contain(root, name)).split(path.sep).join("/");
    const stat = fs.statSync(source, { throwIfNoEntry: false });
    if (stat?.isFile() && !output(rel)) assets.set(rel, source);
    else if (stat?.isDirectory() && rel !== ".harness") {
      for (const entry of fs.readdirSync(source, { recursive: true, withFileTypes: true })) {
        if (!entry.isFile()) continue;
        const file = path.join(entry.parentPath, entry.name);
        const key = `${rel}/${path.relative(source, file).split(path.sep).join("/")}`;
        if (output(key)) continue;
        if (assets.size >= MAX_ASSETS) {
          overflow = rel;
          break;
        }
        assets.set(key, file);
      }
    }
  }
  return { assets, overflow, invalid };
}

/**
 * Copy the run's .harness/ assets into the worktree, which a fresh checkout
 * usually lacks, read-only.
 *
 * @param {string} cwd
 * @param {Map<string, string>} assets
 * @returns {string[]} the copied paths, relative to the project
 */
function copyHarness(cwd, assets) {
  for (const [rel, source] of assets) {
    const target = contain(cwd, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    fs.chmodSync(target, 0o444);
  }
  return [...assets.keys()];
}

/**
 * Keep the copies out of git when .harness/ is not already ignored. A linked
 * worktree shares the repository's info/exclude, so the returned function
 * puts it back.
 *
 * @param {string} cwd
 * @param {string} prefix
 * @param {string[]} copied
 * @returns {Promise<() => void>}
 */
async function excludeCopies(cwd, prefix, copied) {
  const ignored = await git(["check-ignore", "--", ...copied], cwd);
  const listed = new Set(ignored.stdout.split("\n").map((line) => line.trim()).filter(Boolean));
  const open = copied.filter((p) => !listed.has(p));
  const where = await git(["rev-parse", "--git-path", "info/exclude"], cwd);
  if (open.length === 0 || where.code !== 0) return () => {};
  const file = path.resolve(cwd, where.stdout.trim());
  const original = readTextSafe(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const lines = open.map((p) => `/${prefix}${p}`).join("\n");
  fs.writeFileSync(file, `${original ?? ""}${original && !original.endsWith("\n") ? "\n" : ""}${lines}\n`);
  return () => {
    if (original === undefined) fs.rmSync(file, { force: true });
    else fs.writeFileSync(file, original);
  };
}

/**
 * @param {string} changesFile
 * @param {any} record
 */
function writeChanges(changesFile, record) {
  try {
    fs.mkdirSync(path.dirname(changesFile), { recursive: true });
    fs.writeFileSync(changesFile, `${JSON.stringify(record)}\n`, { encoding: "utf8", mode: 0o600 });
  } catch {
    // the job result still says what happened
  }
}

/**
 * The run itself. Resolves to the job result.
 *
 * @param {ApplyPlan} plan
 * @param {{ signal: AbortSignal, progress: (update: any) => void, logFile: string, changesFile: string, command?: string }} context
 */
export async function runApply(plan, { signal, progress, logFile, changesFile, command }) {
  const root = projectRoot();
  const proposalText = readProposalText(plan.file) ?? "";
  if (digestOf(proposalText) !== plan.digest) {
    return { ok: false, error: "The proposal changed before the run started. Nothing was changed." };
  }
  const parsed = YAML.parse(proposalText) ?? {};
  const approvedAt = parsed?.approval?.approved_at ?? null;

  /** @type {string} */
  let cwd = root;
  /** @type {string | null} */
  let worktree = null;
  /** @type {string | null} */
  let base = null;
  let restoreExclude = () => {};
  const { assets, overflow } = harnessAssets(root, plan, parsed?.evaluation);
  if (overflow) {
    return { ok: false, error: `The evaluation names ${overflow}, which now holds more than ${MAX_ASSETS} files, too many to guard. Nothing was changed.` };
  }
  if (plan.mode === "upstream-pr") {
    progress({ message: `Creating branch ${plan.branch} in a separate worktree` });
    const head = await git(["rev-parse", "HEAD"], root);
    if (head.code !== 0) return { ok: false, error: "This repository has no commit to branch from." };
    base = head.stdout.trim();
    worktree = path.join(os.tmpdir(), "improve-apply", projectId(root), `${String(plan.branch).replaceAll("/", "-")}-${Date.now()}`);
    fs.mkdirSync(path.dirname(worktree), { recursive: true });
    const prefix = (await gitPrefix(root)) ?? "";
    const added = await git(["worktree", "add", "-b", String(plan.branch), worktree, base], root, { logFile });
    if (added.code !== 0) {
      return { ok: false, error: `Could not create branch ${plan.branch}: ${added.stderr.trim() || `git exited ${added.code}`}` };
    }
    cwd = path.join(worktree, prefix);
    try {
      const copied = copyHarness(cwd, assets);
      note(logFile, `copied read-only into the worktree: ${copied.join(", ")}`);
      restoreExclude = await excludeCopies(cwd, prefix, copied);
    } catch (error) {
      await discardBranch(root, worktree, String(plan.branch), logFile);
      return { ok: false, error: `Could not prepare the worktree: ${/** @type {Error} */ (error).message}` };
    }
  }

  try {
    const before = snapshot(cwd, plan.files);
    const dirtyBefore = await dirtyPaths(cwd);
    const assetsBefore = hashes(cwd, [...assets.keys()]);
    note(logFile, `confirmed files: ${plan.files.join(", ")}`);

    const agent = await runAgent({
      command: command || process.env.IMPROVE_AGENT_COMMAND || "claude",
      prompt: applyPrompt(plan, proposalText, approvedAt),
      cwd,
      timeoutMs: TIMEOUT_MS,
      allowEdits: true,
      allowedTools: plan.commands.map((c) => `Bash(${c})`),
      settingSources: [],
      pluginDir: pluginRoot(),
      signal,
      logFile,
      onProgress: (update) => progress({ message: update.message, done: null, total: null })
    });

    progress({ message: "Checking what changed" });
    const changes = compare(before, snapshot(cwd, plan.files));
    const dirtyAfter = await dirtyPaths(cwd);
    const listed = harnessAssets(cwd, plan, parsed?.evaluation);
    const assetsAfter = hashes(cwd, [...listed.assets.keys()]);
    const stray = [...new Set([
      ...(dirtyBefore && dirtyAfter ? strayPaths(dirtyBefore, dirtyAfter, plan, cwd) : []),
      ...[...new Set([...assetsBefore.keys(), ...assetsAfter.keys()])]
        .filter((p) => !plan.files.includes(p) && assetsBefore.get(p) !== assetsAfter.get(p)),
      ...(listed.overflow ? [`${listed.overflow}/`] : [])
    ])].sort();
    const unchecked = dirtyBefore && dirtyAfter ? null : "This project is not a git repository, so changes outside the confirmed files could not be checked.";
    const changed = changes.filter((c) => c.change !== "unchanged");
    const evaluation = readEvaluation(agent.payload);

    /** @type {string | null} */
    let failure = null;
    if (!agent.ok) failure = agent.error ?? "The agent failed.";
    else if (typeof agent.payload?.undeclared_command === "string") {
      failure = `The evaluation needs a command the proposal does not declare: ${agent.payload.undeclared_command.slice(0, 500)}. The run does not widen its own permissions; add it to evaluation.commands and approve the proposal again.`;
    } else if (agent.payload?.applied !== true) {
      failure = `The recheck stopped the run: ${typeof agent.payload?.reason === "string" ? agent.payload.reason.slice(0, 500) : "no reason given"}`;
    } else if (stray.length) failure = `The run changed files outside the ones you confirmed: ${stray.join(", ")}.`;
    else if (changed.length === 0) failure = "The run reported success but changed none of the confirmed files.";
    else if (!evaluation) failure = "The run did not report an evaluation result.";
    else if (!evaluation.passed) failure = `The evaluation failed${evaluation.summary ? `: ${evaluation.summary}` : "."}`;

    const summary = {
      mode: plan.mode,
      proposal: plan.file,
      files: changes.map((c) => ({ path: c.path, change: c.change })),
      stray,
      unchecked,
      evaluation,
      cost_usd: agent.envelope?.cost_usd ?? null
    };

    if (failure) {
      /** @type {string[]} */
      let restoreFailed = [];
      if (plan.mode === "local-apply" && changed.length) {
        progress({ message: "Putting the confirmed files back" });
        restoreFailed = restore(root, before, changes, logFile);
      }
      if (worktree) await discardBranch(root, worktree, String(plan.branch), logFile);
      writeChanges(changesFile, { ...summary, files: changes, restored: plan.mode === "local-apply" && changed.length > 0 && restoreFailed.length === 0 });
      recordAttempt(plan, { status: "failed", error: failure, evaluation });
      const parts = [];
      if (plan.mode === "local-apply" && changed.length) {
        parts.push(restoreFailed.length
          ? `Some confirmed files could not be put back: ${restoreFailed.join("; ")}.`
          : "The confirmed files were put back as they were.");
      } else if (plan.mode === "upstream-pr") {
        parts.push(`Branch ${plan.branch} was deleted; this repository is unchanged.`);
      } else {
        parts.push("No confirmed file was changed.");
      }
      if (stray.length) parts.push(`Inspect these, which the run changed and which were not put back: ${stray.join(", ")}.`);
      return {
        ok: false,
        cancelled: agent.cancelled,
        timedOut: agent.timedOut,
        error: failure,
        hint: parts.join(" "),
        ...summary,
        restored: plan.mode === "local-apply" && changed.length > 0 && restoreFailed.length === 0
      };
    }

    if (plan.mode === "upstream-pr" && worktree) {
      progress({ message: `Committing on ${plan.branch}` });
      const commit = await commitBranch(cwd, plan, changed, logFile);
      if (!commit.ok) {
        await discardBranch(root, worktree, String(plan.branch), logFile);
        writeChanges(changesFile, { ...summary, files: changes });
        recordAttempt(plan, { status: "failed", error: commit.error, evaluation });
        return { ok: false, error: commit.error, hint: `Branch ${plan.branch} was deleted; this repository is unchanged.`, ...summary };
      }
      await removeWorktree(root, worktree, logFile);
      worktree = null;
      const next = `Nothing was pushed. To open the pull request: git push -u origin ${plan.branch}, then gh pr create --head ${plan.branch}. Or hand the branch to Firstmate to deliver.`;
      writeChanges(changesFile, { ...summary, files: changes, branch: plan.branch, commit: commit.sha, base });
      recordUpstream(plan, { branch: String(plan.branch), commit: commit.sha, base, evaluation, files: changed.map((c) => c.path) });
      return { ok: true, ...summary, branch: plan.branch, commit: commit.sha, base, next };
    }

    writeChanges(changesFile, { ...summary, files: changes });
    recordApplied(plan, { evaluation, files: changed.map((c) => c.path) });
    return { ok: true, ...summary };
  } finally {
    if (worktree) await removeWorktree(root, worktree, logFile);
    restoreExclude();
  }
}

/**
 * @param {string} cwd the project inside the worktree
 * @param {ApplyPlan} plan
 * @param {FileChange[]} changed
 * @param {string} logFile
 * @returns {Promise<{ ok: true, sha: string } | { ok: false, error: string }>}
 */
async function commitBranch(cwd, plan, changed, logFile) {
  const add = await git(["add", "-A", "--", ...changed.map((c) => c.path)], cwd, { logFile });
  if (add.code !== 0) return { ok: false, error: `git add failed: ${add.stderr.trim()}` };
  const message = `${plan.title}\n\nApplies approved improve proposal ${plan.id}.\nPrepared from the improve review UI; the evaluation passed.`;
  const commit = await git(["commit", "--no-verify", "-m", message], cwd, { logFile });
  if (commit.code !== 0) {
    return { ok: false, error: `Could not commit on ${plan.branch}: ${commit.stderr.trim() || commit.stdout.trim() || `git exited ${commit.code}`}` };
  }
  const sha = await git(["rev-parse", "HEAD"], cwd);
  return { ok: true, sha: sha.stdout.trim() };
}

/**
 * @param {string} root
 * @param {string} worktree
 * @param {string | undefined} logFile
 */
async function removeWorktree(root, worktree, logFile) {
  const removed = await git(["worktree", "remove", "--force", worktree], root, { logFile });
  if (removed.code !== 0) note(logFile, `could not remove the worktree at ${worktree}; git worktree prune clears it`);
}

/**
 * @param {string} root
 * @param {string} worktree
 * @param {string} branch
 * @param {string | undefined} logFile
 */
async function discardBranch(root, worktree, branch, logFile) {
  await removeWorktree(root, worktree, logFile);
  await git(["branch", "-D", branch], root, { logFile });
}

/**
 * @param {ApplyPlan} plan
 * @param {{ status: string, error: string, evaluation: any }} attempt
 */
function recordAttempt(plan, attempt) {
  try {
    const latest = readProposal(plan.file);
    updateStatus(plan.file, latest?.status ?? "approved", {
      last_apply: { at: new Date().toISOString(), by: "ui", mode: plan.mode, ...attempt }
    });
  } catch {
    // the job record still holds the outcome
  }
}

/**
 * @param {ApplyPlan} plan
 * @param {{ evaluation: any, files: string[] }} outcome
 */
function recordApplied(plan, { evaluation, files }) {
  const proposal = readProposal(plan.file);
  if (!proposal) return;
  recordDecision(proposal, {
    decision: "approved",
    rationale: `Applied from the review UI. Evaluation passed${evaluation?.summary ? `: ${evaluation.summary}` : "."}`,
    applied_files: files,
    digest: plan.digest
  });
  updateStatus(plan.file, "validated", {
    outcome: {
      measurements: evaluation?.checks ?? [],
      conclusion: evaluation?.summary ?? "Evaluation passed.",
      applied_at: new Date().toISOString(),
      applied_by: "ui"
    },
    last_apply: { at: new Date().toISOString(), by: "ui", mode: plan.mode, status: "applied", evaluation }
  });
}

/**
 * The change exists only on a branch until its pull request merges, so the
 * proposal stays approved.
 *
 * @param {ApplyPlan} plan
 * @param {{ branch: string, commit: string, base: string | null, evaluation: any, files: string[] }} change
 */
function recordUpstream(plan, change) {
  try {
    updateStatus(plan.file, "approved", {
      upstream_change: { ...change, prepared_at: new Date().toISOString(), prepared_by: "ui" },
      last_apply: { at: new Date().toISOString(), by: "ui", mode: plan.mode, status: "prepared", evaluation: change.evaluation }
    });
  } catch {
    // the job record still holds the branch
  }
}
