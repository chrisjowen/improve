import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { loadConfig, readJson, similarity, updateJson, writeJsonAtomic } from "./lib.mjs";
import { blockScalar, landing, topScalar } from "./landing.mjs";
import { readBlock, readScopeFiles } from "./proposal-check.mjs";
import { readCandidates } from "./review-cli.mjs";
import { runProcess, lastMeaningfulLine } from "./run-process.mjs";
import { agentEnv } from "./spawn-agent.mjs";
import { caseScores, compare, gate, losing, signed } from "./replay-gate.mjs";
import { READ_TOOLS, SUITE_DIR, readSuite } from "./replay-cases.mjs";
import { findTranscript, readTranscript, toolCalls } from "./transcripts.mjs";
import { setBlock, setInBlock, toYaml } from "./yaml-emit.mjs";

/**
 * Replay A/B for proposals, the acceptance gate, regression checks on kept
 * changes, and the measured outcome after a change lands.
 *
 * A proposal that can be replayed carries its candidate beside it:
 *
 *   .harness/proposals/<name>.yaml
 *   .harness/proposals/<name>.candidate/
 *     lesson.md        a CLAUDE.md or AGENTS.md lesson, word for word
 *     skills/ agents/ commands/ hooks/   plugin-shaped, copied as they are
 *     candidate.json   { "workspace": false, "cases": [], "targets": [] }
 *
 * The candidate is packaged as a temporary plugin and the replay suite runs
 * through `claude plugin eval --ablation with-without`, once with the plugin
 * and once without. Eval runs load no CLAUDE.md, so a lesson rides along as a
 * SessionStart hook that adds it as context, which is how a CLAUDE.md line
 * reaches the model in a real session.
 */

const PROPOSALS = path.join(".harness", "proposals");
const RESULTS = path.join(SUITE_DIR, "results");

/** @param {string} root */
export function replayConfig(root) {
  return loadConfig(root).replay;
}

/** @param {Date} now */
const stamp = (now) => now.toISOString().replaceAll(":", "-").replace(/\.\d+Z$/, "Z");

/**
 * The proposal file `ref` names in `root`: a file name, a file name without
 * its extension, or a proposal id. Undefined when there is none.
 *
 * @param {string} root
 * @param {string} ref
 */
export function resolveProposal(root, ref) {
  const dir = path.join(root, PROPOSALS);
  let names;
  try {
    names = fs.readdirSync(dir).filter((name) => /\.ya?ml$/i.test(name));
  } catch {
    return undefined;
  }
  const base = path.basename(String(ref ?? ""));
  const direct = names.find((name) => name === base || name === `${base}.yaml` || name === `${base}.yml`);
  if (direct) return direct;
  return names.find((name) => topScalar(readText(path.join(dir, name)) ?? "", "id") === ref);
}

/** @param {string} file */
function readText(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return undefined;
  }
}

/**
 * @param {string} root
 * @param {string} file proposal file name
 */
export function candidatePath(root, file) {
  return path.join(root, PROPOSALS, file.replace(/\.ya?ml$/i, ".candidate"));
}

/**
 * Every file under `dir`, relative, sorted. A symbolic link is refused: the
 * candidate is copied into a plugin that runs, so it must be exactly the
 * files a person reviewed.
 *
 * @param {string} dir
 */
function listFiles(dir, prefix = "") {
  /** @type {string[]} */
  const files = [];
  for (const entry of fs.readdirSync(path.join(dir, prefix), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = path.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`the candidate holds a symbolic link, which replay does not follow: ${rel}`);
    if (entry.isDirectory()) files.push(...listFiles(dir, rel));
    else if (entry.isFile()) files.push(rel);
  }
  return files;
}

/**
 * The proposal's candidate, or undefined when it has none.
 *
 * @param {string} root
 * @param {string} file proposal file name
 */
export function readCandidate(root, file) {
  const dir = candidatePath(root, file);
  if (!fs.existsSync(dir)) return undefined;
  const files = listFiles(dir);
  const hash = crypto.createHash("sha256");
  for (const rel of files) hash.update(rel).update("\0").update(fs.readFileSync(path.join(dir, rel))).update("\0");
  /** @type {{ workspace?: boolean, cases?: string[], targets?: string[] }} */
  let settings = {};
  if (files.includes("candidate.json")) {
    try {
      const value = JSON.parse(fs.readFileSync(path.join(dir, "candidate.json"), "utf8"));
      if (value && typeof value === "object") settings = value;
    } catch (error) {
      throw new Error(`candidate.json is not valid JSON: ${/** @type {Error} */ (error).message}`);
    }
  }
  const lesson = files.includes("lesson.md") ? fs.readFileSync(path.join(dir, "lesson.md"), "utf8").trim() : null;
  const kinds = [
    ...(lesson ? ["lesson"] : []),
    ...["skills", "agents", "commands", "hooks"].filter((kind) => files.some((f) => f.startsWith(`${kind}${path.sep}`)))
  ];
  return {
    dir: path.relative(root, dir),
    files,
    digest: hash.digest("hex"),
    lesson,
    kinds,
    workspace: settings.workspace === true,
    cases: Array.isArray(settings.cases) ? settings.cases.filter((c) => typeof c === "string") : [],
    targets: Array.isArray(settings.targets) ? settings.targets.filter((c) => typeof c === "string") : []
  };
}

const LESSON_HOOK = `import fs from "node:fs";
// A CLAUDE.md lesson, added as SessionStart context: eval runs load no CLAUDE.md.
const text = fs.readFileSync(new URL("./lesson.md", import.meta.url), "utf8");
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: text } }));
`;

/**
 * Package the candidate as a plugin in `outDir`: skills, agents, commands and
 * hooks as they are, and a lesson as a SessionStart hook.
 *
 * @param {string} root
 * @param {string} file proposal file name
 * @param {string} outDir an empty directory
 */
