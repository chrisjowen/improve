<script>
  import Pill from "$lib/components/Pill.svelte";
  import Notice from "$lib/components/Notice.svelte";
  import Trend from "$lib/components/Trend.svelte";
  import Icon from "$lib/components/Icon.svelte";
  import ObjectiveEditor from "$lib/components/ObjectiveEditor.svelte";
  import SuiteEditor from "$lib/components/SuiteEditor.svelte";
  import { api } from "$lib/client/api.js";
  import { joinArgv } from "$lib/client/argv.js";
  import { summary, refreshSummary } from "$lib/client/summary.svelte.js";
  import { ago, plural, score, waiting as isWaiting } from "$lib/client/format.js";

  let objectives = $state(/** @type {any[]} */ ([]));
  let suites = $state(/** @type {any[]} */ ([]));
  let skills = $state([]);
  let cover = $state(null);
  let loading = $state(true);
  /**
   * What the side panel edits: an objective (null id for a new one) or an
   * eval (null file for a new one), with the objective it was opened from.
   * @typedef {{ kind: "objective", id: string | null } | { kind: "suite", file: string | null, objective: string, from: string | null }} Editing
   */
  let editing = $state(/** @type {Editing | null} */ (null));
  let done = $state(/** @type {{ text: string, proposal?: string } | null} */ (null));

  function load() {
    return Promise.all([
      api("/api/objectives").catch(() => ({})),
      api("/api/suites").catch(() => ({})),
      api("/api/skills").catch(() => ({})),
      api("/api/coverage").catch(() => null)
    ]).then(([o, su, s, c]) => {
      objectives = o.objectives ?? [];
      suites = su.suites ?? [];
      skills = s.skills ?? [];
      cover = c;
      loading = false;
    });
  }
  $effect(() => { load(); });

  /** An edit filed from this page that still waits for a decision. */
  function waiting(/** @type {string} */ kind, /** @type {string} */ id) {
    const kinds = kind === "objective" ? ["delete-objective"] : ["edit-eval", "add-eval", "delete-eval"];
    return summary.proposals.find((p) => p.harness_edit && kinds.includes(p.harness_edit.kind) && p.harness_edit.target === id && isWaiting(p)) ?? null;
  }
  const suitesOf = (/** @type {string} */ id) => suites.filter((s) => s.objective_id === id);
  const editedId = $derived(editing?.kind === "objective" ? editing.id : null);
  const editedObjective = $derived(editedId ? objectives.find((o) => o.id === editedId) ?? null : null);
  const current = $derived(editing ? (editing.kind === "objective" ? editing.id : editing.objective) : null);

  /** @param {string} text */
  async function saved(text) {
    editing = null;
    done = { text };
    await load();
  }

  /** @param {string} proposal @param {string} text */
  async function filed(proposal, text) {
    editing = null;
    done = { text, proposal };
    await Promise.all([load(), refreshSummary()]);
  }

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
    <p>What this harness is supposed to be good at, the evals that measure it, and how its last readings went. A score shows a trend; it cannot prove a harness change caused it.</p>
  </div>
  <button class="primary" onclick={() => { done = null; editing = { kind: "objective", id: null }; }}><Icon name="plus" size={14} />New objective</button>
</div>

