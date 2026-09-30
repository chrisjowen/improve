import crypto from "node:crypto";

/**
 * In-memory job table. Jobs are single-user and short-lived, and losing them on
 * restart is preferable to persisting state the UI would then have to reconcile.
 */
const jobs = new Map();
const MAX_CONCURRENT = 1;
const RETAIN = 50;

export function activeCount() {
  let active = 0;
  for (const job of jobs.values()) if (job.status === "running") active += 1;
  return active;
}

export function startJob(kind, detail, work) {
  if (activeCount() >= MAX_CONCURRENT) {
    return { error: "another job is already running", status: 409 };
  }
  const id = crypto.randomUUID();
  const job = {
    id,
    kind,
    detail,
    status: "running",
    started_at: new Date().toISOString(),
    finished_at: null,
    result: null,
    error: null
  };
  jobs.set(id, job);

  Promise.resolve()
    .then(() => work())
    .then((result) => {
      job.status = result?.ok === false ? "failed" : "completed";
      job.result = result ?? null;
      if (result?.ok === false) job.error = result.error ?? "job failed";
    })
    .catch((error) => {
      job.status = "failed";
      job.error = error?.message ?? String(error);
    })
    .finally(() => {
      job.finished_at = new Date().toISOString();
      prune();
    });

  return { job };
}

export function getJob(id) {
  return jobs.get(id);
}

export function listJobs() {
  return [...jobs.values()].sort((a, b) => b.started_at.localeCompare(a.started_at));
}

function prune() {
  const finished = [...jobs.values()]
    .filter((job) => job.status !== "running")
    .sort((a, b) => String(b.finished_at).localeCompare(String(a.finished_at)));
  for (const job of finished.slice(RETAIN)) jobs.delete(job.id);
}
