<script>
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import Pill from "$lib/components/Pill.svelte";
  import Icon from "$lib/components/Icon.svelte";
  import JobCard from "$lib/components/JobCard.svelte";
  import LogView from "$lib/components/LogView.svelte";
  import { jobs } from "$lib/client/jobs.svelte.js";
  import { JOB, ago, duration, plural, when } from "$lib/client/format.js";

  /** @type {Record<string, string>} */
  const KIND = { evaluate: "Evaluation", "draft-skill": "Skill draft", dream: "Background review" };
  const selectedId = $derived(page.url.searchParams.get("job"));
  const selected = $derived(jobs.list.find((job) => job.id === selectedId) ?? null);

  /** @param {string} id */
  function open(id) {
    goto(`/runs?job=${id}`, { noScroll: true, keepFocus: true });
  }
</script>

<svelte:head><title>Runs · improve</title></svelte:head>

<div class="page-head">
  <div>
    <h1>Runs</h1>
    <p>Evaluations, skill drafts and background reviews started from this page. Each keeps a log, and a running one can be cancelled.</p>
  </div>
</div>

{#if selected}
  <section class="panel" style="margin-bottom:16px">
    <div class="panel-head">
      <h2><button class="ghost small" onclick={() => goto("/runs")} aria-label="Back to all runs"><Icon name="arrowLeft" size={14} /></button>{KIND[selected.kind] ?? selected.kind}</h2>
    </div>
    <JobCard job={selected} />
    <div class="panel-body stack" style="border-top:1px solid var(--border)">
      <dl class="kv small">
        <dt>Started</dt><dd>{when(selected.started_at)}</dd>
        {#if selected.finished_at}<dt>Finished</dt><dd>{when(selected.finished_at)} (took {duration(selected.started_at, selected.finished_at)})</dd>{/if}
        {#if selected.detail?.suite}<dt>Suite</dt><dd class="mono">{selected.detail.suite}</dd>{/if}
        {#if selected.detail?.base || selected.detail?.head}<dt>Revisions</dt><dd class="mono">{selected.detail.base ?? "working tree"}..{selected.detail.head ?? "HEAD"}</dd>{/if}
        {#if selected.detail?.transcript}<dt>Transcript</dt><dd class="mono">{selected.detail.transcript}</dd>{/if}
        {#if selected.detail?.proposal}<dt>Proposal</dt><dd><a href="/proposals?view=all&p={encodeURIComponent(selected.detail.proposal)}">{selected.detail.proposal}</a></dd>{/if}
        {#if selected.result?.run}<dt>Result</dt><dd><a href="/evals?run={selected.result.run.run_id}">Score {selected.result.run.score?.toFixed(2)}, {selected.result.run.success ? "passed" : "did not pass"}</a></dd>{/if}
        {#if selected.result?.file}<dt>Report</dt><dd><a href="/findings">{plural(selected.result.findings, "finding")}</a></dd>{/if}
      </dl>
      <div>
        <div class="section-label">Log</div>
        <LogView url="/api/jobs/{selected.id}/log" live={selected.status === "running"} />
      </div>
    </div>
  </section>
{:else if selectedId && jobs.loaded}
  <div style="margin-bottom:16px"><p class="muted">That run is no longer recorded. Older runs are pruned after a hundred.</p></div>
{/if}

<section class="panel">
  {#if !jobs.loaded}
    <p class="empty small">Loading…</p>
  {:else if jobs.list.length === 0}
    <div class="empty">
      <strong>No runs yet.</strong>
      Run an evaluation, draft a skill from a proposal, or run a background review, and it shows up here with its progress and log.
    </div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead><tr><th>Status</th><th>What</th><th>Started</th><th>Took</th><th>Now</th></tr></thead>
        <tbody>
          {#each jobs.list as job (job.id)}
            {@const meta = JOB[job.status] ?? { label: job.status, tone: "" }}
            <tr class="clickable" onclick={() => open(job.id)} aria-selected={job.id === selectedId}>
              <td><Pill tone={meta.tone}>{meta.label}</Pill></td>
              <td>
                <a href="/runs?job={job.id}" onclick={(event) => event.stopPropagation()}>{job.title}</a>
                <div class="small faint">{KIND[job.kind] ?? job.kind}</div>
              </td>
              <td class="small faint" title={job.started_at}>{ago(job.started_at)}</td>
              <td class="small num">{duration(job.started_at, job.finished_at)}</td>
              <td class="small muted">{job.status === "running" ? job.progress?.message : job.error ?? ""}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
