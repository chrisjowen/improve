<script>
  import Trend from "$lib/components/Trend.svelte";

  let objectives = $state([]);
  let skills = $state([]);
  let cover = $state(null);
  let loading = $state(true);

  $effect(() => {
    Promise.all([
      fetch("/api/objectives").then((r) => r.json()),
      fetch("/api/skills").then((r) => r.json()),
      fetch("/api/coverage").then((r) => r.json())
    ])
      .then(([o, s, c]) => {
        objectives = o.objectives ?? [];
        skills = s.skills ?? [];
        cover = c;
      })
      .finally(() => { loading = false; });
  });

  function arrow(trend) {
    if (trend === null || trend === 0) return { mark: "→", tone: "muted" };
    return trend > 0
      ? { mark: "↑", tone: "success" }
      : { mark: "↓", tone: "destructive" };
  }
</script>

<div style="margin-bottom:16px">
  <h1>Objectives</h1>
  <p class="muted small" style="margin:4px 0 0">
    How good this harness is at each thing it is supposed to be good at. Objectives are
    read from the suites that measure them.
  </p>
</div>

{#if cover?.uncovered?.length}
  <div class="alert" style="margin-bottom:14px">
    <strong>{cover.uncovered.length} objective{cover.uncovered.length === 1 ? "" : "s"} with no suite.</strong>
    An objective nobody measures cannot be improved deliberately:
    {#each cover.uncovered as id, i}<code>{id}</code>{i < cover.uncovered.length - 1 ? ", " : ""}{/each}
  </div>
{/if}

{#if loading}
  <p class="muted">Loading…</p>
{:else if objectives.length === 0}
  <div class="card empty">
    <p style="margin:0 0 6px"><strong>No objectives declared.</strong></p>
    <p class="small muted" style="margin:0">
      Every suite in <code>.harness/evals/suites/</code> names the objective it measures.
      Add a suite and its objective appears here.
    </p>
  </div>
{:else}
  <div class="grid grid-2">
    {#each objectives as objective}
      {@const t = arrow(objective.trend)}
      <div class="card">
        <div class="card-header">
          <h2>{objective.id}</h2>
          <span class="row" style="gap:5px">
            {#if objective.regime}
              <span class="badge" title={objective.regime === "observed"
                ? "Graded from what happened; no counterfactual, one reading per run"
                : "A fixed task that can be re-run against a changed harness"}>{objective.regime}</span>
            {/if}
            {#if !objective.registered}
              <span class="badge badge-warning" title="Declared inside a suite rather than in .harness/objectives.yaml">unregistered</span>
            {/if}
            {#if !objective.covered}
              <span class="badge badge-danger">no suite</span>
            {:else if !objective.encountered}
              <span class="badge">not yet encountered</span>
            {/if}
          </span>
        </div>
        {#if objective.description}
          <p class="small" style="margin:0 0 12px">{objective.description}</p>
        {/if}

        <div class="spread" style="margin-bottom:10px">
          <div>
            <p class="small muted" style="margin:0">Latest</p>
            <p class="stat" style="color:hsl(var(--{objective.latest ? (objective.latest.success ? 'success' : 'destructive') : 'muted-foreground'}))">
              {objective.latest ? objective.latest.score.toFixed(2) : "—"}
              {#if objective.trend !== null}
                <span class="small" style="color:hsl(var(--{t.tone}))">{t.mark} {Math.abs(objective.trend).toFixed(2)}</span>
              {/if}
            </p>
          </div>
          <Trend history={objective.history} />
        </div>

        <p class="small muted" style="margin:0 0 4px">
          {objective.history.length} reading{objective.history.length === 1 ? "" : "s"} ·
          {objective.suites.length} suite{objective.suites.length === 1 ? "" : "s"}
        </p>

        {#if objective.success_criteria?.length}
          <details>
            <summary class="small muted">Success criteria</summary>
            <ul class="small" style="margin:8px 0 0">
              {#each objective.success_criteria as criterion}<li>{criterion}</li>{/each}
            </ul>
          </details>
        {/if}
      </div>
    {/each}
  </div>

  <div class="alert" style="margin-top:16px">
    An observed objective has no counterfactual: a score can show a trend, but it cannot
    prove a harness change caused it.
  </div>
{/if}

{#if skills.length}
  <div class="card" style="margin-top:16px">
    <h2 style="margin-bottom:6px">Applied skills</h2>
    <p class="small muted" style="margin:0 0 12px">
      Used counts invocations. Viewed counts sessions that read the skill without
      necessarily following it — being read is not being followed, so the two are
      never merged. Neither shows whether the skill helped.
    </p>
    <table>
      <thead>
        <tr><th>Skill</th><th>Used</th><th>Viewed</th><th>Revisions</th><th>From</th><th>Last used</th></tr>
      </thead>
      <tbody>
        {#each skills as skill}
          <tr>
            <td><code>{skill.name}</code></td>
            <td>
              <span class="badge {skill.use > 0 ? 'badge-success' : ''}">{skill.use}</span>
            </td>
            <td><span class="badge">{skill.view}</span></td>
            <td class="small">{skill.patch}{skill.archived_versions ? ` (${skill.archived_versions} archived)` : ""}</td>
            <td class="small muted">{skill.proposal ?? "—"}</td>
            <td class="small muted">{skill.use_last_at?.slice(0, 10) ?? "never"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if skills.every((s) => s.use === 0)}
      <p class="small muted" style="margin:10px 0 0">
        Nothing has been invoked yet. A skill that is never used is a candidate for
        rewriting or retiring, but there is no data to justify a policy yet.
      </p>
    {/if}
  </div>
{/if}
