/**
 * The elements' stylesheet, inside each element's shadow root. It draws with
 * Wheelhouse's documented CSS variables only, so the elements follow its
 * light and dark themes and look as its own panels do.
 */

const tint = (v, pct) => `color-mix(in srgb, var(${v}) ${pct}%, transparent)`;

export const STYLE = `
:host { display: block; color: var(--foreground); font-family: var(--font-sans); font-size: 1rem; line-height: 1.5; }
:host([hidden]) { display: none; }
* { box-sizing: border-box; }
h2, h3, p, ul { margin: 0; padding: 0; }
ul { list-style: none; }
a { color: inherit; text-decoration: none; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.icon { width: 1em; height: 1em; flex-shrink: 0; }
.i3 { width: 0.75rem; height: 0.75rem; }
.i35 { width: 0.875rem; height: 0.875rem; }
.i4 { width: 1rem; height: 1rem; }

.muted { color: var(--muted-foreground); }
.fg { color: var(--foreground); }
.sea { color: var(--sea); }
.warn { color: var(--warning); }
.xs { font-size: 0.8125rem; line-height: 1.25rem; }
.sm { font-size: 1rem; line-height: 1.5rem; }
.tabular { font-variant-numeric: tabular-nums; }
.strong { font-weight: 600; }
.medium { font-weight: 500; }
.relaxed { line-height: 1.625; }
.clamp2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row { display: flex; align-items: center; }
.wrap { flex-wrap: wrap; }
.grow { flex: 1 1 0%; min-width: 0; }
.shrink0 { flex-shrink: 0; }
.mt1 { margin-top: 0.25rem; } .mt2 { margin-top: 0.5rem; } .mt3 { margin-top: 0.75rem; }
.mt4 { margin-top: 1rem; } .mt8 { margin-top: 2rem; }
.big { font-family: var(--font-display); font-weight: 500; line-height: 1; font-variant-numeric: tabular-nums; }

.card { border: 1px solid var(--border); border-radius: var(--radius); background: var(--card); color: var(--card-foreground); }
.section-label {
  display: flex; align-items: center; gap: 0.75rem; margin: 0;
  font-family: var(--font-display); font-size: 1.2rem; font-weight: 500; line-height: 1.75rem;
  letter-spacing: 0.1em; color: var(--muted-foreground); font-variant-caps: all-small-caps;
}
.section-label::after { content: ""; flex: 1 1 0%; min-width: 1rem; border-top: 1px solid var(--hair); }
.section-label.small { font-size: 1rem; line-height: 1.5rem; }
.count {
  border: 1px solid var(--hair); border-radius: 9999px; padding: 0 0.5rem;
  font-size: 1rem; line-height: 1.25rem; letter-spacing: normal; font-variant-caps: normal;
  font-variant-numeric: tabular-nums;
}

.chip {
  display: inline-flex; align-items: center; gap: 0.25rem; white-space: nowrap;
  border: 1px solid var(--hair); border-radius: 9999px; padding: 0.125rem 0.5rem;
  font-size: 0.8125rem; line-height: 1.25rem; color: var(--muted-foreground);
}
.chip.badge { gap: 0.375rem; padding: 0.125rem 0.625rem; font-weight: 600; }
.chip.solid-sea { border-color: var(--sea); background: var(--sea); color: var(--primary-foreground); }
.chip.solid-success { border-color: var(--success); background: var(--success); color: var(--primary-foreground); }
.chip.soft-success { border-color: ${tint("--success", 40)}; background: ${tint("--success", 10)}; color: var(--success); }
.chip.soft-sea { border-color: ${tint("--sea", 40)}; background: ${tint("--sea", 10)}; color: var(--sea); }
.chip.soft-warning { border-color: ${tint("--warning", 40)}; background: ${tint("--warning", 10)}; color: var(--warning); }
.chip.plain-fg { background: var(--muted); color: var(--foreground); }
.chip.dashed { border-style: dashed; border-color: var(--input); }
.chip.status { font-weight: 600; }
.chip.vis { font-weight: 500; }
a.chip.soft-sea { background: none; font-weight: 500; }
a.chip.soft-sea:hover { background: ${tint("--sea", 10)}; }

/* The Improvements page */
.lede { margin: -0.75rem 0 1.5rem; max-width: 65ch; }
.tiles { display: grid; gap: 0.75rem; }
@media (min-width: 640px) { .tiles { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.tile { padding: 1rem; }
.tile .big { font-size: 2.25rem; }
.problems {
  margin-top: 1rem; display: flex; flex-direction: column; gap: 0.25rem; padding: 0.75rem 1rem;
  border: 1px solid ${tint("--warning", 30)}; border-radius: var(--radius); background: ${tint("--warning", 5)};
  font-size: 1rem; line-height: 1.5rem;
}
.problems li { display: flex; gap: 0.5rem; }
.problems .icon { margin-top: 0.125rem; color: var(--warning); }
.layout { margin-top: 2rem; display: grid; column-gap: 2.5rem; row-gap: 2rem; }
@media (min-width: 1280px) { .layout { grid-template-columns: minmax(0, 3fr) minmax(0, 1fr); } }
.column { display: flex; min-width: 0; flex-direction: column; gap: 2rem; }
.column .section-label { margin-bottom: 0.75rem; }
.cards { display: grid; gap: 0.75rem; }
@media (min-width: 768px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.empty { border: 1px dashed var(--border); border-radius: var(--radius); padding: 1.5rem; }
.patterns { display: flex; flex-direction: column; gap: 0.5rem; }
.patterns summary {
  display: flex; align-items: center; gap: 0.5rem; list-style: none; cursor: pointer;
  padding: 0.5rem 0.75rem; font-size: 1rem; line-height: 1.5rem;
}
.patterns summary::-webkit-details-marker { display: none; }
.patterns .times {
  flex-shrink: 0; border-radius: 9999px; padding: 0 0.375rem; background: ${tint("--sea", 10)};
  color: var(--sea); font-size: 0.8125rem; line-height: 1.25rem; font-weight: 600; font-variant-numeric: tabular-nums;
}
.patterns .more { border-top: 1px solid var(--hair); padding: 0.5rem 0.75rem; }
.size { padding: 0.75rem; font-size: 0.8125rem; line-height: 1.25rem; }
.size .head { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; }
.meter { margin-top: 0.5rem; height: 0.375rem; overflow: hidden; border-radius: 9999px; background: var(--muted); }
.meter span { display: block; height: 100%; border-radius: 9999px; background: var(--sea); }
.meter span.over { background: var(--warning); }

/* The review badge and the evidence bar */
.bar { display: flex; overflow: hidden; border-radius: 9999px; background: var(--muted); height: 0.625rem; }
.bar.compact { height: 0.375rem; }
.bar span { height: 100%; border-right: 1px solid var(--card); }
.bar span:last-child { border-right: 0; }
.legend { margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.25rem 0.75rem; color: var(--muted-foreground); font-size: 0.8125rem; line-height: 1.25rem; }
.legend.compact { font-size: 0.7rem; line-height: 1.5; }
.legend li { display: flex; align-items: center; gap: 0.375rem; }
.dot { width: 0.5rem; height: 0.5rem; flex-shrink: 0; border-radius: 9999px; }

/* A proposal card */
.proposal {
  display: flex; height: 100%; flex-direction: column; padding: 1rem; scroll-margin-top: 6rem;
  transition: border-color 200ms;
}
.proposal:hover { border-color: color-mix(in srgb, var(--foreground) 25%, transparent); }
.proposal.waiting { border-left: 3px solid var(--sea); }
.proposal .kind {
  display: flex; width: 2rem; height: 2rem; flex-shrink: 0; align-items: center; justify-content: center;
  border: 1px solid var(--hair); border-radius: 9999px; background: var(--panel); color: var(--sea);
}
.proposal .kind-label {
  font-size: 0.95rem; font-weight: 600; letter-spacing: 0.08em; color: var(--muted-foreground);
  font-variant-caps: all-small-caps;
}
.proposal .evidence-count { margin-left: auto; }
.proposal h3 { margin-top: 0.75rem; font-family: var(--font-display); font-size: 1.15rem; line-height: 1.375; font-weight: 500; }
.proposal h3 a { border-radius: calc(var(--radius) * 0.6); }
.proposal h3 a:hover { text-decoration: underline; }
.proposal h3 .external { margin-left: 0.25rem; }
.proposal h3 .external:hover { text-decoration: none; }
.proposal h3 .icon { vertical-align: baseline; color: var(--muted-foreground); }
.proposal h3 a:hover .icon { color: var(--foreground); }
.proposal .chips { margin-top: 0.75rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.375rem; }
.proposal .foot { margin-top: auto; padding-top: 0.75rem; }
.details-toggle {
  margin: 0 -0.25rem; display: flex; align-items: center; gap: 0.25rem; border-radius: 0.25rem; padding: 0.25rem;
  font-size: 0.8125rem; line-height: 1.25rem; font-weight: 500; color: var(--muted-foreground); transition: color 150ms;
}
.details-toggle:hover { color: var(--foreground); }
.details-toggle .icon { transition: transform 200ms; }
.details-toggle[aria-expanded="true"] .icon { transform: rotate(180deg); }
.detail {
  margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.75rem; border-top: 1px solid var(--hair);
  padding-top: 0.75rem; font-size: 1rem; line-height: 1.5rem;
}
.files { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.files code {
  border: 1px solid var(--hair); border-radius: 0.25rem; background: color-mix(in srgb, var(--muted) 60%, transparent);
  padding: 0.125rem 0.375rem; font-size: 0.8125rem; line-height: 1.25rem;
}
.evidence { display: flex; flex-direction: column; border: 1px solid var(--hair); border-radius: calc(var(--radius) * 0.8); font-size: 0.8125rem; line-height: 1.25rem; }
.evidence li { display: flex; gap: 0.75rem; padding: 0.5rem 0.75rem; }
.evidence li + li { border-top: 1px solid var(--hair); }
.evidence .source { width: 7rem; flex-shrink: 0; color: var(--muted-foreground); }

/* The Harness card on the home page's rail */
.health { padding: 0.75rem; }
.health .head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.health .waits {
  margin: 0.75rem -0.25rem 0; display: flex; align-items: flex-end; gap: 0.75rem;
  border-radius: calc(var(--radius) * 0.8); padding: 0.25rem;
}
.health .waits:hover { background: color-mix(in srgb, var(--muted) 60%, transparent); }
.health .waits .big { font-size: 2.4rem; }
.health .split { margin-left: auto; display: flex; flex-direction: column; align-items: flex-end; gap: 0.125rem; padding-bottom: 0.125rem; }
.health .chips { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.375rem; }
.health .chips li { display: flex; align-items: center; gap: 0.375rem; border: 1px solid var(--hair); border-radius: 9999px; padding: 0.125rem 0.5rem; font-size: 0.8125rem; line-height: 1.25rem; }
.more-link { margin-top: 0.75rem; display: flex; align-items: center; gap: 0.25rem; font-size: 0.8125rem; line-height: 1.25rem; color: var(--muted-foreground); }
.more-link:hover { color: var(--foreground); }

/* The header pill: on wide screens only */
.pill {
  display: none; align-items: center; gap: 0.375rem; white-space: nowrap; border: 1px solid ${tint("--sea", 40)};
  border-radius: 9999px; background: ${tint("--sea", 10)}; padding: 0.25rem 0.75rem;
  font-size: 0.8125rem; line-height: 1.25rem; font-weight: 500; color: var(--sea);
}
.pill:hover { background: ${tint("--sea", 15)}; }
@media (min-width: 1280px) { .pill { display: flex; } }

.section { max-width: 48rem; }

a:focus-visible, button:focus-visible, summary:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;
