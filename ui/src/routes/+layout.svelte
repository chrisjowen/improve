<script>
  import "../app.css";
  import { page } from "$app/state";

  let { children } = $props();
  let status = $state(null);

  $effect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((value) => { status = value; })
      .catch(() => { status = null; });
  });
</script>

<header class="topbar">
  <strong>improve</strong>
  {#if status?.eval_rig?.drifted}
    <span class="badge badge-warning" title="The repository's copy of the eval rig is older than the plugin's">
      rig {status.eval_rig.installed} → {status.eval_rig.available}
    </span>
  {/if}
  {#if status && !status.harness_initialized}
    <span class="badge badge-warning" title="Run /improve init to create .harness">no .harness</span>
  {/if}
  <nav>
    <a href="/" aria-current={page.url.pathname === "/" ? "page" : undefined}>Suggestions</a>
    <a href="/evals" aria-current={page.url.pathname.startsWith("/evals") ? "page" : undefined}>Evaluations</a>
    <a href="/objectives" aria-current={page.url.pathname.startsWith("/objectives") ? "page" : undefined}>Objectives</a>
  </nav>
</header>

<main class="shell">
  {@render children?.()}
</main>
