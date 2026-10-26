<script>
  import Pill from "$lib/components/Pill.svelte";
  import Icon from "$lib/components/Icon.svelte";
  import Trend from "$lib/components/Trend.svelte";
  import JobCard from "$lib/components/JobCard.svelte";
  import { api } from "$lib/client/api.js";
  import { summary, findingCount } from "$lib/client/summary.svelte.js";
  import { jobs } from "$lib/client/jobs.svelte.js";
  import { ago, plural, score, scopeLabel, showScope, waiting } from "$lib/client/format.js";

  let objectives = $state([]);
  $effect(() => {
    api("/api/objectives").then((value) => { objectives = value.objectives ?? []; }).catch(() => {});
  });

  const status = $derived(summary.status);
  const queue = $derived(summary.proposals.filter(waiting));
  const due = $derived(status?.review_due_reasons);
  const observed = $derived(status?.data_location != null);
  const state = $derived(status?.state ?? {});
  const recent = $derived(jobs.list.slice(0, 5));
  const findings = $derived(findingCount());

  const headline = $derived.by(() => {
    if (!status) return "";
    if (!status.harness_initialized) return "This repository has no .harness directory yet. Run /improve init in Claude Code to start.";
    const parts = [];
    if (due?.length) parts.push("A harness review is due");
    parts.push(queue.length ? `${plural(queue.length, "proposal")} waiting for you` : "Nothing is waiting for your review");
    return `${parts.join(". ")}.`;
  });
</script>

<svelte:head><title>Overview · improve</title></svelte:head>

<div class="page-head">
  <div>
    <h1>Overview</h1>
    <p>{headline}</p>
  </div>
</div>

<div class="grid cols-main">
  <div class="stack" style="gap:16px">
    <section class="panel" aria-labelledby="waiting">
      <div class="panel-head">
        <h2 id="waiting"><Icon name="inbox" />Waiting for you</h2>
        <a class="small" href="/proposals">All proposals</a>
      </div>
      {#if !summary.loaded}
        <p class="empty small">Loading…</p>
      {:else if queue.length === 0}
        <div class="empty">
          <strong>No proposals to review.</strong>
          Run <code>/improve propose</code> or <code>/improve review</code> in Claude Code. Each writes a proposal to
          <code>.harness/proposals/</code>, and it shows up here.
        </div>
      {:else}
        <ul class="list">
          {#each queue as proposal (proposal.file)}
            {@const scope = scopeLabel(proposal.check)}
            <li>
              <a class="list-row" href="/proposals?p={encodeURIComponent(proposal.file)}">
                <span class="title">{proposal.title}</span>
                {#if proposal.status === "draft"}<Pill>Draft</Pill>{/if}
                {#if showScope(proposal.check)}<Pill tone={scope.tone} title={scope.meaning}>{scope.label}</Pill>{/if}
                <span class="meta">{ago(proposal.created_at)}</span>
                <Icon name="chevron" />
              </a>
            </li>
          {/each}
        </ul>
      {/if}
      {#if findings}
        <div class="panel-body" style="border-top:1px solid var(--border)">
          <a href="/findings" class="row">
            <Icon name="sparkles" />{plural(findings, "background finding")} not yet triaged
          </a>
        </div>
      {/if}
    </section>

    <section class="panel" aria-labelledby="runs">
      <div class="panel-head">
        <h2 id="runs"><Icon name="activity" />Recent runs</h2>
        <a class="small" href="/runs">All runs</a>
      </div>
      {#if recent.length === 0}
        <p class="empty small">No evaluations, drafts or background reviews have run from this page yet.</p>
      {:else}
        <ul class="list">
          {#each recent as job (job.id)}<li><JobCard {job} compact /></li>{/each}
        </ul>
      {/if}
    </section>
  </div>

  <div class="stack" style="gap:16px">
    <section class="panel" aria-labelledby="health">
      <div class="panel-head">
        <h2 id="health"><Icon name="gauge" />Harness health</h2>
        {#if due == null}
          <Pill title="No plugin data directory was found, so hook observations cannot be read">Not observed</Pill>
        {:else if due.length}
          <Pill tone="warn">Review due</Pill>
        {:else}
          <Pill tone="ok">No review due</Pill>
        {/if}
      </div>
      <div class="panel-body stack">
        {#if due?.length}
          <div>
            <div class="section-label">Why a review is due</div>
            <ul class="small">{#each due as reason}<li>{reason}</li>{/each}</ul>
          </div>
        {/if}
        {#if status?.repeated_correction && status.repeated_correction.count > 1}
          <div>
            <div class="section-label">Most repeated correction</div>
            <p class="small">
              Made {status.repeated_correction.count} times. Key words:
              <code>{status.repeated_correction.key.replaceAll("-", " ")}</code>
            </p>
          </div>
        {/if}
        <div>
          <div class="section-label">Since the last review</div>
          {#if observed}
            <dl class="kv small">
              <dt>Sessions</dt><dd class="num">{state.sessions_since_review ?? 0}</dd>
              <dt>Tool calls</dt><dd class="num">{state.tool_calls_since_review ?? 0}</dd>
              <dt>Tool failures</dt><dd class="num">{state.tool_failures_since_review ?? 0}</dd>
              <dt>Corrections</dt><dd class="num">{state.corrections_since_review ?? 0}</dd>
              <dt>Last review</dt><dd>{state.last_reviewed_at ? ago(state.last_reviewed_at) : "never"}</dd>
            </dl>
          {:else}
            <p class="small muted">
              No hook observations were found for this repository. They appear once the plugin's hooks have run in a
              Claude Code session here.
            </p>
          {/if}
        </div>
        <div>
          <div class="section-label">Evidence for evaluations</div>
          <dl class="kv small">
            <dt>Session transcripts</dt>
            <dd>{status?.transcripts?.count ? `${status.transcripts.count}, oldest ${status.transcripts.oldest_age_days} days` : "none found"}</dd>
            <dt>Eval rig</dt>
            <dd>
              {#if status?.eval_rig?.installed}
                {status.eval_rig.installed}{#if status.eval_rig.drifted}<span style="color:var(--warn)"> (plugin has {status.eval_rig.available})</span>{/if}
              {:else}not installed{/if}
            </dd>
            <dt>Background reviews</dt>
            <dd>{status?.background_dreaming_enabled ? "on, after sessions" : "off; run one from Background findings"}</dd>
          </dl>
        </div>
      </div>
    </section>

    <section class="panel" aria-labelledby="objectives">
      <div class="panel-head">
        <h2 id="objectives"><Icon name="target" />Objectives</h2>
        <a class="small" href="/objectives">Details</a>
      </div>
      {#if objectives.length === 0}
        <p class="empty small">No objectives declared. Add them to <code>.harness/objectives.yaml</code>.</p>
      {:else}
        <ul class="list">
          {#each objectives as objective (objective.id)}
            <li>
              <a class="list-row" href="/objectives#{objective.id}">
                <span class="title">{objective.id}</span>
                {#if !objective.covered}
                  <Pill tone="bad">No suite</Pill>
                {:else if !objective.encountered}
                  <Pill>Not measured yet</Pill>
                {:else}
                  <Trend history={objective.history} width={72} height={22} />
                  <span class="num" style="min-width:36px;text-align:right;color:{objective.latest?.success ? 'var(--ok)' : 'var(--bad)'}">
                    {score(objective.latest?.score)}
                  </span>
                {/if}
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
</div>
