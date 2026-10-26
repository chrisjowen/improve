import { api } from "./api.js";

/**
 * Every page shares one view of the job list, polled while anything runs.
 * Fast when a job is live, slow when idle, so a run started on one page shows
 * its progress on every other page too.
 */
export const jobs = $state({ list: [], error: null, loaded: false });

let timer;
let listeners = 0;

async function tick() {
  try {
    const value = await api("/api/jobs");
    jobs.list = value.jobs ?? [];
    jobs.error = null;
  } catch (error) {
    jobs.error = error.message;
  }
  jobs.loaded = true;
  schedule();
}

function schedule() {
  clearTimeout(timer);
  if (listeners === 0) return;
  const live = jobs.list.some((job) => job.status === "running");
  timer = setTimeout(tick, live ? 1000 : 8000);
}

/** Start polling for the lifetime of the calling component. */
export function watchJobs() {
  $effect(() => {
    listeners += 1;
    tick();
    return () => {
      listeners -= 1;
      if (listeners === 0) clearTimeout(timer);
    };
  });
}

/** Poll now, for after a page starts a job. */
export function refreshJobs() {
  return tick();
}

/** Resolve once the job is no longer running. */
export async function settled(id) {
  for (;;) {
    const job = jobs.list.find((candidate) => candidate.id === id);
    if (job && job.status !== "running") return job;
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (!jobs.list.some((candidate) => candidate.id === id)) await tick();
  }
}
