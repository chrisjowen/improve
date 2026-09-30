<script>
  import Badge from "$lib/components/Badge.svelte";
  import Diff from "$lib/components/Diff.svelte";

  let proposals = $state([]);
  let loading = $state(true);
  let error = $state(null);
  let openFile = $state(null);
  let diff = $state(null);
  let busy = $state(null);
  let rationale = $state("");
  let notice = $state(null);
  let confirmUnmarked = $state(false);

  async function load() {
    loading = true;
    try {
      const response = await fetch("/api/proposals");
      const body = await response.json();
      proposals = body.proposals ?? [];
      error = body.error ?? null;
    } catch (cause) {
      error = cause.message;
    } finally {
      loading = false;
    }
  }

  $effect(() => { load(); });

  /** Poll a background job to completion. Jobs are short and single-user. */
  async function waitFor(jobId) {
    for (;;) {
      await new Promise((r) => setTimeout(r, 1200));
      const { job } = await (await fetch(`/api/jobs/${jobId}`)).json();
      if (!job || job.status !== "running") return job;
    }
  }

  async function draft(file) {
    busy = file;
    notice = null;
    try {
      const started = await (await fetch(`/api/proposals/${file}/draft-skill`, { method: "POST" })).json();
      if (!started.ok) { notice = { bad: true, text: started.error }; return; }
      const job = await waitFor(started.job.id);
      if (job?.status !== "completed") {
        notice = { bad: true, text: job?.error ?? "drafting failed" };
        return;
      }
      await load();
      await openDiff(file);
      notice = { text: "Draft ready. Review the diff before applying." };
    } catch (cause) {
      notice = { bad: true, text: cause.message };
    } finally {
      busy = null;
    }
  }

  async function openDiff(file) {
    openFile = file;
    diff = null;
    confirmUnmarked = false;
    const body = await (await fetch(`/api/proposals/${file}/diff`)).json();
    diff = body.ok ? body : { error: body.error };
  }

  async function apply(file, { allowUnmarked = false } = {}) {
    busy = file;
    try {
      const body = await (await fetch(`/api/proposals/${file}/apply`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rationale,
          // Pins the write to the bytes shown in the diff.
          digest: diff?.digest,
          idempotency_key: `${file}:${diff?.digest}`,
          allow_unmarked_overwrite: allowUnmarked
        })
      })).json();
      if (body.ok) {
        notice = {
          text: body.archived
            ? `Wrote ${body.written}; previous version archived to ${body.archived}`
            : `Wrote ${body.written}`
        };
        openFile = null; diff = null; rationale = "";
        await load();
      } else if (body.requires === "allow_unmarked_overwrite") {
        // The target has no provenance, so it is assumed to be hand-written.
        confirmUnmarked = true;
        notice = { bad: true, text: body.error };
      } else {
        notice = { bad: true, text: body.error };
      }
    } finally {
      busy = null;
    }
  }

  async function reject(file) {
    busy = file;
    try {
      const body = await (await fetch(`/api/proposals/${file}/reject`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rationale, idempotency_key: `reject:${file}` })
      })).json();
      notice = body.ok ? { text: "Recorded as rejected." } : { bad: true, text: body.error };
      if (body.ok) { openFile = null; diff = null; rationale = ""; await load(); }
    } finally {
      busy = null;
    }
  }
</script>

<div class="spread" style="margin-bottom:16px">
  <div>
    <h1>Suggestions</h1>
    <p class="muted small" style="margin:4px 0 0">
      Improvement proposals from <code>.harness/proposals/</code>. A proposal is not approval.
    </p>
  </div>
  <button onclick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
</div>

