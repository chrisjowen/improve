import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { formatDuration, lastMeaningfulLine, runProcess } from "../../../../scripts/run-process.mjs";
import { contain, ensureDir, harnessDir, projectRoot, safeId } from "./paths.js";
import { appendRun, reportPath } from "./results.js";

const BUILD_TIMEOUT_MS = 120_000;
const GRADE_TIMEOUT_MS = 600_000;

function runnerDir() {
  return path.join(harnessDir(), "evals", "runner");
}

function python() {
  return process.env.IMPROVE_PYTHON || "python3";
}

/**
 * `~` and `~/x` as a shell would read them. The form suggests that shape.
 * @param {any} value
 */
export function expandHome(value) {
  if (typeof value !== "string") return value;
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
  return value;
}

/**
 * A rig failure in words a person can act on, with the next step.
 *
 * The rig is Python, so its failures arrive as tracebacks. The page used to
 * show "build_context failed" and keep the traceback out of sight.
 *
 * @param {string} stage
 * @param {any} outcome
 */
export function explainRigFailure(stage, outcome) {
  const label = stage === "build" ? "Collecting the session and changes" : "Grading";
  if (outcome.spawnError) {
    return outcome.spawnError.code === "ENOENT"
      ? {
          error: `Python was not found (tried "${python()}").`,
          hint: "Install Python 3, or start the UI with IMPROVE_PYTHON set to your interpreter."
        }
      : { error: `${label} could not start: ${outcome.spawnError.message}` };
  }
  if (outcome.cancelled) return { error: "Cancelled.", cancelled: true };
  if (outcome.timedOut) {
    return {
      error: `${label} did not finish within ${formatDuration(stage === "build" ? BUILD_TIMEOUT_MS : GRADE_TIMEOUT_MS)} and was stopped.`,
      timedOut: true,
      hint: "A step's timeout_ms in the suite bounds each evaluator; check for a command that waits on input."
    };
  }
  const stderr = String(outcome.stderr ?? "");
  const missing = stderr.match(/ModuleNotFoundError: No module named '([^']+)'/);
  if (missing) {
    return {
      error: `The eval rig needs the Python package "${missing[1]}".`,
      hint: `Run: ${python()} -m pip install -r .harness/evals/requirements.txt`
    };
  }
  const line = lastMeaningfulLine(stderr.split("\n").filter((l) => !l.startsWith("{\"improve_progress\"")).join("\n"));
  return { error: `${label} failed${line ? `: ${line}` : ` (exit ${outcome.code}).`}`, hint: "The full output is in the run log." };
}

/**
 * @param {string} root
 * @param {string} revision
 * @param {string} label
 */
async function verifyRevision(root, revision, label) {
  const check = await runProcess("git", ["rev-parse", "--verify", "--quiet", `${revision}^{commit}`], { cwd: root, timeoutMs: 15_000 });
  if (check.spawnError) return { error: "git was not found on PATH." };
  if (check.code !== 0) {
    return {
      error: `The ${label} revision "${revision}" does not exist in this repository.`,
      hint: "Use a branch, tag, or commit, such as HEAD~1 or main."
    };
  }
  return undefined;
}

/**
 * Build a context then grade it, and record the outcome in the run index.
 *
 * Both halves of the rig live in the repository under evaluation, not in the
 * plugin, because the runner refuses to load evaluators from outside the
 * project root.
 *
 * `signal` cancels; `progress` receives `{ message, done, total }`; every line
 * either half prints goes to `logFile`.
 *
 * @param {{
 *   suiteFile: string, transcript?: string, base?: string, head?: string,
 *   includeContent?: boolean, includePatch?: boolean, signal?: AbortSignal,
 *   progress?: (update: { message?: string, done?: number, total?: number }) => void,
 *   logFile?: string
 * }} options
 */
