<script>
  import "../app.css";
  import { page } from "$app/state";
  import { afterNavigate } from "$app/navigation";
  import Icon from "$lib/components/Icon.svelte";
  import { summary, refreshSummary, waitingCount, findingCount } from "$lib/client/summary.svelte.js";
  import { jobs, watchJobs } from "$lib/client/jobs.svelte.js";

  let { children } = $props();
  let theme = $state("light");

  watchJobs();
  afterNavigate(() => { refreshSummary(); });
  $effect(() => {
    theme = document.documentElement.dataset.theme ?? "light";
    const timer = setInterval(refreshSummary, 20_000);
    return () => clearInterval(timer);
  });

  function toggleTheme() {
    theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("improve-theme", theme); } catch { /* private mode */ }
  }

  const running = $derived(jobs.list.filter((job) => job.status === "running").length);
  const project = $derived(summary.status?.project ?? "");
  const NAV = $derived([
    { href: "/", label: "Overview", icon: "home", match: (p) => p === "/" },
    { href: "/proposals", label: "Proposals", icon: "inbox", count: waitingCount() || null, match: (p) => p.startsWith("/proposals") },
    { href: "/findings", label: "Background findings", icon: "sparkles", count: findingCount() || null, match: (p) => p.startsWith("/findings") },
    { href: "/evals", label: "Evaluations", icon: "gauge", match: (p) => p.startsWith("/evals") },
    { href: "/objectives", label: "Objectives", icon: "target", match: (p) => p.startsWith("/objectives") },
    { href: "/runs", label: "Runs", icon: "activity", count: running ? `${running} running` : null, match: (p) => p.startsWith("/runs") }
  ]);
</script>

<div class="app">
  <aside class="sidebar" aria-label="Main">
    <div class="brand"><span class="brand-mark"><Icon name="check" size={14} /></span>improve</div>
    {#if project}
      <div class="project" title={project}>
        <div class="project-name">{project.split("/").filter(Boolean).at(-1)}</div>
        <div class="project-path">{project}</div>
      </div>
    {/if}
    <nav class="stack" style="gap:2px">
      {#each NAV as item}
        <a class="nav-link" href={item.href} aria-current={item.match(page.url.pathname) ? "page" : undefined}>
          <Icon name={item.icon} />{item.label}
          {#if item.count}<span class="count">{item.count}</span>{/if}
        </a>
      {/each}
    </nav>
    <div class="sidebar-foot">
      {#if summary.status?.eval_rig?.drifted}
        <p class="small" style="color:var(--warn)">
          This repository's eval rig is {summary.status.eval_rig.installed}; the plugin has {summary.status.eval_rig.available}.
        </p>
      {/if}
      {#if summary.error}<p class="small" style="color:var(--bad)">{summary.error}</p>{/if}
      <button class="ghost small" onclick={toggleTheme} aria-label="Switch to {theme === 'dark' ? 'light' : 'dark'} theme">
        <Icon name={theme === "dark" ? "sun" : "moon"} size={14} />{theme === "dark" ? "Light" : "Dark"} theme
      </button>
    </div>
  </aside>
  <main class="main">
    {@render children?.()}
  </main>
</div>
