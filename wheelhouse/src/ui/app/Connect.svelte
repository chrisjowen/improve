<script>
  import { untrack } from "svelte";
  import Icon from "$lib/components/Icon.svelte";
  import Notice from "$lib/components/Notice.svelte";
  import { page } from "./router.svelte.js";

  /**
   * How to reach improve's review UI while it does not answer: Launch, which
   * asks Wheelhouse to start it on 127.0.0.1 for this home (and, as Wheelhouse
   * does for every launch, open it in a new tab), or the command that starts
   * it, ready to copy, and why Wheelhouse cannot start it itself.
   *
   * @typedef {import("../../types.mjs").ImproveUi} ImproveUi
   * @typedef {{ state: string, url: string | null, reason: string | null, launchable: boolean, hint: string | null }} ServiceView
   */
  /** @type {{ ui: ImproveUi | null, host: any, link: string, onready: () => void, compact?: boolean }} */
  let { ui, host, link, onready, compact = false } = $props();

  let service = $state(/** @type {ServiceView | null} */ (null));
  let launching = $state(false);
  let failure = $state(/** @type {string | null} */ (null));
  let copied = $state(false);

  async function read() {
    if (!host?.service) return;
    try {
      service = await host.service("ui");
    } catch {
      service = null;
    }
  }

  $effect(() => {
    if (link === "down") untrack(read);
  });

  // Open the same view in the new tab Wheelhouse opens on Launch.
  const open = $derived(ui ? `${ui.url}${page.url.pathname === "/firstmate" ? "/" : page.url.pathname}${page.url.search}` : null);
  const hint = $derived(service?.hint ?? ui?.start ?? null);

  async function launch() {
    launching = true;
    failure = null;
    try {
      service = await host.launch("ui", { open });
      if (service?.state === "running") onready();
      else failure = service?.reason ?? "Wheelhouse could not start it.";
    } catch (error) {
      failure = /** @type {Error} */ (error).message;
    } finally {
      launching = false;
    }
  }

  async function copy() {
    if (!hint) return;
    try {
      await navigator.clipboard.writeText(hint);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      // clipboard unavailable: the command stays selectable
    }
  }
</script>

{#if ui}
  <section class="panel panel-body connect" aria-live="polite">
    {#if link === "checking"}
      <p class="row muted"><span class="spin" style="display:inline-flex"><Icon name="refresh" size={14} /></span>Connecting to improve’s review UI…</p>
    {:else if ui.servesHome === false}
      <Notice tone="warn">
        <p>improve’s review UI at <code>{ui.url}</code> serves <code>{ui.project}</code>, not this Firstmate home.</p>
        <p class="small">Stop it, or set <code>plugins.improve.settings.uiUrl</code> to where this home’s runs.</p>
      </Notice>
    {:else if ui.connects === false}
      <Notice tone="warn">
        <p>improve’s review UI runs at <code>{ui.url}</code>, but it is from a copy of improve that Wheelhouse cannot drive.</p>
        <p class="small">Update improve and restart its UI. Until then, <a href={ui.url} target="_blank" rel="noreferrer">open it in a new tab</a>.</p>
      </Notice>
    {:else if link === "refused"}
      <Notice tone="warn">
        <p>improve’s review UI refused Wheelhouse’s token: it has restarted since Wheelhouse last read it.</p>
        <p class="small">Wheelhouse reads it again within half a minute.</p>
      </Notice>
      <div class="actions"><button class="small" onclick={onready}><Icon name="refresh" size={13} />Try again</button></div>
    {:else}
      {#if !compact}
        <h2>improve’s review UI is not running</h2>
        <p class="muted" style="margin-top:4px">
          Proposals, background findings, evaluations, objectives and runs come from improve’s review UI, a small server on this computer.
          {#if service?.reason && service.state !== "stopped"}{service.reason}{/if}
        </p>
      {:else}
        <p class="muted">improve’s review UI is not running, so only what Wheelhouse read about this home shows.{#if service?.reason && service.state !== "stopped"} {service.reason}{/if}</p>
      {/if}
      {#if service?.state === "starting" || launching}
        <p class="row muted" style="margin-top:12px" role="status"><span class="spin" style="display:inline-flex"><Icon name="refresh" size={14} /></span>Starting improve’s review UI; the first start can take a minute.</p>
      {:else if service?.launchable}
        <div class="actions">
          <button class="primary" onclick={launch}><Icon name="play" size={14} />Launch improve’s review UI</button>
          <span class="small faint">Wheelhouse starts it on 127.0.0.1 for this home and opens it in a new tab; this page connects to it too.</span>
        </div>
      {:else}
        {#if hint}
          <p class="small" style="margin-top:12px">Start it with:</p>
          <pre class="log">{hint}</pre>
        {/if}
        <div class="actions">
          {#if hint}<button class="small" onclick={copy}><Icon name={copied ? "check" : "file"} size={13} />{copied ? "Copied" : "Copy the command"}</button>{/if}
          <button class="small" onclick={onready}><Icon name="refresh" size={13} />Check again</button>
        </div>
      {/if}
      {#if failure}<div style="margin-top:12px"><Notice tone="bad"><p>{failure}</p></Notice></div>{/if}
    {/if}
  </section>
{/if}