export function packageCandidate(root, file, outDir) {
  const candidate = readCandidate(root, file);
  if (!candidate) throw new Error(`${file} has no candidate to replay: put the change, as it would land, in ${path.relative(root, candidatePath(root, file))}/ (see references/replay.md).`);
  if (candidate.kinds.length === 0) throw new Error(`${candidate.dir} holds no lesson.md, skills/, agents/, commands/ or hooks/, so there is nothing to replay.`);
  const source = path.join(root, candidate.dir);
  for (const rel of candidate.files) {
    if (rel === "candidate.json" || rel === "lesson.md") continue;
    fs.mkdirSync(path.dirname(path.join(outDir, rel)), { recursive: true });
    fs.copyFileSync(path.join(source, rel), path.join(outDir, rel));
  }
  const name = `improve-candidate-${file.replace(/\.ya?ml$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
  fs.mkdirSync(path.join(outDir, ".claude-plugin"), { recursive: true });
  fs.writeFileSync(path.join(outDir, ".claude-plugin", "plugin.json"), `${JSON.stringify({ name, version: "0.0.0", description: `Replay candidate for ${file}` }, null, 2)}\n`);
  if (candidate.lesson) {
    fs.mkdirSync(path.join(outDir, "improve-replay"), { recursive: true });
    fs.writeFileSync(path.join(outDir, "improve-replay", "lesson.md"), `${candidate.lesson}\n`);
    fs.writeFileSync(path.join(outDir, "improve-replay", "lesson.mjs"), LESSON_HOOK);
    const hooksFile = path.join(outDir, "hooks", "hooks.json");
    const hooks = readJson(hooksFile, {});
    hooks.hooks = hooks.hooks && typeof hooks.hooks === "object" ? hooks.hooks : {};
    hooks.hooks.SessionStart = [
      ...(Array.isArray(hooks.hooks.SessionStart) ? hooks.hooks.SessionStart : []),
      { hooks: [{ type: "command", command: "node", args: ["${CLAUDE_PLUGIN_ROOT}/improve-replay/lesson.mjs"], timeout: 5 }] }
    ];
    fs.mkdirSync(path.dirname(hooksFile), { recursive: true });
    fs.writeFileSync(hooksFile, `${JSON.stringify(hooks, null, 2)}\n`);
  }
  return { name, ...candidate };
}

/** @param {string} glob */
function globRegex(glob) {
  return new RegExp(`^${glob.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*")}$`);
}

/**
 * The suite's cases in `split`, narrowed to `names` (globs) when given. A case
 * that needs a tool `replay.allow_tools` does not grant is skipped, with why.
 *
 * @param {string} root
 * @param {{ split: "validation" | "test", names?: string[], grants?: string[] }} options
 */
export function selectCases(root, { split, names = [], grants = [] }) {
  const patterns = names.map(globRegex);
  const chosen = [];
  const skipped = [];
  for (const entry of readSuite(root).cases) {
    if (entry.split !== split) continue;
    if (patterns.length && !patterns.some((p) => p.test(entry.name))) continue;
    const missing = (Array.isArray(entry.needs) ? entry.needs : []).filter((tool) => !grants.includes(tool));
    if (missing.length) {
      skipped.push({ case: entry.name, reason: `needs ${missing.join(", ")}, which replay.allow_tools does not grant` });
      continue;
    }
    if (!fs.existsSync(path.join(root, SUITE_DIR, "cases", entry.name, "case.yaml"))) {
      skipped.push({ case: entry.name, reason: "its case.yaml is missing" });
      continue;
    }
    chosen.push(entry);
  }
  return { cases: chosen, skipped };
}

/**
 * Copy cases into the plugin's `evals/`. For a workspace run each case starts
 * in a fresh checkout of the repository at HEAD: a shared local clone, so
 * nothing is added to the repository's worktree list and nothing outlives the
 * run's sandbox.
 *
 * @param {string} root
 * @param {string} pluginDir
 * @param {any[]} cases
 * @param {{ workspace?: boolean }} [options]
 */
export function stageCases(root, pluginDir, cases, { workspace = false } = {}) {
  for (const entry of cases) {
    const from = path.join(root, SUITE_DIR, "cases", entry.name);
    const to = path.join(pluginDir, "evals", entry.name);
    fs.mkdirSync(to, { recursive: true });
    let text = fs.readFileSync(path.join(from, "case.yaml"), "utf8");
    if (fs.existsSync(path.join(from, "history.jsonl"))) fs.copyFileSync(path.join(from, "history.jsonl"), path.join(to, "history.jsonl"));
    if (workspace) {
      fs.writeFileSync(path.join(to, "scaffold.sh"), [
        "#!/bin/bash",
        "# A fresh checkout of the repository at HEAD, in this run's working directory.",
        "set -euo pipefail",
        `git clone --quiet --shared ${JSON.stringify(root)} ./.improve-workspace`,
        "shopt -s dotglob",
        "mv ./.improve-workspace/* .",
        "rmdir ./.improve-workspace",
        ""
      ].join("\n"), { mode: 0o755 });
      text = setInBlock(text, "context", { scaffold_script: "scaffold.sh" });
    }
    fs.writeFileSync(path.join(to, "case.yaml"), text);
  }
}

/**
 * Run `claude plugin eval` on `pluginDir` with a WITH and a WITHOUT arm.
 *
 * Always capped: `maxCostUsd` is required. The JSON result is read from the
 * file the eval writes. Exit 1 only means a case scored below the threshold,
 * which the gate decides instead; exit 2 means the cost ceiling stopped the
 * run, and the result is partial.
 *
 * @param {{ pluginDir: string, cases: number, runs: number, maxCostUsd: number, model?: string | null, allowTools?: string[], scaffold?: boolean, concurrency?: number, command?: string, signal?: AbortSignal, logFile?: string, onLine?: (line: string) => void }} options
 */
export async function runEval({ pluginDir, cases, runs, maxCostUsd, model, allowTools = [], scaffold = false, concurrency = 1, command = "claude", signal, logFile, onLine }) {
  if (!(Number(maxCostUsd) > 0)) throw new Error("A replay run needs a cost ceiling: set replay.max_cost_usd to a positive number.");
  const out = path.join(pluginDir, ".improve-replay-result.json");
  const args = [
    "plugin", "eval", pluginDir,
    "--ablation", "with-without",
    "--runs", String(runs),
    "--json", out,
    "--max-cost-usd", String(maxCostUsd),
    "--threshold", "0",
    "--trust-plugin",
    "--no-publish",
    "--output-dir", path.join(pluginDir, ".improve-replay-output"),
    "-j", String(Math.max(1, Math.min(8, concurrency))),
    ...(model ? ["--model", model] : []),
    ...(scaffold ? ["--scaffold"] : []),
    ...(allowTools.length ? ["--allow-tools", ...allowTools] : [])
  ];
  // Every run is a full session of up to five minutes, in two arms.
  const timeoutMs = Math.max(10 * 60_000, Math.ceil((cases * runs * 2) / Math.max(1, concurrency)) * 330_000);
  const ran = await runProcess(command, args, {
    cwd: pluginDir,
    env: { ...agentEnv(), IMPROVE_AGENT_CHILD: "1" },
    timeoutMs,
    signal,
    logFile,
    onStdoutLine: onLine,
    onStderrLine: onLine
  });
  const result = readJson(out, null);
  if (!result) {
    const why = ran.cancelled ? "the run was cancelled"
      : ran.timedOut ? "the run timed out"
      : ran.spawnError ? `${command} could not start: ${ran.spawnError.message}`
      : lastMeaningfulLine(ran.stderr) || lastMeaningfulLine(ran.stdout) || `${command} exited ${ran.code}`;
    return { ok: false, error: `claude plugin eval wrote no result: ${why}`, result: null, partial: false, cost: null };
  }
  return { ok: true, error: null, result, partial: Boolean(result.partial) || ran.code === 2, cost: typeof result.costUsd === "number" ? result.costUsd : null };
}

/**
 * Keep a copy of an eval's JSON result in the repository's results folder.
 *
 * @param {string} root
 * @param {string} id
 * @param {string} name
 * @param {any} result
 */
function keepResult(root, id, name, result) {
  const rel = path.join(RESULTS, id.replace(/[^\w.-]+/g, "-"), `${name}.json`);
  writeJsonAtomic(path.join(root, rel), result);
  return rel;
}

/** @param {ReturnType<typeof compare>} summary */
function armSummary(summary) {
  return { cases: summary.cases, with: summary.with, without: summary.without, delta: summary.delta, se: summary.se };
}

/**
 * Run the candidate against the cases of one split in a fresh temporary
 * plugin, and score them.
 *
 * @param {{ root: string, file: string, split: "validation" | "test", names: string[], config: ReturnType<typeof replayConfig>, maxCostUsd: number, command?: string, signal?: AbortSignal, logFile?: string, onLine?: (line: string) => void }} options
 */
async function runSplit({ root, file, split, names, config, maxCostUsd, command, signal, logFile, onLine }) {
  const grants = Array.isArray(config.allow_tools) ? config.allow_tools.filter((t) => typeof t === "string") : [];
  const selection = selectCases(root, { split, names, grants });
  if (selection.cases.length === 0) return { ran: false, selection, scores: [], eval: null, candidate: null };
  const pluginDir = fs.mkdtempSync(path.join(os.tmpdir(), "improve-replay-"));
  try {
    const candidate = packageCandidate(root, file, pluginDir);
    stageCases(root, pluginDir, selection.cases, { workspace: candidate.workspace });
    const ran = await runEval({
      pluginDir,
      cases: selection.cases.length,
      runs: Number(config.runs) > 0 ? Number(config.runs) : 3,
      maxCostUsd,
      model: config.model,
      allowTools: [...new Set(selection.cases.flatMap((c) => (Array.isArray(c.needs) ? c.needs : [])))],
      scaffold: candidate.workspace,
      concurrency: Number(config.concurrency) || 1,
      command: command || process.env.IMPROVE_REPLAY_COMMAND || config.command || "claude",
      signal,
      logFile,
      onLine
    });
    return { ran: true, selection, scores: ran.result ? caseScores(ran.result) : [], eval: ran, candidate };
  } finally {
    fs.rmSync(pluginDir, { recursive: true, force: true });
  }
}

/** Statuses a proposal may be scored in: before anyone approved it. */
const SCORABLE = new Set(["draft", "proposed", undefined]);

/**
 * Score a proposal before approval: the regression check first when one is
 * due, then the candidate against the validation split, the gate, and, only
 * when the gate passes, the sealed test split, once per proposal. The verdict
 * is written to the proposal's `replay` block, and every eval result is kept
 * under `.harness/evals/replay/results/`.
 *
 * @param {{ root: string, file: string, dataDir?: string, command?: string, signal?: AbortSignal, logFile?: string, onLine?: (line: string) => void, now?: () => Date, regressFirst?: boolean }} options
 */
export async function scoreProposal({ root, file, dataDir, command, signal, logFile, onLine, now = () => new Date(), regressFirst = true }) {
  const proposalPath = path.join(root, PROPOSALS, file);
  const text = readText(proposalPath);
  if (text === undefined) throw new Error(`no such proposal: ${file}`);
  const status = topScalar(text, "status");
  if (!SCORABLE.has(status)) throw new Error(`${file} is ${status}. Replay scores a proposal before it is approved, so the verdict is part of what is approved.`);
  const config = replayConfig(root);
  if (!config.enabled) throw new Error("Replay is turned off: replay.enabled is false in .harness/improve.json.");
  const candidate = readCandidate(root, file);
  if (!candidate) throw new Error(`${file} has no candidate to replay: put the change, as it would land, in ${path.relative(root, candidatePath(root, file))}/ (see references/replay.md).`);
  const id = topScalar(text, "id") ?? file.replace(/\.ya?ml$/i, "");

  // Before every later proposal is scored, the changes already kept are
  // checked again when anything changed since the last check.
  let regression = null;
  if (regressFirst && regressionDue(root, dataDir).due) {
    regression = await regress({ root, dataDir, trigger: "before-scoring", command, signal, logFile, onLine, now });
  }

  const started = now();
  const cap = Number(config.max_cost_usd);
  const validation = await runSplit({ root, file, split: "validation", names: candidate.cases, config, maxCostUsd: cap, command, signal, logFile, onLine });
  const kept = [];
  if (validation.eval?.result) kept.push(keepResult(root, id, `${stamp(started)}-validation`, validation.eval.result));
  const verdict = validation.ran
    ? (validation.eval?.ok
      ? gate(validation.scores, { k: Number(config.k), tolerance: Number(config.tolerance), partial: validation.eval.partial })
      : { ...gate([], {}), verdict: "incomplete", reasons: [validation.eval?.error ?? "The eval did not run."] })
    : { ...gate([], {}), verdict: "incomplete", reasons: ["No validation case can run: export cases with replay-cli export, or grant the tools they need."] };
  let spent = validation.eval?.cost ?? 0;

  // The test split is sealed: it runs only after the gate passes, and only
  // once for a proposal, so nobody tunes a change against it.
  const sealedFile = path.join(root, SUITE_DIR, "sealed.json");
  const sealed = readJson(sealedFile, { scored: [] });
  const already = (Array.isArray(sealed.scored) ? sealed.scored : []).find((s) => s.proposal === id);
  /** @type {any} */
  let test = already ? { ...already.test, scored_at: already.scored_at, candidate_digest: already.candidate_digest, note: "The sealed test split was scored once for this proposal already; this is that score." } : null;
  if (verdict.verdict === "pass" && !already) {
    const remaining = cap - spent;
    if (remaining <= 0) {
      test = { scored_at: null, note: "The cost ceiling was reached before the sealed test split could run." };
    } else {
      const testRun = await runSplit({ root, file, split: "test", names: candidate.cases, config, maxCostUsd: remaining, command, signal, logFile, onLine });
      spent += testRun.eval?.cost ?? 0;
      if (!testRun.ran) {
        test = { scored_at: now().toISOString(), cases: 0, note: "The suite has no test case that can run." };
      } else if (!testRun.eval?.ok) {
        test = { scored_at: null, note: testRun.eval?.error ?? "The test split did not run." };
      } else {
        const summary = compare(testRun.scores);
        test = {
          ...armSummary(summary),
          scored_at: now().toISOString(),
          candidate_digest: candidate.digest,
          partial: testRun.eval.partial,
          confirms: summary.delta !== null && summary.delta > 0,
          result: keepResult(root, id, `${stamp(started)}-test`, testRun.eval.result)
        };
        kept.push(test.result);
        writeJsonAtomic(sealedFile, {
          scored: [...(Array.isArray(sealed.scored) ? sealed.scored : []), { proposal: id, scored_at: test.scored_at, candidate_digest: candidate.digest, test: armSummary(summary) }]
        });
      }
    }
  }

  const block = {
    scored_at: started.toISOString(),
    candidate: candidate.dir,
    candidate_digest: candidate.digest,
    kinds: candidate.kinds,
    workspace: candidate.workspace,
    runs: Number(config.runs) || 3,
    model: config.model ?? null,
    max_cost_usd: cap,
    cost_usd: Math.round(spent * 10000) / 10000,
    validation: {
      ...armSummary(verdict),
      cases_skipped: validation.selection.skipped
    },
    gate: {
      verdict: verdict.verdict,
      k: verdict.k,
      threshold: verdict.threshold,
      regressions: verdict.regressions,
      reasons: verdict.reasons
    },
    test,
    per_case: validation.scores.map((c) => ({ name: c.name, with: c.with.mean, without: c.without.mean, delta: c.delta, se: c.se })),
    results: kept,
    regression_check: regression ? { ran_at: regression.ran_at, losing: regression.changes.filter((c) => c.losing).map((c) => c.proposal) } : null
  };
  // Re-read: a long run must not write back a proposal someone edited meanwhile.
  const current = readText(proposalPath) ?? text;
  fs.writeFileSync(proposalPath, setBlock(current, "replay", block));
  return { file, id, ...block };
}

/**
 * Proposals whose change was kept: validated, or approved with an outcome
 * that records it landed. Rolled-back and rejected ones are not.
 *
 * @param {string} root
 */
export function keptProposals(root) {
  const dir = path.join(root, PROPOSALS);
  let names;
  try {
    names = fs.readdirSync(dir).filter((name) => /\.ya?ml$/i.test(name)).sort();
  } catch {
    return [];
  }
  const kept = [];
  for (const name of names) {
    const text = readText(path.join(dir, name));
    if (text === undefined) continue;
    const status = topScalar(text, "status");
    if (status !== "validated" && landing(text)?.state !== "applied") continue;
    kept.push({
      file: name,
      id: topScalar(text, "id") ?? name.replace(/\.ya?ml$/i, ""),
      title: topScalar(text, "title") ?? name,
      applied_at: blockScalar(text, "outcome", "applied_at") ?? null,
      text
    });
  }
  return kept;
}

/**
 * Whether the kept changes should be checked again, and why.
 *
 * @param {string} root
 * @param {string} [dataDir]
 */
export function regressionDue(root, dataDir) {
  const config = replayConfig(root);
  if (!config.enabled) return { due: false, reason: "replay is turned off" };
  const kept = keptProposals(root).filter((k) => readCandidateSafe(root, k.file));
  if (kept.length === 0) return { due: false, reason: "no kept change has a candidate to replay" };
  if (!readSuite(root).cases.some((c) => c.split === "validation")) return { due: false, reason: "the replay suite has no validation case" };
  const last = readJson(path.join(root, SUITE_DIR, "regression.json"), {});
  const ranAt = Date.parse(last.ran_at ?? "");
  if (!Number.isFinite(ranAt)) return { due: true, reason: "the kept changes were never checked" };
  const state = dataDir ? readJson(path.join(dataDir, "state.json"), {}) : {};
  if (Date.parse(state.last_config_change_at ?? "") > ranAt) return { due: true, reason: "the harness configuration changed since the last check" };
  const newer = kept.find((k) => Date.parse(k.applied_at ?? "") > ranAt);
  if (newer) return { due: true, reason: `${newer.id} was applied since the last check` };
  return { due: false, reason: "nothing changed since the last check" };
}

/** @param {string} root @param {string} file */
function readCandidateSafe(root, file) {
  try {
    return readCandidate(root, file);
  } catch {
    return undefined;
  }
}

/**
 * Re-run the validation split for every kept change that has a candidate.
 * A change that now loses (its delta is below zero, or a case regressed) gets
 * a rollback proposal drafted, unless one is already open. Nothing is
 * applied or reverted here.
 *
 * @param {{ root: string, dataDir?: string, trigger: string, command?: string, signal?: AbortSignal, logFile?: string, onLine?: (line: string) => void, now?: () => Date }} options
 */
export async function regress({ root, dataDir, trigger, command, signal, logFile, onLine, now = () => new Date() }) {
  const config = replayConfig(root);
  const ranAt = now();
  const kept = keptProposals(root).filter((k) => readCandidateSafe(root, k.file));
  const budget = Number(config.regression.max_cost_usd);
  const changes = [];
  let spent = 0;
  for (const change of kept) {
    const remaining = budget - spent;
    if (!(remaining > 0)) {
      changes.push({ proposal: change.id, file: change.file, verdict: "incomplete", losing: false, note: "The regression check's cost ceiling was reached first." });
      continue;
    }
    const candidate = /** @type {NonNullable<ReturnType<typeof readCandidate>>} */ (readCandidateSafe(root, change.file));
    const run = await runSplit({ root, file: change.file, split: "validation", names: candidate.cases, config, maxCostUsd: remaining / Math.max(1, kept.length - changes.length), command, signal, logFile, onLine });
    spent += run.eval?.cost ?? 0;
    const verdict = run.ran && run.eval?.ok
      ? gate(run.scores, { k: Number(config.k), tolerance: Number(config.tolerance), partial: run.eval.partial })
      : { ...gate([], {}), verdict: "incomplete", reasons: [run.eval?.error ?? "No validation case can run."] };
    const result = run.eval?.result ? keepResult(root, change.id, `${stamp(ranAt)}-regression`, run.eval.result) : null;
    const isLosing = losing(verdict);
    const entry = {
      proposal: change.id,
      file: change.file,
      verdict: verdict.verdict,
      with: verdict.with,
      without: verdict.without,
      delta: verdict.delta,
      se: verdict.se,
      cases: verdict.cases,
      regressions: verdict.regressions,
      losing: isLosing,
      result,
      rollback_proposal: /** @type {string | null} */ (null)
    };
    if (isLosing) entry.rollback_proposal = openRollback(root, change.id) ?? draftRollback(root, change, entry, ranAt);
    changes.push(entry);
  }
  const report = {
    schema_version: 1,
    ran_at: ranAt.toISOString(),
    trigger,
    cost_usd: Math.round(spent * 10000) / 10000,
    changes,
    note: kept.length === 0 ? "No kept change has a candidate to replay." : null
  };
  writeJsonAtomic(path.join(root, SUITE_DIR, "regression.json"), report);
  if (dataDir) {
    updateJson(path.join(dataDir, "state.json"), (state) => {
      state.replay_regression_running = false;
      state.replay_regression_finished_at = new Date().toISOString();
      return state;
    });
  }
  return report;
}

/**
 * The open rollback proposal for `id`, if one was drafted and not yet
 * decided against.
 *
 * @param {string} root
 * @param {string} id
 */
function openRollback(root, id) {
  const dir = path.join(root, PROPOSALS);
  let names;
  try {
    names = fs.readdirSync(dir).filter((name) => /\.ya?ml$/i.test(name));
  } catch {
    return undefined;
  }
  return names.find((name) => {
    const text = readText(path.join(dir, name)) ?? "";
    return topScalar(text, "rollback_of") === id && !["rejected", "rolled-back"].includes(topScalar(text, "status") ?? "");
  });
}

/**
 * Draft a proposal to roll back a kept change that now loses. It is
 * `proposed`, never approved: a person decides, and `/improve rollback` or
 * the review UI does the rest.
 *
 * @param {string} root
 * @param {{ file: string, id: string, title: string, text: string }} change
 * @param {{ with: number | null, without: number | null, delta: number | null, se: number | null, cases: number, regressions: string[], result: string | null }} entry
 * @param {Date} at
 */
export function draftRollback(root, change, entry, at) {
  const day = at.toISOString().slice(0, 10).replaceAll("-", "");
  const id = `IMP-${day}-rollback-${change.id.replace(/^IMP-\d{8}-/, "").slice(0, 40)}`;
  const file = `${id}.yaml`;
  const files = readScopeFiles(change.text);
  const ownRollback = readBlock(change.text, "rollback").join(" ").trim() || topScalar(change.text, "rollback") || null;
  const regressed = entry.regressions.length ? ` Cases that got worse: ${entry.regressions.join(", ")}.` : "";
  const document = {
    id,
    title: `Roll back ${change.id}, which now scores lower than the harness without it`,
    layer: topScalar(change.text, "layer") ?? "instructions",
    status: "proposed",
    owner: topScalar(change.text, "owner") ?? null,
    created_at: at.toISOString(),
    review_by: new Date(at.getTime() + 14 * 86_400_000).toISOString(),
    rollback_of: change.id,
    objective: `Keep only harness changes that still help: ${change.title}`,
    hypothesis: `Reverting ${change.id} brings the replay validation score back to at least its score without the change.`,
    confidence: entry.cases >= 3 ? "medium" : "low",
    evidence: [{
      source: entry.result ?? path.join(SUITE_DIR, "regression.json"),
      observation: `On ${entry.cases} validation ${entry.cases === 1 ? "case" : "cases"}, the harness scored ${entry.with} with ${change.id} and ${entry.without} without it. The delta is ${signed(entry.delta)}, with a standard error of ${entry.se}.${regressed}`
    }],
    scope: { files, systems: [], permissions_changed: false },
    intervention: {
      summary: `Today the harness carries ${change.id}. Revert what it changed in ${files.length ? files.join(", ") : "its files"}${ownRollback ? `, as its own rollback says: ${ownRollback}` : ""}. After that, the agent works as it did before ${change.id}.`,
      alternatives: [
        "Do nothing and run the regression check again: one losing run can be noise.",
        `Revise ${change.id} instead of removing it, and score the revision with replay.`
      ]
    },
    evaluation: {
      baseline: `The regression check: ${signed(entry.delta)} for ${change.id}.`,
      candidate: "Run the regression check again after the rollback.",
      pass_conditions: [`The validation score without ${change.id} is at least its score with it.`],
      regression_conditions: ["A correction the change targeted comes back more often after the rollback."],
      commands: [],
      outputs: []
    },
    risks: [`The correction ${change.id} targeted may come back.`],
    cost: { implementation: "Revert the listed files.", runtime: "None." },
    rollout: "Revert in one change, then let the next sessions run.",
    rollback: `Apply ${change.id} again.`,
    approval: { approved_by: null, approved_at: null },
    outcome: { measurements: [], conclusion: null, applied_at: null, applied_by: null },
    provenance: { source: "replay-regression", drafted_at: at.toISOString(), regression: path.join(SUITE_DIR, "regression.json") }
  };
  fs.mkdirSync(path.join(root, PROPOSALS), { recursive: true });
  fs.writeFileSync(path.join(root, PROPOSALS, file), toYaml(document));
  return file;
}

/**
 * Start the regression check in the background when the harness
 * configuration changed, unless one ran recently or is running. Returns why
 * it did or did not start.
 *
 * @param {{ root: string, dataDir: string, now?: number, start?: (args: string[]) => void }} options
 */
export function maybeStartRegression({ root, dataDir, now = Date.now(), start = startWorker }) {
  const config = replayConfig(root);
  if (!config.enabled || !config.regression.on_config_change) return { started: false, reason: "turned off" };
  const due = regressionDue(root, dataDir);
  if (!due.due) return { started: false, reason: due.reason };
  const minutes = Number(config.regression.min_interval_minutes) || 0;
  let go = false;
  updateJson(path.join(dataDir, "state.json"), (state) => {
    const startedAt = Date.parse(state.replay_regression_started_at ?? "");
    const running = state.replay_regression_running && Number.isFinite(startedAt) && now - startedAt < 60 * 60_000;
    const recent = Number.isFinite(startedAt) && now - startedAt < minutes * 60_000;
    if (!running && !recent) {
      go = true;
      state.replay_regression_running = true;
      state.replay_regression_started_at = new Date(now).toISOString();
    }
    return state;
  });
  if (!go) return { started: false, reason: "a regression check is running or ran recently" };
  start(["regress", root, dataDir, "config-change"]);
  return { started: true, reason: due.reason };
}

/**
 * Start `replay-worker.mjs` detached, so a hook returns at once.
 *
 * @param {string[]} args
 */
export function startWorker(args) {
  const child = spawn(process.execPath, [path.join(import.meta.dirname, "replay-worker.mjs"), ...args], {
    cwd: args[1],
    detached: true,
    stdio: "ignore",
    env: { ...process.env, IMPROVE_AGENT_CHILD: "1" },
    windowsHide: true
  });
  child.unref();
}

/**
 * @param {string} file
 * @returns {any[]}
 */
function readJsonl(file) {
  const text = readText(file);
  if (!text) return [];
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      // a torn line is skipped
    }
  }
  return rows;
}

