<script>
  import * as d3 from "d3";

  /** @type {{ steps?: Array<any> }} */
  let { steps = [] } = $props();

  const rows = $derived(steps.map((step) => ({
    id: step.id,
    score: typeof step.result?.score === "number" ? step.result.score : 0,
    status: step.status,
    passed: step.passed,
    threshold: step.threshold ?? 1
  })));

  const width = 520;
  const rowHeight = 26;
  const labelWidth = 170;
  const height = $derived(Math.max(rows.length * rowHeight, rowHeight));
  const x = $derived(d3.scaleLinear().domain([0, 1]).range([0, width - labelWidth - 54]));
</script>

{#if rows.length}
  <svg viewBox="0 0 {width} {height}" style="width:100%;max-width:{width}px;height:auto" role="img" aria-label="Score by evaluation step">
    {#each rows as row, i}
      <g transform="translate(0,{i * rowHeight})">
        <text x="0" y={rowHeight / 2 + 4} font-size="12" fill="var(--text-3)">
          {row.id.length > 24 ? `${row.id.slice(0, 23)}…` : row.id}
        </text>
        <rect x={labelWidth} y={rowHeight / 2 - 6} width={x(1)} height="12" rx="3"
              fill="var(--surface-2)" />
        <rect x={labelWidth} y={rowHeight / 2 - 6} width={Math.max(x(row.score), row.score > 0 ? 2 : 0)}
              height="12" rx="3"
              fill={row.status !== "completed"
                ? "var(--text-3)"
                : row.passed ? "var(--ok)" : "var(--bad)"} />
        <line x1={labelWidth + x(row.threshold)} x2={labelWidth + x(row.threshold)}
              y1={rowHeight / 2 - 9} y2={rowHeight / 2 + 9}
              stroke="var(--text)" stroke-width="1" stroke-dasharray="2 2" opacity="0.5" />
        <text x={labelWidth + x(1) + 10} y={rowHeight / 2 + 4} font-size="12"
              font-variant-numeric="tabular-nums" fill="var(--text)">
          {row.status === "completed" ? row.score.toFixed(2) : row.status}
        </text>
      </g>
    {/each}
  </svg>
{/if}