<div class="stack" style="gap:16px">
  {#if done}
    <Notice tone="ok">
      <p>{done.text}{#if done.proposal}{" "}<a href="/proposals?p={encodeURIComponent(done.proposal)}">Open it</a>{/if}</p>
    </Notice>
  {/if}
  {#if cover?.uncovered?.length}
    <Notice tone="warn">
      {plural(cover.uncovered.length, "objective has", "objectives have")} no suite, so nothing measures
      {cover.uncovered.length === 1 ? "it" : "them"}: {cover.uncovered.join(", ")}.
    </Notice>
  {/if}

  <div class="grid" class:editing={editing !== null}>
  <section class="panel">
    {#if loading}
      <p class="empty small">Loading…</p>
    {:else if objectives.length === 0}
      <div class="empty">
        <strong>No objectives declared.</strong>
        An objective names something this harness should be good at. Add one with <strong>New objective</strong>, or in <code>.harness/objectives.yaml</code>.
      </div>
    {:else}
      <ul class="list">
        {#each objectives as objective (objective.id)}
          {@const t = trendWords(objective.trend)}
          {@const runs = suitesOf(objective.id).flatMap((suite) => suite.commands ?? [])}
          {@const filed = waiting("objective", objective.id) ?? objective.suites.map((id) => waiting("suite", id)).find(Boolean)}
          <li id={objective.id} class="objective" aria-current={current === objective.id ? "true" : undefined}>
            <div class="grow stack" style="gap:6px">
              <div class="row">
                <h2 class="mono" style="font-size:14px">{objective.id}</h2>
                {#if objective.regime}
                  <Pill plain title={objective.regime === "observed" ? "Graded from what happened; one reading per run" : "A fixed task that can be re-run"}>{objective.regime}</Pill>
                {/if}
                {#if !objective.registered}<Pill tone="warn" title="Declared inside a suite, not in .harness/objectives.yaml">Not registered</Pill>{/if}
                {#if !objective.covered}<Pill tone="bad">No suite</Pill>{:else if !objective.encountered}<Pill>Not measured yet</Pill>{/if}
                {#if filed}<a href="/proposals?p={encodeURIComponent(filed.file)}"><Pill tone="accent" title={filed.id}>Change waiting</Pill></a>{/if}
              </div>
              {#if objective.description}<p class="muted prose">{objective.description}</p>{/if}
              <p class="small faint">
                {plural(objective.history.length, "reading")} · {plural(objective.suites.length, "suite")}{objective.suites.length ? `: ${objective.suites.join(", ")}` : ""}
                {#if runs.length} · runs <span class="mono">{runs.map(joinArgv).join(", ")}</span>{/if}
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
            {#if !editing}
              <div class="reading">
                <Trend history={objective.history} width={140} height={36} />
                <div style="text-align:right">
                  <div class="stat-value" style="font-size:22px;color:{objective.latest ? (objective.latest.success ? 'var(--ok)' : 'var(--bad)') : 'var(--text-3)'}">{score(objective.latest?.score)}</div>
                  {#if t}<div class="small" style="color:{t.tone ? `var(--${t.tone})` : 'var(--text-3)'}">{t.text}</div>{/if}
                </div>
              </div>
            {/if}
            <button class="ghost small" onclick={() => { done = null; editing = { kind: "objective", id: objective.id }; }} aria-label="Edit {objective.id}">
              <Icon name="pencil" size={13} />{editing ? "" : "Edit"}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  {#if editing?.kind === "objective"}
    {#key editing.id}
      <ObjectiveEditor objective={editedObjective} suites={editing.id ? suitesOf(editing.id) : []} {waiting}
        onclose={() => { editing = null; }}
        onsaved={saved}
        onfiled={filed}
        oneditsuite={(file) => { editing = { kind: "suite", file, objective: /** @type {string} */ (current), from: current }; }}
        onnewsuite={() => { editing = { kind: "suite", file: null, objective: /** @type {string} */ (current), from: current }; }} />
    {/key}
  {:else if editing?.kind === "suite"}
    {#key `${editing.file}|${editing.objective}`}
      <SuiteEditor file={editing.file} objective={editing.objective} objectives={objectives.map((o) => o.id)} {waiting}
        onclose={() => { editing = null; }}
        onback={editing.from ? () => { editing = { kind: "objective", id: /** @type {any} */ (editing).from }; } : null}
        onfiled={filed} />
    {/key}
  {/if}
  </div>

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
  .objective[aria-current="true"] { background: var(--accent-soft); }
  .editing { grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); align-items: start; }
  @media (max-width: 1100px) { .editing { grid-template-columns: 1fr; } }
  .reading { display: flex; align-items: center; gap: 16px; flex: none; }
  @media (max-width: 700px) { .objective { flex-direction: column; } }
</style>