/**
 * Sessions a person ran, with when each started, from the recorded events.
 *
 * @param {string} dataDir
 */
function humanSessions(dataDir) {
  /** @type {Map<string, number>} */
  const sessions = new Map();
  for (const event of readJsonl(path.join(dataDir, "events.jsonl"))) {
    if (event?.event !== "SessionStart" || event.automated || typeof event.session_id !== "string") continue;
    const at = Date.parse(event.occurred_at ?? "");
    if (!Number.isFinite(at)) continue;
    if (!sessions.has(event.session_id) || /** @type {number} */ (sessions.get(event.session_id)) > at) sessions.set(event.session_id, at);
  }
  return sessions;
}

/** @param {string} pattern */
function safeRegex(pattern) {
  try {
    return new RegExp(pattern);
  } catch {
    return undefined;
  }
}

/**
 * Whether one session's tool calls follow one deterministic check, or null
 * when the check does not apply to the session or cannot be read from a
 * transcript.
 *
 * - `tool_used` with `max: 0`: applies when the session used that tool;
 *   it complies when no call matched.
 * - `tool_used` with `min`: applies when the session used that tool; it
 *   complies when enough calls matched.
 * - `tool_order`: applies when the later call happened; it complies when the
 *   earlier one came first.
 *
 * @param {any} check
 * @param {{ name: string, input: any }[]} calls
 * @returns {boolean | null}
 */
