import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

/**
 * Run a command to completion, with a timeout, a cancel signal, and a log.
 *
 * The child leads its own process group, so a timeout or cancel ends every
 * descendant. Killing only the direct child used to leave an evaluator's
 * `sh -c ...` or an agent's tool subprocesses running after the job had been
 * reported as finished.
 *
 * Never rejects. The result says how the process ended:
 * `{ code, signal, stdout, stderr, timedOut, cancelled, spawnError }`.
 */
export function runProcess(command, args, {
  cwd,
  env = process.env,
  timeoutMs = 300_000,
  signal,
  logFile,
  onStdoutLine,
  onStderrLine,
  // Rewrites a stdout line for the log; return null to leave it out.
  formatStdoutLog,
  graceMs = 2_000
} = {}) {
  const log = logFile ? openLog(logFile) : undefined;
  log?.(`$ ${[command, ...args].map(quote).join(" ")}`);

  return new Promise((resolve) => {
    if (signal?.aborted) {
      log?.close("cancelled before start");
      resolve({ code: null, signal: null, stdout: "", stderr: "", timedOut: false, cancelled: true });
      return;
    }

    let child;
    try {
      child = spawn(command, args, {
        cwd,
        env,
        stdio: ["ignore", "pipe", "pipe"],
        detached: process.platform !== "win32",
        windowsHide: true
      });
    } catch (error) {
      log?.close(`spawn failed: ${error.message}`);
      resolve({ code: null, signal: null, stdout: "", stderr: "", spawnError: error });
      return;
    }

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let cancelled = false;
    let settled = false;
    let killTimer;

    const lines = (stream, onLine, tag, append, format = (line) => `${tag} ${line}`) => {
      let pending = "";
      stream.setEncoding("utf8");
      stream.on("data", (chunk) => {
        append(chunk);
        pending += chunk;
        const parts = pending.split("\n");
        pending = parts.pop();
        for (const line of parts) {
          const entry = format(line);
          if (entry != null) log?.(entry);
          onLine?.(line);
        }
      });
      stream.on("end", () => {
        if (!pending) return;
        const entry = format(pending);
        if (entry != null) log?.(entry);
        onLine?.(pending);
        pending = "";
      });
    };
    lines(child.stdout, onStdoutLine, "out", (chunk) => { stdout += chunk; }, formatStdoutLog);
    lines(child.stderr, onStderrLine, "err", (chunk) => { stderr += chunk; });

    const stop = () => {
      killGroup(child, "SIGTERM");
      killTimer = setTimeout(() => killGroup(child, "SIGKILL"), graceMs);
      killTimer.unref?.();
    };

    const timer = setTimeout(() => {
      timedOut = true;
      log?.(`timed out after ${formatDuration(timeoutMs)}; stopping`);
      stop();
    }, timeoutMs);
    timer.unref?.();

    const onAbort = () => {
      cancelled = true;
      log?.("cancel requested; stopping");
      stop();
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(killTimer);
      signal?.removeEventListener("abort", onAbort);
      log?.close(result.spawnError
        ? `could not start: ${result.spawnError.message}`
        : `exited ${result.code ?? result.signal}${timedOut ? " (timed out)" : ""}${cancelled ? " (cancelled)" : ""}`);
      resolve({ stdout, stderr, timedOut, cancelled, ...result });
    };

    child.on("error", (error) => finish({ code: null, signal: null, spawnError: error }));
    child.on("close", (code, exitSignal) => {
      // The leader is gone; make sure nothing it started outlives the job.
      if (timedOut || cancelled) killGroup(child, "SIGKILL");
      finish({ code, signal: exitSignal });
    });
  });
}

function killGroup(child, signalName) {
  if (!child.pid) return;
  try {
    if (process.platform === "win32") child.kill(signalName);
    else process.kill(-child.pid, signalName);
  } catch {
    // already gone
  }
}

function quote(value) {
  return /^[\w@%+=:,./-]+$/.test(value) ? value : JSON.stringify(value.length > 200 ? `${value.slice(0, 200)}…` : value);
}

export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 120) return `${seconds}s`;
  return `${Math.round(seconds / 60)} minutes`;
}

/** A line-oriented, timestamped log that never throws into the caller. */
function openLog(file) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  } catch {
    return undefined;
  }
  const write = (line) => {
    try {
      fs.appendFileSync(file, `${new Date().toISOString()} ${line}\n`, { encoding: "utf8", mode: 0o600 });
    } catch {
      // a log failure must not fail the job
    }
  };
  write.close = (line) => write(line);
  return write;
}

/**
 * The line of a failure most worth showing a person.
 *
 * Python tracebacks end with the exception, Node errors start with it, and both
 * are surrounded by noise. Prefer a known exception line, then the last line.
 */
export function lastMeaningfulLine(text) {
  const lines = String(text ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
  const exception = [...lines].reverse().find((line) => /^([A-Za-z_.]+(Error|Exception)|fatal|error)\b[:\s]/i.test(line));
  return exception ?? lines.at(-1) ?? "";
}
