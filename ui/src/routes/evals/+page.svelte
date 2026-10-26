<script>
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import Pill from "$lib/components/Pill.svelte";
  import Icon from "$lib/components/Icon.svelte";
  import Notice from "$lib/components/Notice.svelte";
  import JobCard from "$lib/components/JobCard.svelte";
  import ScoreChart from "$lib/components/ScoreChart.svelte";
  import StepBars from "$lib/components/StepBars.svelte";
  import { api } from "$lib/client/api.js";
  import { jobs, refreshJobs, settled } from "$lib/client/jobs.svelte.js";
  import { ago, score, when } from "$lib/client/format.js";

  let suites = $state(/** @type {any[]} */ ([]));
  let runs = $state(/** @type {any[]} */ ([]));
  let transcripts = $state(/** @type {any[]} */ ([]));
  let report = $state(/** @type {any} */ (null));
  let reportError = $state(/** @type {string | null} */ (null));
  let notice = $state(/** @type {{ tone: "ok" | "warn" | "bad" | "", text: string, hint?: string } | null} */ (null));

  let suite = $state("");
  let pick = $state("");
  let customPath = $state("");
  let base = $state("");
  let head = $state("");
  let includeContent = $state(false);

  async function load() {
    const [s, r, t] = await Promise.all([
      api("/api/suites").catch(() => ({ suites: [] })),
      api("/api/runs").catch(() => ({ runs: [] })),
      api("/api/transcripts").catch(() => ({ transcripts: [] }))
    ]);
    suites = s.suites ?? [];
    runs = r.runs ?? [];
    transcripts = t.transcripts ?? [];
    if (!suite && suites.length) suite = suites.find((x) => !x.malformed)?.file ?? "";
  }
  $effect(() => { load(); });

  const runId = $derived(page.url.searchParams.get("run"));
  $effect(() => {
    const id = runId;
    report = null;
    reportError = null;
    if (!id) return;
    api(`/api/runs/${id}`).then((v) => { report = v.report; }).catch((error) => { reportError = error.message; });
  });

  const running = $derived(jobs.list.find((job) => job.kind === "evaluate" && job.status === "running"));
  const lastEval = $derived(jobs.list.find((job) => job.kind === "evaluate"));
  const transcript = $derived(pick === "custom" ? customPath.trim() : pick);
  const recent = $derived(runs.filter((r) => !r.malformed).slice().reverse());
  const selectedSuite = $derived(suites.find((s) => s.file === suite));

  async function run() {
    notice = null;
    try {
      const { job } = await api("/api/runs", {
        method: "POST",
        body: { suite, transcript: transcript || undefined, base: base.trim() || undefined, head: head.trim() || undefined, include_content: includeContent }
      });
      await refreshJobs();
      const done = await settled(job.id);
      await load();
      if (done.status === "completed" && done.result?.run) goto(`/evals?run=${done.result.run.run_id}`, { noScroll: true });
    } catch (cause) {
      const error = /** @type {any} */ (cause);
      notice = { tone: "bad", text: error.message, hint: error.hint };
    }
  }

  const unreadable = $derived((report?.steps ?? []).some((/** @type {any} */ step) => (step.result?.notes ?? []).some((/** @type {string} */ note) => /not captured/.test(note))));
</script>

<svelte:head><title>Evaluations · improve</title></svelte:head>

<div class="page-head">
  <div>
    <h1>Evaluations</h1>
    <p>Score a session or a range of commits against a suite. Nothing runs on a schedule: an observed session cannot be replayed, so a score is only taken when you ask.</p>
  </div>
</div>

