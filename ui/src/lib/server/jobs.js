import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { projectDataDir, projectId, projectRoot, readTextSafe } from "./paths.js";

/**
 * Background jobs: evaluations, skill drafts, and background reviews.
 *
 * Each job is a record on disk plus a log, so a run survives leaving the page
 * and a server restart, and a person can read what it did. A record left
 * "running" by a previous server process is reported as interrupted, never as
 * still running.
 *
 * One job runs at a time per lane. An agent draft can take minutes, and it
 * used to block every evaluation behind a bare 409.
 */
/**
 * @typedef {{ message?: string, done?: number | null, total?: number | null, [key: string]: any }} JobProgress
 * @typedef {{
 *   id: string, kind: string, lane: string, title: string, detail: any, status: string,
 *   started_at: string, updated_at: string, finished_at: string | null,
 *   progress: JobProgress, result: any, error: string | null, hint: string | null,
 *   log: string, server_pid: number, controller?: AbortController
 * }} Job
 * @typedef {{ signal: AbortSignal, progress: (update: Partial<JobProgress>) => void, logFile: string }} JobContext
 */
/** @type {Record<string, string>} */
const LANES = { evaluate: "evaluate", "draft-skill": "agent", dream: "agent" };
const RETAIN = 100;
const LOG_TAIL_BYTES = 64 * 1024;

/** @type {Map<string, Job>} */
const live = new Map();
let loaded = false;

// A job's processes lead their own group, so they would outlive the server.
// adapter-node emits this on SIGINT and SIGTERM before it exits.
process.once("sveltekit:shutdown", () => {
  for (const job of live.values()) if (job.status === "running") job.controller?.abort();
});

export function jobsDir() {
  const data = projectDataDir();
  return data
    ? path.join(data, "jobs")
    : path.join(os.tmpdir(), "improve-ui", projectId(projectRoot()), "jobs");
}

/** @param {string} id */
function recordFile(id) {
  return path.join(jobsDir(), `${id}.json`);
}

/** @param {string} id */
export function logFile(id) {
  return path.join(jobsDir(), `${id}.log`);
}

