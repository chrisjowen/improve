<script>
  import * as d3 from "d3";

  /** @type {{ runs?: Array<any>, height?: number }} */
  let { runs = [], height = 200 } = $props();

  const width = 720;
  const margin = { top: 12, right: 16, bottom: 26, left: 34 };

  const series = $derived.by(() => {
    const byObjective = d3.group(
      runs.filter((r) => !r.malformed && typeof r.score === "number" && r.objective_id),
      (r) => r.objective_id
    );
    return [...byObjective].map(([id, values]) => ({
      id,
      values: values.slice().sort((a, b) => String(a.occurred_at).localeCompare(String(b.occurred_at)))
    }));
  });

  const maxLength = $derived(d3.max(series, (s) => s.values.length) ?? 1);
  const x = $derived(d3.scaleLinear()
    .domain([0, Math.max(maxLength - 1, 1)])
    .range([margin.left, width - margin.right]));
  const y = $derived(d3.scaleLinear()
    .domain([0, 1])
    .range([height - margin.bottom, margin.top]));
  const colour = $derived(d3.scaleOrdinal()
    .domain(series.map((s) => s.id))
    .range(["#60a5fa", "#f472b6", "#34d399", "#fbbf24", "#a78bfa", "#fb7185"]));

  function linePath(values) {
    return d3.line()
      .x((_, i) => x(i))
      .y((d) => y(d.score))
      .curve(d3.curveMonotoneX)(values) ?? "";
  }
</script>

{#if series.length}
  <svg viewBox="0 0 {width} {height}" style="width:100%;height:auto" role="img"
       aria-label="Objective scores over successive runs">
    {#each [0, 0.5, 1] as tick}
      <line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)}
            stroke="hsl(var(--border))" stroke-width="1" />
      <text x={margin.left - 8} y={y(tick) + 4} text-anchor="end" font-size="11"
            fill="hsl(var(--muted-foreground))">{tick}</text>
    {/each}
    {#each series as s}
      <path d={linePath(s.values)} fill="none" stroke={colour(s.id)} stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" />
      {#each s.values as point, i}
        <circle cx={x(i)} cy={y(point.score)} r="3" fill={colour(s.id)}>
          <title>{s.id} · {point.score.toFixed(3)} · {point.occurred_at}</title>
        </circle>
      {/each}
    {/each}
    <text x={margin.left} y={height - 6} font-size="11" fill="hsl(var(--muted-foreground))">
      oldest run
    </text>
    <text x={width - margin.right} y={height - 6} text-anchor="end" font-size="11"
          fill="hsl(var(--muted-foreground))">latest run</text>
  </svg>
  <div class="row small" style="margin-top:8px">
    {#each series as s}
      <span class="row" style="gap:5px">
        <span style="width:10px;height:10px;border-radius:2px;background:{colour(s.id)}"></span>
        {s.id}
      </span>
    {/each}
  </div>
{:else}
  <p class="empty">No scored runs yet. Run an evaluation to start a history.</p>
{/if}