export function complies(check, calls) {
  /** @param {any} side */
  const matcher = (side) => {
    const tool = typeof side === "string" ? side : side?.tool;
    const re = side?.input_match ? safeRegex(side.input_match) : undefined;
    if (side?.input_match && !re) return undefined;
    return (/** @type {{ name: string, input: any }} */ call) => call.name === tool && (!re || re.test(JSON.stringify(call.input ?? {})));
  };
  if (check?.type === "tool_used") {
    const match = matcher(check);
    if (!match) return null;
    if (!calls.some((call) => call.name === check.tool)) return null;
    const count = calls.filter(match).length;
    if (typeof check.max === "number" && count > check.max) return false;
    if (typeof check.min === "number" && count < check.min) return false;
    return true;
  }
  if (check?.type === "tool_order") {
    const before = matcher(check.before);
    const after = matcher(check.after);
    if (!before || !after) return null;
    const last = calls.findIndex(after);
    if (last === -1) return null;
    const first = calls.findIndex(before);
    return first !== -1 && first < last;
  }
  return null;
}

/**
 * Measure a kept change's outcome from what happened after it landed, and
 * fill the proposal's `outcome` block:
 *
 * - how often the correction it targets came back, per `per_sessions`
 *   sessions a person ran, in the `window_days` before it landed and since;
 * - how often sessions' tool calls followed the rule, read from their
 *   transcripts with the targeted cases' deterministic checks.
 *
 * Writes only when a number changed, and stops once `per_sessions` sessions
 * have run since the change: the outcome is then settled.
 *
 * @param {{ root: string, dataDir: string, file: string, now?: Date, home?: string, configDir?: string }} options
 */