<div class="grid cols-main">
  <div class="stack" style="gap:16px">
    {#if running}
      <div class="panel"><JobCard job={running} /></div>
    {:else if lastEval && lastEval.status !== "completed" && lastEval.error && !runId}
      <div class="panel"><JobCard job={lastEval} /></div>
    {/if}

    {#if runId}
      <section class="panel">
        <div class="panel-head">
          <h2>
            {report?.suite?.id ?? "Report"}
            {#if report}<Pill tone={report.success ? "ok" : "bad"}>{report.success ? "Passed" : "Did not pass"}</Pill>{/if}
          </h2>
          <button class="ghost small" onclick={() => goto("/evals", { noScroll: true })} aria-label="Close the report"><Icon name="x" size={14} /></button>
        </div>
        {#if reportError}
          <div class="panel-body"><Notice tone="bad">{reportError}</Notice></div>
        {:else if !report}
          <p class="empty small">Loading…</p>
        {:else}
          <div class="panel-body stack" style="gap:16px">
            <div class="grid cols-3">
              <div><div class="section-label">Score</div><div class="stat-value" style="color:{report.success ? 'var(--ok)' : 'var(--bad)'}">{score(report.score)}</div></div>
              <div><div class="section-label">Needed</div><div class="stat-value">{score(report.threshold)}</div></div>
              <div><div class="section-label">Objective</div><p style="margin-top:4px">{report.objective?.id ?? "–"}</p></div>
            </div>
            {#if report.objective?.description}<p class="muted prose">{report.objective.description}</p>{/if}
            {#if unreadable}
              <Notice tone="warn">
                This run did not include message and tool content, so commands the agent ran could not be checked.
                Run it again with content included to grade verification.
              </Notice>
            {/if}
            <StepBars steps={report.steps ?? []} />
            <div class="table-wrap" style="border:1px solid var(--border);border-radius:var(--radius-sm)">
              <table>
                <thead><tr><th>Step</th><th>Result</th><th>Score</th><th>What it found</th></tr></thead>
                <tbody>
                  {#each report.steps ?? [] as step}
                    <tr>
                      <td class="mono small">{step.id}</td>
                      <td>
                        {#if step.status !== "completed"}<Pill tone="bad">{step.status}</Pill>
                        {:else if step.passed}<Pill tone="ok">Passed</Pill>
                        {:else}<Pill tone="bad">Failed</Pill>{/if}
                      </td>
                      <td class="num">{score(step.result?.score)}</td>
                      <td class="small">
                        {#each step.result?.notes ?? [] as note}<p>{note}</p>{/each}
                        {#each step.result?.evidence ?? [] as item}<p class="faint">{item.message}</p>{/each}
                        {#if step.error}<p style="color:var(--bad)">{step.error}</p>{/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      </section>
    {/if}

    <section class="panel">
      <div class="panel-head"><h2>Score over runs</h2></div>
      <div class="panel-body"><ScoreChart {runs} /></div>
    </section>

    <section class="panel">
      <div class="panel-head"><h2>History</h2><span class="small faint">{recent.length} runs</span></div>
      {#if recent.length === 0}
        <p class="empty small">No runs recorded yet.</p>
      {:else}
        <div class="table-wrap">
          <table>
            <thead><tr><th>When</th><th>Suite</th><th>Objective</th><th>Covered</th><th>Score</th></tr></thead>
            <tbody>
              {#each recent as r (r.run_id)}
                <tr class="clickable" onclick={() => goto(`/evals?run=${r.run_id}`, { noScroll: true })} aria-selected={r.run_id === runId}>
                  <td class="small" title={when(r.occurred_at)}><a href="/evals?run={r.run_id}" onclick={(e) => e.stopPropagation()}>{ago(r.occurred_at)}</a></td>
                  <td class="mono small">{r.suite_id}</td>
                  <td class="small">{r.objective_id ?? "–"}</td>
                  <td class="small faint">
                    {r.context?.transcript ? "session" : ""}{r.context?.transcript && (r.context?.base || r.context?.head) ? " + " : ""}{r.context?.base || r.context?.head ? `${r.context.base ?? ""}..${r.context.head ?? "HEAD"}` : ""}{!r.context?.transcript && !r.context?.base && !r.context?.head ? "working tree" : ""}
                  </td>
                  <td><Pill tone={r.success ? "ok" : "bad"}><span class="num">{score(r.score)}</span></Pill></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  </div>

  <section class="panel run-form" aria-labelledby="run-a-suite">
    <div class="panel-head"><h2 id="run-a-suite">Run a suite</h2></div>
    {#if suites.length === 0}
      <div class="empty small">
        <strong>No suites yet.</strong>
        Copy the plugin's <code>assets/eval-rig</code> into <code>.harness/evals</code> and add a suite under <code>.harness/evals/suites/</code>.
      </div>
    {:else}
      <form class="panel-body stack" style="gap:16px" onsubmit={(event) => { event.preventDefault(); run(); }}>
        <div>
          <label for="suite">Suite</label>
          <select id="suite" bind:value={suite}>
            {#each suites as item}
              <option value={item.file} disabled={Boolean(item.malformed)}>{item.id}{item.objective_id ? ` (${item.objective_id})` : ""}{item.malformed ? " – unreadable" : ""}</option>
            {/each}
          </select>
          {#if selectedSuite}<p class="help">{selectedSuite.steps} {selectedSuite.steps === 1 ? "step" : "steps"}{selectedSuite.threshold != null ? `, passes at ${selectedSuite.threshold}` : ""}.</p>{/if}
        </div>

        <div>
          <label for="transcript">Session</label>
          <select id="transcript" bind:value={pick}>
            <option value="">No session: grade the changes only</option>
            {#each transcripts as item}
              <option value={item.file}>{ago(item.modified)}: {item.preview ?? item.name}</option>
            {/each}
            <option value="custom">Another file…</option>
          </select>
          {#if pick === "custom"}
            <input style="margin-top:8px" bind:value={customPath} placeholder="~/.claude/projects/…/session.jsonl" aria-label="Transcript path" />
          {/if}
          <p class="help">{transcripts.length ? "Recent Claude Code sessions in this repository." : "No sessions found for this repository on this machine."}</p>
        </div>

        <fieldset class="revisions">
          <legend class="label">Changes</legend>
          <div class="grid cols-2" style="gap:10px">
            <div><label for="base" class="faint">From</label><input id="base" bind:value={base} placeholder="HEAD~1" /></div>
            <div><label for="head" class="faint">To</label><input id="head" bind:value={head} placeholder="HEAD" /></div>
          </div>
          <p class="help">Leave both empty to use uncommitted changes.</p>
        </fieldset>

        <label class="check">
          <input type="checkbox" bind:checked={includeContent} />
          <span>Include message and tool content<br><span class="help" style="margin:0">Needed to check which commands ran. The content is redacted and passed to the evaluators.</span></span>
        </label>

        {#if notice}<Notice tone={notice.tone}><p>{notice.text}</p>{#if notice.hint}<p class="small">{notice.hint}</p>{/if}</Notice>{/if}

        <button class="primary" type="submit" disabled={Boolean(running) || !suite}>
          <Icon name="play" size={14} />{running ? "An evaluation is running" : "Run evaluation"}
        </button>
      </form>
    {/if}
  </section>
</div>

<style>
  .run-form { position: sticky; top: 16px; align-self: start; }
  .revisions { border: 0; padding: 0; margin: 0; }
  @media (max-width: 1100px) { .run-form { position: static; order: -1; } }
</style>
