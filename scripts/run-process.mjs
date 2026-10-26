import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

/**
 * @typedef {object} RunProcessOptions
 * @property {string} [cwd]
 * @property {NodeJS.ProcessEnv} [env]
 * @property {number} [timeoutMs]
 * @property {AbortSignal} [signal]
 * @property {string} [logFile]
 * @property {(line: string) => void} [onStdoutLine]
 * @property {(line: string) => void} [onStderrLine]
 * @property {(line: string) => string | null} [formatStdoutLog]
 * @property {number} [graceMs]
 */

/**
 * @typedef {object} RunProcessResult
 * @property {number | null} code
 * @property {NodeJS.Signals | null} signal
 * @property {string} stdout
 * @property {string} stderr
 * @property {boolean} [timedOut]
 * @property {boolean} [cancelled]
 * @property {NodeJS.ErrnoException} [spawnError]
 */

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
 *
 * @param {string} command
 * @param {readonly string[]} args
 * @param {RunProcessOptions} [options]
 * @returns {Promise<RunProcessResult>}
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
      log?.close(`spawn failed: ${/** @type {Error} */ (error).message}`);
      resolve({ code: null, signal: null, stdout: "", stderr: "", spawnError: /** @type {NodeJS.ErrnoException} */ (error) });
      return;
    }

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let cancelled = false;
    let settled = false;
    /** @type {NodeJS.Timeout | undefined} */
    let killTimer;

    /**
     * @param {import("node:stream").Readable} stream
     * @param {((line: string) => void) | undefined} onLine
     * @param {string} tag
     * @param {(chunk: string) => void} append
     * @param {(line: string) => string | null} [format]
     */

    const lines = (stream, onLine, tag, append, format = (line) => `${tag} ${line}`) => {
      let pending = "";
      stream.setEncoding("utf8");
      stream.on("data", (/** @type {string} */ chunk) => {
        append(chunk);
        pending += chunk;
        const parts = pending.split("\n");
        pending = /** @type {string} */ (parts.pop());
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

    /** @param {{ code: number | null, signal: NodeJS.Signals | null, spawnError?: NodeJS.ErrnoException }} result */
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

/**
 * @param {import("node:child_process").ChildProcess} child
 * @param {NodeJS.Signals} signalName
 */
function killGroup(child, signalName) {
  if (!child.pid) return;
  try {
    if (process.platform === "win32") child.kill(signalName);
    else process.kill(-child.pid, signalName);
  } catch {
    // already gone
  }
}

/** @param {string} value */
function quote(value) {
  return /^[\w@%+=:,./-]+$/.test(value) ? value : JSON.stringify(value.length > 200 ? `${value.slice(0, 200)}…` : value);
}

/**
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 120) return `${seconds}s`;
  return `${Math.round(seconds / 60)} minutes`;
}

/**
 * A line-oriented, timestamped log that never throws into the caller.
 *
 * @param {string} file
 */
function openLog(file) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
  } catch {
    return undefined;
  }
  /** @param {string} line */
  const write = (line) => {
    try {
      fs.appendFileSync(file, `${new Date().toISOString()} ${line}\n`, { encoding: "utf8", mode: 0o600 });
    } catch {
      // a log failure must not fail the job
    }
  };
  write.close = (/** @type {string} */ line) => write(line);
  return write;
}

/**
 * The line of a failure most worth showing a person.
 *
 * Python tracebacks end with the exception, Node errors start with it, and both
 * are surrounded by noise. Prefer a known exception line, then the last line.
 *
 * @param {unknown} text
 * @returns {string}
 */
export function lastMeaningfulLine(text) {
  const lines = String(text ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
  const exception = [...lines].reverse().find((line) => /^([A-Za-z_.]+(Error|Exception)|fatal|error)\b[:\s]/i.test(line));
  return exception ?? lines.at(-1) ?? "";
}
