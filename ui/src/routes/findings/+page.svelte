<script>
  import { goto } from "$app/navigation";
  import Pill from "$lib/components/Pill.svelte";
  import Icon from "$lib/components/Icon.svelte";
  import Notice from "$lib/components/Notice.svelte";
  import JobCard from "$lib/components/JobCard.svelte";
  import LogView from "$lib/components/LogView.svelte";
  import { api } from "$lib/client/api.js";
  import { summary, refreshSummary } from "$lib/client/summary.svelte.js";
  import { jobs, refreshJobs, settled } from "$lib/client/jobs.svelte.js";
  import { ago, plural } from "$lib/client/format.js";

  let notice = $state(null);
  let busy = $state(null);
  let openLog = $state(null);

  const reports = $derived(summary.dreams);
  const running = $derived(jobs.list.find((job) => job.kind === "dream" && job.status === "running"));
  const lastRun = $derived(jobs.list.find((job) => job.kind === "dream"));

  async function runReview() {
    notice = null;
    try {
      const { job } = await api("/api/dreams", { method: "POST" });
      await refreshJobs();
      await settled(job.id);
      await refreshSummary();
    } catch (error) {
      notice = { tone: "bad", text: error.message, hint: error.hint };
    }
  }

  async function importFinding(file, index) {
    busy = `${file}:${index}`;
    notice = null;
    try {
      const value = await api(`/api/dreams/${encodeURIComponent(file)}/import`, { method: "POST", body: { index } });
      await refreshSummary();
      goto(`/proposals?view=waiting&p=${encodeURIComponent(value.proposal)}`);
    } catch (error) {
      notice = { tone: "bad", text: error.message };
    } finally {
      busy = null;
    }
  }

  async function dismiss(file) {
    busy = file;
    notice = null;
    try {
      await api(`/api/dreams/${encodeURIComponent(file)}/dismiss`, { method: "POST" });
      notice = { tone: "", text: "Dismissed. The report is deleted; nothing was imported." };
      await refreshSummary();
    } catch (error) {
      notice = { tone: "bad", text: error.message };
    } finally {
      busy = null;
    }
  }

  function reportTitle(report) {
    return report.produced_at ? `Background review, ${ago(report.produced_at)}` : report.file;
  }
</script>

<svelte:head><title>Background findings · improve</title></svelte:head>

<div class="page-head">
  <div>
    <h1>Background findings</h1>
    <p>
      Ideas from a read-only agent that looked through this repository. They are unverified and stay outside the
      repository. Import one to review it as a proposal, or dismiss the report.
    </p>
  </div>
  <button class="primary" onclick={runReview} disabled={Boolean(running)}>
    <Icon name="play" size={14} />{running ? "Review running…" : "Run a background review"}
  </button>
</div>

<div class="stack" style="gap:16px">
  {#if running}
    <div class="panel"><JobCard job={running} /></div>
  {:else if lastRun && lastRun.status !== "completed" && lastRun.error}
    <div class="panel"><JobCard job={lastRun} /></div>
  {/if}
  {#if notice}
    <Notice tone={notice.tone}><p>{notice.text}</p>{#if notice.hint}<p class="small">{notice.hint}</p>{/if}</Notice>
  {/if}

  {#if summary.loaded && reports.length === 0}
    <div class="panel empty">
      <strong>No background findings.</strong>
      Run a background review here, or enable <code>background_dreaming</code> in <code>.harness/improve.json</code>
      to run one after sessions. The agent cannot edit anything; it only reports.
    </div>
  {/if}

  {#each reports as report (report.file)}
    <section class="panel">
      <div class="panel-head">
        <h2>
          {reportTitle(report)}
          {#if report.status === "completed"}
            <Pill plain>{plural(report.findings.length, "finding")}</Pill>
          {:else}
            <Pill tone={report.status === "cancelled" ? "" : "bad"}>{report.status === "unreadable" ? "Unreadable" : report.status === "cancelled" ? "Cancelled" : "Failed"}</Pill>
          {/if}
          {#if report.cost_usd}<span class="small faint num">${report.cost_usd.toFixed(2)}</span>{/if}
        </h2>
        <div class="row">
          {#if report.log}
            <button class="ghost small" onclick={() => { openLog = openLog === report.file ? null : report.file; }}>
              <Icon name="terminal" size={13} />{openLog === report.file ? "Hide log" : "Log"}
            </button>
          {/if}
          <button class="ghost small danger" onclick={() => dismiss(report.file)} disabled={busy === report.file}>Dismiss report</button>
        </div>
      </div>

      {#if report.error}
        <div class="panel-body"><Notice tone="bad">{report.error}</Notice></div>
      {/if}
      {#if openLog === report.file}
        <div class="panel-body"><LogView url="/api/dreams/{encodeURIComponent(report.file)}/log" /></div>
      {/if}

      <ul class="list">
        {#each report.findings as finding}
          <li class="finding">
            <div class="spread" style="align-items:flex-start">
              <h3 class="grow">{finding.title}</h3>
              <button class="small" onclick={() => importFinding(report.file, finding.index)} disabled={busy === `${report.file}:${finding.index}`}>
                Review as a proposal
              </button>
            </div>
            {#if finding.hypothesis}<p class="prose muted" style="margin-top:6px">{finding.hypothesis}</p>{/if}
            {#if finding.intervention}<p class="prose" style="margin-top:8px"><span class="faint">Suggested change:</span> {finding.intervention}</p>{/if}
            {#if finding.evidence.length}
              <ul class="small" style="margin-top:8px">
                {#each finding.evidence as item}<li><span class="mono faint">{item.source}</span> {item.observation}</li>{/each}
              </ul>
            {/if}
            {#if finding.reasons_to_reject.length}
              <p class="small" style="margin-top:8px;color:var(--warn)">Reasons to reject: {finding.reasons_to_reject.join(" ")}</p>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</div>

<style>
  .finding { padding: 14px 16px; }
</style>
