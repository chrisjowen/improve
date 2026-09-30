<script>
  import Badge from "$lib/components/Badge.svelte";
  import ScoreChart from "$lib/components/ScoreChart.svelte";
  import StepBars from "$lib/components/StepBars.svelte";

  let suites = $state([]);
  let runs = $state([]);
  let report = $state(null);
  let running = $state(false);
  let notice = $state(null);

  let suite = $state("");
  let transcript = $state("");
  let base = $state("");
  let head = $state("");
  let includeContent = $state(false);

  async function load() {
    const [s, r] = await Promise.all([
      fetch("/api/suites").then((x) => x.json()),
      fetch("/api/runs").then((x) => x.json())
    ]);
    suites = s.suites ?? [];
    runs = r.runs ?? [];
    if (!suite && suites.length) suite = suites[0].file;
  }

  $effect(() => { load(); });

  async function waitFor(jobId) {
    for (;;) {
      await new Promise((r) => setTimeout(r, 1000));
      const { job } = await (await fetch(`/api/jobs/${jobId}`)).json();
      if (!job || job.status !== "running") return job;
    }
  }

  async function run() {
    running = true;
    notice = null;
    report = null;
    try {
      const started = await (await fetch("/api/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          suite,
          transcript: transcript || undefined,
          base: base || undefined,
          head: head || undefined,
          include_content: includeContent
        })
      })).json();
      if (!started.ok) { notice = { bad: true, text: started.error }; return; }

      const job = await waitFor(started.job.id);
      if (job?.status !== "completed") {
        notice = { bad: true, text: job?.error ?? "evaluation failed" };
        return;
      }
      report = job.result?.report ?? null;
      // A failing suite is a result, not an error.
      notice = {
        text: report
          ? `Scored ${report.score?.toFixed(3)} — ${report.success ? "passed" : "did not pass"}`
          : "Run finished"
      };
      await load();
    } catch (cause) {
      notice = { bad: true, text: cause.message };
    } finally {
      running = false;
    }
  }

  async function show(runId) {
    report = null;
    const body = await (await fetch(`/api/runs/${runId}`)).json();
    report = body.report ?? null;
    if (body.error) notice = { bad: true, text: body.error };
  }

  const recent = $derived(runs.filter((r) => !r.malformed).slice().reverse());
</script>

<div style="margin-bottom:16px">
  <h1>Evaluations</h1>
  <p class="muted small" style="margin:4px 0 0">
    Evaluations run only when you ask. An observed suite cannot be replayed, so nothing runs in the background.
  </p>
</div>

{#if notice}
  <div class="alert {notice.bad ? 'alert-danger' : ''}" style="margin-bottom:14px">{notice.text}</div>
{/if}

<div class="grid grid-2">
  <div class="card">
    <h2 style="margin-bottom:12px">Run a suite</h2>
    {#if suites.length === 0}
      <p class="small muted">
        No suites in <code>.harness/evals/suites/</code>. Copy the plugin's
        <code>assets/eval-rig</code> into <code>.harness/evals</code> first.
      </p>
    {:else}
      <div class="stack" style="gap:12px">
        <div>
          <label for="suite">Suite</label>
          <select id="suite" bind:value={suite}>
            {#each suites as item}
              <option value={item.file}>{item.id} — {item.steps} steps</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="transcript">Session transcript (optional)</label>
          <input id="transcript" bind:value={transcript}
                 placeholder="~/.claude/projects/<project>/<session>.jsonl" />
        </div>
        <div class="row" style="gap:10px">
          <div style="flex:1">
            <label for="base">Base revision</label>
            <input id="base" bind:value={base} placeholder="HEAD~1" />
          </div>
          <div style="flex:1">
            <label for="head">Head revision</label>
            <input id="head" bind:value={head} placeholder="HEAD" />
          </div>
        </div>
        <label class="row small" style="gap:8px;margin:0">
          <input type="checkbox" bind:checked={includeContent} style="width:auto;height:auto" />
          Include message and tool content (off by default; content becomes evaluation evidence)
        </label>
        <button class="primary" onclick={run} disabled={running || !suite}>
          {running ? "Running…" : "Run evaluation"}
        </button>
      </div>
    {/if}
  </div>

  <div class="card">
    <h2 style="margin-bottom:12px">Score over runs</h2>
    <ScoreChart runs={runs} />
  </div>
</div>

{#if report}
  <div class="card">
    <div class="card-header">
      <h2>{report.suite?.id ?? "report"}</h2>
      <Badge status={report.success ? "validated" : "rejected"}>
        {report.success ? "passed" : "failed"}
      </Badge>
    </div>
    <div class="grid grid-3" style="margin-bottom:14px">
      <div><p class="small muted" style="margin:0">Score</p><p class="stat">{report.score?.toFixed(3)}</p></div>
      <div><p class="small muted" style="margin:0">Threshold</p><p class="stat">{report.threshold}</p></div>
      <div><p class="small muted" style="margin:0">Rig</p><p class="stat">{report.rig_version ?? "—"}</p></div>
    </div>
    <p class="small muted" style="margin:0 0 4px">Objective: <strong>{report.objective?.id}</strong> — {report.objective?.description}</p>
    <StepBars steps={report.steps ?? []} />
    <details style="margin-top:12px">
      <summary class="small muted">Step detail</summary>
      <table style="margin-top:8px">
        <thead><tr><th>Step</th><th>Status</th><th>Score</th><th>Notes</th></tr></thead>
        <tbody>
          {#each report.steps ?? [] as step}
            <tr>
              <td><code>{step.id}</code></td>
              <td>{step.status}{step.passed === false && step.status === "completed" ? " · failed" : ""}</td>
              <td>{step.result?.score ?? "—"}</td>
              <td class="small">{(step.result?.notes ?? [step.error]).filter(Boolean).join(" ")}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </details>
  </div>
{/if}

<div class="card">
  <h2 style="margin-bottom:12px">Run history</h2>
  {#if recent.length === 0}
    <p class="empty">No runs recorded yet.</p>
  {:else}
    <table>
      <thead><tr><th>When</th><th>Objective</th><th>Suite</th><th>Score</th><th>Rig</th><th></th></tr></thead>
      <tbody>
        {#each recent as r}
          <tr>
            <td class="small">{r.occurred_at?.replace("T", " ").slice(0, 19)}</td>
            <td class="small">{r.objective_id ?? "—"}</td>
            <td class="small"><code>{r.suite_id}</code></td>
            <td><span class="badge {r.success ? 'badge-success' : 'badge-danger'}">{r.score?.toFixed(3)}</span></td>
            <td class="small">{r.rig_version ?? "—"}</td>
            <td><button onclick={() => show(r.run_id)}>View</button></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
