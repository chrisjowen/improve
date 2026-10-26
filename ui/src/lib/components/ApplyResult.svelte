<script>
  import Pill from "./Pill.svelte";
  import Icon from "./Icon.svelte";
  import Diff from "./Diff.svelte";
  import Notice from "./Notice.svelte";
  import LogView from "./LogView.svelte";
  import { api } from "$lib/client/api.js";
  import { ago } from "$lib/client/format.js";

  /**
   * What an apply run did: the evaluation, the diff of every confirmed file,
   * anything it changed outside them, and its log. A failed run's diff is what
   * it tried; the files themselves were put back.
   */
  /** @type {{ job: any }} */
  let { job } = $props();
  let changes = $state(/** @type {any} */ (null));

  const running = $derived(job.status === "running");
  const result = $derived(job.result ?? {});
  const upstream = $derived(job.detail?.mode === "upstream-pr");
  const outcome = $derived(running ? { label: "Running", tone: "accent live" }
    : job.status === "completed" ? (upstream ? { label: "Branch prepared", tone: "ok" } : { label: "Applied", tone: "ok" })
    : job.status === "cancelled" ? { label: "Cancelled", tone: "" }
    : { label: "Not applied", tone: "bad" });
  const changed = $derived((changes?.files ?? []).filter((/** @type {any} */ f) => f.change !== "unchanged"));

  $effect(() => {
    const key = `${job.id}|${job.status}`;
    changes = null;
    if (running) return;
    api(`/api/jobs/${encodeURIComponent(key.split("|")[0])}/changes`).then((v) => { changes = v; }).catch(() => { changes = { files: [] }; });
  });
</script>

<div class="stack" style="gap:14px">
  <div class="row">
    <Pill tone={outcome.tone}>{outcome.label}</Pill>
    <span class="small faint">{running ? "started" : "finished"} {ago(running ? job.started_at : job.finished_at)}</span>
    <a class="small" href="/runs?job={job.id}">Open in Runs</a>
  </div>

  {#if !running && job.error}
    <Notice tone={job.status === "cancelled" ? "" : "bad"}>
      <p>{job.error}</p>
      {#if job.hint}<p class="small" style="margin-top:4px">{job.hint}</p>{/if}
    </Notice>
  {/if}

  {#if result.evaluation}
    <div>
      <div class="section-label">Evaluation</div>
      <div class="row" style="margin-bottom:6px">
        <Pill tone={result.evaluation.passed ? "ok" : "bad"}>{result.evaluation.passed ? "Passed" : "Failed"}</Pill>
        {#if result.evaluation.summary}<span>{result.evaluation.summary}</span>{/if}
      </div>
      {#if result.evaluation.checks?.length}
        <ul class="checks small">
          {#each result.evaluation.checks as check}
            <li>
              <span style="color:var({check.passed ? '--ok' : '--bad'})"><Icon name={check.passed ? "check" : "x"} size={13} label={check.passed ? "passed" : "failed"} /></span>
              <span><strong>{check.name}</strong>{#if check.detail}<span class="muted">: {check.detail}</span>{/if}</span>
            </li>
          {/each}
        </ul>
      {/if}
      <p class="small faint" style="margin-top:6px">Reported by the apply run.</p>
    </div>
  {/if}

  {#if job.status === "completed" && upstream && result.branch}
    <Notice tone="ok">
      <p>Committed on branch <code>{result.branch}</code>{#if result.commit} as <code>{result.commit.slice(0, 10)}</code>{/if}. This checkout is unchanged.</p>
      {#if result.next}<p class="small" style="margin-top:4px">{result.next}</p>{/if}
    </Notice>
  {/if}

  {#if result.unchecked}
    <Notice tone="warn"><p>{result.unchecked}</p></Notice>
  {/if}

  {#if result.stray?.length}
    <Notice tone="warn">
      <p><strong>Changed outside the confirmed files, and left for you to inspect:</strong></p>
      <ul class="small mono" style="margin-top:4px">{#each result.stray as file}<li>{file}</li>{/each}</ul>
    </Notice>
  {/if}

  {#if !running}
    <div>
      <div class="section-label">
        {job.status === "completed" ? (upstream ? "Changes on the branch" : "Changes") : "What the run tried"}
        {#if changes?.restored}<span class="faint" style="font-weight:400;text-transform:none;letter-spacing:0"> · put back as they were</span>{/if}
      </div>
      {#if !changes}
        <p class="small faint">Loading the diff…</p>
      {:else if changed.length === 0}
        <p class="small muted">No confirmed file was changed.</p>
      {:else}
        <div class="stack" style="gap:10px">
          {#each changed as file (file.path)}
            <Diff current={file.before ?? ""} proposed={file.after ?? ""} path={file.path} />
            {#if file.truncated}<p class="small faint">This file is long; the diff shows its start.</p>{/if}
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <details open={running}>
    <summary class="small muted">Log</summary>
    <div style="margin-top:8px"><LogView url="/api/jobs/{job.id}/log" live={running} /></div>
  </details>
</div>

<style>
  .checks { list-style: none; padding: 0; margin: 0; display: grid; gap: 4px; }
  .checks li { display: flex; gap: 8px; align-items: baseline; }
</style>
