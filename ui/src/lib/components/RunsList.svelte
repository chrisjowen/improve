<script>
  import Icon from "./Icon.svelte";
  import { joinArgv } from "$lib/client/argv.js";

  /**
   * The commands an eval runs, before and after a change: each one once,
   * marked when the change adds or removes it. Adding a command widens what
   * running the eval executes, so that is the line said out loud.
   */
  /** @type {{ before?: string[][], after?: string[][] }} */
  let { before = [], after = [] } = $props();

  const key = (/** @type {string[]} */ argv) => JSON.stringify(argv);
  const lines = $derived.by(() => {
    const was = new Set(before.map(key));
    const now = new Set(after.map(key));
    return [
      ...after.map((argv) => ({ argv, kind: was.has(key(argv)) ? "same" : "add" })),
      ...before.filter((argv) => !now.has(key(argv))).map((argv) => ({ argv, kind: "del" }))
    ];
  });
  const added = $derived(lines.filter((l) => l.kind === "add").length);
  const removed = $derived(lines.filter((l) => l.kind === "del").length);
</script>

{#if lines.length === 0}
  <p class="small muted row" style="gap:6px"><Icon name="eye" size={13} />No commands. Running it reads the transcript and files only.</p>
{:else}
  <ul class="runs">
    {#each lines as line}
      <li class={line.kind}>
        <span class="mark" aria-hidden="true">{line.kind === "add" ? "+" : line.kind === "del" ? "−" : ""}</span>
        <Icon name="terminal" size={12} /><code>{joinArgv(line.argv)}</code>
        {#if line.kind !== "same"}<span class="sr-only">{line.kind === "add" ? "(added)" : "(removed)"}</span>{/if}
      </li>
    {/each}
  </ul>
  {#if added}
    <p class="small" style="color:var(--warn);margin-top:6px">Adds {added === 1 ? "a command" : `${added} commands`} to what running this eval executes in the repository.</p>
  {:else if removed}
    <p class="small faint" style="margin-top:6px">Removes {removed === 1 ? "a command" : `${removed} commands`}; adds none.</p>
  {/if}
{/if}

<style>
  .runs { list-style: none; padding: 0; margin: 0; display: grid; gap: 4px; }
  .runs li { display: flex; align-items: center; gap: 8px; margin: 0; padding: 5px 10px; border-radius: var(--radius-sm); background: var(--surface-2); overflow-wrap: anywhere; }
  .runs li code { background: none; padding: 0; }
  .runs li.add { background: var(--add-bg); }
  .runs li.del { background: var(--del-bg); }
  .runs li.del code { text-decoration: line-through; color: var(--text-2); }
  .mark { width: 10px; flex: none; font: 600 12.5px var(--mono); }
  .add .mark { color: var(--ok); }
  .del .mark { color: var(--bad); }
</style>
