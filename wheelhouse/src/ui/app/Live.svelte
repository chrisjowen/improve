<script>
  import { untrack } from "svelte";
  import { refreshSummary } from "$lib/client/summary.svelte.js";
  import { watchJobs } from "$lib/client/jobs.svelte.js";
  import Overview from "$routes/+page.svelte";
  import Proposals from "$routes/proposals/+page.svelte";
  import Findings from "$routes/findings/+page.svelte";
  import Evals from "$routes/evals/+page.svelte";
  import Objectives from "$routes/objectives/+page.svelte";
  import Runs from "$routes/runs/+page.svelte";
  import { page } from "./router.svelte.js";

  /**
   * improve's views while its review UI answers: the page for the tab, kept
   * fresh as improve's own frame keeps it (the summary every 20 seconds and on
   * each move, the job list fast while a job runs).
   */
  /** @type {{ view: string }} */
  let { view } = $props();

  watchJobs();
  $effect(() => {
    void page.url.href;
    untrack(refreshSummary);
  });
  $effect(() => {
    const timer = setInterval(refreshSummary, 20_000);
    return () => clearInterval(timer);
  });

  /** @type {Record<string, any>} */
  const PAGES = { "/": Overview, "/proposals": Proposals, "/findings": Findings, "/evals": Evals, "/objectives": Objectives, "/runs": Runs };
  const Page = $derived(PAGES[view] ?? Overview);
</script>

{#key view}<Page />{/key}