{#if notice}
  <div class="alert {notice.bad ? 'alert-danger' : ''}" style="margin-bottom:14px">{notice.text}</div>
{/if}
{#if error}
  <div class="alert alert-danger" style="margin-bottom:14px">{error}</div>
{/if}

{#if !loading && proposals.length === 0}
  <div class="card empty">
    <p style="margin:0 0 6px"><strong>No proposals yet.</strong></p>
    <p class="small muted" style="margin:0">
      Run <code>/improve propose</code>, <code>/improve assess</code> or <code>/improve dream</code>
      in Claude Code. Each writes a YAML proposal this page reads.
    </p>
  </div>
{/if}

{#each proposals as proposal (proposal.file)}
  <div class="card">
    <div class="card-header">
      <h2>{proposal.title}</h2>
      <Badge status={proposal.status}>{proposal.status}</Badge>
      {#if proposal.confidence}<span class="badge">{proposal.confidence}</span>{/if}
    </div>

    {#if proposal.malformed}
      <div class="alert alert-danger">Could not parse: {proposal.malformed}</div>
    {:else}
      {#if proposal.hypothesis}
        <p style="margin:0 0 10px">{proposal.hypothesis}</p>
      {/if}
      <div class="row small muted" style="margin-bottom:10px">
        <code>{proposal.source}</code>
        {#if proposal.objective_id}<span>objective: {proposal.objective_id}</span>{/if}
        {#if proposal.owner}<span>owner: {proposal.owner}</span>{/if}
        {#if proposal.review_by}<span>review by {proposal.review_by}</span>{/if}
      </div>

      {#if proposal.evidence.length}
        <details style="margin-bottom:10px">
          <summary class="small muted">Evidence ({proposal.evidence.length})</summary>
          <ul class="small" style="margin:8px 0 0">
            {#each proposal.evidence as item}
              <li><strong>{item.source ?? "source"}</strong> — {item.observation ?? JSON.stringify(item)}</li>
            {/each}
          </ul>
        </details>
      {/if}

      <div class="row">
        {#if proposal.skill_draft}
          <button onclick={() => openDiff(proposal.file)}>Review draft</button>
          <span class="badge badge-success">draft: {proposal.skill_draft.name}</span>
        {:else}
          <button onclick={() => draft(proposal.file)} disabled={busy === proposal.file}>
            {busy === proposal.file ? "Drafting…" : "Draft skill"}
          </button>
        {/if}
        <button class="danger" onclick={() => reject(proposal.file)} disabled={busy === proposal.file}>
          Reject
        </button>
      </div>
    {/if}

    {#if openFile === proposal.file}
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid hsl(var(--border))">
        {#if !diff}
          <p class="muted small">Loading diff…</p>
        {:else if diff.error}
          <div class="alert alert-danger">{diff.error}</div>
        {:else}
          <div class="spread" style="margin-bottom:10px">
            <h3><code>{diff.target}</code></h3>
            <span class="row" style="gap:6px">
              <span class="badge">{diff.exists ? "overwrites existing" : "new file"}</span>
              {#if diff.exists && diff.plugin_authored === false}
                <span class="badge badge-warning">not authored by improve</span>
              {/if}
              {#if diff.sidecar}
                <span class="badge" title="times the model invoked this skill">used {diff.sidecar.use}</span>
              {/if}
            </span>
          </div>

          {#if diff.findings?.length}
            <div class="alert {diff.blocked ? 'alert-danger' : ''}" style="margin-bottom:10px">
              <strong>{diff.blocked ? "This draft cannot be applied." : "Findings."}</strong>
              <ul class="small" style="margin:6px 0 0">
                {#each diff.findings as [family, detail]}
                  <li><code>{family}</code> — {detail}</li>
                {/each}
              </ul>
              {#if diff.blocked}
                <p class="small" style="margin:6px 0 0">
                  A skill body becomes a standing instruction, so a safety match blocks the write.
                </p>
              {/if}
            </div>
          {/if}

          <Diff current={diff.current} proposed={diff.proposed} />
          <div style="margin-top:12px">
            <label for="why-{proposal.file}">Rationale (recorded with the decision)</label>
            <textarea id="why-{proposal.file}" rows="2" bind:value={rationale}
                      placeholder="Why this is or isn't the right change"></textarea>
          </div>
          <div class="row" style="margin-top:10px">
            <button class="primary" onclick={() => apply(proposal.file)}
                    disabled={busy === proposal.file || diff.blocked}>
              {busy === proposal.file ? "Applying…" : "Apply"}
            </button>
            {#if confirmUnmarked}
              <button class="danger" onclick={() => apply(proposal.file, { allowUnmarked: true })}
                      disabled={busy === proposal.file}>
                Overwrite the hand-written file
              </button>
            {/if}
            <button onclick={() => { openFile = null; diff = null; confirmUnmarked = false; }}>Cancel</button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/each}
