<script>
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import Pill from "$lib/components/Pill.svelte";
  import Icon from "$lib/components/Icon.svelte";
  import Diff from "$lib/components/Diff.svelte";
  import Notice from "$lib/components/Notice.svelte";
  import JobCard from "$lib/components/JobCard.svelte";
  import { api } from "$lib/client/api.js";
  import { summary, refreshSummary } from "$lib/client/summary.svelte.js";
  import { jobs, refreshJobs, settled } from "$lib/client/jobs.svelte.js";
  import { SCOPE, STATUS, ago, when, plural, waiting } from "$lib/client/format.js";

  /** @type {[string, string, (proposal: any) => boolean][]} */
  const VIEWS = [
    ["waiting", "Waiting", waiting],
    ["approved", "Approved", (p) => p.status === "approved" || p.status === "applying"],
    ["decided", "Decided", (p) => ["validated", "rejected", "rolled-back"].includes(p.status)],
    ["all", "All", () => true]
  ];

  const view = $derived(page.url.searchParams.get("view") ?? "waiting");
  const selectedFile = $derived(page.url.searchParams.get("p"));
  const filter = $derived(VIEWS.find(([key]) => key === view)?.[2] ?? waiting);
  const shown = $derived(summary.proposals.filter(filter));
  const selected = $derived(summary.proposals.find((p) => p.file === selectedFile) ?? null);

  let decisions = $state(/** @type {any[]} */ ([]));
  let diff = $state(/** @type {any} */ (null));
  let reason = $state("");
  let busy = $state(/** @type {string | null} */ (null));
  let notice = $state(/** @type {{ tone: "ok" | "warn" | "bad" | "", text: string, hint?: string } | null} */ (null));
  let reasonError = $state(/** @type {string | null} */ (null));
  let confirmOverwrite = $state(false);

  /** @param {Record<string, string | null>} params */
  function go(params) {
    const url = new URL(page.url);
    for (const [key, value] of Object.entries(params)) {
      if (value == null) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    goto(url, { keepFocus: true, noScroll: true, replaceState: false });
  }

  // Open the first waiting proposal so the page is never an empty pane.
  $effect(() => {
    if (!selectedFile && summary.loaded && shown.length) go({ p: shown[0].file });
  });

  // Keyed on primitives: the list refreshes every few seconds with new
  // objects, and that must not clear a reason someone is typing.
  const openFile = $derived(selected?.file ?? null);
  const draftKey = $derived(selected?.skill_draft ? `${selected.file}|${selected.skill_draft.drafted_at ?? ""}` : null);

  $effect(() => {
    const file = openFile;
    decisions = [];
    reason = "";
    reasonError = null;
    confirmOverwrite = false;
    notice = null;
    if (!file) return;
    api(`/api/decisions?proposal=${encodeURIComponent(file)}`).then((v) => { decisions = v.decisions ?? []; }).catch(() => {});
  });

  $effect(() => {
    const key = draftKey;
    diff = null;
    if (key) loadDiff(key.split("|")[0]);
  });

  /** @param {string} file */
  async function loadDiff(file) {
    try {
      diff = await api(`/api/proposals/${encodeURIComponent(file)}/diff`);
    } catch (error) {
      diff = { error: /** @type {Error} */ (error).message };
    }
  }

  const draftJob = $derived(selected
    ? jobs.list.find((job) => job.kind === "draft-skill" && job.detail?.proposal === selected.file && job.status === "running")
    : null);
  const lastDraftJob = $derived(selected
    ? jobs.list.find((job) => job.kind === "draft-skill" && job.detail?.proposal === selected.file)
    : null);

  async function draft() {
    notice = null;
    try {
      const { job } = await api(`/api/proposals/${encodeURIComponent(selected.file)}/draft-skill`, { method: "POST" });
      await refreshJobs();
      const file = selected.file;
      const done = await settled(job.id);
      if (done.status === "completed") {
        await refreshSummary();
        if (selected?.file === file) await loadDiff(file);
      }
    } catch (cause) {
      const error = /** @type {any} */ (cause);
      notice = { tone: "bad", text: error.message, hint: error.hint };
    }
  }

  /**
   * @param {string} kind
   * @param {{ overwrite?: boolean }} [options]
   */
  async function decide(kind, { overwrite = false } = {}) {
    reasonError = null;
    if (kind === "reject" && reason.trim().length < 3) {
      reasonError = "Say why. The reason is kept so the same idea is not proposed again.";
      document.getElementById("reason")?.focus();
      return;
    }
    busy = kind;
    notice = null;
    const file = selected.file;
    try {
      if (kind === "apply") {
        const value = await api(`/api/proposals/${encodeURIComponent(file)}/apply`, {
          method: "POST",
          body: { rationale: reason, digest: diff?.digest, idempotency_key: `${file}:${diff?.digest}`, allow_unmarked_overwrite: overwrite }
        });
        notice = { tone: "ok", text: `Approved and wrote ${value.written}.${value.archived ? ` The previous version is in ${value.archived}.` : ""}` };
      } else {
        const value = await api(`/api/proposals/${encodeURIComponent(file)}/${kind}`, {
          method: "POST",
          body: { rationale: reason, idempotency_key: `${kind}:${file}:${Date.now()}` }
        });
        notice = kind === "approve"
          ? { tone: "ok", text: `Approved. ${value.next}` }
          : { tone: "", text: "Rejected. The reason is recorded with the decision." };
      }
      reason = "";
      await refreshSummary();
      decisions = (await api(`/api/decisions?proposal=${encodeURIComponent(file)}`)).decisions ?? [];
    } catch (cause) {
      const error = /** @type {any} */ (cause);
      if (error.detail?.requires === "allow_unmarked_overwrite") confirmOverwrite = true;
      notice = { tone: "bad", text: error.message, hint: error.hint };
    } finally {
      busy = null;
    }
  }

  const scope = $derived(SCOPE[selected?.check?.scope] ?? SCOPE.unknown);
  const status = $derived(STATUS[selected?.status] ?? { label: selected?.status, tone: "" });
  const decidable = $derived(selected && waiting(selected) && !selected.malformed);
</script>

<svelte:head><title>Proposals · improve</title></svelte:head>

<div class="page-head">
  <div>
    <h1>Proposals</h1>
    <p>Changes to the harness, waiting for a decision. A proposal is not approval: nothing changes until you approve it.</p>
  </div>
</div>

<div class="split">
  <section class="panel list-pane" aria-label="Proposal list">
    <div class="panel-head">
      <div class="segmented" role="group" aria-label="Filter">
        {#each VIEWS as [key, label, test]}
          <button aria-pressed={view === key} onclick={() => go({ view: key, p: null })}>
            {label} <span class="faint num">{summary.proposals.filter(test).length}</span>
          </button>
        {/each}
      </div>
    </div>
    {#if !summary.loaded}
      <p class="empty small">Loading…</p>
    {:else if shown.length === 0}
      <div class="empty small">
        <strong>{view === "waiting" ? "Nothing is waiting for you." : "Nothing here."}</strong>
        {#if view === "waiting"}New proposals come from <code>/improve propose</code>, <code>/improve review</code>, or an imported background finding.{/if}
      </div>
    {:else}
      <ul class="list">
        {#each shown as proposal (proposal.file)}
          {@const s = STATUS[proposal.status] ?? { label: proposal.status, tone: "" }}
          <li>
            <button class="list-row stacked" aria-current={proposal.file === selectedFile ? "true" : undefined}
                    onclick={() => go({ p: proposal.file })}>
              <span class="title">{proposal.title}</span>
              <span class="row small faint">
                <Pill tone={s.tone}>{s.label}</Pill>
                {#if proposal.malformed}<Pill tone="bad">Unreadable</Pill>{/if}
                {#if proposal.check && proposal.check.scope !== "harness"}
                  <Pill tone={SCOPE[proposal.check.scope].tone}>{SCOPE[proposal.check.scope].label}</Pill>
                {/if}
                <span>{ago(proposal.created_at)}</span>
              </span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="detail" aria-live="polite">
    {#if !selected}
      {#if summary.loaded}
        <div class="panel empty">
          <strong>{selectedFile ? "That proposal no longer exists." : "Pick a proposal."}</strong>
          Its evidence, the files it changes, and the decision controls appear here.
        </div>
      {/if}
    {:else}
      <article class="panel">
        <header class="panel-body stack" style="gap:10px;border-bottom:1px solid var(--border)">
          <div class="row">
            <Pill tone={status.tone}>{status.label}</Pill>
            {#if selected.check}<Pill tone={scope.tone} title={scope.meaning}>{scope.label}</Pill>{/if}
            {#if selected.confidence}<Pill plain>Confidence: {selected.confidence}</Pill>{/if}
            {#if selected.provenance?.kind === "background-dream"}<Pill tone="warn">From a background review, unverified</Pill>{/if}
          </div>
          <h2 style="font-size:18px">{selected.title}</h2>
          <p class="small faint">
            <span class="mono">{selected.id}</span>
            {#if selected.objective_id || typeof selected.objective === "string"} · objective <a href="/objectives#{selected.objective_id ?? selected.objective}">{selected.objective_id ?? selected.objective}</a>{/if}
            {#if selected.owner} · owner {selected.owner}{/if}
            {#if selected.created_at} · proposed {ago(selected.created_at)}{/if}
            {#if selected.review_by} · review by {when(selected.review_by)}{/if}
          </p>
        </header>

        {#if selected.malformed}
          <div class="panel-body"><Notice tone="bad">This file could not be parsed: {selected.malformed}</Notice></div>
        {:else}
          <div class="panel-body stack" style="gap:20px">
            {#each selected.check?.findings ?? [] as finding}
              <Notice tone={selected.check.scope === "codebase" ? "bad" : "warn"}>{finding.detail}</Notice>
            {/each}

            {#if selected.intervention?.summary}
              <div>
                <div class="section-label">What changes</div>
                <p class="prose">{selected.intervention.summary}</p>
              </div>
            {/if}
            {#if selected.hypothesis}
              <div>
                <div class="section-label">Why</div>
                <p class="prose">{selected.hypothesis}</p>
              </div>
            {/if}

            <div>
              <div class="section-label">Files</div>
              {#if selected.scope?.files?.length}
                <div class="row">
                  {#each selected.scope.files as file}
                    <span class="chip" class:outside={selected.check?.outside?.includes(file)}><Icon name="file" size={12} />{file}</span>
                  {/each}
                </div>
              {:else}
                <p class="small muted">None listed.</p>
              {/if}
              {#if selected.scope?.permissions_changed}<p class="small" style="color:var(--warn);margin-top:6px">Changes permissions.</p>{/if}
            </div>

            <div>
              <div class="section-label">Evidence</div>
              {#if selected.evidence.length}
                <div class="table-wrap evidence">
                  <table>
                    <thead><tr><th>Source</th><th>What it shows</th></tr></thead>
                    <tbody>
                      {#each selected.evidence as item}
                        <tr>
                          <td class="mono small" style="width:34%">{item.source ?? "unspecified"}</td>
                          <td>{item.observation ?? JSON.stringify(item)}</td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {:else}
                <p class="small" style="color:var(--warn)">No evidence is given. A proposal without evidence is a guess.</p>
              {/if}
            </div>

            {#if selected.evaluation && (selected.evaluation.baseline || selected.evaluation.candidate || selected.evaluation.pass_conditions?.length)}
              <div>
                <div class="section-label">How we will know it worked</div>
                <dl class="kv">
                  {#if selected.evaluation.baseline}<dt>Today</dt><dd>{selected.evaluation.baseline}</dd>{/if}
                  {#if selected.evaluation.candidate}<dt>Measured by</dt><dd>{selected.evaluation.candidate}</dd>{/if}
                  {#if selected.evaluation.pass_conditions?.length}<dt>Passes if</dt><dd>{selected.evaluation.pass_conditions.join("; ")}</dd>{/if}
                  {#if selected.evaluation.regression_conditions?.length}<dt>Fails if</dt><dd>{selected.evaluation.regression_conditions.join("; ")}</dd>{/if}
                </dl>
              </div>
            {/if}

            {#if selected.reasons_to_reject.length}
              <Notice tone="warn">
                <p><strong>Reasons to reject, from whoever wrote it</strong></p>
                <ul class="small" style="margin-top:4px">{#each selected.reasons_to_reject as item}<li>{item}</li>{/each}</ul>
              </Notice>
            {/if}

            {#if selected.risks.length || selected.rollback}
              <div class="grid cols-2">
                {#if selected.risks.length}
                  <div>
                    <div class="section-label">Risks</div>
                    <ul>{#each selected.risks as risk}<li>{risk}</li>{/each}</ul>
                  </div>
                {/if}
                {#if selected.rollback}
                  <div>
                    <div class="section-label">How to undo it</div>
                    <p>{selected.rollback}</p>
                  </div>
                {/if}
              </div>
            {/if}

            {#if selected.check?.prose?.length}
              <details>
                <summary class="small muted">Writing check: {plural(selected.check.prose.length, "issue")}</summary>
                <ul class="small" style="margin-top:8px">
                  {#each selected.check.prose as issue}
                    <li><span class="faint">{issue.field}:</span> "{issue.match}". {issue.fix}</li>
                  {/each}
                </ul>
              </details>
            {/if}

            <!-- A skill can be drafted from a proposal and applied from its reviewed diff. -->
            {#if selected.skill_draft || (decidable && selected.check?.scope !== "codebase")}
              <div>
                <div class="spread" style="margin-bottom:8px">
                  <div class="section-label" style="margin:0">Skill draft</div>
                  {#if decidable && !draftJob}
                    <button class="small" onclick={draft}>
                      <Icon name="sparkles" size={13} />{selected.skill_draft ? "Draft again" : "Draft a skill"}
                    </button>
                  {/if}
                </div>
                {#if draftJob}
                  <div class="panel"><JobCard job={draftJob} /></div>
                {:else if lastDraftJob && lastDraftJob.status !== "completed" && !selected.skill_draft}
                  <div class="panel"><JobCard job={lastDraftJob} /></div>
                {/if}
                {#if selected.skill_draft}
                  {#if !diff}
                    <p class="small faint">Loading the diff…</p>
                  {:else if diff.error}
                    <Notice tone="bad">{diff.error}</Notice>
                  {:else}
                    <div class="stack" style="gap:10px">
                      <p class="small muted">
                        {diff.exists ? "Replaces" : "Creates"} <code>{diff.target}</code>.
                        Drafted {ago(selected.skill_draft.drafted_at)} by a read-only agent.
                        {#if diff.exists && diff.plugin_authored === false}<strong style="color:var(--warn)">The current file was not written by improve.</strong>{/if}
                      </p>
                      {#if diff.findings?.length}
                        <Notice tone={diff.blocked ? "bad" : "warn"}>
                          <p><strong>{diff.blocked ? "This draft cannot be applied." : "Check these before applying."}</strong></p>
                          <ul class="small" style="margin-top:4px">{#each diff.findings as [family, detail]}<li><span class="mono">{family}</span>: {detail}</li>{/each}</ul>
                        </Notice>
                      {/if}
                      <Diff current={diff.current} proposed={diff.proposed} path={diff.target} />
                    </div>
                  {/if}
                {:else if !draftJob}
                  <p class="small muted">A read-only agent can draft the skill this proposal describes. Nothing is written until you apply the reviewed diff.</p>
                {/if}
              </div>
            {/if}

            {#if decisions.length}
              <div>
                <div class="section-label">Decisions</div>
                <ul class="list panel">
                  {#each decisions as decision}
                    <li class="panel-body" style="padding:10px 14px">
                      <div class="row">
                        <Pill tone={decision.decision === "rejected" ? "bad" : "ok"}>{decision.decision === "rejected" ? "Rejected" : "Approved"}</Pill>
                        <span class="small faint">{when(decision.decided_at)} · {decision.decided_by ?? "unknown"}</span>
                      </div>
                      {#if decision.rationale}<p style="margin-top:6px">{decision.rationale}</p>{/if}
                      {#if decision.applied_files.length}<p class="small faint" style="margin-top:4px">Wrote {decision.applied_files.join(", ")}</p>{/if}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>

          {#if notice}
            <div class="panel-body" style="padding-top:0">
              <Notice tone={notice.tone}>
                <p>{notice.text}</p>
                {#if notice.hint}<p class="small">{notice.hint}</p>{/if}
              </Notice>
            </div>
          {/if}

          {#if decidable}
            <footer class="decision">
              <label for="reason">Your reason <span class="faint" style="font-weight:400">(required to reject, kept with the decision)</span></label>
              <textarea id="reason" rows="2" bind:value={reason} aria-invalid={reasonError ? "true" : undefined}
                        aria-describedby={reasonError ? "reason-error" : "reason-help"}
                        placeholder="What convinced you, or what is wrong with it"></textarea>
              {#if reasonError}<p id="reason-error" class="field-error">{reasonError}</p>{/if}
              <div class="decision-actions">
                <p id="reason-help" class="small faint">
                  {#if selected.skill_draft && diff && !diff.error}
                    Approving writes <code>{diff.target}</code> exactly as shown.
                  {:else}
                    Approving records your decision only. Nothing changes until <code>/improve apply {selected.id}</code> runs.
                  {/if}
                </p>
                <div class="row">
                  <button class="danger" onclick={() => decide("reject")} disabled={busy !== null || Boolean(draftJob)}>
                    <Icon name="x" size={14} />{busy === "reject" ? "Rejecting…" : "Reject"}
                  </button>
                  {#if confirmOverwrite}
                    <button class="danger" onclick={() => decide("apply", { overwrite: true })} disabled={busy !== null || Boolean(draftJob)}>Overwrite the hand-written file</button>
                  {/if}
                  {#if selected.skill_draft && diff && !diff.error}
                    <button class="primary" onclick={() => decide("apply")} disabled={busy !== null || Boolean(draftJob) || diff.blocked}>
                      <Icon name="check" size={14} />{busy === "apply" ? "Writing…" : "Approve and write skill"}
                    </button>
                  {:else}
                    <button class="primary" onclick={() => decide("approve")} disabled={busy !== null || Boolean(draftJob)}>
                      <Icon name="check" size={14} />{busy === "approve" ? "Approving…" : "Approve"}
                    </button>
                  {/if}
                </div>
              </div>
            </footer>
          {:else if selected.status === "approved"}
            <footer class="decision">
              <p>Approved and waiting to be applied. In Claude Code, run <code>/improve apply {selected.id}</code>; it rechecks the proposal, applies it, and runs its evaluation.</p>
            </footer>
          {/if}
        {/if}
      </article>
    {/if}
  </section>
</div>

<style>
  .split { display: grid; grid-template-columns: minmax(300px, 380px) minmax(0, 1fr); gap: 16px; align-items: start; }
  .list-pane { position: sticky; top: 16px; max-height: calc(100vh - 32px); overflow-y: auto; }
  .list-pane .panel-head { position: sticky; top: 0; background: var(--surface); z-index: 1; }
  .stacked { flex-direction: column; align-items: flex-start; gap: 6px; }
  .decision { position: sticky; bottom: 0; padding: 14px 16px; background: var(--surface); border-top: 1px solid var(--border); border-radius: 0 0 var(--radius) var(--radius); }
  .decision-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 16px; margin-top: 10px; }
  .decision-actions p { flex: 1 1 260px; }
  .decision-actions .row { flex: none; margin-left: auto; }
  .evidence { border: 1px solid var(--border); border-radius: var(--radius-sm); }
  .evidence th, .evidence td { padding: 8px 12px; }
  @media (max-width: 960px) {
    .split { grid-template-columns: 1fr; }
    .list-pane { position: static; max-height: none; }
  }
</style>
