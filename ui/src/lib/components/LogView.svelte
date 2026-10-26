<script>
  import { api } from "$lib/client/api.js";

  /**
   * The end of a log, refreshed while its job runs. Lines are timestamped by
   * the runner; the time is shortened here so the message has the width.
   */
  /** @type {{ url: string, live?: boolean }} */
  let { url, live = false } = $props();
  let text = $state("");
  let truncated = $state(false);
  let error = $state(/** @type {string | null} */ (null));
  let box = $state();

  async function load() {
    try {
      const value = await api(url);
      const stick = box ? box.scrollHeight - box.scrollTop - box.clientHeight < 40 : true;
      text = (value.text ?? "").replace(/^\d{4}-\d\d-\d\dT(\d\d:\d\d:\d\d)\.\d+Z /gm, "$1  ");
      truncated = Boolean(value.truncated);
      error = null;
      if (stick) requestAnimationFrame(() => { if (box) box.scrollTop = box.scrollHeight; });
    } catch (cause) {
      error = /** @type {Error} */ (cause).message;
    }
  }

  $effect(() => {
    url;
    load();
    if (!live) return;
    const timer = setInterval(load, 1500);
    return () => clearInterval(timer);
  });
</script>

{#if error}
  <p class="small faint">The log could not be read: {error}</p>
{:else if !text}
  <p class="small faint">Nothing has been logged yet.</p>
{:else}
  {#if truncated}<p class="small faint" style="margin-bottom:6px">Showing the end of the log.</p>{/if}
  <pre class="log" bind:this={box}>{text}</pre>
{/if}
