<script>
  import Icon from "./Icon.svelte";
  /** @type {{ tone?: "ok"|"warn"|"bad"|"", children?: import('svelte').Snippet }} */
  let { tone = "", children } = $props();
  const icon = $derived(tone === "ok" ? "check" : tone === "bad" ? "alert" : tone === "warn" ? "alert" : "info");
</script>

<div class="notice {tone}" role={tone === "bad" ? "alert" : "status"}>
  <span class="notice-icon"><Icon name={icon} /></span>
  <div class="grow">{@render children?.()}</div>
</div>
