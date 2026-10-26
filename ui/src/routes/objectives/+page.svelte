<script>
  import Pill from "$lib/components/Pill.svelte";
  import Notice from "$lib/components/Notice.svelte";
  import Trend from "$lib/components/Trend.svelte";
  import { api } from "$lib/client/api.js";
  import { ago, plural, score } from "$lib/client/format.js";

  let objectives = $state([]);
  let skills = $state([]);
  let cover = $state(null);
  let loading = $state(true);

  $effect(() => {
    Promise.all([
      api("/api/objectives").catch(() => ({})),
      api("/api/skills").catch(() => ({})),
      api("/api/coverage").catch(() => null)
    ]).then(([o, s, c]) => {
      objectives = o.objectives ?? [];
      skills = s.skills ?? [];
      cover = c;
      loading = false;
    });
  });

  function trendWords(trend) {
    if (trend === null) return null;
    if (trend === 0) return { text: "no change", tone: "" };
    return trend > 0 ? { text: `up ${trend.toFixed(2)}`, tone: "ok" } : { text: `down ${Math.abs(trend).toFixed(2)}`, tone: "bad" };
  }
</script>

<svelte:head><title>Objectives · improve</title></svelte:head>

<div class="page-head">
  <div>
    <h1>Objectives</h1>
    <p>What this harness is supposed to be good at, and how its last readings went. A score shows a trend; it cannot prove a harness change caused it.</p>
  </div>
</div>

<div class="stack" style="gap:16px">
  {#if cover?.uncovered?.length}
    <Notice tone="warn">
      {plural(cover.uncovered.length, "objective has", "objectives have")} no suite, so nothing measures
      {cover.uncovered.length === 1 ? "it" : "them"}: {cover.uncovered.join(", ")}.
    </Notice>
  {/if}

  <section class="panel">
    {#if loading}
      <p class="empty small">Loading…</p>
    {:else if objectives.length === 0}
      <div class="empty">
        <strong>No objectives declared.</strong>
        Add them to <code>.harness/objectives.yaml</code>, or name one in a suite under <code>.harness/evals/suites/</code>.
      </div>
    {:else}
      <ul class="list">
        {#each objectives as objective (objective.id)}
          {@const t = trendWords(objective.trend)}
          <li id={objective.id} class="objective">
            <div class="grow stack" style="gap:6px">
              <div class="row">
                <h2 class="mono" style="font-size:14px">{objective.id}</h2>
                {#if objective.regime}
                  <Pill plain title={objective.regime === "observed" ? "Graded from what happened; one reading per run" : "A fixed task that can be re-run"}>{objective.regime}</Pill>
                {/if}
                {#if !objective.registered}<Pill tone="warn" title="Declared inside a suite, not in .harness/objectives.yaml">Not registered</Pill>{/if}
                {#if !objective.covered}<Pill tone="bad">No suite</Pill>{:else if !objective.encountered}<Pill>Not measured yet</Pill>{/if}
              </div>
              {#if objective.description}<p class="muted prose">{objective.description}</p>{/if}
              <p class="small faint">
                {plural(objective.history.length, "reading")} · {plural(objective.suites.length, "suite")}{objective.suites.length ? `: ${objective.suites.join(", ")}` : ""}
                {#if objective.owner} · owner {objective.owner}{/if}
                {#if objective.latest} · last {ago(objective.latest.occurred_at)}{/if}
              </p>
              {#if objective.success_criteria?.length}
                <details>
                  <summary class="small muted">Success criteria</summary>
                  <ul class="small" style="margin-top:6px">{#each objective.success_criteria as criterion}<li>{criterion}</li>{/each}</ul>
                </details>
              {/if}
            </div>
            <div class="reading">
              <Trend history={objective.history} width={140} height={36} />
              <div style="text-align:right">
                <div class="stat-value" style="font-size:22px;color:{objective.latest ? (objective.latest.success ? 'var(--ok)' : 'var(--bad)') : 'var(--text-3)'}">{score(objective.latest?.score)}</div>
                {#if t}<div class="small" style="color:{t.tone ? `var(--${t.tone})` : 'var(--text-3)'}">{t.text}</div>{/if}
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="panel">
    <div class="panel-head"><h2>Skills applied from this page</h2></div>
    {#if skills.length === 0}
      <p class="empty small">None yet. A skill applied from a proposal gets a <code>.improve.json</code> record beside it, and its use shows here.</p>
    {:else}
      <div class="table-wrap">
        <table>
          <thead><tr><th>Skill</th><th>Used</th><th>Read</th><th>Revisions</th><th>From</th><th>Last used</th></tr></thead>
          <tbody>
            {#each skills as skill}
              <tr>
                <td class="mono small">{skill.name}</td>
                <td class="num">{skill.use}</td>
                <td class="num">{skill.view}</td>
                <td class="small num">{skill.patch}{skill.archived_versions ? ` (${skill.archived_versions} archived)` : ""}</td>
                <td class="small faint">{skill.proposal ?? "unknown"}</td>
                <td class="small faint">{skill.use_last_at ? ago(skill.use_last_at) : "never"}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="small faint panel-body" style="border-top:1px solid var(--border)">
        Used counts invocations; read counts reads of the file. Being read is not being followed, and neither shows the skill helped.
      </p>
    {/if}
  </section>
</div>

<style>
  .objective { display: flex; gap: 24px; padding: 16px; align-items: flex-start; }
  .reading { display: flex; align-items: center; gap: 16px; flex: none; }
  @media (max-width: 700px) { .objective { flex-direction: column; } }
</style>