export function measureOutcome({ root, dataDir, file, now = new Date(), home, configDir }) {
  const proposalPath = path.join(root, PROPOSALS, file);
  const text = readText(proposalPath);
  if (text === undefined) throw new Error(`no such proposal: ${file}`);
  const appliedAt = Date.parse(blockScalar(text, "outcome", "applied_at") ?? "");
  if (!Number.isFinite(appliedAt)) return { file, written: false, reason: "the change has not landed: outcome.applied_at is empty" };
  if (blockScalar(text, "outcome", "settled") === "true") return { file, written: false, reason: "the outcome is settled" };

  const config = replayConfig(root).outcome;
  const per = Number(config.per_sessions) > 0 ? Number(config.per_sessions) : 20;
  const windowMs = (Number(config.window_days) > 0 ? Number(config.window_days) : 30) * 86_400_000;
  const threshold = Number(config.similarity) > 0 ? Number(config.similarity) : 0.6;
  const candidate = readCandidateSafe(root, file);
  const suite = readSuite(root).cases;
  const names = candidate ? (candidate.targets.length ? candidate.targets : candidate.cases) : [];
  const patterns = names.map(globRegex);
  const targets = patterns.length ? suite.filter((c) => patterns.some((p) => p.test(c.name))) : [];

  if (targets.length === 0) {
    const conclusion = "Not measured: the proposal names no replay case it targets. List them in its candidate.json under targets.";
    if (blockScalar(text, "outcome", "conclusion") === conclusion) return { file, written: false, reason: "unchanged" };
    fs.writeFileSync(proposalPath, setInBlock(text, "outcome", { conclusion, measured_at: now.toISOString() }));
    return { file, written: true, measurements: [], conclusion };
  }

  const sessions = humanSessions(dataDir);
  const before = [...sessions].filter(([, at]) => at < appliedAt && at >= appliedAt - windowMs).map(([id]) => id);
  const after = [...sessions].filter(([, at]) => at >= appliedAt && at <= now.getTime()).map(([id]) => id);

  // The correction coming back: a candidate whose fingerprint is close to one
  // of the targeted group's.
  const fingerprints = targets.flatMap((t) => (Array.isArray(t.fingerprints) ? t.fingerprints : []));
  const { candidates } = readCandidates([dataDir]);
  let correctionsBefore = 0;
  let correctionsAfter = 0;
  for (const c of candidates) {
    const at = Date.parse(c.occurred_at ?? "");
    if (!Number.isFinite(at) || !fingerprints.some((f) => f === c.fingerprint || similarity(f, c.fingerprint) >= threshold)) continue;
    if (at >= appliedAt && at <= now.getTime()) correctionsAfter += 1;
    else if (at < appliedAt && at >= appliedAt - windowMs) correctionsBefore += 1;
  }
  /** @param {number} count @param {number} n */
  const rate = (count, n) => (n ? Math.round((count / n) * per * 100) / 100 : null);

  // The rule followed: each session's tool calls against the checks.
  const checks = targets.flatMap((t) => (Array.isArray(t.checks) ? t.checks : [])).filter((c) => c?.type === "tool_used" || c?.type === "tool_order");
  /** @param {string[]} ids */
  const compliance = (ids) => {
    let applicable = 0;
    let followed = 0;
    for (const id of ids) {
      const transcript = findTranscript(id, { home, configDir });
      if (!transcript) continue;
      const calls = toolCalls(readTranscript(transcript));
      for (const check of checks) {
        const verdict = complies(check, calls);
        if (verdict === null) continue;
        applicable += 1;
        if (verdict) followed += 1;
      }
    }
    return { applicable, followed, rate: applicable ? Math.round((followed / applicable) * 100) / 100 : null };
  };
  const complianceBefore = checks.length ? compliance(before) : null;
  const complianceAfter = checks.length ? compliance(after) : null;

  const measurements = [
    {
      name: `correction recurrence per ${per} sessions`,
      before: rate(correctionsBefore, before.length),
      after: rate(correctionsAfter, after.length),
      detail: `${correctionsBefore} in ${before.length} sessions before the change, ${correctionsAfter} in ${after.length} sessions since.`
    },
    {
      name: "rule compliance in transcripts",
      before: complianceBefore?.rate ?? null,
      after: complianceAfter?.rate ?? null,
      detail: complianceBefore && complianceAfter
        ? `${complianceBefore.followed} of ${complianceBefore.applicable} checks followed before, ${complianceAfter.followed} of ${complianceAfter.applicable} since.`
        : "The targeted cases have no tool-call check to read from transcripts."
    }
  ];
  const settled = after.length >= per;
  const conclusion = outcomeConclusion({ measurements, sessionsAfter: after.length, per, settled });
  const previous = JSON.stringify({ m: readBlock(text, "outcome").filter((l) => !/^\s+measured_at:/.test(l)).join("\n") });
  const next = setInBlock(text, "outcome", { measurements, conclusion, measured_at: now.toISOString(), settled });
  if (JSON.stringify({ m: readBlock(next, "outcome").filter((l) => !/^\s+measured_at:/.test(l)).join("\n") }) === previous) {
    return { file, written: false, reason: "unchanged", measurements, conclusion };
  }
  fs.writeFileSync(proposalPath, next);
  return { file, written: true, measurements, conclusion, settled };
}

