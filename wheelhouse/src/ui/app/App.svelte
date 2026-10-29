<script>
  import { untrack } from "svelte";
  import Icon from "$lib/components/Icon.svelte";
  import { summary, waitingCount, findingCount } from "$lib/client/summary.svelte.js";
  import { jobs } from "$lib/client/jobs.svelte.js";
  import { api } from "$lib/client/api.js";
  import { connection } from "./connection.svelte.js";
  import { page, chosen, sync, setAnchorHome } from "./router.svelte.js";
  import Connect from "./Connect.svelte";
  import Live from "./Live.svelte";

  /**
   * improve's review UI inside Wheelhouse: its six views as tabs, in place of
   * its sidebar, plus Firstmate, what Wheelhouse's provider read about this
   * home. improve's views are improve's own pages, talking to its review UI's
   * server on its own origin; while that server is down they show how to start
   * it, and Firstmate still shows.
   *
   * @typedef {import("../../types.mjs").HarnessView} HarnessView
   * @typedef {import("../../types.mjs").ImproveUi} ImproveUi
   */
  /** @type {{ data: HarnessView | null, host: any }} */
  let { data, host } = $props();

  /** "checking" | "ready" | "down" | "refused" */
  let link = $state("checking");
  let root = $state(/** @type {HTMLElement | undefined} */ (undefined));

  const ui = $derived(data?.ui ?? null);
  // A chosen view, else Overview once the UI answers, else Firstmate, which needs no UI.
  const view = $derived(chosen() || link === "ready" ? page.url.pathname : "/firstmate");
  const running = $derived(jobs.list.filter((job) => job.status === "running").length);
  const project = $derived(summary.status?.project ?? "");
  const blocked = $derived(ui ? ui.connects === false || ui.servesHome === false : false);

  /** @type {{ href: string, label: string, icon: any, count?: number | string | null }[]} */
  const TABS = $derived([
    { href: "/", label: "Overview", icon: "home" },
    { href: "/proposals", label: "Proposals", icon: "inbox", count: (link === "ready" ? waitingCount() : data?.waiting) || null },
    { href: "/findings", label: "Background findings", icon: "sparkles", count: link === "ready" ? findingCount() || null : null },
    { href: "/evals", label: "Evaluations", icon: "gauge" },
    { href: "/objectives", label: "Objectives", icon: "target" },
    { href: "/runs", label: "Runs", icon: "activity", count: link === "ready" && running ? `${running} running` : null },
    { href: "/firstmate", label: "Firstmate", icon: "clock" }
  ]);

  // Point the pages at the UI the provider names, and check it answers whenever that changes.
  const target = $derived(ui ? `${ui.url}|${ui.token ?? ""}|${blocked}` : "");
  $effect(() => {
    if (!target) return;
    connection.url = ui?.url ?? "";
    connection.token = ui?.token ?? "";
    untrack(check);
  });

  /** Whether improve's review UI answers, with this token, for this home. */
  async function check() {
    if (blocked) {
      link = "down";
      return;
    }
    if (link !== "ready") link = "checking";
    connection.refused = false;
    try {
      await api("/api/status");
      link = "ready";
    } catch (cause) {
      const error = /** @type {any} */ (cause);
      link = error.status === 403 ? "refused" : "down";
    }
  }

  // A request refused for its token means the UI restarted under another one.
  $effect(() => {
    if (connection.refused && link === "ready") link = "refused";
  });

  $effect(() => {
    const onHash = () => sync();
    addEventListener("hashchange", onHash);
    addEventListener("popstate", onHash);
    return () => {
      removeEventListener("hashchange", onHash);
      removeEventListener("popstate", onHash);
    };
  });

  $effect(() => {
    setAnchorHome(root ?? null);
    return () => setAnchorHome(null);
  });

  // `/objectives#id`: scroll to it once the view has drawn.
  $effect(() => {
    const id = page.url.hash.slice(1);
    if (!id || link !== "ready") return;
    const t = setTimeout(() => (/** @type {ShadowRoot} */ (root?.getRootNode()))?.getElementById?.(decodeURIComponent(id))?.scrollIntoView({ block: "start" }), 120);
    return () => clearTimeout(t);
  });
</script>

<div class="improve-app" bind:this={root}>
  <nav class="tabs" aria-label="improve">
    {#each TABS as tab}
      <a href="#{tab.href}" aria-current={view === tab.href ? "page" : undefined}>
        <Icon name={tab.icon} size={15} />{tab.label}
        {#if tab.count}<span class="count">{tab.count}</span>{/if}
      </a>
    {/each}
  </nav>

  {#if view === "/firstmate"}
    {#if link !== "ready"}<Connect {ui} {host} {link} onready={check} compact />{/if}
    <improve-firstmate-view {data}></improve-firstmate-view>
  {:else if link === "ready"}
    {#if ui}
      <div class="strip small">
        {#if project}<span class="faint" title={project}>improve’s review UI for <span class="mono">{project}</span></span>{/if}
        <a href="{ui.url}{page.url.pathname}{page.url.search}" target="_blank" rel="noreferrer">Open in its own tab</a>
        {#if summary.status?.eval_rig?.drifted}
          <span style="color:var(--warn)">This repository's eval rig is {summary.status.eval_rig.installed}; the plugin has {summary.status.eval_rig.available}.</span>
        {/if}
        {#if summary.error}<span style="color:var(--bad)">{summary.error}</span>{/if}
      </div>
    {/if}
    <Live {view} />
  {:else}
    <Connect {ui} {host} {link} onready={check} />
  {/if}
</div>