/** @param {Job} job */
function persist(job) {
  try {
    fs.mkdirSync(jobsDir(), { recursive: true });
    const temp = `${recordFile(job.id)}.${process.pid}.tmp`;
    fs.writeFileSync(temp, `${JSON.stringify(publicView(job), null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    fs.renameSync(temp, recordFile(job.id));
  } catch {
    // the in-memory record still serves this process
  }
}

function load() {
  if (loaded) return;
  loaded = true;
  /** @type {string[]} */
  let names = [];
  try {
    names = fs.readdirSync(jobsDir()).filter((name) => name.endsWith(".json"));
  } catch {
    return;
  }
  for (const name of names) {
    const text = readTextSafe(path.join(jobsDir(), name));
    if (!text) continue;
    try {
      const job = JSON.parse(text);
      if (!job?.id) continue;
      if (job.status === "running" && job.server_pid !== process.pid && !alive(job.server_pid)) {
        job.status = "interrupted";
        job.error = "The UI server stopped while this was running, so it did not finish.";
        job.finished_at = job.finished_at ?? job.updated_at ?? job.started_at;
        persist(job);
      }
      live.set(job.id, job);
    } catch {
      // a half-written record is skipped, not fatal
    }
  }
}

/** @param {number} pid */
function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** @param {Job} job */
function publicView(job) {
  const { controller, ...rest } = job;
  return rest;
}

/**
 * A running job another server owns changes on disk, not here; re-read it.
 * @param {Job} job
 * @returns {Job}
 */
function current(job) {
  if (job.status !== "running" || job.controller) return job;
  const text = readTextSafe(recordFile(job.id));
  try {
    const fresh = text ? JSON.parse(text) : undefined;
    if (fresh?.id === job.id) live.set(job.id, fresh);
    return fresh?.id === job.id ? fresh : job;
  } catch {
    return job;
  }
}

/** @param {string} lane */
export function runningIn(lane) {
  load();
  return [...live.values()].find((job) => job.status === "running" && job.lane === lane);
}

/**
 * Start `work({ signal, progress, logFile })` as a job.
 *
 * `work` resolves to `{ ok, error?, hint?, cancelled?, timedOut?, ... }`. A
 * result with `ok: false` is a failed job; everything else it returns is kept
 * as the job's `result`, so it must be small.
 *
 * @param {string} kind
 * @param {{ title?: string, detail?: any }} options
 * @param {(context: JobContext) => any} work
 */
export function startJob(kind, { title, detail = {} }, work) {
  load();
  const lane = LANES[kind] ?? kind;
  const busy = runningIn(lane);
  if (busy) {
    return {
      status: 409,
      error: `"${busy.title}" is still running. Wait for it to finish, or cancel it.`,
      running: publicView(busy)
    };
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  /** @type {Job} */
  const job = {
    id,
    kind,
    lane,
    title: title ?? kind,
    detail,
    status: "running",
    started_at: now,
    updated_at: now,
    finished_at: null,
    progress: { message: "Starting", done: null, total: null },
    result: null,
    error: null,
    hint: null,
    log: path.basename(logFile(id)),
    server_pid: process.pid,
    controller: new AbortController()
  };
  live.set(id, job);
  persist(job);

  let lastWrite = 0;
  /** @param {Partial<JobProgress>} update */
  const progress = (update) => {
    job.progress = { ...job.progress, ...update };
    job.updated_at = new Date().toISOString();
    // Progress can arrive many times a second; the record need not.
    if (Date.now() - lastWrite > 500) {
      lastWrite = Date.now();
      persist(job);
    }
  };

  Promise.resolve()
    .then(() => work({ signal: /** @type {AbortController} */ (job.controller).signal, progress, logFile: logFile(id) }))
    .then((result) => {
      const value = result ?? {};
      job.status = value.cancelled ? "cancelled"
        : value.timedOut ? "timed-out"
        : value.ok === false ? "failed"
        : "completed";
      job.error = value.ok === false ? (value.error ?? "The job failed.") : null;
      job.hint = value.hint ?? null;
      const { ok, error, hint, cancelled, timedOut, ...rest } = value;
      job.result = rest;
    })
    .catch((error) => {
      job.status = "failed";
      job.error = error?.message ?? String(error);
    })
    .finally(() => {
      job.finished_at = new Date().toISOString();
      job.updated_at = job.finished_at;
      job.progress = { ...job.progress, message: job.status === "completed" ? "Finished" : job.progress.message };
      persist(job);
      prune();
    });

  return { job: publicView(job) };
}

/** @param {string} id */
export function cancelJob(id) {
  load();
  const job = live.get(id);
  if (!job) return { ok: false, status: 404, error: `no such job: ${id}` };
  if (job.status !== "running") return { ok: false, status: 409, error: `This job already ${job.status}.` };
  if (!job.controller) return { ok: false, status: 409, error: "This job belongs to another server process." };
  job.progress = { ...job.progress, message: "Cancelling" };
  job.controller.abort();
  return { ok: true, job: publicView(job) };
}

/** @param {string} id */
export function getJob(id) {
  load();
  const job = live.get(id);
  return job ? publicView(current(job)) : undefined;
}

/** @param {{ kind?: string, limit?: number }} [options] */
export function listJobs({ kind, limit = 50 } = {}) {
  load();
  return [...live.values()]
    .map(current)
    .filter((job) => !kind || job.kind === kind)
    .sort((a, b) => b.started_at.localeCompare(a.started_at))
    .slice(0, limit)
    .map(publicView);
}

/**
 * The end of a job's log. Logs can be long; the end is where a failure is.
 * @param {string} id
 */
export function readLog(id) {
  load();
  if (!live.has(id)) return undefined;
  const file = logFile(id);
  let size;
  try {
    size = fs.statSync(file).size;
  } catch {
    return { text: "", truncated: false };
  }
  const start = Math.max(0, size - LOG_TAIL_BYTES);
  const fd = fs.openSync(file, "r");
  try {
    const buffer = Buffer.alloc(size - start);
    fs.readSync(fd, buffer, 0, buffer.length, start);
    let text = buffer.toString("utf8");
    if (start > 0) text = text.slice(text.indexOf("\n") + 1);
    return { text, truncated: start > 0, bytes: size };
  } finally {
    fs.closeSync(fd);
  }
}

function prune() {
  const finished = [...live.values()]
    .filter((job) => job.status !== "running")
    .sort((a, b) => String(b.finished_at).localeCompare(String(a.finished_at)));
  for (const job of finished.slice(RETAIN)) {
    live.delete(job.id);
    for (const file of [recordFile(job.id), logFile(job.id)]) {
      try {
        fs.rmSync(file, { force: true });
      } catch {
        // pruning is best effort
      }
    }
  }
}

/** For tests: forget everything in memory so the next call reloads from disk. */
export function resetForTests() {
  live.clear();
  loaded = false;
}