export async function runEvaluation({
  suiteFile, transcript, base, head, includeContent = false, includePatch = false,
  signal, progress = () => {}, logFile
}) {
  const root = projectRoot();
  const suitePath = contain(path.join(harnessDir(), "evals", "suites"), safeId(suiteFile));
  if (!fs.existsSync(suitePath)) {
    return { ok: false, error: `There is no suite named ${suiteFile}.` };
  }

  const buildScript = path.join(runnerDir(), "build_context.py");
  const runScript = path.join(runnerDir(), "eval_runner.py");
  for (const script of [buildScript, runScript]) {
    if (!fs.existsSync(script)) {
      return {
        ok: false,
        error: `The eval rig is missing: ${path.relative(root, script)} does not exist.`,
        hint: "Copy the plugin's assets/eval-rig into .harness/evals."
      };
    }
  }

  // An absent transcript is legitimate: a commit range alone is a valid
  // input, and the rig degrades to structural checks.
  let transcriptPath;
  if (transcript) {
    transcriptPath = path.resolve(expandHome(transcript));
    if (!fs.existsSync(transcriptPath)) {
      return { ok: false, error: `There is no transcript at ${transcript}.`, hint: "Pick a recent session, or paste the full path to a .jsonl file." };
    }
  }

  progress({ message: "Checking the revision range" });
  for (const [revision, label] of /** @type {[string | undefined, string][]} */ ([[base, "base"], [head, "head"]])) {
    if (!revision) continue;
    const problem = await verifyRevision(root, revision, label);
    if (problem) return { ok: false, ...problem };
  }

  const runId = crypto.randomUUID();
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "improve-eval-"));
  const contextFile = path.join(scratch, "context.json");
  if (!transcriptPath) {
    transcriptPath = path.join(scratch, "empty.jsonl");
    fs.writeFileSync(transcriptPath, "");
  }

  try {
    const buildArgs = [
      buildScript,
      "--project-root", root,
      "--transcript-jsonl", transcriptPath,
      "--output", contextFile,
      "--task-id", runId,
      "--prompt", "Evaluated from the improve UI"
    ];
    if (base) buildArgs.push("--base", base);
    if (head) buildArgs.push("--head", head);
    if (includeContent) buildArgs.push("--include-content");
    if (includePatch) buildArgs.push("--include-patch");

    progress({ message: "Collecting the session and changes" });
    const built = await runProcess(python(), buildArgs, { cwd: root, timeoutMs: BUILD_TIMEOUT_MS, signal, logFile });
    if (built.spawnError || built.cancelled || built.timedOut || built.code !== 0) {
      return { ok: false, ...explainRigFailure("build", built) };
    }

    const output = reportPath(runId);
    ensureDir(path.dirname(output));
    progress({ message: "Grading" });
    const graded = await runProcess(python(), [runScript, suitePath, "--context", contextFile, "--output", output], {
      cwd: root,
      // Older copies of the rig ignore this; newer ones report each step.
      env: { ...process.env, IMPROVE_EVAL_PROGRESS: "1" },
      timeoutMs: GRADE_TIMEOUT_MS,
      signal,
      logFile,
      onStderrLine: (/** @type {string} */ line) => {
        if (!line.startsWith("{\"improve_progress\"")) return;
        try {
          const event = JSON.parse(line).improve_progress;
          const done = event.state === "running" ? event.index : event.index + 1;
          progress({
            message: event.state === "running" ? `Grading step ${event.index + 1} of ${event.total}: ${event.step}` : `Graded ${event.step}`,
            done,
            total: event.total
          });
        } catch {
          // a malformed progress line is only progress
        }
      }
    });

    // eval_runner exits 1 when the suite fails, which is a result, not an error.
    if (graded.spawnError || graded.cancelled || graded.timedOut || !fs.existsSync(output)) {
      return { ok: false, ...explainRigFailure("grade", graded) };
    }

    let report;
    try {
      report = JSON.parse(fs.readFileSync(output, "utf8"));
    } catch (error) {
      return { ok: false, error: `The report could not be read: ${/** @type {Error} */ (error).message}` };
    }
    const entry = {
      run_id: runId,
      suite_id: report.suite?.id ?? suiteFile,
      suite_file: suiteFile,
      objective_id: report.objective?.id ?? null,
      rig_version: report.rig_version ?? null,
      score: report.score,
      success: report.success,
      occurred_at: new Date().toISOString(),
      report_path: path.relative(root, output),
      context: { transcript: transcript ?? null, base: base ?? null, head: head ?? null, include_content: includeContent }
    };
    appendRun(entry);

    // A failing suite is a valid result, not a failed job.
    return { ok: true, run: entry };
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}
