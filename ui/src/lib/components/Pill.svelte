<script>
  /** Status shown as a dot and words, so colour is never the only signal. */
  /** @type {{ tone?: string, plain?: boolean, title?: string, children?: import('svelte').Snippet }} */
  let { tone = "", plain = false, title, children } = $props();
</script>

<span class="pill {tone}" class:plain {title}>{@render children?.()}</span>
