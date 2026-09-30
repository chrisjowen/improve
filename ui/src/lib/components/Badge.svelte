<script>
  /** @type {{ status?: string, children?: import('svelte').Snippet }} */
  let { status = "", children } = $props();

  const TONE = {
    validated: "badge-success",
    approved: "badge-success",
    rejected: "badge-danger",
    "rolled-back": "badge-danger",
    applying: "badge-warning",
    proposed: "badge-warning"
  };
</script>

<span class="badge {TONE[status] ?? ''}">{@render children?.()}</span>
