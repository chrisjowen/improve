<script>
  import * as d3 from "d3";

  /** @type {{ history?: Array<{score:number, occurred_at:string}>, width?: number, height?: number }} */
  let { history = [], width = 220, height = 44 } = $props();

  const points = $derived(history.filter((d) => typeof d.score === "number"));

  const path = $derived.by(() => {
    if (points.length < 2) return "";
    const x = d3.scaleLinear().domain([0, points.length - 1]).range([2, width - 2]);
    const y = d3.scaleLinear().domain([0, 1]).range([height - 3, 3]);
    return d3.line()
      .x((_, i) => x(i))
      .y((d) => y(d.score))
      .curve(d3.curveMonotoneX)(points) ?? "";
  });

  const last = $derived(points.at(-1));
</script>

{#if points.length >= 2}
  <svg {width} {height} role="img" aria-label="Score over time">
    <line x1="2" x2={width - 2} y1={height - 3} y2={height - 3}
          stroke="hsl(var(--border))" stroke-width="1" />
    <path d={path} fill="none" stroke="hsl(var(--foreground))" stroke-width="1.75"
          stroke-linecap="round" stroke-linejoin="round" />
    {#if last}
      <circle cx={width - 2} cy={(height - 3) - last.score * (height - 6)} r="2.5"
              fill={last.score >= 0.999 ? "hsl(var(--success))" : "hsl(var(--warning))"} />
    {/if}
  </svg>
{:else if points.length === 1}
  <span class="small muted">one reading</span>
{:else}
  <span class="small muted">not yet encountered</span>
{/if}