/**
 * @param {{ measurements: { before: number | null, after: number | null }[], sessionsAfter: number, per: number, settled: boolean }} input
 */
function outcomeConclusion({ measurements, sessionsAfter, per, settled }) {
  const [recurrence, compliance] = measurements;
  const parts = [];
  if (recurrence.before !== null && recurrence.after !== null) {
    parts.push(recurrence.after < recurrence.before ? "The correction came back less often since the change."
      : recurrence.after > recurrence.before ? "The correction came back more often since the change."
      : "The correction came back as often as before.");
  }
  if (compliance.before !== null && compliance.after !== null) {
    parts.push(compliance.after > compliance.before ? "Sessions followed the rule more often."
      : compliance.after < compliance.before ? "Sessions followed the rule less often."
      : "Sessions followed the rule as often as before.");
  }
  if (parts.length === 0) parts.push("There are not enough sessions on either side to compare yet.");
  const head = settled ? `Settled after ${sessionsAfter} sessions.` : `Measuring: ${sessionsAfter} of ${per} sessions since the change, so this is not settled.`;
  return `${head} ${parts.join(" ")}`;
}

/**
 * Measure every kept change whose outcome is not settled.
 *
 * @param {{ root: string, dataDir: string, now?: Date, home?: string, configDir?: string }} options
 */
