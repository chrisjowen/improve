<script>
  import Pill from "./Pill.svelte";
  import Icon from "./Icon.svelte";
  import Notice from "./Notice.svelte";
  import { api } from "$lib/client/api.js";
  import { refreshJobs } from "$lib/client/jobs.svelte.js";
  import { JOB, duration, ago } from "$lib/client/format.js";

  /** One job's live status: what it is doing, how far along, and how to stop it. */
  /** @type {{ job: any, compact?: boolean }} */
  let { job, compact = false } = $props();
  let cancelling = $state(false);
  let now = $state(Date.now());

  $effect(() => {
    if (job.status !== "running") return;
    const timer = setInterval(() => { now = Date.now(); }, 1000);
    return () => clearInterval(timer);
  });

  const meta = $derived(JOB[job.status] ?? { label: job.status, tone: "" });
  const fraction = $derived(job.progress?.total ? Math.min(1, (job.progress.done ?? 0) / job.progress.total) : null);

  async function cancel() {
    cancelling = true;
    try {
      await api(`/api/jobs/${job.id}/cancel`, { method: "POST" });
      await refreshJobs();
    } finally {
      cancelling = false;
    }
  }
</script>

<div class="job">
  <div class="spread">
    <div class="row grow">
      <Pill tone={meta.tone}>{meta.label}</Pill>
      <a class="title" href="/runs?job={job.id}">{job.title}</a>
    </div>
    <span class="small faint num" title={job.started_at}>
      {job.status === "running" ? duration(job.started_at, null, now) : `${ago(job.finished_at)} · took ${duration(job.started_at, job.finished_at)}`}
    </span>
  </div>
  {#if job.status === "running"}
    <div class="stack" style="gap:8px;margin-top:10px">
      <div class="progress" class:indeterminate={fraction === null}>
        <span style={fraction === null ? "" : `width:${Math.max(4, fraction * 100)}%`}></span>
      </div>
      <div class="spread">
        <span class="small muted">{job.progress?.message ?? "Working"}</span>
        <button class="small" onclick={cancel} disabled={cancelling}>
          <Icon name="square" size={12} /> {cancelling ? "Cancelling…" : "Cancel"}
        </button>
      </div>
    </div>
  {:else if job.error && !compact}
    <div style="margin-top:10px">
      <Notice tone={job.status === "cancelled" ? "" : "bad"}>
        <p>{job.error}</p>
        {#if job.hint}<p class="small" style="margin-top:4px">{job.hint}</p>{/if}
      </Notice>
    </div>
  {:else if job.error}
    <p class="small" style="color:var(--bad);margin-top:6px">{job.error}</p>
  {/if}
</div>

<style>
  .job { padding: 12px 16px; }
  .title { color: var(--text); font-weight: 500; overflow-wrap: anywhere; }
</style>
