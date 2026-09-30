<script>
  /**
   * What the hooks have seen since the last harness review.
   *
   * A field the server could not read arrives as null and renders as "not
   * available", never as 0. A zero means the hooks looked and found nothing.
   */
  let { status } = $props();

  const observed = $derived(status?.data_location != null);
  const state = $derived(status?.state ?? {});
  const due = $derived(status?.review_due_reasons);
  const repeated = $derived(status?.repeated_correction);
  const transcripts = $derived(status?.transcripts);

  function count(value) {
    return observed ? String(value ?? 0) : "not available";
  }
</script>

{#if status}
  <div class="card status-strip">
    <div class="row small" style="gap:18px;flex-wrap:wrap">
      <span>
        <span class="muted">Review</span>
        {#if due == null}
          <span class="badge" title="CLAUDE_PLUGIN_DATA is not set, so the hook data cannot be read">not available</span>
        {:else if due.length}
          <span class="badge badge-warning">due</span>
        {:else}
          <span class="badge badge-success">not due</span>
        {/if}
      </span>
      <span><span class="muted">Corrections</span> <strong class:na={!observed}>{count(status.observations?.corrections)}</strong></span>
      <span><span class="muted">Tool calls since review</span> <strong class:na={!observed}>{count(state.tool_calls_since_review)}</strong></span>
      <span><span class="muted">Tool failures since review</span> <strong class:na={!observed}>{count(state.tool_failures_since_review)}</strong></span>
      <span>
        <span class="muted">Transcripts</span>
        {#if transcripts?.count}
          <strong>{transcripts.count}</strong>
          <span class="muted">(oldest {transcripts.oldest_age_days} days)</span>
        {:else}
          <span class="badge badge-warning" title="Observed evaluations read session transcripts">none found</span>
        {/if}
      </span>
    </div>

    {#if due?.length}
      <ul class="small" style="margin:8px 0 0">
        {#each due as reason}<li>{reason}</li>{/each}
      </ul>
    {/if}
    {#if repeated}
      <p class="small" style="margin:8px 0 0">
        The most repeated correction was made {repeated.count} {repeated.count === 1 ? "time" : "times"}.
        Its key words are <code>{repeated.key.replaceAll("-", " ")}</code>.
      </p>
    {/if}
    {#if !observed}
      <p class="small muted" style="margin:8px 0 0">
        Hook data is not available. Start the UI with <code>CLAUDE_PLUGIN_DATA</code> set to read it.
      </p>
    {/if}
  </div>
{/if}

<style>
  .status-strip { padding: 10px 14px; margin-bottom: 16px; }
  .na { font-weight: 400; color: hsl(var(--muted-foreground)); font-style: italic; }
</style>
