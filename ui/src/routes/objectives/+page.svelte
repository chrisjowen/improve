<script>
  import Trend from "$lib/components/Trend.svelte";

  let objectives = $state([]);
  let loading = $state(true);

  $effect(() => {
    fetch("/api/objectives")
      .then((r) => r.json())
      .then((body) => { objectives = body.objectives ?? []; })
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
          {#if !objective.encountered}
            <span class="badge">not yet encountered</span>
          {/if}
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