export function measureAll({ root, dataDir, now = new Date(), home, configDir }) {
  return keptProposals(root).map((k) => {
    try {
      return measureOutcome({ root, dataDir, file: k.file, now, home, configDir });
    } catch (error) {
      return { file: k.file, written: false, reason: /** @type {Error} */ (error).message };
    }
  });
}

/**
 * Whether an outcome measurement should start in the background: a kept
 * change is not settled and the last measurement is older than `everyMs`.
 *
 * @param {{ root: string, dataDir: string, now?: number, everyMs?: number, start?: (args: string[]) => void }} options
 */
export function maybeMeasureOutcomes({ root, dataDir, now = Date.now(), everyMs = 6 * 60 * 60_000, start = startWorker }) {
  const pending = keptProposals(root).filter((k) => blockScalar(k.text, "outcome", "settled") !== "true");
  if (pending.length === 0) return { started: false, reason: "no kept change is waiting for its outcome" };
  let go = false;
  updateJson(path.join(dataDir, "state.json"), (state) => {
    const last = Date.parse(state.replay_outcome_started_at ?? "");
    if (!Number.isFinite(last) || now - last >= everyMs) {
      go = true;
      state.replay_outcome_started_at = new Date(now).toISOString();
    }
    return state;
  });
  if (!go) return { started: false, reason: "measured recently" };
  start(["outcome", root, dataDir]);
  return { started: true, reason: `${pending.length} kept ${pending.length === 1 ? "change is" : "changes are"} waiting for an outcome` };
}

/**
 * What the review UI and Wheelhouse show: the suite's size, the last
 * regression check, and each proposal's replay verdict.
 *
 * @param {string} root
 */
export function replayStatus(root) {
  const suite = readSuite(root);
  const regression = readJson(path.join(root, SUITE_DIR, "regression.json"), null);
  return {
    suite: {
      cases: suite.cases.length,
      validation: suite.cases.filter((c) => c.split === "validation").length,
      test: suite.cases.filter((c) => c.split === "test").length,
      deterministic: suite.cases.filter((c) => c.graders === "deterministic").length,
      llm: suite.cases.filter((c) => c.graders === "llm").length,
      generated_at: suite.generated_at
    },
    regression: regression
      ? {
          ran_at: regression.ran_at ?? null,
          trigger: regression.trigger ?? null,
          checked: Array.isArray(regression.changes) ? regression.changes.length : 0,
          losing: Array.isArray(regression.changes) ? regression.changes.filter((c) => c.losing).map((c) => ({ proposal: c.proposal, delta: c.delta, rollback_proposal: c.rollback_proposal })) : []
        }
      : null,
    read_tools: READ_TOOLS
  };
}
