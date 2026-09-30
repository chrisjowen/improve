<script>
  /** Minimal line-level diff. A real LCS is unnecessary for reviewing one
      generated file, and this keeps the dependency list at d3 plus yaml. */
  /** @type {{ current?: string, proposed?: string }} */
  let { current = "", proposed = "" } = $props();

  const lines = $derived.by(() => {
    const a = current ? current.split("\n") : [];
    const b = proposed ? proposed.split("\n") : [];
    const out = [];
    const common = new Set(a);
    const kept = new Set(b);
    let ai = 0;
    let bi = 0;
    while (ai < a.length || bi < b.length) {
      if (ai < a.length && bi < b.length && a[ai] === b[bi]) {
        out.push({ kind: "same", text: a[ai], n: bi + 1 });
        ai += 1;
        bi += 1;
      } else if (bi < b.length && !common.has(b[bi])) {
        out.push({ kind: "add", text: b[bi], n: bi + 1 });
        bi += 1;
      } else if (ai < a.length && !kept.has(a[ai])) {
        out.push({ kind: "del", text: a[ai], n: null });
        ai += 1;
      } else if (bi < b.length) {
        out.push({ kind: "add", text: b[bi], n: bi + 1 });
        bi += 1;
      } else {
        out.push({ kind: "del", text: a[ai], n: null });
        ai += 1;
      }
    }
    return out;
  });

  const added = $derived(lines.filter((l) => l.kind === "add").length);
  const removed = $derived(lines.filter((l) => l.kind === "del").length);
</script>

<p class="small muted" style="margin:0 0 8px">
  <span style="color:hsl(var(--success))">+{added}</span>
  <span style="color:hsl(var(--destructive))">−{removed}</span>
</p>
<div class="diff">
  {#each lines as line}
    <div class="diff-line {line.kind === 'add' ? 'diff-add' : line.kind === 'del' ? 'diff-del' : ''}">
      <span>{line.kind === "del" ? "−" : line.n ?? ""}</span>
      <span>{line.text || " "}</span>
    </div>
  {/each}
</div>
