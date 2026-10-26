<script>
  /**
   * A unified line diff in the GitHub style: old and new line numbers, and
   * unchanged runs folded to three lines of context either side.
   *
   * Longest common subsequence over lines. A drafted SKILL.md is a few hundred
   * lines at most, so the quadratic table is cheap and needs no dependency.
   */
  /** @type {{ current?: string, proposed?: string, path?: string }} */
  let { current = "", proposed = "", path = "" } = $props();
  const CONTEXT = 3;
  let expanded = $state(new Set());

  /**
   * @param {string[]} a
   * @param {string[]} b
   */
  function diffLines(a, b) {
    const n = a.length;
    const m = b.length;
    const table = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i -= 1) {
      for (let j = m - 1; j >= 0; j -= 1) {
        table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
    const out = [];
    let i = 0;
    let j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[i] === b[j]) {
        out.push({ kind: "same", text: a[i], old: i + 1, new: j + 1 });
        i += 1; j += 1;
      } else if (j < m && (i >= n || table[i][j + 1] >= table[i + 1][j])) {
        out.push({ kind: "add", text: b[j], old: null, new: j + 1 });
        j += 1;
      } else {
        out.push({ kind: "del", text: a[i], old: i + 1, new: null });
        i += 1;
      }
    }
    return out;
  }

  const split = (/** @type {string} */ text) => (text ? text.replace(/\n$/, "").split("\n") : []);
  const lines = $derived(diffLines(split(current), split(proposed)));
  const added = $derived(lines.filter((l) => l.kind === "add").length);
  const removed = $derived(lines.filter((l) => l.kind === "del").length);

  /** Rows to render: lines, plus a fold marker for each long unchanged run. */
  const rows = $derived.by(() => {
    const keep = lines.map((line, index) => line.kind !== "same"
      || lines.slice(Math.max(0, index - CONTEXT), index + CONTEXT + 1).some((l) => l.kind !== "same"));
    const out = [];
    let index = 0;
    while (index < lines.length) {
      if (keep[index] || expanded.has(index)) {
        out.push({ line: lines[index] });
        index += 1;
        continue;
      }
      const start = index;
      while (index < lines.length && !keep[index] && !expanded.has(index)) index += 1;
      out.push({ fold: { start, end: index } });
    }
    return out;
  });

  /** @param {{ start: number, end: number }} fold */
  function unfold(fold) {
    const next = new Set(expanded);
    for (let i = fold.start; i < fold.end; i += 1) next.add(i);
    expanded = next;
  }
</script>

<div class="diff">
  <div class="diff-head">
    <span class="mono diff-path">{path}</span>
    <span class="num small"><span class="plus">+{added}</span> <span class="minus">−{removed}</span></span>
  </div>
  {#if lines.length === 0}
    <p class="empty small">Both versions are empty.</p>
  {:else}
    <table>
      <tbody>
        {#each rows as row}
          {#if row.fold}
            <tr class="fold">
              <td colspan="3">
                <button class="ghost small" onclick={() => unfold(row.fold)}>
                  Show {row.fold.end - row.fold.start} unchanged lines
                </button>
              </td>
            </tr>
          {:else}
            <tr class={row.line.kind}>
              <td class="ln">{row.line.old ?? ""}</td>
              <td class="ln">{row.line.new ?? ""}</td>
              <td class="code"><span class="sign" aria-hidden="true">{row.line.kind === "add" ? "+" : row.line.kind === "del" ? "−" : " "}</span>{row.line.text || " "}<span class="sr-only">{row.line.kind === "add" ? " (added)" : row.line.kind === "del" ? " (removed)" : ""}</span></td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .diff { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; background: var(--surface); }
  .diff-head { display: flex; justify-content: space-between; gap: 12px; padding: 8px 12px; background: var(--surface-2); border-bottom: 1px solid var(--border); }
  .diff-path { overflow-wrap: anywhere; }
  .plus { color: var(--ok); font-weight: 600; }
  .minus { color: var(--bad); font-weight: 600; }
  table { font: 12.5px/1.6 var(--mono); table-layout: fixed; }
  td { padding: 0 10px; border: 0; vertical-align: top; }
  .ln { width: 46px; text-align: right; color: var(--text-3); user-select: none; padding: 0 8px; }
  .code { white-space: pre-wrap; overflow-wrap: anywhere; }
  .sign { display: inline-block; width: 14px; color: var(--text-3); user-select: none; }
  tr.add td { background: var(--add-bg); }
  tr.add .ln { background: var(--add-gutter); }
  tr.del td { background: var(--del-bg); }
  tr.del .ln { background: var(--del-gutter); }
  tr.fold td { background: var(--surface-2); padding: 2px 8px; color: var(--text-2); }
</style>
