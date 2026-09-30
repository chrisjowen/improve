import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { contain, ensureDir, harnessDir, projectRoot, safeId } from "./paths.js";
import { appendRun, reportPath } from "./results.js";

function runnerDir() {
  return path.join(harnessDir(), "evals", "runner");
}

function python() {
  return process.env.IMPROVE_PYTHON || "python3";
}

function exec(command, args, cwd, timeoutMs = 300_000) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    } catch (error) {
      resolve({ code: 127, stdout: "", stderr: `spawn failed: ${error.message}` });
      return;
    }
    let stdout = "";
    let stderr = "";
    let settled = false;
    child.stdout.on("data", (c) => { stdout += c; });
    child.stderr.on("data", (c) => { stderr += c; });
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      resolve({ code: 124, stdout, stderr: `${stderr}\ntimed out after ${timeoutMs}ms` });
    }, timeoutMs);
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code: 127, stdout, stderr: `${stderr}${error.message}` });
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

/**
 * Build a context then grade it, and record the outcome in the run index.
 *
 * Both halves of the rig live in the repository under evaluation, not in the
 * plugin, because the runner refuses to load evaluators from outside the
 * project root.
 */
export async function runEvaluation({ suiteFile, transcript, base, head, includeContent = false, includePatch = false }) {
  const root = projectRoot();
  const suitePath = contain(path.join(harnessDir(), "evals", "suites"), safeId(suiteFile));
  if (!fs.existsSync(suitePath)) {
    return { ok: false, error: `no such suite: ${suiteFile}` };
  }

  const buildScript = path.join(runnerDir(), "build_context.py");
  const runScript = path.join(runnerDir(), "eval_runner.py");
  for (const script of [buildScript, runScript]) {
    if (!fs.existsSync(script)) {
      return { ok: false, error: `eval rig missing at ${path.relative(root, script)}. Copy the plugin's assets/eval-rig into .harness/evals.` };
    }
  }

  const runId = crypto.randomUUID();
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "improve-eval-"));
  const contextFile = path.join(scratch, "context.json");

  // An absent transcript is legitimate: a commit range alone is a valid
  // substrate, and the rig degrades to structural checks.
  let transcriptPath = path.join(scratch, "empty.jsonl");
  fs.writeFileSync(transcriptPath, "");
  if (transcript) {
    const resolved = path.resolve(transcript);
    if (!fs.existsSync(resolved)) {
      return { ok: false, error: `no such transcript: ${transcript}` };
    }
    transcriptPath = resolved;
  }

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

  const built = await exec(python(), buildArgs, root);
  if (built.code !== 0) {
    fs.rmSync(scratch, { recursive: true, force: true });
    return { ok: false, error: "build_context failed", stderr: built.stderr.slice(-2000) };
  }

  const output = reportPath(runId);
  ensureDir(path.dirname(output));
  const graded = await exec(python(), [runScript, suitePath, "--context", contextFile, "--output", output], root);
  fs.rmSync(scratch, { recursive: true, force: true });

  if (!fs.existsSync(output)) {
    return { ok: false, error: "eval_runner produced no report", stderr: graded.stderr.slice(-2000) };
  }

  const report = JSON.parse(fs.readFileSync(output, "utf8"));
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
    context: { transcript: transcript ?? null, base: base ?? null, head: head ?? null }
  };
  appendRun(entry);

  // A failing suite is a valid result, not a failed job.
  return { ok: true, run: entry, report };
}
