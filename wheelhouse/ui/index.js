// Built from wheelhouse/src by wheelhouse/build.mjs; do not edit. Run `npm run build` in wheelhouse/.

// src/urls.mjs
var IMPROVEMENTS = "/plugins/improve/improvements";

// src/words.mjs
var GROUPS = [
  { id: "waiting", label: "Waiting for your call" },
  { id: "drafting", label: "Being drafted" },
  { id: "approved", label: "Approved, not applied yet" },
  { id: "done", label: "Applied" },
  { id: "declined", label: "Rejected or rolled back" }
];
var plural = (n, one2, many = `${one2}s`) => `${n} ${n === 1 ? one2 : many}`;
function since(iso, now) {
  const s = Math.max(0, (now - Date.parse(iso)) / 1e3);
  if (s < 3600) return "within the hour";
  if (s < 86400) return plural(Math.floor(s / 3600), "hour") + " ago";
  return plural(Math.floor(s / 86400), "day") + " ago";
}
var chipText = (s, max2 = 56) => s.length > max2 ? `${s.slice(0, max2 - 1).trimEnd()}\u2026` : s;

// src/ui/dom.mjs
function h(tag2, attrs = null, ...children) {
  const el = document.createElement(tag2);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === null || v === void 0 || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(
      k.slice(2),
      /** @type {EventListener} */
      v
    );
    else if (k === "href") {
      const href = safeHref(String(v));
      if (href) el.setAttribute("href", href);
    } else el.setAttribute(k, v === true ? "" : String(v));
  }
  append(el, children);
  return el;
}
function append(el, children) {
  for (const c of children.flat()) {
    if (c === null || c === void 0 || c === false) continue;
    el.append(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  }
}
function safeHref(href) {
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    const u = new URL(href);
    return u.protocol === "https:" || u.protocol === "http:" ? href : null;
  } catch {
    return null;
  }
}
var SVG = "http://www.w3.org/2000/svg";
function icon(node, cls = "icon", label = null) {
  const svg = document.createElementNS(SVG, "svg");
  for (const [k, v] of Object.entries({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    class: cls
  }))
    svg.setAttribute(k, v);
  if (label) {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", label);
  } else svg.setAttribute("aria-hidden", "true");
  for (const [tag2, attrs] of node) {
    const part = document.createElementNS(SVG, tag2);
    for (const [k, v] of Object.entries(attrs)) part.setAttribute(k, v);
    svg.append(part);
  }
  return svg;
}

// node_modules/lucide/dist/esm/icons/arrow-right.mjs
var ArrowRight = [
  ["path", { d: "M5 12h14" }],
  ["path", { d: "m12 5 7 7-7 7" }]
];

// node_modules/lucide/dist/esm/icons/arrow-up-right.mjs
var ArrowUpRight = [
  ["path", { d: "M7 7h10v10" }],
  ["path", { d: "M7 17 17 7" }]
];

// node_modules/lucide/dist/esm/icons/book-open.mjs
var BookOpen = [
  ["path", { d: "M12 5v16" }],
  [
    "path",
    {
      d: "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"
    }
  ]
];

// node_modules/lucide/dist/esm/icons/calendar-check.mjs
var CalendarCheck = [
  ["path", { d: "M8 2v3" }],
  ["path", { d: "M16 2v3" }],
  ["rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }],
  ["path", { d: "M3 9h18" }],
  ["path", { d: "m9 15 2 2 4-4" }]
];

// node_modules/lucide/dist/esm/icons/calendar-clock.mjs
var CalendarClock = [
  ["path", { d: "M16 14v2.2l1.6 1" }],
  ["path", { d: "M16 2v3" }],
  ["path", { d: "M21 7.338V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h2.338" }],
  ["path", { d: "M3 9h5.859" }],
  ["path", { d: "M8 2v3" }],
  ["circle", { cx: "16", cy: "16", r: "6" }]
];

// node_modules/lucide/dist/esm/icons/calendar-off.mjs
var CalendarOff = [
  ["path", { d: "M16 2v3" }],
  ["path", { d: "m2 2 20 20" }],
  ["path", { d: "M21 9h-5.5" }],
  ["path", { d: "M3 9h6" }],
  ["path", { d: "M3.586 3.586A2 2 0 003 5v14a2 2 0 002 2h14a2 2 0 001.414-.586" }],
  ["path", { d: "M8.656 3H19a2 2 0 012 2v10.344" }]
];

// node_modules/lucide/dist/esm/icons/chevron-down.mjs
var ChevronDown = [["path", { d: "m6 9 6 6 6-6" }]];

// node_modules/lucide/dist/esm/icons/file-search.mjs
var FileSearch = [
  [
    "path",
    {
      d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
    }
  ],
  ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
  ["circle", { cx: "11.5", cy: "14.5", r: "2.5" }],
  ["path", { d: "M13.3 16.3 15 18" }]
];

// node_modules/lucide/dist/esm/icons/file-text.mjs
var FileText = [
  [
    "path",
    {
      d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
    }
  ],
  ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }],
  ["path", { d: "M10 9H8" }],
  ["path", { d: "M16 13H8" }],
  ["path", { d: "M16 17H8" }]
];

// node_modules/lucide/dist/esm/icons/git-pull-request.mjs
var GitPullRequest = [
  ["circle", { cx: "18", cy: "18", r: "3" }],
  ["circle", { cx: "6", cy: "6", r: "3" }],
  ["path", { d: "M13 6h3a2 2 0 0 1 2 2v7" }],
  ["line", { x1: "6", x2: "6", y1: "9", y2: "21" }]
];

// node_modules/lucide/dist/esm/icons/hand.mjs
var Hand = [
  ["path", { d: "M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" }],
  ["path", { d: "M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" }],
  ["path", { d: "M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" }],
  [
    "path",
    {
      d: "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"
    }
  ]
];

// node_modules/lucide/dist/esm/icons/info.mjs
var Info = [
  ["circle", { cx: "12", cy: "12", r: "10" }],
  ["path", { d: "M12 16v-4" }],
  ["path", { d: "M12 8h.01" }]
];

// node_modules/lucide/dist/esm/icons/lock.mjs
var Lock = [
  ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2" }],
  ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4" }]
];

// node_modules/lucide/dist/esm/icons/message-square-text.mjs
var MessageSquareText = [
  [
    "path",
    {
      d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"
    }
  ],
  ["path", { d: "M7 11h10" }],
  ["path", { d: "M7 15h6" }],
  ["path", { d: "M7 7h8" }]
];

// node_modules/lucide/dist/esm/icons/notebook-pen.mjs
var NotebookPen = [
  ["path", { d: "M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" }],
  ["path", { d: "M2 6h4" }],
  ["path", { d: "M2 10h4" }],
  ["path", { d: "M2 14h4" }],
  ["path", { d: "M2 18h4" }],
  [
    "path",
    {
      d: "M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"
    }
  ]
];

// node_modules/lucide/dist/esm/icons/scroll-text.mjs
var ScrollText = [
  ["path", { d: "M15 12h-5" }],
  ["path", { d: "M15 8h-5" }],
  ["path", { d: "M19 17V5a2 2 0 0 0-2-2H4" }],
  [
    "path",
    {
      d: "M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"
    }
  ]
];

// node_modules/lucide/dist/esm/icons/settings-2.mjs
var Settings2 = [
  ["path", { d: "M14 17H5" }],
  ["path", { d: "M19 7h-9" }],
  ["circle", { cx: "17", cy: "17", r: "3" }],
  ["circle", { cx: "7", cy: "7", r: "3" }]
];

// node_modules/lucide/dist/esm/icons/sliders-horizontal.mjs
var SlidersHorizontal = [
  ["path", { d: "M10 5H3" }],
  ["path", { d: "M12 19H3" }],
  ["path", { d: "M14 3v4" }],
  ["path", { d: "M16 17v4" }],
  ["path", { d: "M21 12h-9" }],
  ["path", { d: "M21 19h-5" }],
  ["path", { d: "M21 5h-7" }],
  ["path", { d: "M8 10v4" }],
  ["path", { d: "M8 12H3" }]
];

// node_modules/lucide/dist/esm/icons/split.mjs
var Split = [
  ["path", { d: "M16 3h5v5" }],
  ["path", { d: "M8 3H3v5" }],
  ["path", { d: "M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" }],
  ["path", { d: "m15 9 6-6" }]
];

// node_modules/lucide/dist/esm/icons/square-terminal.mjs
var SquareTerminal = [
  ["path", { d: "m7 11 2-2-2-2" }],
  ["path", { d: "M11 13h4" }],
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }]
];

// node_modules/lucide/dist/esm/icons/wrench.mjs
var Wrench = [
  [
    "path",
    {
      d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"
    }
  ]
];

// src/ui/parts.mjs
var KIND_ICON = {
  instructions: ScrollText,
  skill: BookOpen,
  script: SquareTerminal,
  preference: SlidersHorizontal,
  memory: NotebookPen,
  settings: Settings2,
  docs: FileText,
  other: Wrench
};
var VIS_CHIP = {
  "captain-private": { icon: Lock, cls: "plain-fg" },
  "shared-tracked": { icon: GitPullRequest, cls: "soft-sea" },
  mixed: { icon: Split, cls: "soft-warning" }
};
var STATUS_CHIP = {
  waiting: "solid-sea",
  drafting: "dashed",
  approved: "soft-success",
  done: "solid-success",
  declined: ""
};
var MIX_COLOR = {
  ask_user_findings: "var(--seg-review, var(--foreground))",
  decisions: "var(--sea)",
  blockers: "var(--warning)",
  captain_preferences: "var(--brass)",
  learnings: "var(--seg-ci, var(--success))"
};
function reviewBadge(review) {
  const b = review.due === true ? { icon: CalendarClock, label: "Review due", cls: "solid-sea" } : review.due === false ? { icon: CalendarCheck, label: "No review due", cls: "soft-success" } : { icon: CalendarOff, label: "Not scheduled", cls: "" };
  return h("span", { class: `chip badge ${b.cls}`, title: review.headline }, icon(b.icon, "icon i35"), b.label);
}
function evidenceBar(mix, compact = false) {
  const sorted = [...mix].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((n, m) => n + m.value, 0);
  if (total <= 0) return [];
  const label = sorted.map((m) => `${m.value} ${m.label.toLowerCase()}`).join(", ");
  const color2 = (key2) => MIX_COLOR[key2] ?? "var(--muted-foreground)";
  const bar = h("div", { class: `bar${compact ? " compact" : ""}`, role: "img", "aria-label": `What improve read: ${label}` });
  for (const m of sorted) {
    const s = h("span");
    s.style.width = `${m.value / total * 100}%`;
    s.style.background = color2(m.key);
    bar.append(s);
  }
  const legend = h(
    "ul",
    { class: `legend${compact ? " compact" : ""}`, "aria-hidden": "true" },
    sorted.map((m) => {
      const dot = h("span", { class: "dot" });
      dot.style.background = color2(m.key);
      return h("li", null, dot, m.label, " ", h("span", { class: "tabular medium fg" }, m.value));
    })
  );
  return [bar, legend];
}
function proposalCard(p, o) {
  const evidence = `${p.evidence.length} ${p.evidence.length === 1 ? "piece" : "pieces"} of evidence`;
  const vis = p.visibility ? VIS_CHIP[p.visibility] : null;
  const detailId = `detail-${p.file}`;
  const title = [
    h("a", { href: p.reviewHref, title: "Open on the Proposals tab" }, p.title),
    p.openUrl ? h("a", { class: "external", href: p.openUrl, target: "_blank", rel: "noreferrer", title: "Open in improve\u2019s own UI", "aria-label": "Open in improve\u2019s own UI" }, icon(ArrowUpRight, "icon i35")) : null
  ];
  const chips = [
    h("span", { class: `chip status ${STATUS_CHIP[p.group]}` }, p.statusShort),
    h("span", { class: `chip vis ${vis?.cls ?? ""}`, title: p.visibilityLabel }, vis ? icon(vis.icon, "icon i3") : null, p.visibilityShort)
  ];
  if (p.decision) {
    chips.push(
      (o.showDecisionLink ?? true) && p.decision.href ? h("a", { class: "chip soft-sea", href: p.decision.href, title: "Open the decision task" }, icon(Hand, "icon i3"), p.decision.state) : h("span", { class: "chip" }, icon(Hand, "icon i3"), p.decision.state)
    );
  } else if (p.routing && p.waiting) {
    chips.push(h("span", { class: "chip dashed", title: p.routing }, "Not filed yet"));
  }
  const toggle = h(
    "button",
    { class: "details-toggle", type: "button", "aria-expanded": String(o.open), "aria-controls": detailId },
    "Details",
    icon(ChevronDown, "icon i35")
  );
  toggle.addEventListener("click", () => o.onToggle(!o.open));
  const card = h(
    "article",
    { id: p.file, class: `card proposal${p.waiting ? " waiting" : ""}` },
    h(
      "div",
      { class: "row", style: "gap:0.5rem" },
      h("span", { class: "kind", "aria-hidden": "true" }, icon(KIND_ICON[p.kind] ?? Wrench, "icon i4")),
      h("span", { class: "kind-label" }, p.kindLabel),
      h("span", { class: "chip evidence-count", title: evidence, "aria-label": evidence }, icon(FileSearch, "icon i35"), h("span", { class: "tabular medium" }, p.evidence.length))
    ),
    h("h3", null, title),
    p.summary ? h("p", { class: "mt1 clamp2 sm relaxed muted" }, p.summary) : null,
    h("div", { class: "chips" }, chips),
    h("div", { class: "foot" }, toggle)
  );
  if (o.open) card.append(details(p, detailId));
  return card;
}
function details(p, id) {
  return h(
    "div",
    { id, class: "detail" },
    p.changes ? h("p", { class: "relaxed" }, p.changes) : null,
    p.files.length ? h("div", { class: "files" }, p.files.map((f) => h("code", null, f))) : null,
    h(
      "p",
      { class: "xs relaxed muted" },
      [p.surfaces.length ? `Changes ${p.surfaces.join(", ")}.` : null, p.deliveryLabel, p.routing].filter(Boolean).join(" ")
    ),
    p.why ? h(
      "p",
      { class: "xs relaxed" },
      h("span", { class: "strong" }, "Why:"),
      ` ${p.why}`,
      p.confidence ? h("span", { class: "muted" }, ` (confidence ${p.confidence})`) : null
    ) : null,
    p.evidence.length ? h(
      "ul",
      { class: "evidence" },
      p.evidence.map((e) => h("li", null, h("span", { class: "source" }, e.source), h("span", { style: "min-width:0" }, e.observation)))
    ) : null
  );
}

// src/ui/style.mjs
var tint = (v, pct) => `color-mix(in srgb, var(${v}) ${pct}%, transparent)`;
var STYLE = `
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

// ../ui/src/lib/styles.css
var styles_default = `/* Everything but the page itself: elements, the frame, surfaces, controls and
   data, drawn with the tokens app.css defines. Kept apart from app.css so
   improve's Wheelhouse plugin can draw the same pages in its own shadow root
   with Wheelhouse's tokens (wheelhouse/src/ui/app/theme.mjs). */
* { box-sizing: border-box; }
h1, h2, h3, h4 { margin: 0; font-weight: 600; letter-spacing: -0.01em; line-height: 1.3; }
h1 { font-size: 20px; }
h2 { font-size: 15px; }
h3 { font-size: 14px; }
p { margin: 0; }
a { color: var(--accent-text); text-decoration: none; }
a:hover { text-decoration: underline; }
code, pre, .mono { font-family: var(--mono); font-size: 12.5px; }
code { background: var(--surface-2); padding: 1px 5px; border-radius: 4px; overflow-wrap: anywhere; }
ul { margin: 0; padding-left: 18px; }
li + li { margin-top: 4px; }

:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: 4px; }

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}

/* ---- app frame ------------------------------------------------------- */

.app { display: grid; grid-template-columns: var(--sidebar) minmax(0, 1fr); min-height: 100vh; }

.sidebar {
  position: sticky; top: 0; height: 100vh;
  display: flex; flex-direction: column; gap: 4px;
  padding: 16px 12px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  overflow-y: auto;
}
.brand { display: flex; align-items: center; gap: 8px; padding: 4px 8px 12px; font-weight: 650; font-size: 15px; }
.brand-mark { width: 22px; height: 22px; border-radius: 6px; background: var(--accent); color: var(--on-accent); display: grid; place-items: center; }
.project { padding: 0 8px 14px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
.project-name { font-weight: 600; overflow-wrap: anywhere; }
.project-path { color: var(--text-3); font-size: 12px; overflow-wrap: anywhere; }

.nav-link {
  display: flex; align-items: center; gap: 10px;
  min-height: 34px; padding: 6px 10px; border-radius: var(--radius-sm);
  color: var(--text-2); font-weight: 500;
}
.nav-link:hover { background: var(--surface-hover); color: var(--text); text-decoration: none; }
.nav-link[aria-current="page"] { background: var(--accent-soft); color: var(--accent-text); }
.nav-link .count { margin-left: auto; font-size: 12px; font-variant-numeric: tabular-nums; color: var(--text-3); }
.nav-link[aria-current="page"] .count { color: var(--accent-text); }
.sidebar-foot { margin-top: auto; padding: 12px 8px 0; border-top: 1px solid var(--border); display: grid; gap: 8px; }

.main { min-width: 0; padding: 28px 36px 64px; }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
.page-head p { color: var(--text-2); margin-top: 4px; max-width: 72ch; }

@media (max-width: 860px) {
  .app { grid-template-columns: 1fr; }
  .sidebar { position: static; height: auto; flex-direction: row; flex-wrap: wrap; align-items: center; border-right: 0; border-bottom: 1px solid var(--border); }
  .project, .sidebar-foot { display: none; }
  .brand { padding: 4px 8px; }
  .sidebar > nav { flex-direction: row; flex-wrap: nowrap; overflow-x: auto; width: 100%; }
  .sidebar > nav .nav-link { flex: none; }
  .main { padding: 20px 16px 48px; }
}

/* ---- surfaces -------------------------------------------------------- */

.panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.panel-head h2 { display: flex; align-items: center; gap: 8px; }
.panel-body { padding: 16px; }
.panel + .panel { margin-top: 16px; }

.grid { display: grid; gap: 16px; }
.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.cols-main { grid-template-columns: minmax(0, 1.6fr) minmax(320px, 1fr); }
@media (max-width: 1100px) { .cols-2, .cols-3, .cols-main { grid-template-columns: 1fr; } }

.stack { display: flex; flex-direction: column; gap: 12px; }
.row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.spread { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.grow { flex: 1; min-width: 0; }
.muted { color: var(--text-2); }
.faint { color: var(--text-3); }
.small { font-size: 12.5px; }
.prose { max-width: 75ch; }
.num { font-variant-numeric: tabular-nums; }
.section-label { font-size: 12px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }

/* A list of rows inside a panel: the Linear issue list. */
.list { list-style: none; margin: 0; padding: 0; }
.list > li { margin: 0; border-top: 1px solid var(--border); }
.list > li:first-child { border-top: 0; }
.list-row {
  display: flex; align-items: center; gap: 12px;
  width: 100%; min-height: 44px; padding: 10px 16px;
  color: var(--text); background: none; border: 0; text-align: left; font: inherit; cursor: pointer;
}
.list-row:hover { background: var(--surface-hover); text-decoration: none; }
.list-row[aria-current="true"] { background: var(--accent-soft); }
.list-row .title { flex: 1; min-width: 0; font-weight: 500; overflow-wrap: anywhere; }
.list-row .meta { color: var(--text-3); font-size: 12.5px; white-space: nowrap; }

/* ---- status ---------------------------------------------------------- */

.pill {
  display: inline-flex; align-items: center; gap: 6px;
  height: 22px; padding: 0 8px; border-radius: 999px;
  font-size: 12px; font-weight: 500; white-space: nowrap;
  background: var(--info-soft); color: var(--info);
}
.pill::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.pill.plain::before { display: none; }
.pill.ok { background: var(--ok-soft); color: var(--ok); }
.pill.warn { background: var(--warn-soft); color: var(--warn); }
.pill.bad { background: var(--bad-soft); color: var(--bad); }
.pill.accent { background: var(--accent-soft); color: var(--accent-text); }
.pill.live::before { animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: 0.3; } }

.notice { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface-2); color: var(--text); }
.notice.ok { background: var(--ok-soft); border-color: transparent; }
.notice.warn { background: var(--warn-soft); border-color: transparent; }
.notice.bad { background: var(--bad-soft); border-color: transparent; }
.notice .notice-icon { flex: none; margin-top: 2px; }
.notice.ok .notice-icon { color: var(--ok); }
.notice.warn .notice-icon { color: var(--warn); }
.notice.bad .notice-icon { color: var(--bad); }

/* ---- controls -------------------------------------------------------- */

button, .button {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 34px; padding: 0 14px;
  border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
  background: var(--surface); color: var(--text);
  font: inherit; font-weight: 500; cursor: pointer; white-space: nowrap;
  transition: background 150ms, border-color 150ms;
}
button:hover:not(:disabled), .button:hover { background: var(--surface-hover); text-decoration: none; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
button.primary { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
button.primary:hover:not(:disabled) { background: var(--accent); filter: brightness(1.08); }
button.danger { color: var(--bad); }
button.danger:hover:not(:disabled) { background: var(--bad-soft); border-color: var(--bad); }
button.ghost { border-color: transparent; background: none; color: var(--text-2); }
button.ghost:hover:not(:disabled) { background: var(--surface-hover); color: var(--text); }
button.small { min-height: 28px; padding: 0 10px; font-size: 12.5px; }

input, select, textarea {
  width: 100%; min-height: 36px; padding: 0 10px;
  border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
  background: var(--surface); color: var(--text); font: inherit;
}
textarea { padding: 8px 10px; resize: vertical; line-height: 1.5; }
input:focus, select:focus, textarea:focus { outline: 2px solid var(--focus); outline-offset: -1px; border-color: transparent; }
label, .label { display: block; font-size: 12.5px; font-weight: 600; color: var(--text-2); margin-bottom: 6px; }
.help { font-size: 12.5px; color: var(--text-3); margin-top: 6px; }
.field-error { font-size: 12.5px; color: var(--bad); margin-top: 6px; }
.check { display: flex; align-items: flex-start; gap: 8px; font-weight: 400; color: var(--text); cursor: pointer; }
.check input { width: 16px; min-height: 16px; height: 16px; margin-top: 2px; flex: none; }

.segmented { display: inline-flex; padding: 2px; border-radius: var(--radius-sm); background: var(--surface-2); border: 1px solid var(--border); }
.segmented button { min-height: 28px; border: 0; background: none; color: var(--text-2); padding: 0 10px; font-size: 12.5px; }
.segmented button[aria-pressed="true"] { background: var(--surface); color: var(--text); box-shadow: var(--shadow); outline: 1px solid var(--border); }

/* ---- data ------------------------------------------------------------ */

.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 10px 16px; border-bottom: 1px solid var(--border); vertical-align: top; }
th { font-size: 12px; font-weight: 600; color: var(--text-3); background: var(--surface-2); white-space: nowrap; }
tbody tr:last-child td { border-bottom: 0; }
tbody tr.clickable { cursor: pointer; }
tbody tr.clickable:hover td { background: var(--surface-hover); }

.kv { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 6px 16px; }
.kv dt { color: var(--text-3); font-size: 12.5px; }
.kv dd { margin: 0; overflow-wrap: anywhere; }

.stat-value { font-size: 26px; font-weight: 650; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; line-height: 1.2; }

.progress { height: 6px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
.progress > span { display: block; height: 100%; background: var(--accent); transition: width 300ms ease-out; }
.progress.indeterminate > span { width: 30%; animation: slide 1.2s ease-in-out infinite; }
@keyframes slide { from { transform: translateX(-100%); } to { transform: translateX(330%); } }

.log {
  margin: 0; padding: 12px 14px; max-height: 420px; overflow: auto;
  background: var(--surface-2); border-radius: var(--radius-sm); border: 1px solid var(--border);
  font: 12px/1.6 var(--mono); white-space: pre-wrap; overflow-wrap: anywhere; color: var(--text);
}

.empty { padding: 28px 16px; color: var(--text-2); }
.empty strong { display: block; color: var(--text); margin-bottom: 4px; }

.chip { display: inline-flex; align-items: center; gap: 6px; min-height: 24px; padding: 2px 8px; border-radius: var(--radius-sm); background: var(--surface-2); border: 1px solid var(--border); font: 12px var(--mono); overflow-wrap: anywhere; }
.chip.outside { color: var(--bad); border-color: var(--bad); background: var(--bad-soft); }

.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;

// src/ui/app/theme.mjs
var soft = (v, pct) => `color-mix(in srgb, var(${v}) ${pct}%, var(--card))`;
var TOKENS = `
:host { display: block; --surface-hover: var(--accent); }
.improve-app {
  --bg: var(--background);
  --surface: var(--card);
  --surface-2: ${soft("--muted", 70)};
  --text: var(--card-foreground);
  --text-2: var(--muted-foreground);
  --text-3: color-mix(in srgb, var(--muted-foreground) 82%, var(--card));
  --border-strong: var(--input);
  --accent: var(--sea);
  --accent-text: var(--sea);
  --accent-soft: ${soft("--sea", 12)};
  --on-accent: var(--primary-foreground);
  --ok: var(--success);
  --ok-soft: ${soft("--success", 12)};
  --warn: var(--warning);
  --warn-soft: ${soft("--warning", 12)};
  --bad: var(--danger);
  --bad-soft: ${soft("--danger", 12)};
  --info: var(--muted-foreground);
  --info-soft: var(--muted);
  --add-bg: ${soft("--success", 10)};
  --add-gutter: ${soft("--success", 20)};
  --del-bg: ${soft("--danger", 10)};
  --del-gutter: ${soft("--danger", 20)};
  --focus: var(--ring);
  --radius-sm: calc(var(--radius) * 0.75);
  --shadow: none;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  --sans: var(--font-sans);
  color: var(--text);
  font: 14px/1.55 var(--sans);
}
`;
var FRAME = `
.tabs { display: flex; gap: 2px; overflow-x: auto; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
.tabs a {
  display: inline-flex; align-items: center; gap: 8px; flex: none; min-height: 38px; padding: 6px 12px;
  border-bottom: 2px solid transparent; margin-bottom: -1px; color: var(--text-2); font-weight: 500;
}
.tabs a:hover { color: var(--text); text-decoration: none; background: var(--surface-hover); }
.tabs a[aria-current="page"] { color: var(--accent-text); border-bottom-color: var(--accent); }
.tabs .count { font-size: 12px; font-variant-numeric: tabular-nums; color: var(--text-3); }
.tabs a[aria-current="page"] .count { color: var(--accent-text); }
.strip { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px; margin: -8px 0 16px; }
.page-head h1 { font-size: 18px; }
.connect { max-width: 72ch; }
.connect .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 12px; }
.connect pre { margin: 8px 0 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
`;
var APP_STYLE = TOKENS + styles_default + FRAME;

// node_modules/svelte/src/constants.js
var EACH_ITEM_REACTIVE = 1;
var EACH_INDEX_REACTIVE = 1 << 1;
var EACH_IS_CONTROLLED = 1 << 2;
var EACH_IS_ANIMATED = 1 << 3;
var EACH_ITEM_IMMUTABLE = 1 << 4;
var PROPS_IS_IMMUTABLE = 1;
var PROPS_IS_RUNES = 1 << 1;
var PROPS_IS_UPDATED = 1 << 2;
var PROPS_IS_BINDABLE = 1 << 3;
var PROPS_IS_LAZY_INITIAL = 1 << 4;
var TRANSITION_OUT = 1 << 1;
var TRANSITION_GLOBAL = 1 << 2;
var TEMPLATE_FRAGMENT = 1;
var TEMPLATE_USE_IMPORT_NODE = 1 << 1;
var TEMPLATE_USE_SVG = 1 << 2;
var TEMPLATE_USE_MATHML = 1 << 3;
var HYDRATION_START = "[";
var HYDRATION_START_ELSE = "[!";
var HYDRATION_START_FAILED = "[?";
var HYDRATION_END = "]";
var HYDRATION_ERROR = {};
var ELEMENT_PRESERVE_ATTRIBUTE_CASE = 1 << 1;
var ELEMENT_IS_INPUT = 1 << 2;
var UNINITIALIZED = /* @__PURE__ */ Symbol("uninitialized");
var FILENAME = /* @__PURE__ */ Symbol("filename");
var NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";

// node_modules/esm-env/dev-fallback.js
var node_env = globalThis.process?.env?.NODE_ENV;
var dev_fallback_default = node_env && !node_env.toLowerCase().startsWith("prod");

// node_modules/svelte/src/internal/shared/utils.js
var is_array = Array.isArray;
var index_of = Array.prototype.indexOf;
var includes = Array.prototype.includes;
var array_from = Array.from;
var object_keys = Object.keys;
var define_property = Object.defineProperty;
var get_descriptor = Object.getOwnPropertyDescriptor;
var get_descriptors = Object.getOwnPropertyDescriptors;
var object_prototype = Object.prototype;
var array_prototype = Array.prototype;
var get_prototype_of = Object.getPrototypeOf;
var is_extensible = Object.isExtensible;
var noop = () => {
};
function run_all(arr) {
  for (var i = 0; i < arr.length; i++) {
    arr[i]();
  }
}
function deferred() {
  var resolve;
  var reject;
  var promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
function to_array(value, n) {
  if (Array.isArray(value)) {
    return value;
  }
  if (n === void 0 || !(Symbol.iterator in value)) {
    return Array.from(value);
  }
  const array = [];
  for (const element2 of value) {
    array.push(element2);
    if (array.length === n) break;
  }
  return array;
}

// node_modules/svelte/src/internal/client/constants.js
var DERIVED = 1 << 1;
var EFFECT = 1 << 2;
var RENDER_EFFECT = 1 << 3;
var MANAGED_EFFECT = 1 << 24;
var BLOCK_EFFECT = 1 << 4;
var BRANCH_EFFECT = 1 << 5;
var ROOT_EFFECT = 1 << 6;
var BOUNDARY_EFFECT = 1 << 7;
var PAUSED = 1 << 8;
var CONNECTED = 1 << 9;
var CLEAN = 1 << 10;
var DIRTY = 1 << 11;
var MAYBE_DIRTY = 1 << 12;
var INERT = 1 << 13;
var DESTROYED = 1 << 14;
var REACTION_RAN = 1 << 15;
var DESTROYING = 1 << 25;
var EFFECT_TRANSPARENT = 1 << 16;
var EAGER_EFFECT = 1 << 17;
var HEAD_EFFECT = 1 << 18;
var EFFECT_PRESERVED = 1 << 19;
var USER_EFFECT = 1 << 20;
var EFFECT_OFFSCREEN = 1 << 25;
var REACTION_IS_UPDATING = 1 << 21;
var ASYNC = 1 << 22;
var ERROR_VALUE = 1 << 23;
var STATE_SYMBOL = /* @__PURE__ */ Symbol("$state");
var COMPONENT_SYMBOL = /* @__PURE__ */ Symbol("component");
var LEGACY_PROPS = /* @__PURE__ */ Symbol("legacy props");
var LOADING_ATTR_SYMBOL = /* @__PURE__ */ Symbol("");
var PROXY_PATH_SYMBOL = /* @__PURE__ */ Symbol("proxy path");
var ATTRIBUTES_CACHE = /* @__PURE__ */ Symbol("attributes");
var CLASS_CACHE = /* @__PURE__ */ Symbol("class");
var STYLE_CACHE = /* @__PURE__ */ Symbol("style");
var TEXT_CACHE = /* @__PURE__ */ Symbol("text");
var FORM_RESET_HANDLER = /* @__PURE__ */ Symbol("form reset");
var HMR_ANCHOR = /* @__PURE__ */ Symbol("hmr anchor");
var STALE_REACTION = new class StaleReactionError extends Error {
  name = "StaleReactionError";
  message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}();
var IS_XHTML = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  !!globalThis.document?.contentType && /* @__PURE__ */ globalThis.document.contentType.includes("xml")
);
var TEXT_NODE = 3;
var COMMENT_NODE = 8;

// node_modules/svelte/src/internal/client/warnings.js
var bold = "font-weight: bold";
var normal = "font-weight: normal";
function await_reactivity_loss(name) {
  if (dev_fallback_default) {
    console.warn(`%c[svelte] await_reactivity_loss
%cDetected reactivity loss when reading \`${name}\`. This happens when state is read in an async function after an earlier \`await\`
https://svelte.dev/e/await_reactivity_loss`, bold, normal);
  } else {
    console.warn(`https://svelte.dev/e/await_reactivity_loss`);
  }
}
function await_waterfall(name, location2) {
  if (dev_fallback_default) {
    console.warn(`%c[svelte] await_waterfall
%cAn async derived, \`${name}\` (${location2}) was not read immediately after it resolved. This often indicates an unnecessary waterfall, which can slow down your app
https://svelte.dev/e/await_waterfall`, bold, normal);
  } else {
    console.warn(`https://svelte.dev/e/await_waterfall`);
  }
}
function derived_inert() {
  if (dev_fallback_default) {
    console.warn(`%c[svelte] derived_inert
%cReading a derived belonging to a now-destroyed effect may result in stale values
https://svelte.dev/e/derived_inert`, bold, normal);
  } else {
    console.warn(`https://svelte.dev/e/derived_inert`);
  }
}
function hydration_attribute_changed(attribute, html2, value) {
  if (dev_fallback_default) {
    console.warn(`%c[svelte] hydration_attribute_changed
%cThe \`${attribute}\` attribute on \`${html2}\` changed its value between server and client renders. The client value, \`${value}\`, will be ignored in favour of the server value
https://svelte.dev/e/hydration_attribute_changed`, bold, normal);
  } else {
    console.warn(`https://svelte.dev/e/hydration_attribute_changed`);
  }
}
function hydration_mismatch(location2) {
  if (dev_fallback_default) {
    console.warn(
      `%c[svelte] hydration_mismatch
%c${location2 ? `Hydration failed because the initial UI does not match what was rendered on the server. The error occurred near ${location2}` : "Hydration failed because the initial UI does not match what was rendered on the server"}
https://svelte.dev/e/hydration_mismatch`,
      bold,
      normal
    );
  } else {
    console.warn(`https://svelte.dev/e/hydration_mismatch`);
  }
}
function lifecycle_double_unmount() {
  if (dev_fallback_default) {
    console.warn(`%c[svelte] lifecycle_double_unmount
%cTried to unmount a component that was not mounted
https://svelte.dev/e/lifecycle_double_unmount`, bold, normal);
  } else {
    console.warn(`https://svelte.dev/e/lifecycle_double_unmount`);
  }
}
function select_multiple_invalid_value() {
  if (dev_fallback_default) {
    console.warn(`%c[svelte] select_multiple_invalid_value
%cThe \`value\` property of a \`<select multiple>\` element should be an array, but it received a non-array value. The selection will be kept as is.
https://svelte.dev/e/select_multiple_invalid_value`, bold, normal);
  } else {
    console.warn(`https://svelte.dev/e/select_multiple_invalid_value`);
  }
}
function state_proxy_equality_mismatch(operator) {
  if (dev_fallback_default) {
    console.warn(`%c[svelte] state_proxy_equality_mismatch
%cReactive \`$state(...)\` proxies and the values they proxy have different identities. Because of this, comparisons with \`${operator}\` will produce unexpected results
https://svelte.dev/e/state_proxy_equality_mismatch`, bold, normal);
  } else {
    console.warn(`https://svelte.dev/e/state_proxy_equality_mismatch`);
  }
}
function svelte_boundary_reset_noop() {
  if (dev_fallback_default) {
    console.warn(`%c[svelte] svelte_boundary_reset_noop
%cA \`<svelte:boundary>\` \`reset\` function only resets the boundary the first time it is called
https://svelte.dev/e/svelte_boundary_reset_noop`, bold, normal);
  } else {
    console.warn(`https://svelte.dev/e/svelte_boundary_reset_noop`);
  }
}

// node_modules/svelte/src/internal/client/dom/hydration.js
var hydrating = false;
function set_hydrating(value) {
  hydrating = value;
}
var hydrate_node;
function set_hydrate_node(node) {
  if (node === null) {
    hydration_mismatch();
    throw HYDRATION_ERROR;
  }
  return hydrate_node = node;
}
function hydrate_next() {
  return set_hydrate_node(get_next_sibling(hydrate_node));
}
function reset(node) {
  if (!hydrating) return;
  if (get_next_sibling(hydrate_node) !== null) {
    hydration_mismatch();
    throw HYDRATION_ERROR;
  }
  hydrate_node = node;
}
function next(count = 1) {
  if (hydrating) {
    var i = count;
    var node = hydrate_node;
    while (i--) {
      node = /** @type {TemplateNode} */
      get_next_sibling(node);
    }
    hydrate_node = node;
  }
}
function skip_nodes(remove = true) {
  var depth = 0;
  var node = hydrate_node;
  while (true) {
    if (node.nodeType === COMMENT_NODE) {
      var data = (
        /** @type {Comment} */
        node.data
      );
      if (data === HYDRATION_END) {
        if (depth === 0) return node;
        depth -= 1;
      } else if (data === HYDRATION_START || data === HYDRATION_START_ELSE || // "[1", "[2", etc. for if blocks
      data[0] === "[" && !isNaN(Number(data.slice(1)))) {
        depth += 1;
      }
    }
    var next2 = (
      /** @type {TemplateNode} */
      get_next_sibling(node)
    );
    if (remove) node.remove();
    node = next2;
  }
}
function read_hydration_instruction(node) {
  if (!node || node.nodeType !== COMMENT_NODE) {
    hydration_mismatch();
    throw HYDRATION_ERROR;
  }
  return (
    /** @type {Comment} */
    node.data
  );
}

// node_modules/svelte/src/internal/client/reactivity/equality.js
function equals(value) {
  return value === this.v;
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || a !== null && typeof a === "object" || typeof a === "function";
}
function safe_equals(value) {
  return !safe_not_equal(value, this.v);
}

// node_modules/svelte/src/internal/shared/errors.js
function invariant_violation(message) {
  if (dev_fallback_default) {
    const error = new Error(`invariant_violation
An invariant violation occurred, meaning Svelte's internal assumptions were flawed. This is a bug in Svelte, not your app \u2014 please open an issue at https://github.com/sveltejs/svelte, citing the following message: "${message}"
https://svelte.dev/e/invariant_violation`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/invariant_violation`);
  }
}

// node_modules/svelte/src/internal/client/errors.js
function async_derived_orphan() {
  if (dev_fallback_default) {
    const error = new Error(`async_derived_orphan
Cannot create a \`$derived(...)\` with an \`await\` expression outside of an effect tree
https://svelte.dev/e/async_derived_orphan`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/async_derived_orphan`);
  }
}
function bind_invalid_checkbox_value() {
  if (dev_fallback_default) {
    const error = new Error(`bind_invalid_checkbox_value
Using \`bind:value\` together with a checkbox input is not allowed. Use \`bind:checked\` instead
https://svelte.dev/e/bind_invalid_checkbox_value`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/bind_invalid_checkbox_value`);
  }
}
function derived_references_self() {
  if (dev_fallback_default) {
    const error = new Error(`derived_references_self
A derived value cannot reference itself recursively
https://svelte.dev/e/derived_references_self`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/derived_references_self`);
  }
}
function each_key_duplicate(a, b, value) {
  if (dev_fallback_default) {
    const error = new Error(`each_key_duplicate
${value ? `Keyed each block has duplicate key \`${value}\` at indexes ${a} and ${b}` : `Keyed each block has duplicate key at indexes ${a} and ${b}`}
https://svelte.dev/e/each_key_duplicate`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/each_key_duplicate`);
  }
}
function each_key_volatile(index3, a, b) {
  if (dev_fallback_default) {
    const error = new Error(`each_key_volatile
Keyed each block has key that is not idempotent \u2014 the key for item at index ${index3} was \`${a}\` but is now \`${b}\`. Keys must be the same each time for a given item
https://svelte.dev/e/each_key_volatile`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/each_key_volatile`);
  }
}
function effect_in_teardown(rune) {
  if (dev_fallback_default) {
    const error = new Error(`effect_in_teardown
\`${rune}\` cannot be used inside an effect cleanup function
https://svelte.dev/e/effect_in_teardown`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/effect_in_teardown`);
  }
}
function effect_in_unowned_derived() {
  if (dev_fallback_default) {
    const error = new Error(`effect_in_unowned_derived
Effect cannot be created inside a \`$derived\` value that was not itself created inside an effect
https://svelte.dev/e/effect_in_unowned_derived`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/effect_in_unowned_derived`);
  }
}
function effect_orphan(rune) {
  if (dev_fallback_default) {
    const error = new Error(`effect_orphan
\`${rune}\` can only be used inside an effect (e.g. during component initialisation)
https://svelte.dev/e/effect_orphan`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/effect_orphan`);
  }
}
function effect_update_depth_exceeded() {
  if (dev_fallback_default) {
    const error = new Error(`effect_update_depth_exceeded
Maximum update depth exceeded. This typically indicates that an effect reads and writes the same piece of state
https://svelte.dev/e/effect_update_depth_exceeded`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/effect_update_depth_exceeded`);
  }
}
function hydration_failed() {
  if (dev_fallback_default) {
    const error = new Error(`hydration_failed
Failed to hydrate the application
https://svelte.dev/e/hydration_failed`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/hydration_failed`);
  }
}
function invalid_snippet() {
  if (dev_fallback_default) {
    const error = new Error(`invalid_snippet
Could not \`{@render}\` snippet due to the expression being \`null\` or \`undefined\`. Consider using optional chaining \`{@render snippet?.()}\`
https://svelte.dev/e/invalid_snippet`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/invalid_snippet`);
  }
}
function props_invalid_value(key2) {
  if (dev_fallback_default) {
    const error = new Error(`props_invalid_value
Cannot do \`bind:${key2}={undefined}\` when \`${key2}\` has a fallback value
https://svelte.dev/e/props_invalid_value`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/props_invalid_value`);
  }
}
function rune_outside_svelte(rune) {
  if (dev_fallback_default) {
    const error = new Error(`rune_outside_svelte
The \`${rune}\` rune is only available inside \`.svelte\` and \`.svelte.js/ts\` files
https://svelte.dev/e/rune_outside_svelte`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/rune_outside_svelte`);
  }
}
function state_descriptors_fixed() {
  if (dev_fallback_default) {
    const error = new Error(`state_descriptors_fixed
Property descriptors defined on \`$state\` objects must contain \`value\` and always be \`enumerable\`, \`configurable\` and \`writable\`.
https://svelte.dev/e/state_descriptors_fixed`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/state_descriptors_fixed`);
  }
}
function state_prototype_fixed() {
  if (dev_fallback_default) {
    const error = new Error(`state_prototype_fixed
Cannot set prototype of \`$state\` object
https://svelte.dev/e/state_prototype_fixed`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/state_prototype_fixed`);
  }
}
function state_unsafe_mutation() {
  if (dev_fallback_default) {
    const error = new Error(`state_unsafe_mutation
Updating state inside \`$derived(...)\`, \`$inspect(...)\` or a template expression is forbidden. If the value should not be reactive, declare it without \`$state\`
https://svelte.dev/e/state_unsafe_mutation`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/state_unsafe_mutation`);
  }
}
function svelte_boundary_reset_onerror() {
  if (dev_fallback_default) {
    const error = new Error(`svelte_boundary_reset_onerror
A \`<svelte:boundary>\` \`reset\` function cannot be called while an error is still being handled
https://svelte.dev/e/svelte_boundary_reset_onerror`);
    error.name = "Svelte error";
    throw error;
  } else {
    throw new Error(`https://svelte.dev/e/svelte_boundary_reset_onerror`);
  }
}

// node_modules/svelte/src/internal/flags/index.js
var async_mode_flag = false;
var legacy_mode_flag = false;
var tracing_mode_flag = false;

// node_modules/svelte/src/internal/client/dev/tracing.js
var tracing_expressions = null;
function tag(source2, label) {
  source2.label = label;
  tag_proxy(source2.v, label);
  return source2;
}
function tag_proxy(value, label) {
  value?.[PROXY_PATH_SYMBOL]?.(label);
  return value;
}

// node_modules/svelte/src/internal/shared/dev.js
function get_error(label) {
  const error = new Error();
  const stack2 = get_stack();
  if (stack2.length === 0) {
    return null;
  }
  stack2.unshift("\n");
  define_property(error, "stack", {
    value: stack2.join("\n")
  });
  define_property(error, "name", {
    value: label
  });
  return (
    /** @type {Error & { stack: string }} */
    error
  );
}
function get_stack() {
  const limit = Error.stackTraceLimit;
  Error.stackTraceLimit = Infinity;
  const stack2 = new Error().stack;
  Error.stackTraceLimit = limit;
  if (!stack2) return [];
  const lines = stack2.split("\n");
  const new_lines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const posixified = line.replaceAll("\\", "/");
    if (line.trim() === "Error") {
      continue;
    }
    if (line.includes("validate_each_keys")) {
      return [];
    }
    if (posixified.includes("svelte/src/internal") || posixified.includes("node_modules/.vite")) {
      continue;
    }
    new_lines.push(line);
  }
  return new_lines;
}
function invariant(condition, message) {
  if (!dev_fallback_default) {
    throw new Error("invariant(...) was not guarded by if (DEV)");
  }
  if (!condition) invariant_violation(message);
}

// node_modules/svelte/src/internal/client/context.js
var component_context = null;
function set_component_context(context) {
  component_context = context;
}
var dev_stack = null;
function set_dev_stack(stack2) {
  dev_stack = stack2;
}
var dev_current_component_function = null;
function set_dev_current_component_function(fn) {
  dev_current_component_function = fn;
}
function push(props, runes = false, fn) {
  component_context = {
    p: component_context,
    i: false,
    c: null,
    e: null,
    s: props,
    x: null,
    r: (
      /** @type {Effect} */
      active_effect
    ),
    l: legacy_mode_flag && !runes ? { s: null, u: null, $: [] } : null
  };
  if (dev_fallback_default) {
    component_context.function = fn;
    dev_current_component_function = fn;
  }
}
function pop(component2) {
  var context = (
    /** @type {ComponentContext} */
    component_context
  );
  var effects = context.e;
  if (effects !== null) {
    context.e = null;
    for (var fn of effects) {
      create_user_effect(fn);
    }
  }
  if (component2 !== void 0) {
    context.x = component2;
  }
  context.i = true;
  component_context = context.p;
  if (dev_fallback_default) {
    dev_current_component_function = component_context?.function ?? null;
  }
  return mark_as_component(component2);
}
function mark_as_component(component2 = {}) {
  define_property(component2, COMPONENT_SYMBOL, { value: true });
  return component2;
}
function is_runes() {
  return !legacy_mode_flag || component_context !== null && component_context.l === null;
}

// node_modules/svelte/src/internal/client/dom/task.js
var micro_tasks = [];
function run_micro_tasks() {
  var tasks = micro_tasks;
  micro_tasks = [];
  run_all(tasks);
}
function queue_micro_task(fn) {
  if (micro_tasks.length === 0 && !is_flushing_sync) {
    var tasks = micro_tasks;
    queueMicrotask(() => {
      if (tasks === micro_tasks) run_micro_tasks();
    });
  }
  micro_tasks.push(fn);
}
function flush_tasks() {
  while (micro_tasks.length > 0) {
    run_micro_tasks();
  }
}

// node_modules/svelte/src/internal/client/reactivity/status.js
var STATUS_MASK = ~(DIRTY | MAYBE_DIRTY | CLEAN);
function set_signal_status(signal, status) {
  signal.f = signal.f & STATUS_MASK | status;
}
function update_derived_status(derived2) {
  if ((derived2.f & CONNECTED) !== 0 || derived2.deps === null) {
    set_signal_status(derived2, CLEAN);
  } else {
    set_signal_status(derived2, MAYBE_DIRTY);
  }
}

// node_modules/svelte/src/internal/client/reactivity/utils.js
function defer_effect(effect2, dirty_reactions) {
  if ((effect2.f & DIRTY) !== 0) {
    dirty_reactions.set(effect2, DIRTY);
  } else if ((effect2.f & MAYBE_DIRTY) !== 0 && dirty_reactions.get(effect2) !== DIRTY) {
    dirty_reactions.set(effect2, MAYBE_DIRTY);
  }
  set_signal_status(effect2, CLEAN);
}

// node_modules/svelte/src/internal/client/dev/debug.js
function stringify_derived(fn) {
  return `{${fn.toString().replace(/^async \(\) => /, "").replace(/^\(/, "").replace(/\$\.get\((.+?)\)/g, (_, name) => name).replace(/\$\.track_reactivity_loss\((.+?)\)\(\)/g, (_, name) => name).replace(/\)$/, "")}}`;
}

// node_modules/svelte/src/internal/client/dom/elements/misc.js
function remove_textarea_child(dom) {
  if (hydrating && get_first_child(dom) !== null) {
    clear_text_content(dom);
  }
}
var listening_to_form_reset = false;
function add_form_reset_listener() {
  if (!listening_to_form_reset) {
    listening_to_form_reset = true;
    document.addEventListener(
      "reset",
      (evt) => {
        Promise.resolve().then(() => {
          if (!evt.defaultPrevented) {
            for (
              const e of
              /**@type {HTMLFormElement} */
              evt.target.elements
            ) {
              e[FORM_RESET_HANDLER]?.();
            }
          }
        });
      },
      // In the capture phase to guarantee we get noticed of it (no possibility of stopPropagation)
      { capture: true }
    );
  }
}

// node_modules/svelte/src/internal/client/dom/elements/bindings/shared.js
function without_reactive_context(fn) {
  var previous_reaction = active_reaction;
  var previous_effect = active_effect;
  set_active_reaction(null);
  set_active_effect(null);
  try {
    return fn();
  } finally {
    set_active_reaction(previous_reaction);
    set_active_effect(previous_effect);
  }
}
function listen_to_event_and_reset_event(element2, event2, handler, on_reset = handler) {
  element2.addEventListener(event2, () => without_reactive_context(handler));
  const prev = (
    /** @type {any} */
    element2[FORM_RESET_HANDLER]
  );
  if (prev) {
    element2[FORM_RESET_HANDLER] = () => {
      prev();
      on_reset(true);
    };
  } else {
    element2[FORM_RESET_HANDLER] = () => on_reset(true);
  }
  add_form_reset_listener();
}

// node_modules/svelte/src/internal/client/reactivity/async.js
function flatten(blockers, sync2, async2, fn) {
  const d = is_runes() ? derived : derived_safe_equal;
  var pending2 = blockers.filter((b) => !b.settled);
  var deriveds = sync2.map(d);
  if (dev_fallback_default) {
    deriveds.forEach((d2, i) => {
      d2.label = sync2[i].toString().replace("() => ", "").replaceAll("$.eager(() => ", "$state.eager(").replace(/\$\.get\((.+?)\)/g, (_, id) => id);
    });
  }
  if (async2.length === 0 && pending2.length === 0) {
    fn(deriveds);
    return;
  }
  var parent = (
    /** @type {Effect} */
    active_effect
  );
  var restore = capture();
  var blocker_promise = pending2.length === 1 ? pending2[0].promise : pending2.length > 1 ? Promise.all(pending2.map((b) => b.promise)) : null;
  function finish(async3) {
    if ((parent.f & DESTROYED) !== 0) {
      return;
    }
    restore();
    try {
      fn([...deriveds, ...async3]);
    } catch (error) {
      invoke_error_boundary(error, parent);
    }
    unset_context();
  }
  var decrement_pending = increment_pending();
  if (async2.length === 0) {
    blocker_promise.then(() => finish([])).finally(decrement_pending);
    return;
  }
  function run3() {
    Promise.all(async2.map((expression) => async_derived(expression))).then(finish).catch((error) => invoke_error_boundary(error, parent)).finally(decrement_pending);
  }
  if (blocker_promise) {
    blocker_promise.then(() => {
      if ((parent.f & DESTROYED) !== 0) {
        decrement_pending();
        return;
      }
      restore();
      run3();
      unset_context();
    });
  } else {
    run3();
  }
}
function capture() {
  var previous_effect = (
    /** @type {Effect} */
    active_effect
  );
  var previous_reaction = active_reaction;
  var previous_component_context = component_context;
  var previous_batch2 = (
    /** @type {Batch} */
    current_batch
  );
  if (dev_fallback_default) {
    var previous_dev_stack = dev_stack;
  }
  return function restore(activate_batch = true) {
    set_active_effect(previous_effect);
    set_active_reaction(previous_reaction);
    set_component_context(previous_component_context);
    if (activate_batch && (previous_effect.f & DESTROYED) === 0) {
      previous_batch2?.activate();
      previous_batch2?.apply();
    }
    if (dev_fallback_default) {
      set_reactivity_loss_tracker(null);
      set_dev_stack(previous_dev_stack);
    }
  };
}
var restored = false;
function unset_context(deactivate_batch = true) {
  restored = false;
  set_active_effect(null);
  set_active_reaction(null);
  set_component_context(null);
  if (deactivate_batch) current_batch?.deactivate();
  if (dev_fallback_default) {
    set_reactivity_loss_tracker(null);
    set_dev_stack(null);
  }
}
function increment_pending() {
  var effect2 = (
    /** @type {Effect} */
    active_effect
  );
  var boundary2 = effect2.b;
  var batch = (
    /** @type {Batch} */
    current_batch
  );
  var blocking = !!boundary2?.is_rendered();
  boundary2?.update_pending_count(1, batch);
  batch.increment(blocking, effect2);
  return () => {
    boundary2?.update_pending_count(-1, batch);
    batch.decrement(blocking, effect2);
  };
}

// node_modules/svelte/src/internal/client/reactivity/deriveds.js
var reactivity_loss_tracker = null;
function set_reactivity_loss_tracker(v) {
  reactivity_loss_tracker = v;
}
var recent_async_deriveds = /* @__PURE__ */ new Set();
// @__NO_SIDE_EFFECTS__
function derived(fn) {
  var flags2 = DERIVED | DIRTY;
  if (active_effect !== null) {
    active_effect.f |= EFFECT_PRESERVED;
  }
  const signal = {
    ctx: component_context,
    deps: null,
    effects: null,
    equals,
    f: flags2,
    fn,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      UNINITIALIZED
    ),
    wv: 0,
    parent: active_effect,
    ac: null
  };
  if (dev_fallback_default && tracing_mode_flag) {
    signal.created = get_error("created at");
  }
  return signal;
}
var OBSOLETE = /* @__PURE__ */ Symbol("obsolete");
// @__NO_SIDE_EFFECTS__
function async_derived(fn, label, location2) {
  let parent = (
    /** @type {Effect | null} */
    active_effect
  );
  if (parent === null) {
    async_derived_orphan();
  }
  var promise = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  );
  var signal = source(
    /** @type {V} */
    UNINITIALIZED
  );
  if (dev_fallback_default) signal.label = label ?? stringify_derived(fn);
  var should_suspend = !active_reaction;
  var deferreds = /* @__PURE__ */ new Set();
  async_effect(() => {
    var effect2 = (
      /** @type {Effect} */
      active_effect
    );
    if (dev_fallback_default) {
      reactivity_loss_tracker = { effect: effect2, effect_deps: /* @__PURE__ */ new Set(), warned: false };
    }
    var d = deferred();
    promise = d.promise;
    try {
      Promise.resolve(fn()).then(d.resolve, (e) => {
        if (e !== STALE_REACTION) d.reject(e);
      }).finally(unset_context);
    } catch (error) {
      d.reject(error);
      unset_context();
    }
    if (dev_fallback_default) {
      if (reactivity_loss_tracker) {
        if (effect2.deps !== null) {
          for (let i = 0; i < skipped_deps; i += 1) {
            reactivity_loss_tracker.effect_deps.add(effect2.deps[i]);
          }
        }
        if (new_deps !== null) {
          for (let i = 0; i < new_deps.length; i += 1) {
            reactivity_loss_tracker.effect_deps.add(new_deps[i]);
          }
        }
      }
      reactivity_loss_tracker = null;
    }
    var batch = (
      /** @type {Batch} */
      current_batch
    );
    if (should_suspend) {
      if ((effect2.f & REACTION_RAN) !== 0) {
        var decrement_pending = increment_pending();
      }
      if (
        // boundary can be null if the async derived is inside an $effect.root not connected to the component render tree
        parent.b?.is_rendered()
      ) {
        batch.async_deriveds.get(effect2)?.reject(OBSOLETE);
      } else {
        for (const d2 of deferreds.values()) {
          d2.reject(OBSOLETE);
        }
      }
      deferreds.add(d);
      batch.async_deriveds.set(effect2, d);
    }
    const handler = (value, error = void 0) => {
      if (dev_fallback_default) {
        reactivity_loss_tracker = null;
      }
      decrement_pending?.();
      deferreds.delete(d);
      if (error === OBSOLETE) return;
      batch.activate();
      if (error) {
        signal.f |= ERROR_VALUE;
        internal_set(signal, error);
      } else {
        if ((signal.f & ERROR_VALUE) !== 0) {
          signal.f ^= ERROR_VALUE;
        }
        if (dev_fallback_default && location2 !== void 0 && !signal.equals(value)) {
          recent_async_deriveds.add(signal);
          setTimeout(() => {
            if (recent_async_deriveds.has(signal) && (effect2.f & DESTROYED) === 0) {
              await_waterfall(
                /** @type {string} */
                signal.label,
                location2
              );
              recent_async_deriveds.delete(signal);
            }
          });
        }
        internal_set(signal, value);
      }
      batch.deactivate();
    };
    d.promise.then(handler, (e) => handler(null, e || "unknown"));
  });
  teardown(() => {
    for (const d of deferreds) {
      d.reject(OBSOLETE);
    }
  });
  if (dev_fallback_default) {
    signal.f |= ASYNC;
  }
  return new Promise((fulfil) => {
    function next2(p) {
      function go() {
        if (p === promise) {
          fulfil(signal);
        } else {
          next2(promise);
        }
      }
      p.then(go, go);
    }
    next2(promise);
  });
}
// @__NO_SIDE_EFFECTS__
function user_derived(fn) {
  const d = /* @__PURE__ */ derived(fn);
  if (!async_mode_flag) push_reaction_value(d);
  return d;
}
// @__NO_SIDE_EFFECTS__
function derived_safe_equal(fn) {
  const signal = /* @__PURE__ */ derived(fn);
  signal.equals = safe_equals;
  return signal;
}
function destroy_derived_effects(derived2) {
  var effects = derived2.effects;
  if (effects !== null) {
    derived2.effects = null;
    for (var i = 0; i < effects.length; i += 1) {
      destroy_effect(
        /** @type {Effect} */
        effects[i]
      );
    }
  }
}
var stack = [];
function execute_derived(derived2) {
  var value;
  var prev_active_effect = active_effect;
  var parent = derived2.parent;
  if (!is_destroying_effect && parent !== null && derived2.v !== UNINITIALIZED && // if it was never evaluated before, it's guaranteed to fail downstream, so we try to execute instead
  (parent.f & (DESTROYED | INERT)) !== 0) {
    derived_inert();
    return derived2.v;
  }
  set_active_effect(parent);
  if (dev_fallback_default) {
    let prev_eager_effects = eager_effects;
    set_eager_effects(/* @__PURE__ */ new Set());
    try {
      if (includes.call(stack, derived2)) {
        derived_references_self();
      }
      stack.push(derived2);
      destroy_derived_effects(derived2);
      value = update_reaction(derived2);
    } finally {
      set_active_effect(prev_active_effect);
      set_eager_effects(prev_eager_effects);
      stack.pop();
    }
  } else {
    try {
      destroy_derived_effects(derived2);
      value = update_reaction(derived2);
    } finally {
      set_active_effect(prev_active_effect);
    }
  }
  return value;
}
function update_derived(derived2) {
  var value = execute_derived(derived2);
  if (!derived2.equals(value)) {
    derived2.wv = increment_write_version();
    if (!current_batch?.is_fork || derived2.deps === null) {
      if (current_batch !== null) {
        current_batch.capture(derived2, value, true);
        previous_batch?.capture(derived2, value, true);
      } else {
        derived2.v = value;
      }
      if (derived2.deps === null) {
        set_signal_status(derived2, CLEAN);
        return;
      }
    }
  }
  if (is_destroying_effect) {
    return;
  }
  if (batch_values !== null) {
    if (effect_tracking() || current_batch?.is_fork) {
      batch_values.set(derived2, value);
    }
  } else {
    update_derived_status(derived2);
  }
}
function freeze_derived_effects(derived2) {
  if (derived2.effects === null) return;
  for (const e of derived2.effects) {
    if (e.teardown || e.ac) {
      e.teardown?.();
      if (e.ac !== null) {
        without_reactive_context(() => {
          e.ac.abort(STALE_REACTION);
          e.ac = null;
        });
      }
      if (e.fn !== null) e.teardown = noop;
      remove_reactions(e, 0);
      destroy_effect_children(e);
    }
  }
}
function unfreeze_derived_effects(derived2) {
  if (derived2.effects === null) return;
  for (const e of derived2.effects) {
    if (e.teardown && e.fn !== null) {
      update_effect(e);
    }
  }
}

// node_modules/svelte/src/internal/client/reactivity/batch.js
var first_batch = null;
var last_batch = null;
var current_batch = null;
var previous_batch = null;
var batch_values = null;
var last_scheduled_effect = null;
var is_flushing_sync = false;
var is_processing = false;
var collected_effects = null;
var legacy_updates = null;
var flush_count = 0;
var source_stacks = /* @__PURE__ */ new Set();
var uid = 1;
var Batch = class _Batch {
  id = uid++;
  /** True as soon as `#process` was called */
  started = false;
  linked = true;
  /** @type {Batch | null} */
  prev = null;
  /** @type {Batch | null} */
  next = null;
  /** @type {Map<Effect, ReturnType<typeof deferred<any>>>} */
  async_deriveds = /* @__PURE__ */ new Map();
  /**
   * The current values of any signals that are updated in this batch.
   * Tuple format: [value, is_derived] (note: is_derived is false for deriveds, too, if they were overridden via assignment)
   * The keys of this map are identical to `this.previous`
   * @type {Map<Value, [any, boolean]>}
   */
  current = /* @__PURE__ */ new Map();
  /**
   * The values of any signals (sources and deriveds) that are updated in this batch _before_ those updates took place.
   * The keys of this map are identical to `this.current`
   * @type {Map<Value, any>}
   */
  previous = /* @__PURE__ */ new Map();
  /**
   * When the batch is committed (and the DOM is updated), we need to remove old branches
   * and append new ones by calling the functions added inside (if/each/key/etc) blocks
   * @type {Set<(batch: Batch) => void>}
   */
  #commit_callbacks = /* @__PURE__ */ new Set();
  /**
   * If a fork is discarded, we need to destroy any effects that are no longer needed
   * @type {Set<(batch: Batch) => void>}
   */
  #discard_callbacks = /* @__PURE__ */ new Set();
  /**
   * The number of async effects that are currently in flight
   */
  #pending = 0;
  /**
   * Async effects that are currently in flight, _not_ inside a pending boundary
   * @type {Map<Effect, number>}
   */
  #blocking_pending = /* @__PURE__ */ new Map();
  /**
   * A deferred that resolves when the batch is committed, used with `settled()`
   * TODO replace with Promise.withResolvers once supported widely enough
   * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
   */
  #deferred = null;
  /**
   * Effects that were scheduled in this batch but not yet 'resolved' into the
   * root effects that need to be flushed. Resolving — the upwards traversal that
   * marks the path to each effect on the shared effect tree (see #resolve) — is
   * deferred until the batch is processed, so that the markers are created and
   * consumed within a single traversal. Scheduling into other batches (which can
   * happen concurrently, e.g. while a batch is committed) can therefore never
   * observe (and be confused by) this batch's markers.
   * May contain duplicates — deduplication happens during resolving
   * @type {Effect[]}
   */
  #scheduled = [];
  /**
   * Effects created while this batch was active.
   * @type {Effect[]}
   */
  #new_effects = [];
  /**
   * Deferred effects (which run after async work has completed) and their status (DIRTY or MAYBE_DIRTY)
   * @type {Map<Effect, number>}
   */
  #dirty_reactions = /* @__PURE__ */ new Map();
  /**
   * A map of branches that still exist, but will be destroyed when this batch
   * is committed — we skip over these during `process`.
   * The value contains child effects that were dirty/maybe_dirty before being reset,
   * so they can be rescheduled if the branch survives.
   * @type {Map<Effect, { d: Effect[], m: Effect[] }>}
   */
  #skipped_branches = /* @__PURE__ */ new Map();
  /**
   * Inverse of #skipped_branches which we need to tell prior batches to unskip them when committing
   * @type {Set<Effect>}
   */
  #unskipped_branches = /* @__PURE__ */ new Set();
  is_fork = false;
  #decrement_queued = false;
  constructor() {
    if (last_batch === null) {
      first_batch = last_batch = this;
    } else {
      last_batch.next = this;
      this.prev = last_batch;
    }
    last_batch = this;
  }
  #is_deferred() {
    if (this.is_fork) return true;
    for (const effect2 of this.#blocking_pending.keys()) {
      if (!this.#is_skipped(effect2)) {
        return true;
      }
    }
    return false;
  }
  /**
   * Whether `effect` is inside a branch that this batch skips
   * @param {Effect} effect
   */
  #is_skipped(effect2) {
    for (var e = (
      /** @type {Effect | null} */
      effect2
    ); e !== null; e = e.parent) {
      if (this.#skipped_branches.has(e)) return true;
    }
    return false;
  }
  /**
   * Add an effect to the #skipped_branches map and reset its children
   * @param {Effect} effect
   */
  skip_effect(effect2) {
    if (!this.#skipped_branches.has(effect2)) {
      this.#skipped_branches.set(effect2, { d: [], m: [] });
    }
    this.#unskipped_branches.delete(effect2);
  }
  /**
   * Remove an effect from the #skipped_branches map and reschedule
   * any tracked dirty/maybe_dirty child effects
   * @param {Effect} effect
   * @param {(e: Effect) => void} callback
   */
  unskip_effect(effect2, callback = (e) => this.schedule(e)) {
    var tracked = this.#skipped_branches.get(effect2);
    if (tracked) {
      this.#skipped_branches.delete(effect2);
      for (var e of tracked.d) {
        set_signal_status(e, DIRTY);
        callback(e);
      }
      for (e of tracked.m) {
        set_signal_status(e, MAYBE_DIRTY);
        callback(e);
      }
    }
    this.#unskipped_branches.add(effect2);
  }
  /**
   * Convert the effects that were scheduled in this batch into the root effects
   * that need to be traversed, marking the path to each effect (by clearing the
   * `CLEAN` flag on ancestor branches) so that the traversal can find them.
   * This happens right before traversal rather than at scheduling time, so that
   * the markers left on the (shared) effect tree are created and consumed within
   * a single traversal — scheduling into other batches can never observe them
   * @returns {Effect[]}
   */
  #resolve() {
    var roots = [];
    for (const effect2 of this.#scheduled) {
      if ((effect2.f & DESTROYED) !== 0 || (effect2.f & (DIRTY | MAYBE_DIRTY)) === 0) continue;
      var e = effect2;
      var covered = false;
      while (e.parent !== null) {
        e = e.parent;
        var flags2 = e.f;
        if ((flags2 & (ROOT_EFFECT | BRANCH_EFFECT)) !== 0) {
          if ((flags2 & CLEAN) === 0) {
            covered = true;
            break;
          }
          e.f ^= CLEAN;
        }
      }
      if (!covered) {
        roots.push(e);
      }
    }
    this.#scheduled = [];
    return roots;
  }
  #process() {
    this.started = true;
    if (dev_fallback_default) {
      for (const value of this.current.keys()) {
        source_stacks.add(value);
      }
    }
    for (const [e, status] of this.#dirty_reactions) {
      set_signal_status(e, status);
      this.schedule(e);
    }
    this.apply();
    var effects = collected_effects = [];
    var render_effects = [];
    var updates = legacy_updates = [];
    while (this.#scheduled.length > 0) {
      if (flush_count++ > 1e3) {
        this.#unlink();
        infinite_loop_guard();
      }
      for (const root18 of this.#resolve()) {
        try {
          this.#traverse(root18, effects, render_effects);
        } catch (e) {
          reset_all(root18);
          if (!this.#is_deferred()) this.discard();
          throw e;
        }
      }
    }
    current_batch = null;
    if (updates.length > 0) {
      var batch = _Batch.ensure();
      for (const e of updates) {
        batch.schedule(e);
      }
    }
    collected_effects = null;
    legacy_updates = null;
    if (this.#is_deferred()) {
      this.#defer_effects(render_effects);
      this.#defer_effects(effects);
      for (const [e, t] of this.#skipped_branches) {
        reset_branch(e, t);
      }
      if (updates.length > 0) {
        /** @type {unknown} */
        current_batch.#process();
      }
      return;
    }
    const earlier_batch = this.#find_earlier_batch();
    if (earlier_batch) {
      this.#defer_effects(render_effects);
      this.#defer_effects(effects);
      earlier_batch.#merge(this);
      return;
    }
    this.#dirty_reactions.clear();
    for (const fn of this.#commit_callbacks) fn(this);
    this.#commit_callbacks.clear();
    previous_batch = this;
    flush_queued_effects(render_effects);
    flush_queued_effects(effects);
    previous_batch = null;
    this.#deferred?.resolve();
    var next_batch = (
      /** @type {Batch | null} */
      /** @type {unknown} */
      current_batch
    );
    if (this.#pending === 0 && (this.#scheduled.length === 0 || next_batch !== null)) {
      this.#unlink();
      if (async_mode_flag) {
        this.#commit();
        current_batch = next_batch;
      }
    }
    if (next_batch !== null) {
      old_values.clear();
      next_batch.#process();
    }
  }
  /**
   * Traverse the effect tree, executing effects or stashing
   * them for later execution as appropriate
   * @param {Effect} root
   * @param {Effect[]} effects
   * @param {Effect[]} render_effects
   */
  #traverse(root18, effects, render_effects) {
    root18.f ^= CLEAN;
    var effect2 = root18.first;
    while (effect2 !== null) {
      var flags2 = effect2.f;
      var is_branch = (flags2 & (BRANCH_EFFECT | ROOT_EFFECT)) !== 0;
      var is_skippable_branch = is_branch && (flags2 & CLEAN) !== 0;
      var skip = is_skippable_branch || (flags2 & INERT) !== 0 || this.#skipped_branches.has(effect2);
      if (!skip && effect2.fn !== null) {
        if (is_branch) {
          effect2.f ^= CLEAN;
        } else if ((flags2 & EFFECT) !== 0) {
          effects.push(effect2);
        } else if (async_mode_flag && (flags2 & (RENDER_EFFECT | MANAGED_EFFECT)) !== 0) {
          render_effects.push(effect2);
        } else if (is_dirty(effect2)) {
          if ((flags2 & BLOCK_EFFECT) !== 0) this.add_dirty_reaction(effect2, MAYBE_DIRTY);
          update_effect(effect2);
        }
        var child2 = effect2.first;
        if (child2 !== null) {
          effect2 = child2;
          continue;
        }
      }
      while (effect2 !== null) {
        var next2 = effect2.next;
        if (next2 !== null) {
          effect2 = next2;
          break;
        }
        effect2 = effect2.parent;
      }
    }
  }
  #find_earlier_batch() {
    for (var batch = this.prev; batch !== null; batch = batch.prev) {
      if (!batch.is_fork && this.#intersects(batch)) return batch;
    }
    return null;
  }
  /** @param {Batch} batch */
  #intersects(batch) {
    for (const [source2, [, is_derived]] of this.current) {
      if (is_derived) continue;
      if (batch.current.has(source2)) return true;
    }
    return false;
  }
  /**
   * @param {Batch} batch
   */
  #merge(batch) {
    for (const [source2, value] of batch.current) {
      if (!this.previous.has(source2) && batch.previous.has(source2)) {
        this.previous.set(source2, batch.previous.get(source2));
      }
      this.current.set(source2, value);
    }
    for (const [effect2, deferred2] of batch.async_deriveds) {
      const d = this.async_deriveds.get(effect2);
      if (d) deferred2.promise.then(d.resolve).catch(d.reject);
    }
    batch.async_deriveds.clear();
    this.transfer_reactions(batch.#dirty_reactions);
    const mark = (value) => {
      var reactions = value.reactions;
      if (reactions === null) return;
      if ((value.f & DERIVED) !== 0 && (value.f & (DIRTY | MAYBE_DIRTY)) === 0) {
        return;
      }
      for (const reaction of reactions) {
        var flags2 = reaction.f;
        if ((flags2 & DERIVED) !== 0) {
          mark(
            /** @type {Derived} */
            reaction
          );
        } else {
          var effect2 = (
            /** @type {Effect} */
            reaction
          );
          if (flags2 & (ASYNC | BLOCK_EFFECT) && !this.async_deriveds.has(effect2)) {
            this.#dirty_reactions.delete(effect2);
            set_signal_status(effect2, DIRTY);
            this.schedule(effect2);
          }
        }
      }
    };
    for (const source2 of this.current.keys()) {
      mark(source2);
    }
    this.oncommit(() => batch.discard());
    batch.#unlink();
    current_batch = this;
    this.#process();
  }
  /**
   * @param {Effect[]} effects
   */
  #defer_effects(effects) {
    for (var i = 0; i < effects.length; i += 1) {
      defer_effect(effects[i], this.#dirty_reactions);
    }
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Value} source
   * @param {any} value
   * @param {boolean} [is_derived]
   */
  capture(source2, value, is_derived = false) {
    if (source2.v !== UNINITIALIZED && !this.previous.has(source2)) {
      this.previous.set(source2, source2.v);
    }
    if ((source2.f & ERROR_VALUE) === 0) {
      this.current.set(source2, [value, is_derived]);
      batch_values?.set(source2, value);
    }
    if (!this.is_fork) {
      source2.v = value;
    }
  }
  activate() {
    current_batch = this;
  }
  deactivate() {
    current_batch = null;
    batch_values = null;
  }
  flush() {
    try {
      if (dev_fallback_default) {
        source_stacks.clear();
      }
      is_processing = true;
      current_batch = this;
      this.#process();
    } finally {
      flush_count = 0;
      last_scheduled_effect = null;
      collected_effects = null;
      legacy_updates = null;
      is_processing = false;
      current_batch = null;
      batch_values = null;
      old_values.clear();
      if (dev_fallback_default) {
        for (const source2 of source_stacks) {
          source2.updated = null;
        }
      }
    }
  }
  discard() {
    for (const fn of this.#discard_callbacks) fn(this);
    this.#discard_callbacks.clear();
    for (const deferred2 of this.async_deriveds.values()) {
      deferred2.reject(OBSOLETE);
    }
    this.#unlink();
    this.#deferred?.resolve();
  }
  /**
   * @param {Effect} effect
   */
  register_created_effect(effect2) {
    this.#new_effects.push(effect2);
  }
  #commit() {
    for (let batch = first_batch; batch !== null; batch = batch.next) {
      var is_earlier = batch.id < this.id;
      var sources = [];
      for (const [source3, [value, is_derived]] of this.current) {
        if (batch.current.has(source3)) {
          var batch_value = (
            /** @type {[any, boolean]} */
            batch.current.get(source3)[0]
          );
          if (is_earlier && value !== batch_value) {
            batch.current.set(source3, [value, is_derived]);
          } else {
            continue;
          }
        }
        sources.push(source3);
      }
      if (is_earlier) {
        for (const [effect2, deferred2] of this.async_deriveds) {
          const d = batch.async_deriveds.get(effect2);
          if (d) deferred2.promise.then(d.resolve).catch(d.reject);
        }
      }
      var current = [...batch.current.keys()].filter(
        (source3) => !/** @type {[any, boolean]} */
        batch.current.get(source3)[1]
      );
      if (!batch.started || current.length === 0) continue;
      var others = current.filter((source3) => !this.current.has(source3));
      if (others.length === 0) {
        if (is_earlier) {
          batch.discard();
        }
      } else if (sources.length > 0) {
        if (dev_fallback_default && !batch.#decrement_queued) {
          invariant(batch.#scheduled.length === 0, "Batch has scheduled effects");
        }
        if (is_earlier) {
          for (const unskipped of this.#unskipped_branches) {
            batch.unskip_effect(unskipped, (e) => {
              if ((e.f & (BLOCK_EFFECT | ASYNC)) !== 0) {
                batch.schedule(e);
              } else {
                batch.#defer_effects([e]);
              }
            });
          }
        }
        batch.activate();
        var marked = /* @__PURE__ */ new Set();
        var checked = /* @__PURE__ */ new Map();
        for (var source2 of sources) {
          mark_effects(source2, others, marked, checked);
        }
        checked = /* @__PURE__ */ new Map();
        var current_unequal = [...batch.current].filter(([c, v1]) => {
          const v2 = this.current.get(c);
          if (!v2) return true;
          return v2[0] !== v1[0] || v2[1] !== v1[1];
        }).map(([c]) => c);
        if (current_unequal.length > 0) {
          for (const effect2 of this.#new_effects) {
            if ((effect2.f & (DESTROYED | INERT | EAGER_EFFECT)) === 0 && depends_on(effect2, current_unequal, checked)) {
              if ((effect2.f & (ASYNC | BLOCK_EFFECT)) !== 0) {
                set_signal_status(effect2, DIRTY);
                batch.schedule(effect2);
              } else {
                batch.add_dirty_reaction(effect2, DIRTY);
              }
            }
          }
        }
        if (batch.#scheduled.length > 0 && !batch.#decrement_queued) {
          batch.apply();
          for (var root18 of batch.#resolve()) {
            batch.#traverse(root18, [], []);
          }
        }
        batch.deactivate();
      }
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  increment(blocking, effect2) {
    this.#pending += 1;
    if (blocking) {
      let blocking_pending_count = this.#blocking_pending.get(effect2) ?? 0;
      this.#blocking_pending.set(effect2, blocking_pending_count + 1);
    }
  }
  /**
   * @param {boolean} blocking
   * @param {Effect} effect
   */
  decrement(blocking, effect2) {
    this.#pending -= 1;
    if (blocking) {
      let blocking_pending_count = this.#blocking_pending.get(effect2) ?? 0;
      if (blocking_pending_count === 1) {
        this.#blocking_pending.delete(effect2);
      } else {
        this.#blocking_pending.set(effect2, blocking_pending_count - 1);
      }
    }
    if (this.#decrement_queued) return;
    this.#decrement_queued = true;
    queue_micro_task(() => {
      this.#decrement_queued = false;
      if (this.linked) {
        this.flush();
      }
    });
  }
  /**
   * @param {Map<Effect, number>} dirty_reactions
   */
  transfer_reactions(dirty_reactions) {
    for (const [effect2, status] of dirty_reactions) {
      this.add_dirty_reaction(effect2, status);
    }
    dirty_reactions.clear();
  }
  /**
   * @param {Effect} effect
   * @param {number} status
   */
  add_dirty_reaction(effect2, status) {
    if (status === DIRTY || this.#dirty_reactions.get(effect2) !== DIRTY) {
      this.#dirty_reactions.set(effect2, status);
    }
  }
  /** @param {(batch: Batch) => void} fn */
  oncommit(fn) {
    this.#commit_callbacks.add(fn);
  }
  /** @param {(batch: Batch) => void} fn */
  ondiscard(fn) {
    this.#discard_callbacks.add(fn);
  }
  settled() {
    return (this.#deferred ??= deferred()).promise;
  }
  static ensure() {
    if (current_batch === null) {
      const batch = current_batch = new _Batch();
      if (!is_processing && !is_flushing_sync) {
        queue_micro_task(() => {
          if (!batch.started) {
            batch.flush();
          }
        });
      }
    }
    return current_batch;
  }
  apply() {
    if (!async_mode_flag || !this.is_fork && this.prev === null && this.next === null) {
      batch_values = null;
      return;
    }
    batch_values = /* @__PURE__ */ new Map();
    for (const [source2, [value]] of this.current) {
      batch_values.set(source2, value);
    }
    for (let batch = first_batch; batch !== null; batch = batch.next) {
      if (batch === this || batch.is_fork) continue;
      if (batch.id >= this.id || !batch.#intersects(this)) {
        for (const [source2, previous] of batch.previous) {
          if (!batch_values.has(source2)) {
            batch_values.set(source2, previous);
          }
        }
      }
    }
  }
  /**
   *
   * @param {Effect} effect
   */
  schedule(effect2) {
    last_scheduled_effect = effect2;
    if (effect2.b?.is_pending && (effect2.f & (EFFECT | RENDER_EFFECT | MANAGED_EFFECT)) !== 0 && (effect2.f & REACTION_RAN) === 0) {
      effect2.b.defer_effect(effect2);
      return;
    }
    this.#scheduled.push(effect2);
  }
  #unlink() {
    if (!this.linked) return;
    var prev = this.prev;
    var next2 = this.next;
    if (prev === null) {
      first_batch = next2;
    } else {
      prev.next = next2;
    }
    if (next2 === null) {
      last_batch = prev;
    } else {
      next2.prev = prev;
    }
    this.linked = false;
  }
};
function flushSync(fn) {
  var was_flushing_sync = is_flushing_sync;
  var prev_previous_batch = previous_batch;
  previous_batch = null;
  is_flushing_sync = true;
  try {
    var result;
    if (fn) {
      flushSync();
      result = fn();
    }
    while (true) {
      flush_tasks();
      if (current_batch === null) {
        return (
          /** @type {T} */
          result
        );
      }
      current_batch.flush();
    }
  } finally {
    is_flushing_sync = was_flushing_sync;
    previous_batch = prev_previous_batch;
  }
}
function infinite_loop_guard() {
  if (dev_fallback_default) {
    var updates = /* @__PURE__ */ new Map();
    for (
      const source2 of
      /** @type {Batch} */
      current_batch.current.keys()
    ) {
      for (const [stack2, update2] of source2.updated ?? []) {
        var entry = updates.get(stack2);
        if (!entry) {
          entry = { error: update2.error, count: 0 };
          updates.set(stack2, entry);
        }
        entry.count += update2.count;
      }
    }
    for (const update2 of updates.values()) {
      if (update2.error) {
        console.error(update2.error);
      }
    }
  }
  try {
    effect_update_depth_exceeded();
  } catch (error) {
    if (dev_fallback_default) {
      define_property(error, "stack", { value: "" });
    }
    invoke_error_boundary(error, last_scheduled_effect);
  }
}
var eager_block_effects = null;
function flush_queued_effects(effects) {
  var length = effects.length;
  if (length === 0) return;
  var i = 0;
  while (i < length) {
    var effect2 = effects[i++];
    if ((effect2.f & (DESTROYED | INERT)) === 0 && is_dirty(effect2)) {
      eager_block_effects = /* @__PURE__ */ new Set();
      update_effect(effect2);
      if (effect2.deps === null && effect2.first === null && effect2.nodes === null && effect2.teardown === null && effect2.ac === null) {
        unlink_effect(effect2);
      }
      if (eager_block_effects?.size > 0) {
        old_values.clear();
        for (const e of eager_block_effects) {
          if ((e.f & (DESTROYED | INERT)) !== 0) continue;
          const ordered_effects = [e];
          let ancestor = e.parent;
          while (ancestor !== null) {
            if (eager_block_effects.has(ancestor)) {
              eager_block_effects.delete(ancestor);
              ordered_effects.push(ancestor);
            }
            ancestor = ancestor.parent;
          }
          for (let j = ordered_effects.length - 1; j >= 0; j--) {
            const e3 = ordered_effects[j];
            if ((e3.f & (DESTROYED | INERT)) !== 0) continue;
            update_effect(e3);
          }
        }
        eager_block_effects.clear();
      }
    }
  }
  eager_block_effects = null;
}
function mark_effects(value, sources, marked, checked) {
  if (marked.has(value)) return;
  marked.add(value);
  if (value.reactions !== null) {
    for (const reaction of value.reactions) {
      const flags2 = reaction.f;
      if ((flags2 & DERIVED) !== 0) {
        mark_effects(
          /** @type {Derived} */
          reaction,
          sources,
          marked,
          checked
        );
      } else if ((flags2 & (ASYNC | BLOCK_EFFECT)) !== 0 && (flags2 & DIRTY) === 0 && depends_on(reaction, sources, checked)) {
        set_signal_status(reaction, DIRTY);
        schedule_effect(
          /** @type {Effect} */
          reaction
        );
      }
    }
  }
}
function depends_on(reaction, sources, checked) {
  const depends = checked.get(reaction);
  if (depends !== void 0) return depends;
  if (reaction.deps !== null) {
    for (const dep of reaction.deps) {
      if (includes.call(sources, dep)) {
        return true;
      }
      if ((dep.f & DERIVED) !== 0 && depends_on(
        /** @type {Derived} */
        dep,
        sources,
        checked
      )) {
        checked.set(
          /** @type {Derived} */
          dep,
          true
        );
        return true;
      }
    }
  }
  checked.set(reaction, false);
  return false;
}
function schedule_effect(effect2) {
  current_batch.schedule(effect2);
}
function reset_branch(effect2, tracked) {
  if ((effect2.f & BRANCH_EFFECT) !== 0 && (effect2.f & CLEAN) !== 0) {
    return;
  }
  if ((effect2.f & DIRTY) !== 0) {
    tracked.d.push(effect2);
  } else if ((effect2.f & MAYBE_DIRTY) !== 0) {
    tracked.m.push(effect2);
  }
  set_signal_status(effect2, CLEAN);
  var e = effect2.first;
  while (e !== null) {
    reset_branch(e, tracked);
    e = e.next;
  }
}
function reset_all(effect2) {
  set_signal_status(effect2, CLEAN);
  var e = effect2.first;
  while (e !== null) {
    reset_all(e);
    e = e.next;
  }
}

// node_modules/svelte/src/internal/client/reactivity/sources.js
var eager_effects = /* @__PURE__ */ new Set();
var old_values = /* @__PURE__ */ new Map();
function set_eager_effects(v) {
  eager_effects = v;
}
var eager_effects_deferred = false;
function set_eager_effects_deferred() {
  eager_effects_deferred = true;
}
function source(v, stack2) {
  var signal = {
    f: 0,
    v,
    reactions: null,
    equals,
    rv: 0,
    wv: 0
  };
  if (dev_fallback_default && tracing_mode_flag) {
    signal.created = stack2 ?? get_error("created at");
    signal.updated = null;
    signal.set_during_effect = false;
    signal.trace = null;
  }
  return signal;
}
// @__NO_SIDE_EFFECTS__
function state(v, stack2) {
  const s = source(v, stack2);
  push_reaction_value(s);
  return s;
}
// @__NO_SIDE_EFFECTS__
function mutable_source(initial_value, immutable = false, trackable = true) {
  const s = source(initial_value);
  if (!immutable) {
    s.equals = safe_equals;
  }
  if (legacy_mode_flag && trackable && component_context !== null && component_context.l !== null) {
    (component_context.l.s ??= []).push(s);
  }
  return s;
}
function set(source2, value, should_proxy = false) {
  if (active_reaction !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!untracking || (active_reaction.f & EAGER_EFFECT) !== 0) && is_runes() && (active_reaction.f & (DERIVED | BLOCK_EFFECT | ASYNC | EAGER_EFFECT)) !== 0 && (current_sources === null || !current_sources.has(source2))) {
    state_unsafe_mutation();
  }
  let new_value = should_proxy ? proxy(value) : value;
  if (dev_fallback_default) {
    tag_proxy(
      new_value,
      /** @type {string} */
      source2.label
    );
  }
  return internal_set(source2, new_value, legacy_updates);
}
var seen = null;
var count_deps = 0;
function internal_set(source2, value, updated_during_traversal = null) {
  if (!source2.equals(value)) {
    if (is_destroying_effect) {
      old_values.set(source2, value);
    } else if (!old_values.has(source2)) {
      old_values.set(source2, source2.v);
    }
    var batch = Batch.ensure();
    batch.capture(source2, value);
    if (dev_fallback_default) {
      if (tracing_mode_flag || active_effect !== null) {
        source2.updated ??= /* @__PURE__ */ new Map();
        const count = (source2.updated.get("")?.count ?? 0) + 1;
        source2.updated.set("", { error: (
          /** @type {any} */
          null
        ), count });
        if (tracing_mode_flag || count > 5) {
          const error = get_error("updated at");
          if (error !== null) {
            let entry = source2.updated.get(error.stack);
            if (!entry) {
              entry = { error, count: 0 };
              source2.updated.set(error.stack, entry);
            }
            entry.count++;
          }
        }
      }
      if (active_effect !== null) {
        source2.set_during_effect = true;
      }
    }
    if ((source2.f & DERIVED) !== 0) {
      const derived2 = (
        /** @type {Derived} */
        source2
      );
      if ((source2.f & DIRTY) !== 0) {
        execute_derived(derived2);
      }
      if (batch_values === null) {
        update_derived_status(derived2);
      }
    }
    source2.wv = increment_write_version();
    seen = null;
    count_deps = 0;
    mark_reactions(source2, DIRTY, updated_during_traversal);
    seen = null;
    if (is_runes() && active_effect !== null && (active_effect.f & CLEAN) !== 0 && (active_effect.f & (BRANCH_EFFECT | ROOT_EFFECT)) === 0) {
      if (untracked_writes === null) {
        set_untracked_writes([source2]);
      } else {
        untracked_writes.push(source2);
      }
    }
    if (!batch.is_fork && eager_effects.size > 0 && !eager_effects_deferred) {
      flush_eager_effects();
    }
  }
  return value;
}
function flush_eager_effects() {
  eager_effects_deferred = false;
  for (const effect2 of eager_effects) {
    if ((effect2.f & CLEAN) !== 0) {
      set_signal_status(effect2, MAYBE_DIRTY);
    }
    let dirty;
    try {
      dirty = is_dirty(effect2);
    } catch {
      dirty = true;
    }
    if (dirty) {
      update_effect(effect2);
    }
  }
  eager_effects.clear();
}
function increment(source2) {
  set(source2, source2.v + 1);
}
function mark_reactions(signal, status, updated_during_traversal) {
  var reactions = signal.reactions;
  if (reactions === null) return;
  var runes = is_runes();
  var length = reactions.length;
  count_deps += length;
  if (count_deps > 1e5 && seen === null) seen = /* @__PURE__ */ new Set();
  if (seen !== null) {
    if (seen.has(signal)) return;
    seen.add(signal);
  }
  for (var i = 0; i < length; i++) {
    var reaction = reactions[i];
    var flags2 = reaction.f;
    if (!runes && reaction === active_effect) continue;
    var not_dirty = (flags2 & DIRTY) === 0;
    if (not_dirty) {
      set_signal_status(reaction, status);
    }
    if ((flags2 & EAGER_EFFECT) !== 0) {
      eager_effects.add(
        /** @type {Effect} */
        reaction
      );
    } else if ((flags2 & DERIVED) !== 0) {
      var derived2 = (
        /** @type {Derived} */
        reaction
      );
      batch_values?.delete(derived2);
      mark_reactions(derived2, MAYBE_DIRTY, updated_during_traversal);
    } else if (not_dirty) {
      var effect2 = (
        /** @type {Effect} */
        reaction
      );
      if ((flags2 & BLOCK_EFFECT) !== 0 && eager_block_effects !== null) {
        eager_block_effects.add(effect2);
      }
      if (updated_during_traversal !== null) {
        updated_during_traversal.push(effect2);
      } else {
        schedule_effect(effect2);
      }
    }
  }
}

// node_modules/svelte/src/internal/client/proxy.js
var regex_is_valid_identifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;
function proxy(value) {
  if (typeof value !== "object" || value === null || STATE_SYMBOL in value || COMPONENT_SYMBOL in value) {
    return value;
  }
  const prototype = get_prototype_of(value);
  if (prototype !== object_prototype && prototype !== array_prototype) {
    return value;
  }
  var sources = /* @__PURE__ */ new Map();
  var is_proxied_array = is_array(value);
  var version = state(0);
  var stack2 = dev_fallback_default && tracing_mode_flag ? get_error("created at") : null;
  var parent_version = update_version;
  var with_parent = (fn) => {
    if (update_version === parent_version) {
      return fn();
    }
    var reaction = active_reaction;
    var version2 = update_version;
    set_active_reaction(null);
    set_update_version(parent_version);
    var result = fn();
    set_active_reaction(reaction);
    set_update_version(version2);
    return result;
  };
  if (is_proxied_array) {
    sources.set("length", state(
      /** @type {any[]} */
      value.length,
      stack2
    ));
    if (dev_fallback_default) {
      value = /** @type {any} */
      inspectable_array(
        /** @type {any[]} */
        value
      );
    }
  }
  var path2 = "";
  let updating = false;
  function update_path(new_path) {
    if (updating) return;
    updating = true;
    path2 = new_path;
    tag(version, `${path2} version`);
    for (const [prop2, source2] of sources) {
      tag(source2, get_label(path2, prop2));
    }
    updating = false;
  }
  return new Proxy(
    /** @type {any} */
    value,
    {
      defineProperty(_, prop2, descriptor) {
        if (!("value" in descriptor) || descriptor.configurable === false || descriptor.enumerable === false || descriptor.writable === false) {
          state_descriptors_fixed();
        }
        var s = sources.get(prop2);
        if (s === void 0) {
          with_parent(() => {
            var s2 = state(descriptor.value, stack2);
            sources.set(prop2, s2);
            if (dev_fallback_default && typeof prop2 === "string") {
              tag(s2, get_label(path2, prop2));
            }
            return s2;
          });
        } else {
          set(s, descriptor.value, true);
        }
        return true;
      },
      deleteProperty(target, prop2) {
        var s = sources.get(prop2);
        if (s === void 0) {
          if (prop2 in target) {
            const s2 = with_parent(() => state(UNINITIALIZED, stack2));
            sources.set(prop2, s2);
            increment(version);
            if (dev_fallback_default) {
              tag(s2, get_label(path2, prop2));
            }
          }
        } else {
          set(s, UNINITIALIZED);
          increment(version);
        }
        return true;
      },
      get(target, prop2, receiver) {
        if (prop2 === STATE_SYMBOL) {
          return value;
        }
        if (dev_fallback_default && prop2 === PROXY_PATH_SYMBOL) {
          return update_path;
        }
        var s = sources.get(prop2);
        var exists = prop2 in target;
        if (s === void 0 && (!exists || get_descriptor(target, prop2)?.writable)) {
          s = with_parent(() => {
            var p = proxy(exists ? target[prop2] : UNINITIALIZED);
            var s2 = state(p, stack2);
            if (dev_fallback_default) {
              tag(s2, get_label(path2, prop2));
            }
            return s2;
          });
          sources.set(prop2, s);
        }
        if (s !== void 0) {
          var v = get(s);
          return v === UNINITIALIZED ? void 0 : v;
        }
        return Reflect.get(target, prop2, receiver);
      },
      getOwnPropertyDescriptor(target, prop2) {
        this.has?.(target, prop2);
        var descriptor = Reflect.getOwnPropertyDescriptor(target, prop2);
        var s = sources.get(prop2);
        if (s !== void 0) {
          var value2 = get(s);
          if (value2 === UNINITIALIZED) {
            return void 0;
          }
          if (descriptor && "value" in descriptor) {
            descriptor.value = value2;
          } else {
            return {
              enumerable: true,
              configurable: true,
              value: value2,
              writable: true
            };
          }
        }
        return descriptor;
      },
      has(target, prop2) {
        if (prop2 === STATE_SYMBOL) {
          return true;
        }
        var s = sources.get(prop2);
        var has = s !== void 0 && s.v !== UNINITIALIZED || Reflect.has(target, prop2);
        if (s !== void 0 || (active_effect !== null || active_reaction !== null) && (!has || get_descriptor(target, prop2)?.writable)) {
          if (s === void 0) {
            s = with_parent(() => {
              var p = has ? proxy(target[prop2]) : UNINITIALIZED;
              var s2 = state(p, stack2);
              if (dev_fallback_default) {
                tag(s2, get_label(path2, prop2));
              }
              return s2;
            });
            sources.set(prop2, s);
          }
          var value2 = get(s);
          if (value2 === UNINITIALIZED) {
            return false;
          }
        }
        return has;
      },
      set(target, prop2, value2, receiver) {
        var s = sources.get(prop2);
        var has = prop2 in target;
        if (is_proxied_array && prop2 === "length") {
          for (var i = value2; i < /** @type {Source<number>} */
          s.v; i += 1) {
            var other_s = sources.get(i + "");
            if (other_s !== void 0) {
              set(other_s, UNINITIALIZED);
            } else if (i in target) {
              other_s = with_parent(() => state(UNINITIALIZED, stack2));
              sources.set(i + "", other_s);
              if (dev_fallback_default) {
                tag(other_s, get_label(path2, i));
              }
            }
          }
        }
        if (s === void 0) {
          if (!has || get_descriptor(target, prop2)?.writable) {
            s = with_parent(() => state(void 0, stack2));
            if (dev_fallback_default) {
              tag(s, get_label(path2, prop2));
            }
            set(s, proxy(value2));
            sources.set(prop2, s);
          }
        } else {
          has = s.v !== UNINITIALIZED;
          var p = with_parent(() => proxy(value2));
          set(s, p);
        }
        var descriptor = Reflect.getOwnPropertyDescriptor(target, prop2);
        if (descriptor?.set) {
          descriptor.set.call(receiver, value2);
        }
        if (!has) {
          if (is_proxied_array && typeof prop2 === "string") {
            var ls = (
              /** @type {Source<number>} */
              sources.get("length")
            );
            var n = Number(prop2);
            if (Number.isInteger(n) && n >= ls.v) {
              set(ls, n + 1);
            }
          }
          increment(version);
        }
        return true;
      },
      ownKeys(target) {
        get(version);
        var own_keys = Reflect.ownKeys(target).filter((key3) => {
          var source3 = sources.get(key3);
          return source3 === void 0 || source3.v !== UNINITIALIZED;
        });
        for (var [key2, source2] of sources) {
          if (source2.v !== UNINITIALIZED && !(key2 in target)) {
            own_keys.push(key2);
          }
        }
        return own_keys;
      },
      setPrototypeOf() {
        state_prototype_fixed();
      }
    }
  );
}
function get_label(path2, prop2) {
  if (typeof prop2 === "symbol") return `${path2}[Symbol(${prop2.description ?? ""})]`;
  if (regex_is_valid_identifier.test(prop2)) return `${path2}.${prop2}`;
  return /^\d+$/.test(prop2) ? `${path2}[${prop2}]` : `${path2}['${prop2}']`;
}
function get_proxied_value(value) {
  try {
    if (value !== null && typeof value === "object" && STATE_SYMBOL in value) {
      return value[STATE_SYMBOL];
    }
  } catch {
  }
  return value;
}
function is(a, b) {
  return Object.is(get_proxied_value(a), get_proxied_value(b));
}
var ARRAY_MUTATING_METHODS = /* @__PURE__ */ new Set([
  "copyWithin",
  "fill",
  "pop",
  "push",
  "reverse",
  "shift",
  "sort",
  "splice",
  "unshift"
]);
function inspectable_array(array) {
  return new Proxy(array, {
    get(target, prop2, receiver) {
      var value = Reflect.get(target, prop2, receiver);
      if (!ARRAY_MUTATING_METHODS.has(
        /** @type {string} */
        prop2
      )) {
        return value;
      }
      return function(...args) {
        set_eager_effects_deferred();
        var result = value.apply(this, args);
        flush_eager_effects();
        return result;
      };
    }
  });
}

// node_modules/svelte/src/internal/client/dev/equality.js
function init_array_prototype_warnings() {
  const array_prototype2 = Array.prototype;
  const cleanup = Array.__svelte_cleanup;
  if (cleanup) {
    cleanup();
  }
  const { indexOf, lastIndexOf, includes: includes2 } = array_prototype2;
  array_prototype2.indexOf = function(item, from_index) {
    const index3 = indexOf.call(this, item, from_index);
    if (index3 === -1) {
      for (let i = from_index ?? 0; i < this.length; i += 1) {
        if (get_proxied_value(this[i]) === item) {
          state_proxy_equality_mismatch("array.indexOf(...)");
          break;
        }
      }
    }
    return index3;
  };
  array_prototype2.lastIndexOf = function(item, from_index) {
    const index3 = lastIndexOf.call(this, item, from_index ?? this.length - 1);
    if (index3 === -1) {
      for (let i = 0; i <= (from_index ?? this.length - 1); i += 1) {
        if (get_proxied_value(this[i]) === item) {
          state_proxy_equality_mismatch("array.lastIndexOf(...)");
          break;
        }
      }
    }
    return index3;
  };
  array_prototype2.includes = function(item, from_index) {
    const has = includes2.call(this, item, from_index);
    if (!has) {
      for (let i = 0; i < this.length; i += 1) {
        if (get_proxied_value(this[i]) === item) {
          state_proxy_equality_mismatch("array.includes(...)");
          break;
        }
      }
    }
    return has;
  };
  Array.__svelte_cleanup = () => {
    array_prototype2.indexOf = indexOf;
    array_prototype2.lastIndexOf = lastIndexOf;
    array_prototype2.includes = includes2;
  };
}

// node_modules/svelte/src/internal/client/dom/operations.js
var $window;
var $document;
var is_firefox;
var first_child_getter;
var next_sibling_getter;
function init_operations() {
  if ($window !== void 0) {
    return;
  }
  $window = window;
  $document = document;
  is_firefox = /Firefox/.test(navigator.userAgent);
  var element_prototype = Element.prototype;
  var node_prototype = Node.prototype;
  var text_prototype = Text.prototype;
  first_child_getter = get_descriptor(node_prototype, "firstChild").get;
  next_sibling_getter = get_descriptor(node_prototype, "nextSibling").get;
  if (is_extensible(element_prototype)) {
    element_prototype[CLASS_CACHE] = void 0;
    element_prototype[ATTRIBUTES_CACHE] = null;
    element_prototype[STYLE_CACHE] = void 0;
    element_prototype.__e = void 0;
  }
  if (is_extensible(text_prototype)) {
    text_prototype[TEXT_CACHE] = void 0;
  }
  if (dev_fallback_default) {
    element_prototype.__svelte_meta = null;
    init_array_prototype_warnings();
  }
}
function create_text(value = "") {
  return document.createTextNode(value);
}
// @__NO_SIDE_EFFECTS__
function get_first_child(node) {
  return (
    /** @type {TemplateNode | null} */
    first_child_getter.call(node)
  );
}
// @__NO_SIDE_EFFECTS__
function get_next_sibling(node) {
  return (
    /** @type {TemplateNode | null} */
    next_sibling_getter.call(node)
  );
}
function child(node, is_text) {
  if (!hydrating) {
    return /* @__PURE__ */ get_first_child(node);
  }
  var child2 = /* @__PURE__ */ get_first_child(hydrate_node);
  if (child2 === null) {
    child2 = hydrate_node.appendChild(create_text());
  } else if (is_text && child2.nodeType !== TEXT_NODE) {
    var text2 = create_text();
    child2?.before(text2);
    set_hydrate_node(text2);
    return text2;
  }
  if (is_text) {
    merge_text_nodes(
      /** @type {Text} */
      child2
    );
  }
  set_hydrate_node(child2);
  return child2;
}
function first_child(node, is_text = false) {
  if (!hydrating) {
    var first = /* @__PURE__ */ get_first_child(node);
    if (first instanceof Comment && first.data === "") return /* @__PURE__ */ get_next_sibling(first);
    return first;
  }
  if (is_text) {
    if (hydrate_node?.nodeType !== TEXT_NODE) {
      var text2 = create_text();
      hydrate_node?.before(text2);
      set_hydrate_node(text2);
      return text2;
    }
    merge_text_nodes(
      /** @type {Text} */
      hydrate_node
    );
  }
  return hydrate_node;
}
function only_child(node, is_text = false) {
  if (!hydrating) {
    return /* @__PURE__ */ get_first_child(node);
  }
  var first = child(node, is_text);
  reset(node);
  return first;
}
function sibling(node, count = 1, is_text = false) {
  let next_sibling = hydrating ? hydrate_node : node;
  var last_sibling;
  while (count--) {
    last_sibling = next_sibling;
    next_sibling = /** @type {TemplateNode} */
    /* @__PURE__ */ get_next_sibling(next_sibling);
  }
  if (!hydrating) {
    return next_sibling;
  }
  if (is_text) {
    if (next_sibling?.nodeType !== TEXT_NODE) {
      var text2 = create_text();
      if (next_sibling === null) {
        last_sibling?.after(text2);
      } else {
        next_sibling.before(text2);
      }
      set_hydrate_node(text2);
      return text2;
    }
    merge_text_nodes(
      /** @type {Text} */
      next_sibling
    );
  }
  set_hydrate_node(next_sibling);
  return next_sibling;
}
function clear_text_content(node) {
  node.textContent = "";
}
function should_defer_append() {
  if (!async_mode_flag) return false;
  if (eager_block_effects !== null) return false;
  var flags2 = (
    /** @type {Effect} */
    active_effect.f
  );
  return (flags2 & REACTION_RAN) !== 0;
}
function create_element(tag2, namespace, is2) {
  if (namespace == null || namespace === NAMESPACE_HTML) {
    return (
      /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
      is2 ? document.createElement(tag2, { is: is2 }) : document.createElement(tag2)
    );
  }
  return (
    /** @type {T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : Element} */
    is2 ? document.createElementNS(namespace, tag2, { is: is2 }) : document.createElementNS(namespace, tag2)
  );
}
function merge_text_nodes(text2) {
  if (
    /** @type {string} */
    text2.nodeValue.length < 65536
  ) {
    return;
  }
  let next2 = text2.nextSibling;
  while (next2 !== null && next2.nodeType === TEXT_NODE) {
    next2.remove();
    text2.nodeValue += /** @type {string} */
    next2.nodeValue;
    next2 = text2.nextSibling;
  }
}

// node_modules/svelte/src/internal/client/error-handling.js
var adjustments = /* @__PURE__ */ new WeakMap();
function handle_error(error) {
  var effect2 = active_effect;
  if (effect2 === null) {
    active_reaction.f |= ERROR_VALUE;
    return error;
  }
  if (dev_fallback_default && error instanceof Error && !adjustments.has(error)) {
    adjustments.set(error, get_adjustments(error, effect2));
  }
  if ((effect2.f & REACTION_RAN) === 0 && (effect2.f & EFFECT) === 0) {
    if (dev_fallback_default && !effect2.parent && error instanceof Error) {
      apply_adjustments(error);
    }
    throw error;
  }
  invoke_error_boundary(error, effect2);
}
function invoke_error_boundary(error, effect2) {
  if (error === HYDRATION_ERROR) {
    throw error;
  }
  if (effect2 !== null && (effect2.f & DESTROYED) !== 0) {
    return;
  }
  while (effect2 !== null) {
    if ((effect2.f & BOUNDARY_EFFECT) !== 0 && (effect2.f & (DESTROYED | DESTROYING)) === 0) {
      if ((effect2.f & REACTION_RAN) === 0) {
        throw error;
      }
      try {
        effect2.b.error(error);
        return;
      } catch (e) {
        error = e;
      }
    }
    effect2 = effect2.parent;
  }
  if (dev_fallback_default && error instanceof Error) {
    apply_adjustments(error);
  }
  throw error;
}
function get_adjustments(error, effect2) {
  const message_descriptor = get_descriptor(error, "message");
  if (message_descriptor && !message_descriptor.configurable) return;
  var indent = is_firefox ? "  " : "	";
  var component_stack = `
${indent}in ${effect2.fn?.name || "<unknown>"}`;
  var context = effect2.ctx;
  while (context !== null) {
    component_stack += `
${indent}in ${context.function?.[FILENAME].split("/").pop()}`;
    context = context.p;
  }
  return {
    message: error.message + `
${component_stack}
`,
    stack: error.stack?.split("\n").filter((line) => !line.includes("svelte/src/internal")).join("\n")
  };
}
function apply_adjustments(error) {
  const adjusted = adjustments.get(error);
  if (adjusted) {
    define_property(error, "message", {
      value: adjusted.message
    });
    define_property(error, "stack", {
      value: adjusted.stack
    });
  }
}

// node_modules/svelte/src/internal/client/reactivity/effects.js
function validate_effect(rune) {
  if (active_effect === null) {
    if (active_reaction === null) {
      effect_orphan(rune);
    }
    effect_in_unowned_derived();
  }
  if (is_destroying_effect) {
    effect_in_teardown(rune);
  }
}
function push_effect(effect2, parent_effect) {
  var parent_last = parent_effect.last;
  if (parent_last === null) {
    parent_effect.last = parent_effect.first = effect2;
  } else {
    parent_last.next = effect2;
    effect2.prev = parent_last;
    parent_effect.last = effect2;
  }
}
function create_effect(type, fn) {
  var parent = active_effect;
  if (dev_fallback_default) {
    while (parent !== null && (parent.f & EAGER_EFFECT) !== 0) {
      parent = parent.parent;
    }
  }
  if (parent !== null && (parent.f & INERT) !== 0) {
    type |= INERT;
  }
  var effect2 = {
    ctx: component_context,
    deps: null,
    nodes: null,
    f: type | DIRTY | CONNECTED,
    first: null,
    fn,
    last: null,
    next: null,
    parent,
    b: parent && parent.b,
    prev: null,
    teardown: null,
    wv: 0,
    ac: null
  };
  if (dev_fallback_default) {
    effect2.component_function = dev_current_component_function;
  }
  current_batch?.register_created_effect(effect2);
  var e = effect2;
  if ((type & EFFECT) !== 0) {
    if (collected_effects !== null) {
      collected_effects.push(effect2);
    } else {
      Batch.ensure().schedule(effect2);
    }
  } else if (fn !== null) {
    try {
      update_effect(effect2);
    } catch (e3) {
      destroy_effect(effect2);
      throw e3;
    }
    if (e.deps === null && e.teardown === null && e.nodes === null && e.first === e.last && // either `null`, or a singular child
    (e.f & EFFECT_PRESERVED) === 0) {
      e = e.first;
      if ((type & BLOCK_EFFECT) !== 0 && (type & EFFECT_TRANSPARENT) !== 0 && e !== null) {
        e.f |= EFFECT_TRANSPARENT;
      }
    }
  }
  if (e !== null) {
    e.parent = parent;
    if (parent !== null) {
      push_effect(e, parent);
    }
    if (active_reaction !== null && (active_reaction.f & DERIVED) !== 0 && (type & ROOT_EFFECT) === 0) {
      var derived2 = (
        /** @type {Derived} */
        active_reaction
      );
      (derived2.effects ??= []).push(e);
    }
  }
  return effect2;
}
function effect_tracking() {
  return active_reaction !== null && !untracking;
}
function teardown(fn) {
  const effect2 = create_effect(RENDER_EFFECT, null);
  set_signal_status(effect2, CLEAN);
  effect2.teardown = fn;
  return effect2;
}
function user_effect(fn) {
  validate_effect("$effect");
  if (dev_fallback_default) {
    define_property(fn, "name", {
      value: "$effect"
    });
  }
  var flags2 = (
    /** @type {Effect} */
    active_effect.f
  );
  var defer = !active_reaction && (flags2 & BRANCH_EFFECT) !== 0 && component_context !== null && !component_context.i;
  if (defer) {
    var context = (
      /** @type {ComponentContext} */
      component_context
    );
    (context.e ??= []).push(fn);
  } else {
    return create_user_effect(fn);
  }
}
function create_user_effect(fn) {
  return create_effect(EFFECT | USER_EFFECT, fn);
}
function effect_root(fn) {
  Batch.ensure();
  const effect2 = create_effect(ROOT_EFFECT | EFFECT_PRESERVED, fn);
  return () => {
    destroy_effect(effect2);
  };
}
function component_root(fn) {
  Batch.ensure();
  const effect2 = create_effect(ROOT_EFFECT | EFFECT_PRESERVED, fn);
  return (options = {}) => {
    return new Promise((fulfil) => {
      if (options.outro) {
        pause_effect(effect2, () => {
          destroy_effect(effect2);
          fulfil(void 0);
        });
      } else {
        destroy_effect(effect2);
        fulfil(void 0);
      }
    });
  };
}
function effect(fn) {
  return create_effect(EFFECT, fn);
}
function async_effect(fn) {
  return create_effect(ASYNC | EFFECT_PRESERVED, fn);
}
function render_effect(fn, flags2 = 0) {
  return create_effect(RENDER_EFFECT | flags2, fn);
}
function template_effect(fn, sync2 = [], async2 = [], blockers = []) {
  flatten(blockers, sync2, async2, (values) => {
    create_effect(RENDER_EFFECT, () => {
      fn(...values.map(get));
    });
  });
}
function block(fn, flags2 = 0) {
  var effect2 = create_effect(BLOCK_EFFECT | flags2, fn);
  if (dev_fallback_default) {
    effect2.dev_stack = dev_stack;
  }
  return effect2;
}
function branch(fn) {
  return create_effect(BRANCH_EFFECT | EFFECT_PRESERVED, fn);
}
function execute_effect_teardown(effect2) {
  var teardown2 = effect2.teardown;
  if (teardown2 !== null) {
    const previously_destroying_effect = is_destroying_effect;
    const previous_reaction = active_reaction;
    set_is_destroying_effect(true);
    set_active_reaction(null);
    try {
      teardown2.call(null);
    } catch (error) {
      invoke_error_boundary(error, effect2.parent);
    } finally {
      set_is_destroying_effect(previously_destroying_effect);
      set_active_reaction(previous_reaction);
    }
  }
}
function destroy_effect_children(signal, remove_dom = false) {
  var effect2 = signal.first;
  signal.first = signal.last = null;
  while (effect2 !== null) {
    const controller = effect2.ac;
    if (controller !== null) {
      without_reactive_context(() => {
        controller.abort(STALE_REACTION);
      });
    }
    var next2 = effect2.next;
    if ((effect2.f & ROOT_EFFECT) !== 0) {
      effect2.parent = null;
    } else {
      destroy_effect(effect2, remove_dom);
    }
    effect2 = next2;
  }
}
function destroy_block_effect_children(signal) {
  var effect2 = signal.first;
  while (effect2 !== null) {
    var next2 = effect2.next;
    if ((effect2.f & BRANCH_EFFECT) === 0) {
      destroy_effect(effect2);
    }
    effect2 = next2;
  }
}
function destroy_effect(effect2, remove_dom = true) {
  var removed = false;
  if ((remove_dom || (effect2.f & HEAD_EFFECT) !== 0) && effect2.nodes !== null && effect2.nodes.end !== null) {
    remove_effect_dom(
      effect2.nodes.start,
      /** @type {TemplateNode} */
      effect2.nodes.end
    );
    removed = true;
  }
  effect2.f |= DESTROYING;
  destroy_effect_children(effect2, remove_dom && !removed);
  remove_reactions(effect2, 0);
  var transitions = effect2.nodes && effect2.nodes.t;
  if (transitions !== null) {
    for (const transition2 of transitions) {
      transition2.stop();
    }
  }
  execute_effect_teardown(effect2);
  effect2.f ^= DESTROYING;
  effect2.f |= DESTROYED;
  var parent = effect2.parent;
  if (parent !== null && parent.first !== null) {
    unlink_effect(effect2);
  }
  if (dev_fallback_default) {
    effect2.component_function = null;
  }
  effect2.next = effect2.prev = effect2.teardown = effect2.ctx = effect2.deps = effect2.fn = effect2.nodes = effect2.ac = effect2.b = null;
}
function remove_effect_dom(node, end) {
  while (node !== null) {
    var next2 = node === end ? null : get_next_sibling(node);
    node.remove();
    node = next2;
  }
}
function unlink_effect(effect2) {
  var parent = effect2.parent;
  var prev = effect2.prev;
  var next2 = effect2.next;
  if (prev !== null) prev.next = next2;
  if (next2 !== null) next2.prev = prev;
  if (parent !== null) {
    if (parent.first === effect2) parent.first = next2;
    if (parent.last === effect2) parent.last = prev;
  }
}
function pause_effect(effect2, callback, destroy = true) {
  var transitions = [];
  effect2.f |= PAUSED;
  pause_children(effect2, transitions, true);
  var fn = () => {
    if (destroy) destroy_effect(effect2);
    if (callback) callback();
  };
  var remaining = transitions.length;
  if (remaining > 0) {
    var check = () => --remaining || fn();
    for (var transition2 of transitions) {
      transition2.out(check);
    }
  } else {
    fn();
  }
}
function pause_children(effect2, transitions, local) {
  if ((effect2.f & INERT) !== 0) return;
  effect2.f ^= INERT;
  var t = effect2.nodes && effect2.nodes.t;
  if (t !== null) {
    for (const transition2 of t) {
      if (transition2.is_global || local) {
        transitions.push(transition2);
      }
    }
  }
  var child2 = effect2.first;
  while (child2 !== null) {
    var sibling2 = child2.next;
    if ((child2.f & ROOT_EFFECT) === 0) {
      var transparent = (child2.f & EFFECT_TRANSPARENT) !== 0 || // If this is a branch effect without a block effect parent,
      // it means the parent block effect was pruned. In that case,
      // transparency information was transferred to the branch effect.
      (child2.f & BRANCH_EFFECT) !== 0 && (effect2.f & BLOCK_EFFECT) !== 0;
      pause_children(child2, transitions, transparent ? local : false);
    }
    child2 = sibling2;
  }
}
function resume_effect(effect2) {
  effect2.f &= ~PAUSED;
  resume_children(effect2, true);
}
function resume_children(effect2, local) {
  if ((effect2.f & PAUSED) !== 0) return;
  if ((effect2.f & INERT) === 0) return;
  effect2.f ^= INERT;
  if ((effect2.f & CLEAN) === 0) {
    set_signal_status(effect2, DIRTY);
    Batch.ensure().schedule(effect2);
  }
  var child2 = effect2.first;
  while (child2 !== null) {
    var sibling2 = child2.next;
    var transparent = (child2.f & EFFECT_TRANSPARENT) !== 0 || (child2.f & BRANCH_EFFECT) !== 0;
    resume_children(child2, transparent ? local : false);
    child2 = sibling2;
  }
  var t = effect2.nodes && effect2.nodes.t;
  if (t !== null) {
    for (const transition2 of t) {
      if (transition2.is_global || local) {
        transition2.in();
      }
    }
  }
}
function move_effect(effect2, fragment) {
  if (!effect2.nodes) return;
  var node = effect2.nodes.start;
  var end = effect2.nodes.end;
  while (node !== null) {
    var next2 = node === end ? null : get_next_sibling(node);
    fragment.append(node);
    node = next2;
  }
}

// node_modules/svelte/src/internal/client/legacy.js
var captured_signals = null;

// node_modules/svelte/src/internal/client/runtime.js
var is_destroying_effect = false;
function set_is_destroying_effect(value) {
  is_destroying_effect = value;
}
var active_reaction = null;
var untracking = false;
function set_active_reaction(reaction) {
  active_reaction = reaction;
}
var active_effect = null;
function set_active_effect(effect2) {
  active_effect = effect2;
}
var current_sources = null;
function push_reaction_value(value) {
  if (active_reaction !== null && (!async_mode_flag && (active_reaction.f & REACTION_IS_UPDATING) !== 0 || (active_reaction.f & DERIVED) !== 0)) {
    (current_sources ??= /* @__PURE__ */ new Set()).add(value);
  }
}
var new_deps = null;
var skipped_deps = 0;
var untracked_writes = null;
function set_untracked_writes(value) {
  untracked_writes = value;
}
var write_version = 1;
var read_version = 0;
var update_version = read_version;
function set_update_version(value) {
  update_version = value;
}
function increment_write_version() {
  return ++write_version;
}
function is_dirty(reaction) {
  var flags2 = reaction.f;
  if ((flags2 & DIRTY) !== 0) {
    return true;
  }
  if ((flags2 & MAYBE_DIRTY) !== 0) {
    var dependencies = (
      /** @type {Value[]} */
      reaction.deps
    );
    var length = dependencies.length;
    for (var i = 0; i < length; i++) {
      var dependency = dependencies[i];
      if (is_dirty(
        /** @type {Derived} */
        dependency
      )) {
        update_derived(
          /** @type {Derived} */
          dependency
        );
      }
      if (dependency.wv > reaction.wv) {
        return true;
      }
    }
    if ((flags2 & CONNECTED) !== 0 && // During time traveling we don't want to reset the status so that
    // traversal of the graph in the other batches still happens
    batch_values === null) {
      set_signal_status(reaction, CLEAN);
    }
  }
  return false;
}
function schedule_possible_effect_self_invalidation(signal, effect2, root18 = true) {
  var reactions = signal.reactions;
  if (reactions === null) return;
  if (!async_mode_flag && current_sources !== null && current_sources.has(signal)) {
    return;
  }
  for (var i = 0; i < reactions.length; i++) {
    var reaction = reactions[i];
    if ((reaction.f & DERIVED) !== 0) {
      schedule_possible_effect_self_invalidation(
        /** @type {Derived} */
        reaction,
        effect2,
        false
      );
    } else if (effect2 === reaction) {
      if (root18) {
        set_signal_status(reaction, DIRTY);
      } else if ((reaction.f & CLEAN) !== 0) {
        set_signal_status(reaction, MAYBE_DIRTY);
      }
      schedule_effect(
        /** @type {Effect} */
        reaction
      );
    }
  }
}
function update_reaction(reaction) {
  var previous_deps = new_deps;
  var previous_skipped_deps = skipped_deps;
  var previous_untracked_writes = untracked_writes;
  var previous_reaction = active_reaction;
  var previous_sources = current_sources;
  var previous_component_context = component_context;
  var previous_untracking = untracking;
  var previous_update_version = update_version;
  var flags2 = reaction.f;
  new_deps = /** @type {null | Value[]} */
  null;
  skipped_deps = 0;
  untracked_writes = null;
  active_reaction = (flags2 & (BRANCH_EFFECT | ROOT_EFFECT)) === 0 ? reaction : null;
  current_sources = null;
  set_component_context(reaction.ctx);
  untracking = false;
  update_version = ++read_version;
  if (reaction.ac !== null) {
    without_reactive_context(() => {
      reaction.ac.abort(STALE_REACTION);
    });
    reaction.ac = null;
  }
  try {
    reaction.f |= REACTION_IS_UPDATING;
    var fn = (
      /** @type {Function} */
      reaction.fn
    );
    var result = fn();
    reaction.f |= REACTION_RAN;
    var deps = update_dependencies(reaction);
    if (is_runes() && untracked_writes !== null && !untracking && deps !== null && (reaction.f & (DERIVED | MAYBE_DIRTY | DIRTY)) === 0) {
      for (var i = 0; i < /** @type {Source[]} */
      untracked_writes.length; i++) {
        schedule_possible_effect_self_invalidation(
          untracked_writes[i],
          /** @type {Effect} */
          reaction
        );
      }
    }
    if (previous_reaction !== null && previous_reaction !== reaction) {
      read_version++;
      if (previous_reaction.deps !== null) {
        for (let i2 = 0; i2 < previous_skipped_deps; i2 += 1) {
          previous_reaction.deps[i2].rv = read_version;
        }
      }
      if (previous_deps !== null) {
        for (const dep of previous_deps) {
          dep.rv = read_version;
        }
      }
      if (untracked_writes !== null) {
        if (previous_untracked_writes === null) {
          previous_untracked_writes = untracked_writes;
        } else {
          previous_untracked_writes.push(.../** @type {Source[]} */
          untracked_writes);
        }
      }
    }
    if ((reaction.f & ERROR_VALUE) !== 0) {
      reaction.f ^= ERROR_VALUE;
    }
    return result;
  } catch (error) {
    update_dependencies(reaction);
    return handle_error(error);
  } finally {
    reaction.f ^= REACTION_IS_UPDATING;
    new_deps = previous_deps;
    skipped_deps = previous_skipped_deps;
    untracked_writes = previous_untracked_writes;
    active_reaction = previous_reaction;
    current_sources = previous_sources;
    set_component_context(previous_component_context);
    untracking = previous_untracking;
    update_version = previous_update_version;
  }
}
function update_dependencies(reaction) {
  var deps = reaction.deps;
  var is_fork = current_batch?.is_fork;
  if (new_deps !== null) {
    var i;
    if (!is_fork) {
      remove_reactions(reaction, skipped_deps);
    }
    if (deps !== null && skipped_deps > 0) {
      deps.length = skipped_deps + new_deps.length;
      for (i = 0; i < new_deps.length; i++) {
        deps[skipped_deps + i] = new_deps[i];
      }
    } else {
      reaction.deps = deps = new_deps;
    }
    if (effect_tracking() && (reaction.f & CONNECTED) !== 0) {
      for (i = skipped_deps; i < deps.length; i++) {
        (deps[i].reactions ??= []).push(reaction);
      }
    }
  } else if (!is_fork && deps !== null && skipped_deps < deps.length) {
    remove_reactions(reaction, skipped_deps);
    deps.length = skipped_deps;
  }
  return deps;
}
function remove_reaction(signal, dependency) {
  let reactions = dependency.reactions;
  if (reactions !== null) {
    var index3 = index_of.call(reactions, signal);
    if (index3 !== -1) {
      var new_length = reactions.length - 1;
      if (new_length === 0) {
        reactions = dependency.reactions = null;
      } else {
        reactions[index3] = reactions[new_length];
        reactions.pop();
      }
    }
  }
  if (reactions === null && (dependency.f & DERIVED) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (new_deps === null || !includes.call(new_deps, dependency))) {
    var derived2 = (
      /** @type {Derived} */
      dependency
    );
    if ((derived2.f & CONNECTED) !== 0) {
      derived2.f ^= CONNECTED;
    }
    if (derived2.v !== UNINITIALIZED) {
      update_derived_status(derived2);
    }
    if (derived2.ac !== null) {
      without_reactive_context(() => {
        derived2.ac.abort(STALE_REACTION);
        derived2.ac = null;
        set_signal_status(derived2, DIRTY);
      });
    }
    freeze_derived_effects(derived2);
    remove_reactions(derived2, 0);
  }
}
function remove_reactions(signal, start_index) {
  var dependencies = signal.deps;
  if (dependencies === null) return;
  for (var i = start_index; i < dependencies.length; i++) {
    remove_reaction(signal, dependencies[i]);
  }
}
function update_effect(effect2) {
  var flags2 = effect2.f;
  if ((flags2 & DESTROYED) !== 0) {
    return;
  }
  set_signal_status(effect2, CLEAN);
  var previous_effect = active_effect;
  active_effect = effect2;
  if (dev_fallback_default) {
    var previous_component_fn = dev_current_component_function;
    set_dev_current_component_function(effect2.component_function);
    var previous_stack = (
      /** @type {any} */
      dev_stack
    );
    set_dev_stack(effect2.dev_stack ?? dev_stack);
  }
  try {
    if ((flags2 & (BLOCK_EFFECT | MANAGED_EFFECT)) !== 0) {
      destroy_block_effect_children(effect2);
    } else {
      destroy_effect_children(effect2);
    }
    execute_effect_teardown(effect2);
    var teardown2 = update_reaction(effect2);
    effect2.teardown = typeof teardown2 === "function" ? teardown2 : null;
    effect2.wv = write_version;
    if (dev_fallback_default && tracing_mode_flag && (effect2.f & DIRTY) !== 0 && effect2.deps !== null) {
      for (var dep of effect2.deps) {
        if (dep.set_during_effect) {
          dep.wv = increment_write_version();
          dep.set_during_effect = false;
        }
      }
    }
  } finally {
    active_effect = previous_effect;
    if (dev_fallback_default) {
      set_dev_current_component_function(previous_component_fn);
      set_dev_stack(previous_stack);
    }
  }
}
async function tick() {
  if (async_mode_flag) {
    return new Promise((f) => {
      requestAnimationFrame(() => f());
      setTimeout(() => f());
    });
  }
  await Promise.resolve();
  flushSync();
}
function get(signal) {
  var flags2 = signal.f;
  var is_derived = (flags2 & DERIVED) !== 0;
  captured_signals?.add(signal);
  if (active_reaction !== null && !untracking) {
    var destroyed = active_effect !== null && (active_effect.f & DESTROYED) !== 0;
    if (!destroyed && (current_sources === null || !current_sources.has(signal))) {
      var deps = active_reaction.deps;
      if ((active_reaction.f & REACTION_IS_UPDATING) !== 0) {
        if (signal.rv < read_version) {
          signal.rv = read_version;
          if (new_deps === null && deps !== null && deps[skipped_deps] === signal) {
            skipped_deps++;
          } else if (new_deps === null) {
            new_deps = [signal];
          } else {
            new_deps.push(signal);
          }
        }
      } else {
        active_reaction.deps ??= [];
        if (!includes.call(active_reaction.deps, signal)) {
          active_reaction.deps.push(signal);
        }
        var reactions = signal.reactions;
        if (reactions === null) {
          signal.reactions = [active_reaction];
        } else if (!includes.call(reactions, active_reaction)) {
          reactions.push(active_reaction);
        }
      }
    }
  }
  if (dev_fallback_default) {
    if (!untracking && reactivity_loss_tracker && // By checking that current/previous batch are null we filter out false positives.
    // reactivity_loss_tracker is only reset after a microtask, so if a flush happens
    // before that, we get warnings for things we shouldn't warn on.
    current_batch === null && previous_batch === null && !reactivity_loss_tracker.warned && (reactivity_loss_tracker.effect.f & REACTION_IS_UPDATING) === 0 && !reactivity_loss_tracker.effect_deps.has(signal)) {
      reactivity_loss_tracker.warned = true;
      await_reactivity_loss(
        /** @type {string} */
        signal.label
      );
      var trace2 = get_error("traced at");
      if (trace2) console.warn(trace2);
    }
    recent_async_deriveds.delete(signal);
    if (tracing_mode_flag && !untracking && tracing_expressions !== null && active_reaction !== null && tracing_expressions.reaction === active_reaction) {
      if (signal.trace) {
        signal.trace();
      } else {
        trace2 = get_error("traced at");
        if (trace2) {
          var entry = tracing_expressions.entries.get(signal);
          if (entry === void 0) {
            entry = { traces: [] };
            tracing_expressions.entries.set(signal, entry);
          }
          var last = entry.traces[entry.traces.length - 1];
          if (trace2.stack !== last?.stack) {
            entry.traces.push(trace2);
          }
        }
      }
    }
  }
  if (is_destroying_effect && old_values.has(signal)) {
    return old_values.get(signal);
  }
  if (is_derived) {
    var derived2 = (
      /** @type {Derived} */
      signal
    );
    if (is_destroying_effect) {
      var value = derived2.v;
      if ((derived2.f & CLEAN) === 0 && derived2.reactions !== null || depends_on_old_values(derived2)) {
        value = execute_derived(derived2);
      }
      old_values.set(derived2, value);
      return value;
    }
    var should_connect = (derived2.f & CONNECTED) === 0 && !untracking && active_reaction !== null && (active_reaction.f & CONNECTED) !== 0;
    var is_new = (derived2.f & REACTION_RAN) === 0;
    if (is_dirty(derived2)) {
      if (should_connect) {
        derived2.f |= CONNECTED;
      }
      update_derived(derived2);
    }
    if (should_connect && !is_new) {
      unfreeze_derived_effects(derived2);
      reconnect(derived2);
    }
  }
  if (batch_values?.has(signal)) {
    return batch_values.get(signal);
  }
  if ((signal.f & ERROR_VALUE) !== 0) {
    throw signal.v;
  }
  return signal.v;
}
function reconnect(derived2) {
  derived2.f |= CONNECTED;
  if (derived2.deps === null) return;
  for (const dep of derived2.deps) {
    var reactions = dep.reactions;
    if (reactions === null) {
      dep.reactions = [derived2];
    } else if (!includes.call(reactions, derived2)) {
      reactions.push(derived2);
    }
    if ((dep.f & DERIVED) !== 0 && (dep.f & CONNECTED) === 0) {
      unfreeze_derived_effects(
        /** @type {Derived} */
        dep
      );
      reconnect(
        /** @type {Derived} */
        dep
      );
    }
  }
}
function depends_on_old_values(derived2) {
  if (derived2.v === UNINITIALIZED) return true;
  if (derived2.deps === null) return false;
  for (const dep of derived2.deps) {
    if (old_values.has(dep)) {
      return true;
    }
    if ((dep.f & DERIVED) !== 0 && depends_on_old_values(
      /** @type {Derived} */
      dep
    )) {
      return true;
    }
  }
  return false;
}
function untrack(fn) {
  var previous_untracking = untracking;
  try {
    untracking = true;
    return fn();
  } finally {
    untracking = previous_untracking;
  }
}

// node_modules/svelte/src/internal/client/dom/elements/events.js
var event_symbol = /* @__PURE__ */ Symbol("events");
var all_registered_events = /* @__PURE__ */ new Set();
var root_event_handles = /* @__PURE__ */ new Set();
function create_event(event_name, dom, handler, options = {}) {
  function target_handler(event2) {
    if (!options.capture) {
      handle_event_propagation.call(dom, event2);
    }
    if (!event2.cancelBubble) {
      return without_reactive_context(() => {
        return handler?.call(this, event2);
      });
    }
  }
  if (event_name.startsWith("pointer") || event_name.startsWith("touch") || event_name === "wheel") {
    target_handler.__removed = false;
    queue_micro_task(() => {
      if (!target_handler.__removed) {
        dom.addEventListener(event_name, target_handler, options);
      }
    });
  } else {
    dom.addEventListener(event_name, target_handler, options);
  }
  return target_handler;
}
function event(event_name, dom, handler, capture2, passive2) {
  var options = { capture: capture2, passive: passive2 };
  var target_handler = create_event(event_name, dom, handler, options);
  if (dom === document.body || // @ts-ignore
  dom === window || // @ts-ignore
  dom === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  dom instanceof HTMLMediaElement) {
    teardown(() => {
      target_handler.__removed = true;
      dom.removeEventListener(event_name, target_handler, options);
    });
  }
}
function delegated(event_name, element2, handler) {
  (element2[event_symbol] ??= {})[event_name] = handler;
}
function delegate(events) {
  for (var i = 0; i < events.length; i++) {
    all_registered_events.add(events[i]);
  }
  for (var fn of root_event_handles) {
    fn(events);
  }
}
var last_propagated_event = null;
var last_propagated_event_clear_scheduled = false;
function handle_event_propagation(event2) {
  var handler_element = this;
  var owner_document = (
    /** @type {Node} */
    handler_element.ownerDocument
  );
  var event_name = event2.type;
  var path2 = event2.composedPath?.() || [];
  var current_target = (
    /** @type {null | Element} */
    path2[0] || event2.target
  );
  last_propagated_event = event2;
  if (!last_propagated_event_clear_scheduled) {
    last_propagated_event_clear_scheduled = true;
    setTimeout(() => {
      last_propagated_event_clear_scheduled = false;
      last_propagated_event = null;
    });
  }
  var path_idx = 0;
  var handled_at = last_propagated_event === event2 && event2[event_symbol];
  if (handled_at) {
    var at_idx = path2.indexOf(handled_at);
    if (at_idx !== -1 && (handler_element === document || handler_element === /** @type {any} */
    window)) {
      event2[event_symbol] = handler_element;
      return;
    }
    var handler_idx = path2.indexOf(handler_element);
    if (handler_idx === -1) {
      return;
    }
    if (at_idx <= handler_idx) {
      path_idx = at_idx;
    }
  }
  current_target = /** @type {Element} */
  path2[path_idx] || event2.target;
  if (current_target === handler_element) return;
  define_property(event2, "currentTarget", {
    configurable: true,
    get() {
      return current_target || owner_document;
    }
  });
  var previous_reaction = active_reaction;
  var previous_effect = active_effect;
  set_active_reaction(null);
  set_active_effect(null);
  try {
    var throw_error;
    var other_errors = [];
    while (current_target !== null) {
      if (current_target === handler_element) break;
      try {
        var delegated2 = current_target[event_symbol]?.[event_name];
        if (delegated2 != null && (!/** @type {any} */
        current_target.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
        // -> the target could not have been disabled because it emits the event in the first place
        event2.target === current_target)) {
          delegated2.call(current_target, event2);
        }
      } catch (error) {
        if (throw_error) {
          other_errors.push(error);
        } else {
          throw_error = error;
        }
      }
      if (event2.cancelBubble) break;
      path_idx++;
      current_target = path_idx < path2.length ? (
        /** @type {Element} */
        path2[path_idx]
      ) : null;
    }
    if (throw_error) {
      for (let error of other_errors) {
        queueMicrotask(() => {
          throw error;
        });
      }
      throw throw_error;
    }
  } finally {
    event2[event_symbol] = handler_element;
    delete event2.currentTarget;
    set_active_reaction(previous_reaction);
    set_active_effect(previous_effect);
  }
}

// node_modules/svelte/src/internal/client/dom/reconciler.js
var policy = (
  // We gotta write it like this because after downleveling the pure comment may end up in the wrong location
  globalThis?.window?.trustedTypes && /* @__PURE__ */ globalThis.window.trustedTypes.createPolicy("svelte-trusted-html", {
    /** @param {string} html */
    createHTML: (html2) => {
      return html2;
    }
  })
);
function create_trusted_html(html2) {
  return (
    /** @type {string} */
    policy?.createHTML(html2) ?? html2
  );
}
function create_fragment_from_html(html2) {
  var elem = create_element("template");
  elem.innerHTML = create_trusted_html(html2.replaceAll("<!>", "<!---->"));
  return elem.content;
}

// node_modules/svelte/src/internal/client/dom/template.js
function assign_nodes(start2, end) {
  var effect2 = (
    /** @type {Effect} */
    active_effect
  );
  if (effect2.nodes === null) {
    effect2.nodes = { start: start2, end, a: null, t: null };
  }
}
// @__NO_SIDE_EFFECTS__
function from_html(content, flags2) {
  var is_fragment = (flags2 & TEMPLATE_FRAGMENT) !== 0;
  var use_import_node = (flags2 & TEMPLATE_USE_IMPORT_NODE) !== 0;
  var node;
  var has_start = !content.startsWith("<!>");
  return () => {
    if (hydrating) {
      assign_nodes(hydrate_node, null);
      return hydrate_node;
    }
    if (node === void 0) {
      node = create_fragment_from_html(has_start ? content : "<!>" + content);
      if (!is_fragment) node = /** @type {TemplateNode} */
      get_first_child(node);
    }
    var clone = (
      /** @type {TemplateNode} */
      use_import_node || is_firefox ? document.importNode(node, true) : node.cloneNode(true)
    );
    if (is_fragment) {
      var start2 = (
        /** @type {TemplateNode} */
        get_first_child(clone)
      );
      var end = (
        /** @type {TemplateNode} */
        clone.lastChild
      );
      assign_nodes(start2, end);
    } else {
      assign_nodes(clone, clone);
    }
    return clone;
  };
}
// @__NO_SIDE_EFFECTS__
function from_namespace(content, flags2, ns = "svg") {
  var has_start = !content.startsWith("<!>");
  var is_fragment = (flags2 & TEMPLATE_FRAGMENT) !== 0;
  var wrapped = `<${ns}>${has_start ? content : "<!>" + content}</${ns}>`;
  var node;
  return () => {
    if (hydrating) {
      assign_nodes(hydrate_node, null);
      return hydrate_node;
    }
    if (!node) {
      var fragment = (
        /** @type {DocumentFragment} */
        create_fragment_from_html(wrapped)
      );
      var root18 = (
        /** @type {Element} */
        get_first_child(fragment)
      );
      if (is_fragment) {
        node = document.createDocumentFragment();
        while (get_first_child(root18)) {
          node.appendChild(
            /** @type {TemplateNode} */
            get_first_child(root18)
          );
        }
      } else {
        node = /** @type {Element} */
        get_first_child(root18);
      }
    }
    var clone = (
      /** @type {TemplateNode} */
      node.cloneNode(true)
    );
    if (is_fragment) {
      var start2 = (
        /** @type {TemplateNode} */
        get_first_child(clone)
      );
      var end = (
        /** @type {TemplateNode} */
        clone.lastChild
      );
      assign_nodes(start2, end);
    } else {
      assign_nodes(clone, clone);
    }
    return clone;
  };
}
// @__NO_SIDE_EFFECTS__
function from_svg(content, flags2) {
  return /* @__PURE__ */ from_namespace(content, flags2, "svg");
}
function text(value = "") {
  if (!hydrating) {
    var t = create_text(value + "");
    assign_nodes(t, t);
    return t;
  }
  var node = hydrate_node;
  if (node.nodeType !== TEXT_NODE) {
    node.before(node = create_text());
    set_hydrate_node(node);
  } else {
    merge_text_nodes(
      /** @type {Text} */
      node
    );
  }
  assign_nodes(node, node);
  return node;
}
function comment() {
  if (hydrating) {
    assign_nodes(hydrate_node, null);
    return hydrate_node;
  }
  var frag = document.createDocumentFragment();
  var start2 = document.createComment("");
  var anchor = create_text();
  frag.append(start2, anchor);
  assign_nodes(start2, anchor);
  return frag;
}
function append2(anchor, dom) {
  if (hydrating) {
    var effect2 = (
      /** @type {Effect & { nodes: EffectNodes }} */
      active_effect
    );
    if ((effect2.f & REACTION_RAN) === 0 || effect2.nodes.end === null) {
      effect2.nodes.end = hydrate_node;
    }
    hydrate_next();
    return;
  }
  if (anchor === null) {
    return;
  }
  anchor.before(
    /** @type {Node} */
    dom
  );
}

// node_modules/svelte/src/utils.js
var DOM_BOOLEAN_ATTRIBUTES = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "disabled",
  "formnovalidate",
  "indeterminate",
  "inert",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "seamless",
  "selected",
  "webkitdirectory",
  "defer",
  "disablepictureinpicture",
  "disableremoteplayback"
];
var DOM_PROPERTIES = [
  ...DOM_BOOLEAN_ATTRIBUTES,
  "formNoValidate",
  "isMap",
  "noModule",
  "playsInline",
  "readOnly",
  "value",
  "volume",
  "defaultValue",
  "defaultChecked",
  "srcObject",
  "noValidate",
  "allowFullscreen",
  "disablePictureInPicture",
  "disableRemotePlayback"
];
var PASSIVE_EVENTS = ["touchstart", "touchmove"];
function is_passive_event(name) {
  return PASSIVE_EVENTS.includes(name);
}
var STATE_CREATION_RUNES = (
  /** @type {const} */
  [
    "$state",
    "$state.raw",
    "$derived",
    "$derived.by"
  ]
);
var RUNES = (
  /** @type {const} */
  [
    ...STATE_CREATION_RUNES,
    "$state.eager",
    "$state.snapshot",
    "$props",
    "$props.id",
    "$bindable",
    "$effect",
    "$effect.pre",
    "$effect.tracking",
    "$effect.root",
    "$effect.pending",
    "$inspect",
    "$inspect().with",
    "$inspect.trace",
    "$host"
  ]
);

// node_modules/svelte/src/reactivity/create-subscriber.js
function createSubscriber(start2) {
  let subscribers = 0;
  let version = source(0);
  let stop;
  if (dev_fallback_default) {
    tag(version, "createSubscriber version");
  }
  return () => {
    if (effect_tracking()) {
      get(version);
      render_effect(() => {
        if (subscribers === 0) {
          stop = untrack(() => start2(() => increment(version)));
        }
        subscribers += 1;
        return () => {
          queue_micro_task(() => {
            subscribers -= 1;
            if (subscribers === 0) {
              stop?.();
              stop = void 0;
              increment(version);
            }
          });
        };
      });
    }
  };
}

// node_modules/svelte/src/internal/client/dom/blocks/boundary.js
var flags = EFFECT_TRANSPARENT | EFFECT_PRESERVED;
function boundary(node, props, children, transform_error) {
  new Boundary(node, props, children, transform_error);
}
var Boundary = class {
  /** @type {Boundary | null} */
  parent;
  is_pending = false;
  /**
   * API-level transformError transform function. Transforms errors before they reach the `failed` snippet.
   * Inherited from parent boundary, or defaults to identity.
   * @type {(error: unknown) => unknown}
   */
  transform_error;
  /** @type {TemplateNode} */
  #anchor;
  /** @type {TemplateNode | null} */
  #hydrate_open = hydrating ? hydrate_node : null;
  /** @type {BoundaryProps} */
  #props;
  /** @type {((anchor: Node) => void)} */
  #children;
  /** @type {Effect} */
  #effect;
  /** @type {Effect | null} */
  #main_effect = null;
  /** @type {Effect | null} */
  #pending_effect = null;
  /** @type {Effect | null} */
  #failed_effect = null;
  /** @type {DocumentFragment | null} */
  #offscreen_fragment = null;
  #local_pending_count = 0;
  #pending_count = 0;
  #pending_count_update_queued = false;
  /** @type {Map<Effect, number>} */
  #dirty_reactions = /* @__PURE__ */ new Map();
  /**
   * A source containing the number of pending async deriveds/expressions.
   * Only created if `$effect.pending()` is used inside the boundary,
   * otherwise updating the source results in needless `Batch.ensure()`
   * calls followed by no-op flushes
   * @type {Source<number> | null}
   */
  #effect_pending = null;
  #effect_pending_subscriber = createSubscriber(() => {
    this.#effect_pending = source(this.#local_pending_count);
    if (dev_fallback_default) {
      tag(this.#effect_pending, "$effect.pending()");
    }
    return () => {
      this.#effect_pending = null;
    };
  });
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   * @param {((error: unknown) => unknown) | undefined} [transform_error]
   */
  constructor(node, props, children, transform_error) {
    this.#anchor = node;
    this.#props = props;
    this.#children = (anchor) => {
      var effect2 = (
        /** @type {Effect} */
        active_effect
      );
      effect2.b = this;
      effect2.f |= BOUNDARY_EFFECT;
      children(anchor);
    };
    this.parent = /** @type {Effect} */
    active_effect.b;
    this.transform_error = transform_error ?? this.parent?.transform_error ?? ((e) => e);
    this.#effect = block(() => {
      if (hydrating) {
        const comment_data = read_hydration_instruction(
          /** @type {TemplateNode} */
          this.#hydrate_open
        );
        hydrate_next();
        const server_rendered_pending = comment_data === HYDRATION_START_ELSE;
        const server_rendered_failed = comment_data.startsWith(HYDRATION_START_FAILED);
        if (server_rendered_failed) {
          const serialized_error = JSON.parse(comment_data.slice(HYDRATION_START_FAILED.length));
          this.#hydrate_failed_content(serialized_error);
        } else if (server_rendered_pending) {
          this.#hydrate_pending_content();
        } else {
          this.#hydrate_resolved_content();
        }
      } else {
        this.#render();
      }
    }, flags);
    if (hydrating) {
      this.#anchor = hydrate_node;
    }
  }
  #hydrate_resolved_content() {
    try {
      this.#main_effect = branch(() => this.#children(this.#anchor));
    } catch (error) {
      this.error(error);
    }
  }
  /**
   * @param {unknown} error The deserialized error from the server's hydration comment
   */
  #hydrate_failed_content(error) {
    const failed = this.#props.failed;
    const { reset: reset2, invoke_onerror } = this.#create_reset(error);
    queue_micro_task(invoke_onerror);
    if (!failed) return;
    this.#failed_effect = branch(() => {
      failed(
        this.#anchor,
        () => error,
        () => reset2
      );
    });
  }
  /**
   * Creates the `reset` function for a failed boundary, along with a function
   * that invokes `onerror` with it (if provided)
   * @param {unknown} error
   * @returns {{ reset: () => void, invoke_onerror: () => void }}
   */
  #create_reset(error) {
    var did_reset = false;
    var calling_on_error = false;
    const reset2 = () => {
      if (this.#is_destroyed()) return;
      if (did_reset) {
        svelte_boundary_reset_noop();
        return;
      }
      did_reset = true;
      if (calling_on_error) {
        svelte_boundary_reset_onerror();
      }
      if (this.#failed_effect !== null) {
        pause_effect(this.#failed_effect, () => {
          this.#failed_effect = null;
        });
      }
      this.#run(() => {
        this.#render();
      });
    };
    const invoke_onerror = () => {
      if (this.#is_destroyed()) return;
      try {
        calling_on_error = true;
        this.#props.onerror?.(error, reset2);
        calling_on_error = false;
      } catch (err) {
        invoke_error_boundary(err, this.#effect && this.#effect.parent);
      }
    };
    return { reset: reset2, invoke_onerror };
  }
  #is_destroyed() {
    return (this.#effect.f & (DESTROYED | DESTROYING)) !== 0;
  }
  #hydrate_pending_content() {
    const pending2 = this.#props.pending;
    if (!pending2) return;
    this.is_pending = true;
    this.#pending_effect = branch(() => pending2(this.#anchor));
    queue_micro_task(() => {
      if (this.#is_destroyed()) return;
      var fragment = this.#offscreen_fragment = document.createDocumentFragment();
      var anchor = create_text();
      var handled = false;
      fragment.append(anchor);
      this.#main_effect = this.#run(() => {
        try {
          return branch(() => this.#children(anchor));
        } catch (error) {
          try {
            this.error(error);
            handled = true;
          } catch (error2) {
            invoke_error_boundary(error2, this.#effect.parent);
          }
          return null;
        }
      });
      if (this.#main_effect === null) {
        this.#offscreen_fragment = null;
        if (handled) this.#resolve(
          /** @type {Batch} */
          current_batch
        );
        return;
      }
      if (this.#pending_count === 0) {
        this.#anchor.before(fragment);
        this.#offscreen_fragment = null;
        pause_effect(
          /** @type {Effect} */
          this.#pending_effect,
          () => {
            this.#pending_effect = null;
          }
        );
        this.#resolve(
          /** @type {Batch} */
          current_batch
        );
      }
    });
  }
  #render() {
    try {
      this.is_pending = this.has_pending_snippet();
      this.#pending_count = 0;
      this.#local_pending_count = 0;
      this.#main_effect = branch(() => {
        this.#children(this.#anchor);
      });
      if (this.#pending_count > 0) {
        var fragment = this.#offscreen_fragment = document.createDocumentFragment();
        move_effect(this.#main_effect, fragment);
        const pending2 = (
          /** @type {(anchor: Node) => void} */
          this.#props.pending
        );
        this.#pending_effect = branch(() => pending2(this.#anchor));
      } else {
        this.#resolve(
          /** @type {Batch} */
          current_batch
        );
      }
    } catch (error) {
      this.error(error);
    }
  }
  /**
   * @param {Batch} batch
   */
  #resolve(batch) {
    this.is_pending = false;
    batch.transfer_reactions(this.#dirty_reactions);
  }
  /**
   * Defer an effect inside a pending boundary until the boundary resolves
   * @param {Effect} effect
   */
  defer_effect(effect2) {
    defer_effect(effect2, this.#dirty_reactions);
  }
  /**
   * Returns `false` if the effect exists inside a boundary whose pending snippet is shown
   * @returns {boolean}
   */
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!this.#props.pending;
  }
  /**
   * @template T
   * @param {() => T} fn
   */
  #run(fn) {
    var previous_effect = active_effect;
    var previous_reaction = active_reaction;
    var previous_ctx = component_context;
    set_active_effect(this.#effect);
    set_active_reaction(this.#effect);
    set_component_context(this.#effect.ctx);
    try {
      Batch.ensure();
      return fn();
    } finally {
      set_active_effect(previous_effect);
      set_active_reaction(previous_reaction);
      set_component_context(previous_ctx);
    }
  }
  /**
   * Updates the pending count associated with the currently visible pending snippet,
   * if any, such that we can replace the snippet with content once work is done
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  #update_pending_count(d, batch) {
    if (!this.has_pending_snippet()) {
      if (this.parent) {
        this.parent.#update_pending_count(d, batch);
      }
      return;
    }
    this.#pending_count += d;
    if (this.#pending_count === 0) {
      this.#resolve(batch);
      if (this.#pending_effect) {
        pause_effect(this.#pending_effect, () => {
          this.#pending_effect = null;
        });
      }
      if (this.#offscreen_fragment) {
        this.#anchor.before(this.#offscreen_fragment);
        this.#offscreen_fragment = null;
      }
    }
  }
  /**
   * Update the source that powers `$effect.pending()` inside this boundary,
   * and controls when the current `pending` snippet (if any) is removed.
   * Do not call from inside the class
   * @param {1 | -1} d
   * @param {Batch} batch
   */
  update_pending_count(d, batch) {
    this.#update_pending_count(d, batch);
    this.#local_pending_count += d;
    if (!this.#effect_pending || this.#pending_count_update_queued) return;
    this.#pending_count_update_queued = true;
    queue_micro_task(() => {
      this.#pending_count_update_queued = false;
      if (this.#effect_pending) {
        internal_set(this.#effect_pending, this.#local_pending_count);
      }
    });
  }
  get_effect_pending() {
    this.#effect_pending_subscriber();
    return get(
      /** @type {Source<number>} */
      this.#effect_pending
    );
  }
  /** @param {unknown} error */
  error(error) {
    if (error === HYDRATION_ERROR) {
      throw error;
    }
    if (!this.#props.onerror && !this.#props.failed) {
      throw error;
    }
    if (current_batch?.is_fork) {
      if (this.#main_effect) current_batch.skip_effect(this.#main_effect);
      if (this.#pending_effect) current_batch.skip_effect(this.#pending_effect);
      if (this.#failed_effect) current_batch.skip_effect(this.#failed_effect);
      current_batch.oncommit(() => {
        if (!this.#is_destroyed()) this.#handle_error(error);
      });
    } else {
      this.#handle_error(error);
    }
  }
  /**
   * @param {unknown} error
   */
  #handle_error(error) {
    if (this.#main_effect) {
      destroy_effect(this.#main_effect);
      this.#main_effect = null;
    }
    if (this.#pending_effect) {
      destroy_effect(this.#pending_effect);
      this.#pending_effect = null;
    }
    if (this.#failed_effect) {
      destroy_effect(this.#failed_effect);
      this.#failed_effect = null;
    }
    if (hydrating) {
      set_hydrate_node(
        /** @type {TemplateNode} */
        this.#hydrate_open
      );
      next();
      set_hydrate_node(skip_nodes());
    }
    let failed = this.#props.failed;
    const handle_error_result = (transformed_error) => {
      if (this.#is_destroyed()) return;
      const { reset: reset2, invoke_onerror } = this.#create_reset(transformed_error);
      invoke_onerror();
      if (failed && !this.#is_destroyed()) {
        this.#failed_effect = this.#run(() => {
          try {
            return branch(() => {
              var effect2 = (
                /** @type {Effect} */
                active_effect
              );
              effect2.b = this;
              effect2.f |= BOUNDARY_EFFECT;
              failed(
                this.#anchor,
                () => transformed_error,
                () => reset2
              );
            });
          } catch (error2) {
            invoke_error_boundary(
              error2,
              /** @type {Effect} */
              this.#effect.parent
            );
            return null;
          }
        });
      }
    };
    queue_micro_task(() => {
      if (this.#is_destroyed()) return;
      var result;
      try {
        result = this.transform_error(error);
      } catch (e) {
        invoke_error_boundary(e, this.#effect && this.#effect.parent);
        return;
      }
      if (result !== null && typeof result === "object" && typeof /** @type {any} */
      result.then === "function") {
        result.then(
          handle_error_result,
          /** @param {unknown} e */
          (e) => invoke_error_boundary(e, this.#effect && this.#effect.parent)
        );
      } else {
        handle_error_result(result);
      }
    });
  }
};

// node_modules/svelte/src/internal/client/render.js
var should_intro = true;
function set_text(text2, value) {
  var str = value == null ? "" : typeof value === "object" ? `${value}` : value;
  if (str !== /** @type {any} */
  (text2[TEXT_CACHE] ??= text2.nodeValue)) {
    text2[TEXT_CACHE] = str;
    text2.nodeValue = `${str}`;
  }
}
function mount(component2, options) {
  return _mount(component2, options);
}
function hydrate(component2, options) {
  init_operations();
  options.intro = options.intro ?? false;
  const target = options.target;
  const was_hydrating = hydrating;
  const previous_hydrate_node = hydrate_node;
  try {
    var anchor = get_first_child(target);
    while (anchor && (anchor.nodeType !== COMMENT_NODE || /** @type {Comment} */
    anchor.data !== HYDRATION_START)) {
      anchor = get_next_sibling(anchor);
    }
    if (!anchor) {
      throw HYDRATION_ERROR;
    }
    set_hydrating(true);
    set_hydrate_node(
      /** @type {Comment} */
      anchor
    );
    const instance = _mount(component2, { ...options, anchor });
    set_hydrating(false);
    return (
      /**  @type {Exports} */
      instance
    );
  } catch (error) {
    if (error instanceof Error && error.message.split("\n").some((line) => line.startsWith("https://svelte.dev/e/"))) {
      throw error;
    }
    if (error !== HYDRATION_ERROR) {
      console.warn("Failed to hydrate: ", error);
    }
    if (options.recover === false) {
      hydration_failed();
    }
    init_operations();
    clear_text_content(target);
    set_hydrating(false);
    return mount(component2, options);
  } finally {
    set_hydrating(was_hydrating);
    set_hydrate_node(previous_hydrate_node);
  }
}
var listeners = /* @__PURE__ */ new Map();
function _mount(Component, { target, anchor, props = {}, events, context, intro = true, transformError }) {
  init_operations();
  var component2 = void 0;
  var unmount2 = component_root(() => {
    var anchor_node = anchor ?? target.appendChild(create_text());
    boundary(
      /** @type {TemplateNode} */
      anchor_node,
      {
        pending: () => {
        }
      },
      (anchor_node2) => {
        push({});
        var ctx = (
          /** @type {ComponentContext} */
          component_context
        );
        if (context) ctx.c = context;
        if (events) {
          props.$$events = events;
        }
        if (hydrating) {
          assign_nodes(
            /** @type {TemplateNode} */
            anchor_node2,
            null
          );
        }
        should_intro = intro;
        component2 = Component(anchor_node2, props) || mark_as_component();
        should_intro = true;
        if (hydrating) {
          active_effect.nodes.end = hydrate_node;
          if (hydrate_node === null || hydrate_node.nodeType !== COMMENT_NODE || /** @type {Comment} */
          hydrate_node.data !== HYDRATION_END) {
            hydration_mismatch();
            throw HYDRATION_ERROR;
          }
        }
        pop();
      },
      transformError
    );
    var registered_events = /* @__PURE__ */ new Set();
    var event_handle = (events2) => {
      for (var i = 0; i < events2.length; i++) {
        var event_name = events2[i];
        if (registered_events.has(event_name)) continue;
        registered_events.add(event_name);
        var passive2 = is_passive_event(event_name);
        for (const node of [target, document]) {
          var counts = listeners.get(node);
          if (counts === void 0) {
            counts = /* @__PURE__ */ new Map();
            listeners.set(node, counts);
          }
          var count = counts.get(event_name);
          if (count === void 0) {
            node.addEventListener(event_name, handle_event_propagation, { passive: passive2 });
            counts.set(event_name, 1);
          } else {
            counts.set(event_name, count + 1);
          }
        }
      }
    };
    event_handle(array_from(all_registered_events));
    root_event_handles.add(event_handle);
    return () => {
      for (var event_name of registered_events) {
        for (const node of [target, document]) {
          var counts = (
            /** @type {Map<string, number>} */
            listeners.get(node)
          );
          var count = (
            /** @type {number} */
            counts.get(event_name)
          );
          if (--count == 0) {
            node.removeEventListener(event_name, handle_event_propagation);
            counts.delete(event_name);
            if (counts.size === 0) {
              listeners.delete(node);
            }
          } else {
            counts.set(event_name, count);
          }
        }
      }
      root_event_handles.delete(event_handle);
      if (anchor_node !== anchor) {
        anchor_node.parentNode?.removeChild(anchor_node);
      }
    };
  });
  mounted_components.set(component2, unmount2);
  return component2;
}
var mounted_components = /* @__PURE__ */ new WeakMap();
function unmount(component2, options) {
  const fn = mounted_components.get(component2);
  if (fn) {
    mounted_components.delete(component2);
    return fn(options);
  }
  if (dev_fallback_default) {
    lifecycle_double_unmount();
  }
  return Promise.resolve();
}

// node_modules/svelte/src/internal/client/dom/blocks/branches.js
var BranchManager = class {
  /** @type {TemplateNode} */
  anchor;
  /** @type {Map<Batch, Key>} */
  #batches = /* @__PURE__ */ new Map();
  /**
   * Map of keys to effects that are currently rendered in the DOM.
   * These effects are visible and actively part of the document tree.
   * Example:
   * ```
   * {#if condition}
   * 	foo
   * {:else}
   * 	bar
   * {/if}
   * ```
   * Can result in the entries `true->Effect` and `false->Effect`
   * @type {Map<Key, Effect>}
   */
  #onscreen = /* @__PURE__ */ new Map();
  /**
   * Similar to #onscreen with respect to the keys, but contains branches that are not yet
   * in the DOM, because their insertion is deferred.
   * @type {Map<Key, Branch>}
   */
  #offscreen = /* @__PURE__ */ new Map();
  /**
   * Keys of effects that are currently outroing
   * @type {Set<Key>}
   */
  #outroing = /* @__PURE__ */ new Set();
  /**
   * Whether to pause (i.e. outro) on change, or destroy immediately.
   * This is necessary for `<svelte:element>`
   */
  #transition = true;
  /**
   * @param {TemplateNode} anchor
   * @param {boolean} transition
   */
  constructor(anchor, transition2 = true) {
    this.anchor = anchor;
    this.#transition = transition2;
  }
  /**
   * @param {Batch} batch
   */
  #commit = (batch) => {
    if (!this.#batches.has(batch)) return;
    var key2 = (
      /** @type {Key} */
      this.#batches.get(batch)
    );
    var onscreen = this.#onscreen.get(key2);
    if (onscreen) {
      resume_effect(onscreen);
      this.#outroing.delete(key2);
    } else {
      var offscreen = this.#offscreen.get(key2);
      if (offscreen) {
        resume_effect(offscreen.effect);
        this.#onscreen.set(key2, offscreen.effect);
        this.#offscreen.delete(key2);
        if (dev_fallback_default) {
          offscreen.fragment.lastChild[HMR_ANCHOR] = this.anchor;
        }
        offscreen.fragment.lastChild.remove();
        this.anchor.before(offscreen.fragment);
        onscreen = offscreen.effect;
      }
    }
    for (const [b, k] of this.#batches) {
      this.#batches.delete(b);
      if (b === batch) {
        break;
      }
      const offscreen2 = this.#offscreen.get(k);
      if (offscreen2) {
        destroy_effect(offscreen2.effect);
        this.#offscreen.delete(k);
      }
    }
    for (const [k, effect2] of this.#onscreen) {
      if (k === key2 || this.#outroing.has(k)) continue;
      const on_destroy = () => {
        const keys = Array.from(this.#batches.values());
        if (keys.includes(k)) {
          var fragment = document.createDocumentFragment();
          move_effect(effect2, fragment);
          fragment.append(create_text());
          this.#offscreen.set(k, { effect: effect2, fragment });
        } else {
          destroy_effect(effect2);
        }
        this.#outroing.delete(k);
        this.#onscreen.delete(k);
      };
      if (this.#transition || !onscreen) {
        this.#outroing.add(k);
        pause_effect(effect2, on_destroy, false);
      } else {
        on_destroy();
      }
    }
  };
  /**
   * @param {Batch} batch
   */
  #discard = (batch) => {
    this.#batches.delete(batch);
    const keys = Array.from(this.#batches.values());
    for (const [k, branch2] of this.#offscreen) {
      if (!keys.includes(k)) {
        destroy_effect(branch2.effect);
        this.#offscreen.delete(k);
      }
    }
  };
  /**
   *
   * @param {any} key
   * @param {null | ((target: TemplateNode) => void)} fn
   */
  ensure(key2, fn) {
    var batch = (
      /** @type {Batch} */
      current_batch
    );
    var defer = should_defer_append();
    if (fn && !this.#onscreen.has(key2) && !this.#offscreen.has(key2)) {
      if (defer) {
        var fragment = document.createDocumentFragment();
        var target = create_text();
        fragment.append(target);
        this.#offscreen.set(key2, {
          effect: branch(() => fn(target)),
          fragment
        });
      } else {
        this.#onscreen.set(
          key2,
          branch(() => fn(this.anchor))
        );
      }
    }
    this.#batches.set(batch, key2);
    if (defer) {
      for (const [k, effect2] of this.#onscreen) {
        if (k === key2) {
          batch.unskip_effect(effect2);
        } else {
          batch.skip_effect(effect2);
        }
      }
      for (const [k, branch2] of this.#offscreen) {
        if (k === key2) {
          batch.unskip_effect(branch2.effect);
        } else {
          batch.skip_effect(branch2.effect);
        }
      }
      batch.oncommit(this.#commit);
      batch.ondiscard(this.#discard);
    } else {
      if (hydrating) {
        this.anchor = hydrate_node;
      }
      this.#commit(batch);
    }
  }
};

// node_modules/svelte/src/internal/client/dom/blocks/snippet.js
function snippet(node, get_snippet, ...args) {
  var branches = new BranchManager(node);
  block(() => {
    const snippet2 = get_snippet() ?? null;
    if (dev_fallback_default && snippet2 == null) {
      invalid_snippet();
    }
    branches.ensure(snippet2, snippet2 && ((anchor) => snippet2(anchor, ...args)));
  }, EFFECT_TRANSPARENT);
}

// node_modules/svelte/src/index-client.js
if (dev_fallback_default) {
  let throw_rune_error = function(rune) {
    if (!(rune in globalThis)) {
      let value;
      Object.defineProperty(globalThis, rune, {
        configurable: true,
        // eslint-disable-next-line getter-return
        get: () => {
          if (value !== void 0) {
            return value;
          }
          rune_outside_svelte(rune);
        },
        set: (v) => {
          value = v;
        }
      });
    }
  };
  throw_rune_error("$state");
  throw_rune_error("$effect");
  throw_rune_error("$derived");
  throw_rune_error("$inspect");
  throw_rune_error("$props");
  throw_rune_error("$bindable");
}

// node_modules/svelte/src/internal/client/dev/css.js
var all_styles = /* @__PURE__ */ new Map();
function register_style(hash2, style) {
  var styles = all_styles.get(hash2);
  if (!styles) {
    styles = /* @__PURE__ */ new Set();
    all_styles.set(hash2, styles);
  }
  styles.add(style);
}

// node_modules/svelte/src/internal/client/dom/blocks/if.js
function if_block(node, fn, elseif = false) {
  var marker;
  if (hydrating) {
    marker = hydrate_node;
    hydrate_next();
  }
  var branches = new BranchManager(node);
  var flags2 = elseif ? EFFECT_TRANSPARENT : 0;
  function update_branch(key2, fn2) {
    if (hydrating) {
      var data = read_hydration_instruction(
        /** @type {TemplateNode} */
        marker
      );
      if (key2 !== parseInt(data.substring(1))) {
        var anchor = skip_nodes();
        set_hydrate_node(anchor);
        branches.anchor = anchor;
        set_hydrating(false);
        branches.ensure(key2, fn2);
        set_hydrating(true);
        return;
      }
    }
    branches.ensure(key2, fn2);
  }
  block(() => {
    var has_branch = false;
    fn((fn2, key2 = 0) => {
      has_branch = true;
      update_branch(key2, fn2);
    });
    if (!has_branch) {
      update_branch(-1, null);
    }
  }, flags2);
}

// node_modules/svelte/src/internal/client/dom/blocks/key.js
var NAN = /* @__PURE__ */ Symbol("NaN");
function key(node, get_key, render_fn) {
  if (hydrating) {
    hydrate_next();
  }
  var branches = new BranchManager(node);
  var legacy = !is_runes();
  block(() => {
    var key2 = get_key();
    if (key2 !== key2) {
      key2 = /** @type {any} */
      NAN;
    }
    if (legacy && key2 !== null && typeof key2 === "object") {
      key2 = /** @type {V} */
      {};
    }
    branches.ensure(key2, render_fn);
  });
}

// node_modules/svelte/src/internal/client/dom/blocks/each.js
function index(_, i) {
  return i;
}
function pause_effects(state2, to_destroy, controlled_anchor) {
  var transitions = [];
  var length = to_destroy.length;
  var group2;
  var remaining = to_destroy.length;
  for (var i = 0; i < length; i++) {
    let effect2 = to_destroy[i];
    pause_effect(
      effect2,
      () => {
        if (group2) {
          group2.pending.delete(effect2);
          group2.done.add(effect2);
          if (group2.pending.size === 0) {
            var groups2 = (
              /** @type {Set<EachOutroGroup>} */
              state2.outrogroups
            );
            destroy_effects(state2, array_from(group2.done));
            groups2.delete(group2);
            if (groups2.size === 0) {
              state2.outrogroups = null;
            }
          }
        } else {
          remaining -= 1;
        }
      },
      false
    );
  }
  if (remaining === 0) {
    var fast_path = transitions.length === 0 && controlled_anchor !== null && state2.pending.size === 0;
    if (fast_path) {
      var anchor = (
        /** @type {Element} */
        controlled_anchor
      );
      var parent_node = (
        /** @type {Element} */
        anchor.parentNode
      );
      clear_text_content(parent_node);
      parent_node.append(anchor);
      state2.items.clear();
    }
    destroy_effects(state2, to_destroy, !fast_path);
  } else {
    group2 = {
      pending: new Set(to_destroy),
      done: /* @__PURE__ */ new Set()
    };
    (state2.outrogroups ??= /* @__PURE__ */ new Set()).add(group2);
  }
}
function destroy_effects(state2, to_destroy, remove_dom = true) {
  var preserved_effects;
  if (state2.pending.size > 0) {
    preserved_effects = /* @__PURE__ */ new Set();
    for (const keys of state2.pending.values()) {
      for (const key2 of keys) {
        preserved_effects.add(
          /** @type {EachItem} */
          state2.items.get(key2).e
        );
      }
    }
  }
  for (var i = 0; i < to_destroy.length; i++) {
    var e = to_destroy[i];
    if (preserved_effects?.has(e)) {
      e.f |= EFFECT_OFFSCREEN;
      const fragment = document.createDocumentFragment();
      move_effect(e, fragment);
    } else {
      destroy_effect(to_destroy[i], remove_dom);
    }
  }
}
var offscreen_anchor;
function each(node, flags2, get_collection, get_key, render_fn, fallback_fn = null) {
  var anchor = node;
  var items = /* @__PURE__ */ new Map();
  var is_controlled = (flags2 & EACH_IS_CONTROLLED) !== 0;
  if (is_controlled) {
    var parent_node = (
      /** @type {Element} */
      node
    );
    anchor = hydrating ? set_hydrate_node(get_first_child(parent_node)) : parent_node.appendChild(create_text());
  }
  if (hydrating) {
    hydrate_next();
  }
  var fallback2 = null;
  var each_array = derived_safe_equal(() => {
    var collection = get_collection();
    return (
      /** @type {V[]} */
      is_array(collection) ? collection : collection == null ? [] : array_from(collection)
    );
  });
  if (dev_fallback_default) {
    tag(each_array, "{#each ...}");
  }
  var pending2 = /* @__PURE__ */ new Map();
  var first_run = true;
  function commit(batch) {
    if ((state2.effect.f & DESTROYED) !== 0) {
      return;
    }
    state2.pending.delete(batch);
    var array = get(each_array);
    state2.fallback = fallback2;
    reconcile(state2, array, anchor, flags2, get_key);
    if (fallback2 !== null) {
      if (array.length === 0) {
        if ((fallback2.f & EFFECT_OFFSCREEN) === 0) {
          resume_effect(fallback2);
        } else {
          fallback2.f ^= EFFECT_OFFSCREEN;
          move(fallback2, null, anchor);
        }
      } else {
        pause_effect(fallback2, () => {
          fallback2 = null;
        });
      }
    }
  }
  function discard(batch) {
    state2.pending.delete(batch);
  }
  var effect2 = block(() => {
    var array = (
      /** @type {V[]} */
      get(each_array)
    );
    var length = array.length;
    let mismatch = false;
    if (hydrating) {
      var is_else = read_hydration_instruction(anchor) === HYDRATION_START_ELSE;
      if (is_else !== (length === 0)) {
        anchor = skip_nodes();
        set_hydrate_node(anchor);
        set_hydrating(false);
        mismatch = true;
      }
    }
    var keys = /* @__PURE__ */ new Set();
    var batch = (
      /** @type {Batch} */
      current_batch
    );
    var defer = should_defer_append();
    for (var index3 = 0; index3 < length; index3 += 1) {
      if (hydrating && hydrate_node.nodeType === COMMENT_NODE && /** @type {Comment} */
      hydrate_node.data === HYDRATION_END) {
        anchor = /** @type {Comment} */
        hydrate_node;
        mismatch = true;
        set_hydrating(false);
      }
      var value = array[index3];
      var key2 = get_key(value, index3);
      if (dev_fallback_default) {
        var key_again = get_key(value, index3);
        if (key2 !== key_again) {
          each_key_volatile(String(index3), String(key2), String(key_again));
        }
      }
      var item = first_run ? null : items.get(key2);
      if (item) {
        if (item.v) internal_set(item.v, value);
        if (item.i) internal_set(item.i, index3);
        if (defer) {
          batch.unskip_effect(item.e);
        }
      } else {
        item = create_item(
          items,
          first_run ? anchor : offscreen_anchor ??= create_text(),
          value,
          key2,
          index3,
          render_fn,
          flags2,
          get_collection
        );
        if (!first_run) {
          item.e.f |= EFFECT_OFFSCREEN;
        }
        items.set(key2, item);
      }
      keys.add(key2);
    }
    if (length === 0 && fallback_fn && !fallback2) {
      if (first_run) {
        fallback2 = branch(() => fallback_fn(anchor));
      } else {
        fallback2 = branch(() => fallback_fn(offscreen_anchor ??= create_text()));
        fallback2.f |= EFFECT_OFFSCREEN;
      }
    }
    if (length > keys.size) {
      if (dev_fallback_default) {
        validate_each_keys(array, get_key);
      } else {
        each_key_duplicate("", "", "");
      }
    }
    if (hydrating && length > 0) {
      set_hydrate_node(skip_nodes());
    }
    if (!first_run) {
      pending2.set(batch, keys);
      if (defer) {
        for (const [key3, item2] of items) {
          if (!keys.has(key3)) {
            batch.skip_effect(item2.e);
          }
        }
        batch.oncommit(commit);
        batch.ondiscard(discard);
      } else {
        commit(batch);
      }
    }
    if (mismatch) {
      set_hydrating(true);
    }
    get(each_array);
  });
  var state2 = { effect: effect2, flags: flags2, items, pending: pending2, outrogroups: null, fallback: fallback2 };
  first_run = false;
  if (hydrating) {
    anchor = hydrate_node;
  }
}
function skip_to_branch(effect2) {
  while (effect2 !== null && (effect2.f & BRANCH_EFFECT) === 0) {
    effect2 = effect2.next;
  }
  return effect2;
}
function reconcile(state2, array, anchor, flags2, get_key) {
  var is_animated = (flags2 & EACH_IS_ANIMATED) !== 0;
  var length = array.length;
  var items = state2.items;
  var current = skip_to_branch(state2.effect.first);
  var seen2;
  var prev = null;
  var to_animate;
  var matched = [];
  var stashed = [];
  var value;
  var key2;
  var effect2;
  var i;
  if (is_animated) {
    for (i = 0; i < length; i += 1) {
      value = array[i];
      key2 = get_key(value, i);
      effect2 = /** @type {EachItem} */
      items.get(key2).e;
      if ((effect2.f & EFFECT_OFFSCREEN) === 0) {
        effect2.nodes?.a?.measure();
        (to_animate ??= /* @__PURE__ */ new Set()).add(effect2);
      }
    }
  }
  for (i = 0; i < length; i += 1) {
    value = array[i];
    key2 = get_key(value, i);
    effect2 = /** @type {EachItem} */
    items.get(key2).e;
    if (state2.outrogroups !== null) {
      for (const group2 of state2.outrogroups) {
        group2.pending.delete(effect2);
        group2.done.delete(effect2);
      }
    }
    if ((effect2.f & INERT) !== 0) {
      resume_effect(effect2);
      if (is_animated) {
        effect2.nodes?.a?.unfix();
        (to_animate ??= /* @__PURE__ */ new Set()).delete(effect2);
      }
    }
    if ((effect2.f & EFFECT_OFFSCREEN) !== 0) {
      effect2.f ^= EFFECT_OFFSCREEN;
      if (effect2 === current) {
        move(effect2, null, anchor);
      } else {
        var next2 = prev ? prev.next : current;
        if (effect2 === state2.effect.last) {
          state2.effect.last = effect2.prev;
        }
        if (effect2.prev) effect2.prev.next = effect2.next;
        if (effect2.next) effect2.next.prev = effect2.prev;
        link(state2, prev, effect2);
        link(state2, effect2, next2);
        move(effect2, next2, anchor);
        prev = effect2;
        matched = [];
        stashed = [];
        current = skip_to_branch(prev.next);
        continue;
      }
    }
    if (effect2 !== current) {
      if (seen2 !== void 0 && seen2.has(effect2)) {
        if (matched.length < stashed.length) {
          var start2 = stashed[0];
          var j;
          prev = start2.prev;
          var a = matched[0];
          var b = matched[matched.length - 1];
          for (j = 0; j < matched.length; j += 1) {
            move(matched[j], start2, anchor);
          }
          for (j = 0; j < stashed.length; j += 1) {
            seen2.delete(stashed[j]);
          }
          link(state2, a.prev, b.next);
          link(state2, prev, a);
          link(state2, b, start2);
          current = start2;
          prev = b;
          i -= 1;
          matched = [];
          stashed = [];
        } else {
          seen2.delete(effect2);
          move(effect2, current, anchor);
          link(state2, effect2.prev, effect2.next);
          link(state2, effect2, prev === null ? state2.effect.first : prev.next);
          link(state2, prev, effect2);
          prev = effect2;
        }
        continue;
      }
      matched = [];
      stashed = [];
      while (current !== null && current !== effect2) {
        (seen2 ??= /* @__PURE__ */ new Set()).add(current);
        stashed.push(current);
        current = skip_to_branch(current.next);
      }
      if (current === null) {
        continue;
      }
    }
    if ((effect2.f & EFFECT_OFFSCREEN) === 0) {
      matched.push(effect2);
    }
    prev = effect2;
    current = skip_to_branch(effect2.next);
  }
  if (state2.outrogroups !== null) {
    for (const group2 of state2.outrogroups) {
      if (group2.pending.size === 0) {
        destroy_effects(state2, array_from(group2.done));
        state2.outrogroups?.delete(group2);
      }
    }
    if (state2.outrogroups.size === 0) {
      state2.outrogroups = null;
    }
  }
  if (current !== null || seen2 !== void 0) {
    var to_destroy = [];
    if (seen2 !== void 0) {
      for (effect2 of seen2) {
        if ((effect2.f & INERT) === 0) {
          to_destroy.push(effect2);
        }
      }
    }
    while (current !== null) {
      if ((current.f & INERT) === 0 && current !== state2.fallback) {
        to_destroy.push(current);
      }
      current = skip_to_branch(current.next);
    }
    var destroy_length = to_destroy.length;
    if (destroy_length > 0) {
      var controlled_anchor = (flags2 & EACH_IS_CONTROLLED) !== 0 && length === 0 ? anchor : null;
      if (is_animated) {
        for (i = 0; i < destroy_length; i += 1) {
          to_destroy[i].nodes?.a?.measure();
        }
        for (i = 0; i < destroy_length; i += 1) {
          to_destroy[i].nodes?.a?.fix();
        }
      }
      pause_effects(state2, to_destroy, controlled_anchor);
    }
  }
  if (is_animated) {
    queue_micro_task(() => {
      if (to_animate === void 0) return;
      for (effect2 of to_animate) {
        effect2.nodes?.a?.apply();
      }
    });
  }
}
function create_item(items, anchor, value, key2, index3, render_fn, flags2, get_collection) {
  var v = (flags2 & EACH_ITEM_REACTIVE) !== 0 ? (flags2 & EACH_ITEM_IMMUTABLE) === 0 ? mutable_source(value, false, false) : source(value) : null;
  var i = (flags2 & EACH_INDEX_REACTIVE) !== 0 ? source(index3) : null;
  if (dev_fallback_default && v) {
    v.trace = () => {
      get_collection()[i?.v ?? index3];
    };
  }
  return {
    v,
    i,
    e: branch(() => {
      render_fn(anchor, v ?? value, i ?? index3, get_collection);
      return () => {
        items.delete(key2);
      };
    })
  };
}
function move(effect2, next2, anchor) {
  if (!effect2.nodes) return;
  var node = effect2.nodes.start;
  var end = effect2.nodes.end;
  var dest = next2 && (next2.f & EFFECT_OFFSCREEN) === 0 ? (
    /** @type {EffectNodes} */
    next2.nodes.start
  ) : anchor;
  while (node !== null) {
    var next_node = (
      /** @type {TemplateNode} */
      get_next_sibling(node)
    );
    dest.before(node);
    if (node === end) {
      return;
    }
    node = next_node;
  }
}
function link(state2, prev, next2) {
  if (prev === null) {
    state2.effect.first = next2;
  } else {
    prev.next = next2;
  }
  if (next2 === null) {
    state2.effect.last = prev;
  } else {
    next2.prev = prev;
  }
}
function validate_each_keys(array, key_fn) {
  const keys = /* @__PURE__ */ new Map();
  const length = array.length;
  for (let i = 0; i < length; i++) {
    const key2 = key_fn(array[i], i);
    if (keys.has(key2)) {
      const a = String(keys.get(key2));
      const b = String(i);
      let k = String(key2);
      if (k.startsWith("[object ")) k = null;
      each_key_duplicate(a, b, k);
    }
    keys.set(key2, i);
  }
}

// node_modules/svelte/src/internal/client/dom/blocks/svelte-component.js
function component(node, get_component, render_fn) {
  var hydration_start_node;
  if (hydrating) {
    hydration_start_node = hydrate_node;
    hydrate_next();
  }
  var branches = new BranchManager(node);
  block(() => {
    var component2 = get_component() ?? null;
    if (hydrating) {
      var data = read_hydration_instruction(
        /** @type {TemplateNode} */
        hydration_start_node
      );
      var server_had_component = data === HYDRATION_START;
      var client_has_component = component2 !== null;
      if (server_had_component !== client_has_component) {
        var anchor = skip_nodes();
        set_hydrate_node(anchor);
        branches.anchor = anchor;
        set_hydrating(false);
        branches.ensure(component2, component2 && ((target) => render_fn(target, component2)));
        set_hydrating(true);
        return;
      }
    }
    branches.ensure(component2, component2 && ((target) => render_fn(target, component2)));
  }, EFFECT_TRANSPARENT);
}

// node_modules/svelte/src/internal/client/dom/css.js
function append_styles(anchor, css) {
  effect(() => {
    anchor = active_effect?.parent?.nodes?.start ?? anchor;
    var root18 = anchor.getRootNode();
    var target = (
      /** @type {ShadowRoot} */
      root18.host ? (
        /** @type {ShadowRoot} */
        root18
      ) : (
        /** @type {Document} */
        root18.head ?? /** @type {Document} */
        root18.ownerDocument.head
      )
    );
    if (!target.querySelector("#" + css.hash)) {
      const style = create_element("style");
      style.id = css.hash;
      style.textContent = css.code;
      target.appendChild(style);
      if (dev_fallback_default) {
        register_style(css.hash, style);
      }
    }
  });
}

// node_modules/clsx/dist/clsx.mjs
function r(e) {
  var t, f, n = "";
  if ("string" == typeof e || "number" == typeof e) n += e;
  else if ("object" == typeof e) if (Array.isArray(e)) {
    var o = e.length;
    for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
  } else for (f in e) e[f] && (n && (n += " "), n += f);
  return n;
}
function clsx() {
  for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
  return n;
}

// node_modules/svelte/src/internal/shared/attributes.js
function clsx2(value) {
  if (typeof value === "object") {
    return clsx(value);
  } else {
    return value ?? "";
  }
}
var whitespace = [..." 	\n\r\f\xA0\v\uFEFF"];
function to_class(value, hash2, directives) {
  var classname = value == null ? "" : "" + value;
  if (hash2) {
    classname = classname ? classname + " " + hash2 : hash2;
  }
  if (directives) {
    for (var key2 of Object.keys(directives)) {
      if (directives[key2]) {
        classname = classname ? classname + " " + key2 : key2;
      } else if (classname.length) {
        var len = key2.length;
        var a = 0;
        while ((a = classname.indexOf(key2, a)) >= 0) {
          var b = a + len;
          if ((a === 0 || whitespace.includes(classname[a - 1])) && (b === classname.length || whitespace.includes(classname[b]))) {
            classname = (a === 0 ? "" : classname.substring(0, a)) + classname.substring(b + 1);
          } else {
            a = b;
          }
        }
      }
    }
  }
  return classname === "" ? null : classname;
}
function append_styles2(styles, important = false) {
  var separator = important ? " !important;" : ";";
  var css = "";
  for (var key2 of Object.keys(styles)) {
    var value = styles[key2];
    if (value != null && value !== "") {
      css += " " + key2 + ": " + value + separator;
    }
  }
  return css;
}
function to_css_name(name) {
  if (name[0] !== "-" || name[1] !== "-") {
    return name.toLowerCase();
  }
  return name;
}
function to_style(value, styles) {
  if (styles) {
    var new_style = "";
    var normal_styles;
    var important_styles;
    if (Array.isArray(styles)) {
      normal_styles = styles[0];
      important_styles = styles[1];
    } else {
      normal_styles = styles;
    }
    if (value) {
      value = String(value).replaceAll(/\/\*.*?\*\//g, "").trim();
      var in_str = false;
      var in_apo = 0;
      var in_comment = false;
      var reserved_names = [];
      if (normal_styles) {
        reserved_names.push(...Object.keys(normal_styles).map(to_css_name));
      }
      if (important_styles) {
        reserved_names.push(...Object.keys(important_styles).map(to_css_name));
      }
      var start_index = 0;
      var name_index = -1;
      const len = value.length;
      for (var i = 0; i < len; i++) {
        var c = value[i];
        if (in_comment) {
          if (c === "/" && value[i - 1] === "*") {
            in_comment = false;
          }
        } else if (in_str) {
          if (in_str === c) {
            in_str = false;
          }
        } else if (c === "/" && value[i + 1] === "*") {
          in_comment = true;
        } else if (c === '"' || c === "'") {
          in_str = c;
        } else if (c === "(") {
          in_apo++;
        } else if (c === ")") {
          in_apo--;
        }
        if (!in_comment && in_str === false && in_apo === 0) {
          if (c === ":" && name_index === -1) {
            name_index = i;
          } else if (c === ";" || i === len - 1) {
            if (name_index !== -1) {
              var name = to_css_name(value.substring(start_index, name_index).trim());
              if (!reserved_names.includes(name)) {
                if (c !== ";") {
                  i++;
                }
                var property = value.substring(start_index, i).trim();
                new_style += " " + property + ";";
              }
            }
            start_index = i + 1;
            name_index = -1;
          }
        }
      }
    }
    if (normal_styles) {
      new_style += append_styles2(normal_styles);
    }
    if (important_styles) {
      new_style += append_styles2(important_styles, true);
    }
    new_style = new_style.trim();
    return new_style === "" ? null : new_style;
  }
  return value == null ? null : String(value);
}

// node_modules/svelte/src/internal/client/dom/elements/class.js
function set_class(dom, is_html, value, hash2, prev_classes, next_classes) {
  var prev = (
    /** @type {any} */
    dom[CLASS_CACHE]
  );
  if (hydrating || prev !== value || prev === void 0) {
    var next_class_name = to_class(value, hash2, next_classes);
    if (!hydrating || next_class_name !== dom.getAttribute("class")) {
      if (next_class_name == null) {
        dom.removeAttribute("class");
      } else if (is_html) {
        dom.className = next_class_name;
      } else {
        dom.setAttribute("class", next_class_name);
      }
    }
    dom[CLASS_CACHE] = value;
  } else if (next_classes && prev_classes !== next_classes) {
    for (var key2 in next_classes) {
      var is_present = !!next_classes[key2];
      if (prev_classes == null || is_present !== !!prev_classes[key2]) {
        dom.classList.toggle(key2, is_present);
      }
    }
  }
  return next_classes;
}

// node_modules/svelte/src/internal/client/dom/elements/style.js
function update_styles(dom, prev = {}, next2, priority) {
  for (var key2 in next2) {
    var value = next2[key2];
    if (prev[key2] !== value) {
      if (next2[key2] == null) {
        dom.style.removeProperty(key2);
      } else {
        dom.style.setProperty(key2, value, priority);
      }
    }
  }
}
function set_style(dom, value, prev_styles, next_styles) {
  var prev = (
    /** @type {any} */
    dom[STYLE_CACHE]
  );
  if (hydrating || prev !== value) {
    var next_style_attr = to_style(value, next_styles);
    if (!hydrating || next_style_attr !== dom.getAttribute("style")) {
      if (next_style_attr == null) {
        dom.removeAttribute("style");
      } else {
        dom.style.cssText = next_style_attr;
      }
    }
    dom[STYLE_CACHE] = value;
  } else if (next_styles) {
    if (Array.isArray(next_styles)) {
      update_styles(dom, prev_styles?.[0], next_styles[0]);
      update_styles(dom, prev_styles?.[1], next_styles[1], "important");
    } else {
      update_styles(dom, prev_styles, next_styles);
    }
  }
  return next_styles;
}

// node_modules/svelte/src/internal/client/dom/elements/bindings/select.js
function set_selected(option, selected) {
  if (selected) {
    if (!option.hasAttribute("selected")) option.setAttribute("selected", "");
  } else {
    option.removeAttribute("selected");
  }
}
function apply_default_select_value(select, preserve) {
  var value = select.__defaultValue;
  var multiple = select.multiple;
  var values = multiple ? value ?? [] : null;
  if (multiple && !is_array(values)) return;
  var index3 = select.selectedIndex;
  var selected = preserve && multiple ? new Set(select.selectedOptions) : null;
  for (var option of select.options) {
    var option_value = get_option_value(option);
    set_selected(
      option,
      multiple ? (
        /** @type {any[]} */
        values.includes(option_value)
      ) : is(option_value, value)
    );
  }
  if (!preserve) return;
  if (selected !== null) {
    for (option of select.options) {
      var was_selected = selected.has(option);
      if (option.selected !== was_selected) option.selected = was_selected;
    }
  } else if (select.selectedIndex !== index3) {
    select.selectedIndex = index3;
  }
}
function select_option(select, value, mounting = false) {
  if (select.multiple) {
    if (value == void 0) {
      return;
    }
    if (!is_array(value)) {
      return select_multiple_invalid_value();
    }
    for (var option of select.options) {
      option.selected = value.includes(get_option_value(option));
    }
    return;
  }
  for (option of select.options) {
    var option_value = get_option_value(option);
    if (is(option_value, value)) {
      option.selected = true;
      return;
    }
  }
  if (!mounting || value !== void 0) {
    select.selectedIndex = -1;
  }
}
function init_select(select) {
  var observer = new MutationObserver((entries) => {
    if (entries.every(is_selectedcontent_mutation)) return;
    if ("__defaultValue" in select) {
      apply_default_select_value(select, false);
    }
    if ("__value" in select) {
      select_option(select, select.__value);
    }
  });
  observer.observe(select, {
    // Listen to option element changes
    childList: true,
    subtree: true,
    // because of <optgroup>
    // Listen to option element value attribute changes
    // (doesn't get notified of select value changes,
    // because that property is not reflected as an attribute)
    attributes: true,
    attributeFilter: ["value"]
  });
  teardown(() => {
    observer.disconnect();
  });
}
function bind_select_value(select, get3, set2 = get3) {
  var batches = /* @__PURE__ */ new WeakSet();
  var mounting = true;
  listen_to_event_and_reset_event(select, "change", (is_reset) => {
    var query = is_reset ? "[selected]" : ":checked";
    var value;
    if (select.multiple) {
      value = [].map.call(select.querySelectorAll(query), get_option_value);
    } else {
      var selected_option = select.querySelector(query) ?? // will fall back to first non-disabled option if no option is selected
      select.querySelector("option:not([disabled])");
      value = selected_option && get_option_value(selected_option);
    }
    set2(value);
    select.__value = value;
    if (current_batch !== null) {
      batches.add(current_batch);
    }
  });
  effect(() => {
    var value = get3();
    if (select === document.activeElement) {
      var batch = (
        /** @type {Batch} */
        async_mode_flag ? previous_batch : current_batch
      );
      if (batches.has(batch)) {
        return;
      }
    }
    select_option(select, value, mounting);
    if (mounting && value === void 0) {
      var selected_option = select.querySelector(":checked");
      if (selected_option !== null) {
        value = get_option_value(selected_option);
        set2(value);
      }
    }
    select.__value = value;
    mounting = false;
  });
}
function get_option_value(option) {
  if ("__value" in option) {
    return option.__value;
  } else {
    return option.value;
  }
}
function is_selectedcontent_mutation(entry) {
  if (
    /** @type {Element} */
    entry.target.closest("selectedcontent") !== null
  ) {
    return true;
  }
  if (entry.type === "childList") {
    var nodes = [...entry.addedNodes, ...entry.removedNodes];
    return nodes.length > 0 && nodes.every((node) => node.nodeName === "SELECTEDCONTENT");
  }
  return false;
}

// node_modules/svelte/src/internal/client/dom/elements/attributes.js
var IS_CUSTOM_ELEMENT = /* @__PURE__ */ Symbol("is custom element");
var IS_HTML = /* @__PURE__ */ Symbol("is html");
var LINK_TAG = IS_XHTML ? "link" : "LINK";
function remove_input_defaults(input) {
  if (!hydrating) return;
  var already_removed = false;
  var remove_defaults = () => {
    if (already_removed) return;
    already_removed = true;
    if (input.hasAttribute("value")) {
      var value = input.value;
      set_attribute2(input, "value", null);
      input.value = value;
    }
    if (input.hasAttribute("checked")) {
      var checked = input.checked;
      set_attribute2(input, "checked", null);
      input.checked = checked;
    }
  };
  input[FORM_RESET_HANDLER] = remove_defaults;
  queue_micro_task(remove_defaults);
  add_form_reset_listener();
}
function set_attribute2(element2, attribute, value, skip_warning) {
  var attributes = get_attributes(element2);
  if (hydrating) {
    attributes[attribute] = element2.getAttribute(attribute);
    if (attribute === "src" || attribute === "srcset" || attribute === "href" && element2.nodeName === LINK_TAG) {
      if (!skip_warning) {
        check_src_in_dev_hydration(element2, attribute, value ?? "");
      }
      return;
    }
  }
  var previous = attributes[attribute];
  if (previous === (attributes[attribute] = value)) return;
  if (attribute === "loading") {
    element2[LOADING_ATTR_SYMBOL] = value;
  }
  if (value == null) {
    element2.removeAttribute(attribute);
  } else if (typeof value !== "string" && get_setters(element2).has(attribute)) {
    element2[attribute] = value;
  } else if (
    // while hydrating, skip a number or boolean whose string the server already rendered
    !(hydrating && (typeof value === "number" || typeof value === "boolean") && previous === String(value))
  ) {
    element2.setAttribute(attribute, value);
  }
}
function set_custom_element_data(node, prop2, value) {
  var previous_reaction = active_reaction;
  var previous_effect = active_effect;
  let was_hydrating = hydrating;
  if (hydrating) {
    set_hydrating(false);
  }
  set_active_reaction(null);
  set_active_effect(null);
  try {
    if (
      // `style` should use `set_attribute` rather than the setter
      prop2 !== "style" && // Don't compute setters for custom elements while they aren't registered yet,
      // because during their upgrade/instantiation they might add more setters.
      // Instead, fall back to a simple "an object, then set as property" heuristic.
      (setters_cache.has(node.getAttribute("is") || node.nodeName) || // customElements may not be available in browser extension contexts
      !customElements || customElements.get(node.getAttribute("is") || node.nodeName.toLowerCase()) ? get_setters(node).has(prop2) : value && typeof value === "object")
    ) {
      node[prop2] = value;
    } else {
      set_attribute2(node, prop2, value == null ? value : String(value));
    }
  } finally {
    set_active_reaction(previous_reaction);
    set_active_effect(previous_effect);
    if (was_hydrating) {
      set_hydrating(true);
    }
  }
}
function get_attributes(element2) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    /** @type {any} */
    element2[ATTRIBUTES_CACHE] ??= {
      [IS_CUSTOM_ELEMENT]: element2.nodeName.includes("-"),
      [IS_HTML]: element2.namespaceURI === NAMESPACE_HTML
    }
  );
}
var setters_cache = /* @__PURE__ */ new Map();
function get_setters(element2) {
  var cache_key = element2.getAttribute("is") || element2.nodeName;
  var setters = setters_cache.get(cache_key);
  if (setters) return setters;
  setters_cache.set(cache_key, setters = /* @__PURE__ */ new Set());
  var descriptors;
  var proto = element2;
  var element_proto = Element.prototype;
  while (element_proto !== proto) {
    descriptors = get_descriptors(proto);
    for (var key2 in descriptors) {
      if (descriptors[key2].set && // better safe than sorry, we don't want spread attributes to mess with HTML content
      key2 !== "innerHTML" && key2 !== "textContent" && key2 !== "innerText") {
        setters.add(key2);
      }
    }
    proto = get_prototype_of(proto);
  }
  return setters;
}
function check_src_in_dev_hydration(element2, attribute, value) {
  if (!dev_fallback_default) return;
  if (attribute === "srcset" && srcset_url_equal(element2, value)) return;
  if (src_url_equal(element2.getAttribute(attribute) ?? "", value)) return;
  hydration_attribute_changed(
    attribute,
    element2.outerHTML.replace(element2.innerHTML, element2.innerHTML && "..."),
    String(value)
  );
}
function src_url_equal(element_src, url) {
  if (element_src === url) return true;
  return new URL(element_src, document.baseURI).href === new URL(url, document.baseURI).href;
}
function split_srcset(srcset) {
  return srcset.split(",").map((src) => src.trim().split(" ").filter(Boolean));
}
function srcset_url_equal(element2, srcset) {
  var element_urls = split_srcset(element2.srcset);
  var urls = split_srcset(srcset);
  return urls.length === element_urls.length && urls.every(
    ([url, width], i) => width === element_urls[i][1] && // We need to test both ways because Vite will create an a full URL with
    // `new URL(asset, import.meta.url).href` for the client when `base: './'`, and the
    // relative URLs inside srcset are not automatically resolved to absolute URLs by
    // browsers (in contrast to img.src). This means both SSR and DOM code could
    // contain relative or absolute URLs.
    (src_url_equal(element_urls[i][0], url) || src_url_equal(url, element_urls[i][0]))
  );
}

// node_modules/svelte/src/internal/client/dom/elements/bindings/input.js
function bind_value(input, get3, set2 = get3) {
  var batches = /* @__PURE__ */ new WeakSet();
  listen_to_event_and_reset_event(input, "input", async (is_reset) => {
    if (dev_fallback_default && input.type === "checkbox") {
      bind_invalid_checkbox_value();
    }
    var value = is_reset ? input.defaultValue : input.value;
    value = is_numberlike_input(input) ? to_number(value) : value;
    set2(value);
    if (current_batch !== null) {
      batches.add(current_batch);
    }
    await tick();
    if (value !== (value = get3())) {
      var start2 = input.selectionStart;
      var end = input.selectionEnd;
      var length = input.value.length;
      input.value = value ?? "";
      if (end !== null) {
        var new_length = input.value.length;
        if (start2 === end && end === length && new_length > length) {
          input.selectionStart = new_length;
          input.selectionEnd = new_length;
        } else {
          input.selectionStart = start2;
          input.selectionEnd = Math.min(end, new_length);
        }
      }
    }
  });
  if (
    // If we are hydrating and the value has since changed,
    // then use the updated value from the input instead.
    hydrating && input.defaultValue !== input.value || // If defaultValue is set, then value == defaultValue
    // TODO Svelte 6: remove input.value check and set to empty string?
    untrack(get3) == null && input.value
  ) {
    set2(is_numberlike_input(input) ? to_number(input.value) : input.value);
    if (current_batch !== null) {
      batches.add(current_batch);
    }
  }
  render_effect(() => {
    if (dev_fallback_default && input.type === "checkbox") {
      bind_invalid_checkbox_value();
    }
    var value = get3();
    if (input === document.activeElement) {
      var batch = (
        /** @type {Batch} */
        async_mode_flag ? previous_batch : current_batch
      );
      if (batches.has(batch)) {
        return;
      }
    }
    if (is_numberlike_input(input) && value === to_number(input.value)) {
      return;
    }
    if (input.type === "date" && !value && !input.value) {
      return;
    }
    if (value !== input.value) {
      input.value = value ?? "";
    }
  });
}
function bind_checked(input, get3, set2 = get3) {
  listen_to_event_and_reset_event(input, "change", (is_reset) => {
    var value = is_reset ? input.defaultChecked : input.checked;
    set2(value);
  });
  if (
    // If we are hydrating and the value has since changed,
    // then use the update value from the input instead.
    hydrating && input.defaultChecked !== input.checked || // If defaultChecked is set, then checked == defaultChecked
    untrack(get3) == null
  ) {
    set2(input.checked);
  }
  render_effect(() => {
    var value = get3();
    input.checked = Boolean(value);
  });
}
function is_numberlike_input(input) {
  var type = input.type;
  return type === "number" || type === "range";
}
function to_number(value) {
  return value === "" ? null : +value;
}

// node_modules/svelte/src/internal/client/dom/elements/bindings/this.js
function is_bound_this(bound_value, element_or_component) {
  return bound_value === element_or_component || bound_value?.[STATE_SYMBOL] === element_or_component;
}
function bind_this(element_or_component = mark_as_component(), update2, get_value, get_parts) {
  var component_effect = (
    /** @type {ComponentContext} */
    component_context.r
  );
  var parent = (
    /** @type {Effect} */
    active_effect
  );
  effect(() => {
    var old_parts;
    var parts;
    render_effect(() => {
      old_parts = parts;
      parts = get_parts?.() || [];
      untrack(() => {
        if (!is_bound_this(get_value(...parts), element_or_component)) {
          update2(element_or_component, ...parts);
          if (old_parts && is_bound_this(get_value(...old_parts), element_or_component)) {
            update2(null, ...old_parts);
          }
        }
      });
    });
    return () => {
      let p = parent;
      while (p !== component_effect && p.parent !== null && p.parent.f & DESTROYING) {
        p = p.parent;
      }
      const teardown2 = () => {
        if (parts && is_bound_this(get_value(...parts), element_or_component)) {
          update2(null, ...parts);
        }
      };
      const original_teardown = p.teardown;
      p.teardown = () => {
        teardown2();
        original_teardown?.();
      };
    };
  });
  return element_or_component;
}

// node_modules/svelte/src/internal/client/reactivity/store.js
var is_store_binding = false;
function capture_store_binding(fn) {
  var previous_is_store_binding = is_store_binding;
  try {
    is_store_binding = false;
    return [fn(), is_store_binding];
  } finally {
    is_store_binding = previous_is_store_binding;
  }
}

// node_modules/svelte/src/internal/client/reactivity/props.js
function prop(props, key2, flags2, fallback2) {
  var runes = !legacy_mode_flag || (flags2 & PROPS_IS_RUNES) !== 0;
  var bindable = (flags2 & PROPS_IS_BINDABLE) !== 0;
  var lazy = (flags2 & PROPS_IS_LAZY_INITIAL) !== 0;
  var fallback_value = (
    /** @type {V} */
    fallback2
  );
  var fallback_dirty = true;
  var fallback_signal = (
    /** @type {Derived<V> | undefined} */
    void 0
  );
  var get_fallback = () => {
    if (lazy && runes) {
      fallback_signal ??= derived(
        /** @type {() => V} */
        fallback2
      );
      return get(fallback_signal);
    }
    if (fallback_dirty) {
      fallback_dirty = false;
      fallback_value = lazy ? untrack(
        /** @type {() => V} */
        fallback2
      ) : (
        /** @type {V} */
        fallback2
      );
    }
    return fallback_value;
  };
  let setter;
  if (bindable) {
    var is_entry_props = STATE_SYMBOL in props || LEGACY_PROPS in props;
    setter = get_descriptor(props, key2)?.set ?? (is_entry_props && key2 in props ? (v) => props[key2] = v : void 0);
  }
  var initial_value;
  var is_store_sub = false;
  if (bindable) {
    [initial_value, is_store_sub] = capture_store_binding(() => (
      /** @type {V} */
      props[key2]
    ));
  } else {
    initial_value = /** @type {V} */
    props[key2];
  }
  if (initial_value === void 0 && fallback2 !== void 0) {
    initial_value = get_fallback();
    if (setter) {
      if (runes) props_invalid_value(key2);
      setter(initial_value);
    }
  }
  var getter;
  if (runes) {
    getter = () => {
      var value = (
        /** @type {V} */
        props[key2]
      );
      if (value === void 0) return get_fallback();
      fallback_dirty = true;
      return value;
    };
  } else {
    getter = () => {
      var value = (
        /** @type {V} */
        props[key2]
      );
      if (value !== void 0) {
        fallback_value = /** @type {V} */
        void 0;
      }
      return value === void 0 ? fallback_value : value;
    };
  }
  if (runes && (flags2 & PROPS_IS_UPDATED) === 0) {
    return getter;
  }
  if (setter) {
    var legacy_parent = props.$$legacy;
    return (
      /** @type {() => V} */
      (function(value, mutation) {
        if (arguments.length > 0) {
          if (!runes || !mutation || legacy_parent || is_store_sub) {
            setter(mutation ? getter() : value);
          }
          return value;
        }
        return getter();
      })
    );
  }
  var overridden = false;
  var d = ((flags2 & PROPS_IS_IMMUTABLE) !== 0 ? derived : derived_safe_equal)(() => {
    overridden = false;
    return getter();
  });
  if (dev_fallback_default) {
    d.label = key2;
  }
  if (bindable) get(d);
  var parent_effect = (
    /** @type {Effect} */
    active_effect
  );
  return (
    /** @type {() => V} */
    (function(value, mutation) {
      if (arguments.length > 0) {
        const new_value = mutation ? get(d) : runes && bindable ? proxy(value) : value;
        set(d, new_value);
        overridden = true;
        if (fallback_value !== void 0) {
          fallback_value = new_value;
        }
        return value;
      }
      if (is_destroying_effect && overridden || (parent_effect.f & DESTROYED) !== 0) {
        return d.v;
      }
      return get(d);
    })
  );
}

// node_modules/svelte/src/legacy/legacy-client.js
function createClassComponent(options) {
  return new Svelte4Component(options);
}
var Svelte4Component = class {
  /** @type {any} */
  #events;
  /** @type {Record<string, any>} */
  #instance;
  /**
   * @param {ComponentConstructorOptions & {
   *  component: any;
   * }} options
   */
  constructor(options) {
    var sources = /* @__PURE__ */ new Map();
    var add_source = (key2, value) => {
      var s = mutable_source(value, false, false);
      sources.set(key2, s);
      return s;
    };
    const props = new Proxy(
      { ...options.props || {}, $$events: {} },
      {
        get(target, prop2) {
          return get(sources.get(prop2) ?? add_source(prop2, Reflect.get(target, prop2)));
        },
        has(target, prop2) {
          if (prop2 === LEGACY_PROPS) return true;
          get(sources.get(prop2) ?? add_source(prop2, Reflect.get(target, prop2)));
          return Reflect.has(target, prop2);
        },
        set(target, prop2, value) {
          set(sources.get(prop2) ?? add_source(prop2, value), value);
          return Reflect.set(target, prop2, value);
        }
      }
    );
    this.#instance = (options.hydrate ? hydrate : mount)(options.component, {
      target: options.target,
      anchor: options.anchor,
      props,
      context: options.context,
      intro: options.intro ?? false,
      recover: options.recover,
      transformError: options.transformError
    });
    if (!async_mode_flag && (!options?.props?.$$host || options.sync === false)) {
      flushSync();
    }
    this.#events = props.$$events;
    for (const key2 of Object.keys(this.#instance)) {
      if (key2 === "$set" || key2 === "$destroy" || key2 === "$on") continue;
      define_property(this, key2, {
        get() {
          return this.#instance[key2];
        },
        /** @param {any} value */
        set(value) {
          this.#instance[key2] = value;
        },
        enumerable: true
      });
    }
    this.#instance.$set = /** @param {Record<string, any>} next */
    (next2) => {
      Object.assign(props, next2);
    };
    this.#instance.$destroy = () => {
      unmount(this.#instance);
    };
  }
  /** @param {Record<string, any>} props */
  $set(props) {
    this.#instance.$set(props);
  }
  /**
   * @param {string} event
   * @param {(...args: any[]) => any} callback
   * @returns {any}
   */
  $on(event2, callback) {
    this.#events[event2] = this.#events[event2] || [];
    const cb = (...args) => callback.call(this, ...args);
    this.#events[event2].push(cb);
    return () => {
      this.#events[event2] = this.#events[event2].filter(
        /** @param {any} fn */
        (fn) => fn !== cb
      );
    };
  }
  $destroy() {
    this.#instance.$destroy();
  }
};

// node_modules/svelte/src/internal/client/dom/elements/custom-element.js
var SvelteElement;
if (typeof HTMLElement === "function") {
  SvelteElement = class extends HTMLElement {
    /** The Svelte component constructor */
    $$ctor;
    /** Slots */
    $$s;
    /** @type {any} The Svelte component instance */
    $$c;
    /** Whether or not the custom element is connected */
    $$cn = false;
    /** @type {Record<string, any>} Component props data */
    $$d = {};
    /** `true` if currently in the process of reflecting component props back to attributes */
    $$r = false;
    /** @type {Record<string, CustomElementPropDefinition>} Props definition (name, reflected, type etc) */
    $$p_d = {};
    /** @type {Record<string, EventListenerOrEventListenerObject[]>} Event listeners */
    $$l = {};
    /** @type {Map<EventListenerOrEventListenerObject, Function>} Event listener unsubscribe functions */
    $$l_u = /* @__PURE__ */ new Map();
    /** @type {any} The managed render effect for reflecting attributes */
    $$me;
    /** @type {ShadowRoot | null} The ShadowRoot of the custom element */
    $$shadowRoot = null;
    /**
     * @param {*} $$componentCtor
     * @param {*} $$slots
     * @param {ShadowRootInit | undefined} shadow_root_init
     */
    constructor($$componentCtor, $$slots, shadow_root_init) {
      super();
      this.$$ctor = $$componentCtor;
      this.$$s = $$slots;
      if (shadow_root_init) {
        this.$$shadowRoot = this.attachShadow(shadow_root_init);
      }
    }
    /**
     * @param {string} type
     * @param {EventListenerOrEventListenerObject} listener
     * @param {boolean | AddEventListenerOptions} [options]
     */
    addEventListener(type, listener, options) {
      this.$$l[type] = this.$$l[type] || [];
      this.$$l[type].push(listener);
      if (this.$$c) {
        const unsub = this.$$c.$on(type, listener);
        this.$$l_u.set(listener, unsub);
      }
      super.addEventListener(type, listener, options);
    }
    /**
     * @param {string} type
     * @param {EventListenerOrEventListenerObject} listener
     * @param {boolean | AddEventListenerOptions} [options]
     */
    removeEventListener(type, listener, options) {
      super.removeEventListener(type, listener, options);
      if (this.$$c) {
        const unsub = this.$$l_u.get(listener);
        if (unsub) {
          unsub();
          this.$$l_u.delete(listener);
        }
      }
    }
    async connectedCallback() {
      this.$$cn = true;
      if (!this.$$c) {
        let create_slot = function(name) {
          return (anchor) => {
            const slot2 = create_element("slot");
            if (name !== "default") slot2.name = name;
            append2(anchor, slot2);
          };
        };
        await Promise.resolve();
        if (!this.$$cn || this.$$c) {
          return;
        }
        const $$slots = {};
        const existing_slots = get_custom_elements_slots(this);
        for (const name of this.$$s) {
          if (name in existing_slots) {
            if (name === "default" && !this.$$d.children) {
              this.$$d.children = create_slot(name);
              $$slots.default = true;
            } else {
              $$slots[name] = create_slot(name);
            }
          }
        }
        for (const attribute of this.attributes) {
          const name = this.$$g_p(attribute.name);
          if (!(name in this.$$d)) {
            this.$$d[name] = get_custom_element_value(name, attribute.value, this.$$p_d, "toProp");
          }
        }
        for (const key2 in this.$$p_d) {
          if (!(key2 in this.$$d) && this[key2] !== void 0) {
            this.$$d[key2] = this[key2];
            delete this[key2];
          }
        }
        this.$$c = createClassComponent({
          component: this.$$ctor,
          target: this.$$shadowRoot || this,
          props: {
            ...this.$$d,
            $$slots,
            $$host: this
          }
        });
        this.$$me = effect_root(() => {
          render_effect(() => {
            this.$$r = true;
            for (const key2 of object_keys(this.$$c)) {
              if (!this.$$p_d[key2]?.reflect) continue;
              this.$$d[key2] = this.$$c[key2];
              const attribute_value = get_custom_element_value(
                key2,
                this.$$d[key2],
                this.$$p_d,
                "toAttribute"
              );
              if (attribute_value == null) {
                this.removeAttribute(this.$$p_d[key2].attribute || key2);
              } else {
                this.setAttribute(this.$$p_d[key2].attribute || key2, attribute_value);
              }
            }
            this.$$r = false;
          });
        });
        for (const type in this.$$l) {
          for (const listener of this.$$l[type]) {
            const unsub = this.$$c.$on(type, listener);
            this.$$l_u.set(listener, unsub);
          }
        }
        this.$$l = {};
      }
    }
    // We don't need this when working within Svelte code, but for compatibility of people using this outside of Svelte
    // and setting attributes through setAttribute etc, this is helpful
    /**
     * @param {string} attr
     * @param {string} _oldValue
     * @param {string} newValue
     */
    attributeChangedCallback(attr2, _oldValue, newValue) {
      if (this.$$r) return;
      attr2 = this.$$g_p(attr2);
      this.$$d[attr2] = get_custom_element_value(attr2, newValue, this.$$p_d, "toProp");
      this.$$c?.$set({ [attr2]: this.$$d[attr2] });
    }
    disconnectedCallback() {
      this.$$cn = false;
      Promise.resolve().then(() => {
        if (!this.$$cn && this.$$c) {
          this.$$c.$destroy();
          this.$$me();
          this.$$c = void 0;
        }
      });
    }
    /**
     * @param {string} attribute_name
     */
    $$g_p(attribute_name) {
      return object_keys(this.$$p_d).find(
        (key2) => this.$$p_d[key2].attribute === attribute_name || !this.$$p_d[key2].attribute && key2.toLowerCase() === attribute_name
      ) || attribute_name;
    }
  };
}
function get_custom_element_value(prop2, value, props_definition, transform) {
  const type = props_definition[prop2]?.type;
  value = type === "Boolean" && typeof value !== "boolean" ? value != null : value;
  if (!transform || !props_definition[prop2]) {
    return value;
  } else if (transform === "toAttribute") {
    switch (type) {
      case "Object":
      case "Array":
        return value == null ? null : JSON.stringify(value);
      case "Boolean":
        return value ? "" : null;
      case "Number":
        return value == null ? null : value;
      default:
        return value;
    }
  } else {
    switch (type) {
      case "Object":
      case "Array":
        return value && JSON.parse(value);
      case "Boolean":
        return value;
      // conversion already handled above
      case "Number":
        return value != null ? +value : value;
      default:
        return value;
    }
  }
}
function get_custom_elements_slots(element2) {
  const result = {};
  element2.childNodes.forEach((node) => {
    result[
      /** @type {Element} node */
      node.slot || "default"
    ] = true;
  });
  return result;
}

// node_modules/svelte/src/version.js
var PUBLIC_VERSION = "5";

// node_modules/svelte/src/internal/disclose-version.js
if (typeof window !== "undefined") {
  ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add(PUBLIC_VERSION);
}

// ../ui/src/lib/components/Icon.svelte
var root = from_svg(`<path></path>`);
var root_1 = from_svg(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none"></svg>`);
function Icon($$anchor, $$props) {
  const PATHS = {
    home: ["M3 10.5 12 3l9 7.5", "M5 9.5V20h14V9.5", "M10 20v-6h4v6"],
    inbox: [
      "M22 12h-6l-2 3h-4l-2-3H2",
      "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
    ],
    moon: ["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"],
    sun: [
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
      "M12 2v2",
      "M12 20v2",
      "m4.93 4.93 1.41 1.41",
      "m17.66 17.66 1.41 1.41",
      "M2 12h2",
      "M20 12h2",
      "m6.34 17.66-1.41 1.41",
      "m19.07 4.93-1.41 1.41"
    ],
    gauge: ["m12 14 4-4", "M3.34 19a10 10 0 1 1 17.32 0"],
    target: [
      "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
      "M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z",
      "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
    ],
    activity: ["M22 12h-4l-3 9L9 3l-3 9H2"],
    sparkles: [
      "M9.94 14.06 4 20",
      "M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"
    ],
    check: ["M20 6 9 17l-5-5"],
    x: ["M18 6 6 18", "M6 6l12 12"],
    alert: [
      "M12 9v4",
      "M12 17h.01",
      "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
    ],
    info: [
      "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
      "M12 16v-4",
      "M12 8h.01"
    ],
    play: ["M6 3l14 9-14 9V3z"],
    square: ["M5 5h14v14H5z"],
    refresh: [
      "M21 12a9 9 0 0 1-15.5 6.2L3 16",
      "M3 12a9 9 0 0 1 15.5-6.2L21 8",
      "M21 3v5h-5",
      "M3 21v-5h5"
    ],
    file: [
      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
      "M14 2v6h6"
    ],
    chevron: ["m9 18 6-6-6-6"],
    arrowLeft: ["M19 12H5", "m12 19-7-7 7-7"],
    terminal: ["m4 17 6-6-6-6", "M12 19h8"],
    clock: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 6v6l4 2"]
  };
  let size = prop($$props, "size", 3, 16);
  var svg = root_1();
  each(svg, 21, () => PATHS[$$props.name] ?? [], index, ($$anchor2, d) => {
    var path2 = root();
    template_effect(() => set_attribute2(path2, "d", get(d)));
    append2($$anchor2, path2);
  });
  reset(svg);
  template_effect(() => {
    set_attribute2(svg, "width", size());
    set_attribute2(svg, "height", size());
    set_attribute2(svg, "aria-hidden", $$props.label ? void 0 : "true");
    set_attribute2(svg, "role", $$props.label ? "img" : void 0);
    set_attribute2(svg, "aria-label", $$props.label);
  });
  append2($$anchor, svg);
}

// src/ui/app/connection.svelte.js
var connection = proxy({ url: "", token: "", refused: false });

// src/ui/app/api.js
async function api(url, { method = "GET", body } = {}) {
  const { base, token } = untrack(() => ({ base: connection.url, token: connection.token }));
  const headers = { "x-improve-token": token };
  if (body !== void 0) headers["content-type"] = "application/json";
  let response;
  try {
    response = await fetch(`${base}${url}`, {
      method,
      headers,
      body: body === void 0 ? void 0 : JSON.stringify(body),
      mode: "cors",
      credentials: "omit"
    });
  } catch {
    throw Object.assign(new Error("improve\u2019s review UI is not answering. Is it still running?"), { offline: true });
  }
  const value = await response.json().catch(() => ({}));
  if (response.status === 403 && /token/.test(value?.error ?? "")) connection.refused = true;
  if (!response.ok || value?.ok === false) {
    const error = new Error(value?.error ?? `Request failed (${response.status})`);
    Object.assign(error, { status: response.status, hint: value?.hint, running: value?.running, detail: value });
    throw error;
  }
  return value;
}

// ../ui/src/lib/client/format.js
function ago(iso, now = Date.now()) {
  if (!iso) return "never";
  const seconds = Math.round((now - Date.parse(iso)) / 1e3);
  if (!Number.isFinite(seconds)) return "unknown";
  if (seconds < 0) return `in ${until(-seconds)}`;
  if (seconds < 45) return "just now";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h ago`;
  const days = Math.round(seconds / 86400);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
function until(seconds) {
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} h`;
  return `${Math.round(seconds / 86400)} days`;
}
function duration(startIso, endIso, now = Date.now()) {
  if (!startIso) return "";
  const ms = (endIso ? Date.parse(endIso) : now) - Date.parse(startIso);
  if (!Number.isFinite(ms) || ms < 0) return "";
  const s = Math.round(ms / 1e3);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
}
function when(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString(void 0, { dateStyle: "medium", timeStyle: "short" });
}
function score(value) {
  return typeof value === "number" ? value.toFixed(2) : "\u2013";
}
function plural2(count, one2, many = `${one2}s`) {
  return `${count} ${count === 1 ? one2 : many}`;
}
var STATUS = {
  draft: { label: "Draft", tone: "" },
  proposed: { label: "Waiting for review", tone: "warn" },
  approved: { label: "Approved, not applied", tone: "accent" },
  applying: { label: "Applying", tone: "accent" },
  validated: { label: "Applied", tone: "ok" },
  rejected: { label: "Rejected", tone: "bad" },
  "rolled-back": { label: "Rolled back", tone: "bad" }
};
var JOB = {
  running: { label: "Running", tone: "accent live" },
  completed: { label: "Finished", tone: "ok" },
  failed: { label: "Failed", tone: "bad" },
  cancelled: { label: "Cancelled", tone: "" },
  "timed-out": { label: "Timed out", tone: "bad" },
  interrupted: { label: "Interrupted", tone: "warn" }
};
var SCOPE = {
  harness: { label: "Harness only", tone: "ok", meaning: "Changes only files that shape the agent." },
  codebase: { label: "Changes application code", tone: "bad", meaning: "Changes application files, not the agent's setup. Rewrite it as a harness change." },
  mixed: { label: "Also changes application code", tone: "warn", meaning: "Changes the agent's setup and application files." },
  unknown: { label: "No files listed", tone: "warn", meaning: "The proposal does not say which files it changes." }
};
var FIRSTMATE_SCOPE = {
  "captain-private": { label: "Captain-private", tone: "ok", meaning: "Changes only the captain's own home files. Applied locally after approval." },
  "shared-tracked": { label: "Shared Firstmate files", tone: "ok", meaning: "Changes files committed to the Firstmate repository. Delivered upstream as a pull request." },
  mixed: { label: "Captain-private and shared", tone: "warn", meaning: "Mixes the captain's own files with shared Firstmate files. Split it into one proposal per side." }
};
function scopeLabel(check) {
  const side = check?.scope === "harness" ? FIRSTMATE_SCOPE[check.firstmate?.visibility ?? ""] : void 0;
  return side ?? SCOPE[check?.scope ?? ""] ?? SCOPE.unknown;
}
function showScope(check) {
  return Boolean(check) && (check?.scope !== "harness" || Boolean(check?.firstmate));
}
function waiting(proposal) {
  return proposal.status === "proposed" || proposal.status === "draft";
}

// ../ui/src/lib/client/summary.svelte.js
var summary = proxy({
  status: null,
  proposals: [],
  dreams: [],
  loaded: false,
  error: null
});
async function refreshSummary() {
  try {
    const [status, proposals, dreams] = await Promise.all([
      api("/api/status"),
      api("/api/proposals"),
      api("/api/dreams")
    ]);
    summary.status = status;
    summary.proposals = proposals.proposals ?? [];
    summary.dreams = dreams.dreams ?? [];
    summary.error = null;
  } catch (error) {
    summary.error = /** @type {Error} */
    error.message;
  }
  summary.loaded = true;
}
function waitingCount() {
  return summary.proposals.filter(waiting).length;
}
function findingCount() {
  return summary.dreams.reduce((total, report) => total + (report.findings?.length ?? 0), 0);
}

// ../ui/src/lib/client/jobs.svelte.js
var jobs = proxy({ list: [], error: null, loaded: false });
var timer;
var listeners2 = 0;
async function tick2() {
  try {
    const value = await api("/api/jobs");
    jobs.list = value.jobs ?? [];
    jobs.error = null;
  } catch (error) {
    jobs.error = /** @type {Error} */
    error.message;
  }
  jobs.loaded = true;
  schedule();
}
function schedule() {
  clearTimeout(timer);
  if (listeners2 === 0) return;
  const live = jobs.list.some((job) => job.status === "running");
  timer = setTimeout(tick2, live ? 1e3 : 8e3);
}
function watchJobs() {
  user_effect(() => {
    listeners2 += 1;
    tick2();
    return () => {
      listeners2 -= 1;
      if (listeners2 === 0) clearTimeout(timer);
    };
  });
}
function refreshJobs() {
  return tick2();
}
async function settled2(id) {
  for (; ; ) {
    const job = jobs.list.find((candidate) => candidate.id === id);
    if (job && job.status !== "running") return job;
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (!jobs.list.some((candidate) => candidate.id === id)) await tick2();
  }
}

// src/ui/app/router.svelte.js
var BASE = "http://improve.invalid";
var VIEWS = [
  "/",
  "/proposals",
  "/findings",
  "/evals",
  "/objectives",
  "/runs",
  "/firstmate"
];
function fromHash(hash2) {
  let h2 = hash2.replace(/^#/, "");
  if (!h2) return null;
  if (!h2.startsWith("/")) {
    try {
      h2 = decodeURIComponent(h2);
    } catch {
    }
    return new URL(`/proposals?view=all&p=${encodeURIComponent(h2)}`, BASE);
  }
  try {
    const url = new URL(h2, BASE);
    return url.origin === BASE && VIEWS.includes(url.pathname) ? url : null;
  } catch {
    return null;
  }
}
var toHash = (url) => `#${url.pathname}${url.search}${url.hash}`;
var start = typeof location === "undefined" ? null : fromHash(location.hash);
var here = proxy({ url: start ?? new URL("/", BASE), chosen: start !== null });
var page = {
  get url() {
    return here.url;
  }
};
var chosen = () => here.chosen;
function sync() {
  const url = fromHash(location.hash);
  here.chosen = url !== null;
  const next2 = url ?? new URL("/", BASE);
  if (next2.href !== here.url.href) here.url = next2;
}
var anchorHome = null;
function setAnchorHome(node) {
  anchorHome = node;
}
function goto(to, o = {}) {
  const url = new URL(String(to), here.url);
  const hash2 = toHash(url);
  if (o.replaceState) {
    history.replaceState(history.state, "", hash2);
  } else if (location.hash !== hash2) {
    const a = document.createElement("a");
    a.href = hash2;
    a.hidden = true;
    (anchorHome ?? document.body).appendChild(a);
    a.click();
    a.remove();
    if (location.hash !== hash2) location.hash = hash2;
  }
  sync();
  return Promise.resolve();
}

// ../ui/src/lib/components/Notice.svelte
var root2 = from_html(`<div><span class="notice-icon"><!></span> <div class="grow"><!></div></div>`);
function Notice($$anchor, $$props) {
  let tone = prop($$props, "tone", 3, "");
  const icon2 = user_derived(() => tone() === "ok" ? "check" : tone() === "bad" ? "alert" : tone() === "warn" ? "alert" : "info");
  var div = root2();
  var span = child(div);
  var node = child(span);
  Icon(node, {
    get name() {
      return get(icon2);
    }
  });
  reset(span);
  var div_1 = sibling(span, 2);
  var node_1 = child(div_1);
  snippet(node_1, () => $$props.children ?? noop);
  reset(div_1);
  reset(div);
  template_effect(() => {
    set_class(div, 1, `notice ${tone() ?? ""}`);
    set_attribute2(div, "role", tone() === "bad" ? "alert" : "status");
  });
  append2($$anchor, div);
}

// src/ui/app/Connect.svelte
var root3 = from_html(`<p class="row muted"><span class="spin" style="display:inline-flex"><!></span>Connecting to improve\u2019s review UI\u2026</p>`);
var root_12 = from_html(`<p>improve\u2019s review UI at <code> </code> serves <code> </code>, not this Firstmate home.</p> <p class="small">Stop it, or set <code>plugins.improve.settings.uiUrl</code> to where this home\u2019s runs.</p>`, 1);
var root_2 = from_html(`<p>improve\u2019s review UI runs at <code> </code>, but it is from a copy of improve that Wheelhouse cannot drive.</p> <p class="small">Update improve and restart its UI. Until then, <a target="_blank" rel="noreferrer">open it in a new tab</a>.</p>`, 1);
var root_3 = from_html(`<p>improve\u2019s review UI refused Wheelhouse\u2019s token: it has restarted since Wheelhouse last read it.</p> <p class="small">Wheelhouse reads it again within half a minute.</p>`, 1);
var root_4 = from_html(`<!> <div class="actions"><button class="small"><!>Try again</button></div>`, 1);
var root_5 = from_html(`<h2>improve\u2019s review UI is not running</h2> <p class="muted" style="margin-top:4px">Proposals, background findings, evaluations, objectives and runs come from improve\u2019s review UI, a small server on this computer. <!></p>`, 1);
var root_6 = from_html(`<p class="muted">improve\u2019s review UI is not running, so only what Wheelhouse read about this home shows.<!></p>`);
var root_7 = from_html(`<p class="row muted" style="margin-top:12px" role="status"><span class="spin" style="display:inline-flex"><!></span>Starting improve\u2019s review UI; the first start can take a minute.</p>`);
var root_8 = from_html(`<div class="actions"><button class="primary"><!>Launch improve\u2019s review UI</button> <span class="small faint">Wheelhouse starts it on 127.0.0.1 for this home and opens it in a new tab; this page connects to it too.</span></div>`);
var root_9 = from_html(`<p class="small" style="margin-top:12px">Start it with:</p> <pre class="log"> </pre>`, 1);
var root_10 = from_html(`<button class="small"><!> </button>`);
var root_11 = from_html(`<!> <div class="actions"><!> <button class="small"><!>Check again</button></div>`, 1);
var root_122 = from_html(`<p> </p>`);
var root_13 = from_html(`<div style="margin-top:12px"><!></div>`);
var root_14 = from_html(`<!> <!> <!>`, 1);
var root_15 = from_html(`<section class="panel panel-body connect" aria-live="polite"><!></section>`);
function Connect($$anchor, $$props) {
  push($$props, true);
  let compact = prop($$props, "compact", 3, false);
  let service = state(
    /** @type {ServiceView | null} */
    null
  );
  let launching = state(false);
  let failure = state(
    /** @type {string | null} */
    null
  );
  let copied = state(false);
  async function read() {
    if (!$$props.host?.service) return;
    try {
      set(service, await $$props.host.service("ui"), true);
    } catch {
      set(service, null);
    }
  }
  user_effect(() => {
    if ($$props.link === "down") untrack(read);
  });
  const open = user_derived(() => $$props.ui ? `${$$props.ui.url}${page.url.pathname === "/firstmate" ? "/" : page.url.pathname}${page.url.search}` : null);
  const hint = user_derived(() => get(service)?.hint ?? $$props.ui?.start ?? null);
  async function launch() {
    set(launching, true);
    set(failure, null);
    try {
      set(service, await $$props.host.launch("ui", { open: get(open) }), true);
      if (get(service)?.state === "running") $$props.onready();
      else set(failure, get(service)?.reason ?? "Wheelhouse could not start it.", true);
    } catch (error) {
      set(
        failure,
        /** @type {Error} */
        error.message,
        true
      );
    } finally {
      set(launching, false);
    }
  }
  async function copy2() {
    if (!get(hint)) return;
    try {
      await navigator.clipboard.writeText(get(hint));
      set(copied, true);
      setTimeout(() => set(copied, false), 1500);
    } catch {
    }
  }
  var fragment = comment();
  var node = first_child(fragment);
  {
    var consequent_12 = ($$anchor2) => {
      var section = root_15();
      var node_1 = child(section);
      {
        var consequent = ($$anchor3) => {
          var p = root3();
          var span = child(p);
          var node_2 = child(span);
          Icon(node_2, { name: "refresh", size: 14 });
          reset(span);
          next();
          reset(p);
          append2($$anchor3, p);
        };
        var consequent_1 = ($$anchor3) => {
          Notice($$anchor3, {
            tone: "warn",
            children: ($$anchor4, $$slotProps) => {
              var fragment_2 = root_12();
              var p_1 = first_child(fragment_2);
              var code = sibling(child(p_1));
              var text2 = only_child(code, true);
              var code_1 = sibling(code, 2);
              var text_1 = only_child(code_1, true);
              next();
              reset(p_1);
              next(2);
              template_effect(() => {
                set_text(text2, $$props.ui.url);
                set_text(text_1, $$props.ui.project);
              });
              append2($$anchor4, fragment_2);
            },
            $$slots: { default: true }
          });
        };
        var consequent_2 = ($$anchor3) => {
          Notice($$anchor3, {
            tone: "warn",
            children: ($$anchor4, $$slotProps) => {
              var fragment_4 = root_2();
              var p_2 = first_child(fragment_4);
              var code_2 = sibling(child(p_2));
              var text_2 = only_child(code_2, true);
              next();
              reset(p_2);
              var p_3 = sibling(p_2, 2);
              var a = sibling(child(p_3));
              next();
              reset(p_3);
              template_effect(() => {
                set_text(text_2, $$props.ui.url);
                set_attribute2(a, "href", $$props.ui.url);
              });
              append2($$anchor4, fragment_4);
            },
            $$slots: { default: true }
          });
        };
        var consequent_3 = ($$anchor3) => {
          var fragment_5 = root_4();
          var node_3 = first_child(fragment_5);
          Notice(node_3, {
            tone: "warn",
            children: ($$anchor4, $$slotProps) => {
              var fragment_6 = root_3();
              next(2);
              append2($$anchor4, fragment_6);
            },
            $$slots: { default: true }
          });
          var div = sibling(node_3, 2);
          var button = child(div);
          var node_4 = child(button);
          Icon(node_4, { name: "refresh", size: 13 });
          next();
          reset(button);
          reset(div);
          delegated("click", button, function(...$$args) {
            $$props.onready?.apply(this, $$args);
          });
          append2($$anchor3, fragment_5);
        };
        var alternate_2 = ($$anchor3) => {
          var fragment_7 = root_14();
          var node_5 = first_child(fragment_7);
          {
            var consequent_5 = ($$anchor4) => {
              var fragment_8 = root_5();
              var p_4 = sibling(first_child(fragment_8), 2);
              var node_6 = sibling(child(p_4));
              {
                var consequent_4 = ($$anchor5) => {
                  var text_3 = text();
                  template_effect(() => set_text(text_3, get(service).reason));
                  append2($$anchor5, text_3);
                };
                if_block(node_6, ($$render) => {
                  if (get(service)?.reason && get(service).state !== "stopped") $$render(consequent_4);
                });
              }
              reset(p_4);
              append2($$anchor4, fragment_8);
            };
            var alternate = ($$anchor4) => {
              var p_5 = root_6();
              var node_7 = sibling(child(p_5));
              {
                var consequent_6 = ($$anchor5) => {
                  var text_4 = text();
                  template_effect(() => set_text(text_4, get(service).reason));
                  append2($$anchor5, text_4);
                };
                if_block(node_7, ($$render) => {
                  if (get(service)?.reason && get(service).state !== "stopped") $$render(consequent_6);
                });
              }
              reset(p_5);
              append2($$anchor4, p_5);
            };
            if_block(node_5, ($$render) => {
              if (!compact()) $$render(consequent_5);
              else $$render(alternate, -1);
            });
          }
          var node_8 = sibling(node_5, 2);
          {
            var consequent_7 = ($$anchor4) => {
              var p_6 = root_7();
              var span_1 = child(p_6);
              var node_9 = child(span_1);
              Icon(node_9, { name: "refresh", size: 14 });
              reset(span_1);
              next();
              reset(p_6);
              append2($$anchor4, p_6);
            };
            var consequent_8 = ($$anchor4) => {
              var div_1 = root_8();
              var button_1 = child(div_1);
              var node_10 = child(button_1);
              Icon(node_10, { name: "play", size: 14 });
              next();
              reset(button_1);
              next(2);
              reset(div_1);
              delegated("click", button_1, launch);
              append2($$anchor4, div_1);
            };
            var alternate_1 = ($$anchor4) => {
              var fragment_11 = root_11();
              var node_11 = first_child(fragment_11);
              {
                var consequent_9 = ($$anchor5) => {
                  var fragment_12 = root_9();
                  var pre = sibling(first_child(fragment_12), 2);
                  var text_5 = only_child(pre, true);
                  template_effect(() => set_text(text_5, get(hint)));
                  append2($$anchor5, fragment_12);
                };
                if_block(node_11, ($$render) => {
                  if (get(hint)) $$render(consequent_9);
                });
              }
              var div_2 = sibling(node_11, 2);
              var node_12 = child(div_2);
              {
                var consequent_10 = ($$anchor5) => {
                  var button_2 = root_10();
                  var node_13 = child(button_2);
                  {
                    let $0 = user_derived(() => get(copied) ? "check" : "file");
                    Icon(node_13, {
                      get name() {
                        return get($0);
                      },
                      size: 13
                    });
                  }
                  var text_6 = sibling(node_13, 1, true);
                  reset(button_2);
                  template_effect(() => set_text(text_6, get(copied) ? "Copied" : "Copy the command"));
                  delegated("click", button_2, copy2);
                  append2($$anchor5, button_2);
                };
                if_block(node_12, ($$render) => {
                  if (get(hint)) $$render(consequent_10);
                });
              }
              var button_3 = sibling(node_12, 2);
              var node_14 = child(button_3);
              Icon(node_14, { name: "refresh", size: 13 });
              next();
              reset(button_3);
              reset(div_2);
              delegated("click", button_3, function(...$$args) {
                $$props.onready?.apply(this, $$args);
              });
              append2($$anchor4, fragment_11);
            };
            if_block(node_8, ($$render) => {
              if (get(service)?.state === "starting" || get(launching)) $$render(consequent_7);
              else if (get(service)?.launchable) $$render(consequent_8, 1);
              else $$render(alternate_1, -1);
            });
          }
          var node_15 = sibling(node_8, 2);
          {
            var consequent_11 = ($$anchor4) => {
              var div_3 = root_13();
              var node_16 = child(div_3);
              Notice(node_16, {
                tone: "bad",
                children: ($$anchor5, $$slotProps) => {
                  var p_7 = root_122();
                  var text_7 = only_child(p_7, true);
                  template_effect(() => set_text(text_7, get(failure)));
                  append2($$anchor5, p_7);
                },
                $$slots: { default: true }
              });
              reset(div_3);
              append2($$anchor4, div_3);
            };
            if_block(node_15, ($$render) => {
              if (get(failure)) $$render(consequent_11);
            });
          }
          append2($$anchor3, fragment_7);
        };
        if_block(node_1, ($$render) => {
          if ($$props.link === "checking") $$render(consequent);
          else if ($$props.ui.servesHome === false) $$render(consequent_1, 1);
          else if ($$props.ui.connects === false) $$render(consequent_2, 2);
          else if ($$props.link === "refused") $$render(consequent_3, 3);
          else $$render(alternate_2, -1);
        });
      }
      reset(section);
      append2($$anchor2, section);
    };
    if_block(node, ($$render) => {
      if ($$props.ui) $$render(consequent_12);
    });
  }
  append2($$anchor, fragment);
  pop();
}
delegate(["click"]);

// ../ui/src/lib/components/Pill.svelte
var root4 = from_html(`<span><!></span>`);
function Pill($$anchor, $$props) {
  let tone = prop($$props, "tone", 3, ""), plain = prop($$props, "plain", 3, false);
  var span = root4();
  let classes;
  var node = child(span);
  snippet(node, () => $$props.children ?? noop);
  reset(span);
  template_effect(() => {
    classes = set_class(span, 1, `pill ${tone() ?? ""}`, null, classes, { plain: plain() });
    set_attribute2(span, "title", $$props.title);
  });
  append2($$anchor, span);
}

// node_modules/d3-array/src/ascending.js
function ascending(a, b) {
  return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

// node_modules/d3-array/src/descending.js
function descending(a, b) {
  return a == null || b == null ? NaN : b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
}

// node_modules/d3-array/src/bisector.js
function bisector(f) {
  let compare1, compare2, delta;
  if (f.length !== 2) {
    compare1 = ascending;
    compare2 = (d, x2) => ascending(f(d), x2);
    delta = (d, x2) => f(d) - x2;
  } else {
    compare1 = f === ascending || f === descending ? f : zero;
    compare2 = f;
    delta = f;
  }
  function left(a, x2, lo = 0, hi = a.length) {
    if (lo < hi) {
      if (compare1(x2, x2) !== 0) return hi;
      do {
        const mid = lo + hi >>> 1;
        if (compare2(a[mid], x2) < 0) lo = mid + 1;
        else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }
  function right(a, x2, lo = 0, hi = a.length) {
    if (lo < hi) {
      if (compare1(x2, x2) !== 0) return hi;
      do {
        const mid = lo + hi >>> 1;
        if (compare2(a[mid], x2) <= 0) lo = mid + 1;
        else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }
  function center(a, x2, lo = 0, hi = a.length) {
    const i = left(a, x2, lo, hi - 1);
    return i > lo && delta(a[i - 1], x2) > -delta(a[i], x2) ? i - 1 : i;
  }
  return { left, center, right };
}
function zero() {
  return 0;
}

// node_modules/d3-array/src/number.js
function number(x2) {
  return x2 === null ? NaN : +x2;
}

// node_modules/d3-array/src/bisect.js
var ascendingBisect = bisector(ascending);
var bisectRight = ascendingBisect.right;
var bisectLeft = ascendingBisect.left;
var bisectCenter = bisector(number).center;
var bisect_default = bisectRight;

// node_modules/internmap/src/index.js
var InternMap = class extends Map {
  constructor(entries, key2 = keyof) {
    super();
    Object.defineProperties(this, { _intern: { value: /* @__PURE__ */ new Map() }, _key: { value: key2 } });
    if (entries != null) for (const [key3, value] of entries) this.set(key3, value);
  }
  get(key2) {
    return super.get(intern_get(this, key2));
  }
  has(key2) {
    return super.has(intern_get(this, key2));
  }
  set(key2, value) {
    return super.set(intern_set(this, key2), value);
  }
  delete(key2) {
    return super.delete(intern_delete(this, key2));
  }
};
function intern_get({ _intern, _key }, value) {
  const key2 = _key(value);
  return _intern.has(key2) ? _intern.get(key2) : value;
}
function intern_set({ _intern, _key }, value) {
  const key2 = _key(value);
  if (_intern.has(key2)) return _intern.get(key2);
  _intern.set(key2, value);
  return value;
}
function intern_delete({ _intern, _key }, value) {
  const key2 = _key(value);
  if (_intern.has(key2)) {
    value = _intern.get(key2);
    _intern.delete(key2);
  }
  return value;
}
function keyof(value) {
  return value !== null && typeof value === "object" ? value.valueOf() : value;
}

// node_modules/d3-array/src/identity.js
function identity(x2) {
  return x2;
}

// node_modules/d3-array/src/group.js
function group(values, ...keys) {
  return nest(values, identity, identity, keys);
}
function nest(values, map2, reduce, keys) {
  return (function regroup(values2, i) {
    if (i >= keys.length) return reduce(values2);
    const groups2 = new InternMap();
    const keyof2 = keys[i++];
    let index3 = -1;
    for (const value of values2) {
      const key2 = keyof2(value, ++index3, values2);
      const group2 = groups2.get(key2);
      if (group2) group2.push(value);
      else groups2.set(key2, [value]);
    }
    for (const [key2, values3] of groups2) {
      groups2.set(key2, regroup(values3, i));
    }
    return map2(groups2);
  })(values, 0);
}

// node_modules/d3-array/src/ticks.js
var e10 = Math.sqrt(50);
var e5 = Math.sqrt(10);
var e2 = Math.sqrt(2);
function tickSpec(start2, stop, count) {
  const step = (stop - start2) / Math.max(0, count), power = Math.floor(Math.log10(step)), error = step / Math.pow(10, power), factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
  let i1, i2, inc;
  if (power < 0) {
    inc = Math.pow(10, -power) / factor;
    i1 = Math.round(start2 * inc);
    i2 = Math.round(stop * inc);
    if (i1 / inc < start2) ++i1;
    if (i2 / inc > stop) --i2;
    inc = -inc;
  } else {
    inc = Math.pow(10, power) * factor;
    i1 = Math.round(start2 / inc);
    i2 = Math.round(stop / inc);
    if (i1 * inc < start2) ++i1;
    if (i2 * inc > stop) --i2;
  }
  if (i2 < i1 && 0.5 <= count && count < 2) return tickSpec(start2, stop, count * 2);
  return [i1, i2, inc];
}
function ticks(start2, stop, count) {
  stop = +stop, start2 = +start2, count = +count;
  if (!(count > 0)) return [];
  if (start2 === stop) return [start2];
  const reverse = stop < start2, [i1, i2, inc] = reverse ? tickSpec(stop, start2, count) : tickSpec(start2, stop, count);
  if (!(i2 >= i1)) return [];
  const n = i2 - i1 + 1, ticks2 = new Array(n);
  if (reverse) {
    if (inc < 0) for (let i = 0; i < n; ++i) ticks2[i] = (i2 - i) / -inc;
    else for (let i = 0; i < n; ++i) ticks2[i] = (i2 - i) * inc;
  } else {
    if (inc < 0) for (let i = 0; i < n; ++i) ticks2[i] = (i1 + i) / -inc;
    else for (let i = 0; i < n; ++i) ticks2[i] = (i1 + i) * inc;
  }
  return ticks2;
}
function tickIncrement(start2, stop, count) {
  stop = +stop, start2 = +start2, count = +count;
  return tickSpec(start2, stop, count)[2];
}
function tickStep(start2, stop, count) {
  stop = +stop, start2 = +start2, count = +count;
  const reverse = stop < start2, inc = reverse ? tickIncrement(stop, start2, count) : tickIncrement(start2, stop, count);
  return (reverse ? -1 : 1) * (inc < 0 ? 1 / -inc : inc);
}

// node_modules/d3-array/src/max.js
function max(values, valueof) {
  let max2;
  if (valueof === void 0) {
    for (const value of values) {
      if (value != null && (max2 < value || max2 === void 0 && value >= value)) {
        max2 = value;
      }
    }
  } else {
    let index3 = -1;
    for (let value of values) {
      if ((value = valueof(value, ++index3, values)) != null && (max2 < value || max2 === void 0 && value >= value)) {
        max2 = value;
      }
    }
  }
  return max2;
}

// node_modules/d3-scale/src/init.js
function initRange(domain, range) {
  switch (arguments.length) {
    case 0:
      break;
    case 1:
      this.range(domain);
      break;
    default:
      this.range(range).domain(domain);
      break;
  }
  return this;
}

// node_modules/d3-scale/src/ordinal.js
var implicit = /* @__PURE__ */ Symbol("implicit");
function ordinal() {
  var index3 = new InternMap(), domain = [], range = [], unknown = implicit;
  function scale(d) {
    let i = index3.get(d);
    if (i === void 0) {
      if (unknown !== implicit) return unknown;
      index3.set(d, i = domain.push(d) - 1);
    }
    return range[i % range.length];
  }
  scale.domain = function(_) {
    if (!arguments.length) return domain.slice();
    domain = [], index3 = new InternMap();
    for (const value of _) {
      if (index3.has(value)) continue;
      index3.set(value, domain.push(value) - 1);
    }
    return scale;
  };
  scale.range = function(_) {
    return arguments.length ? (range = Array.from(_), scale) : range.slice();
  };
  scale.unknown = function(_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };
  scale.copy = function() {
    return ordinal(domain, range).unknown(unknown);
  };
  initRange.apply(scale, arguments);
  return scale;
}

// node_modules/d3-color/src/define.js
function define_default(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}
function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key2 in definition) prototype[key2] = definition[key2];
  return prototype;
}

// node_modules/d3-color/src/color.js
function Color() {
}
var darker = 0.7;
var brighter = 1 / darker;
var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex = /^#([0-9a-f]{3,8})$/;
var reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
var reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
var reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
var reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
var reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
var reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
var named = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
define_default(Color, color, {
  copy(channels) {
    return Object.assign(new this.constructor(), this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});
function color_formatHex() {
  return this.rgb().formatHex();
}
function color_formatHex8() {
  return this.rgb().formatHex8();
}
function color_formatHsl() {
  return hslConvert(this).formatHsl();
}
function color_formatRgb() {
  return this.rgb().formatRgb();
}
function color(format2) {
  var m, l;
  format2 = (format2 + "").trim().toLowerCase();
  return (m = reHex.exec(format2)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) : l === 3 ? new Rgb(m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, (m & 15) << 4 | m & 15, 1) : l === 8 ? rgba(m >> 24 & 255, m >> 16 & 255, m >> 8 & 255, (m & 255) / 255) : l === 4 ? rgba(m >> 12 & 15 | m >> 8 & 240, m >> 8 & 15 | m >> 4 & 240, m >> 4 & 15 | m & 240, ((m & 15) << 4 | m & 15) / 255) : null) : (m = reRgbInteger.exec(format2)) ? new Rgb(m[1], m[2], m[3], 1) : (m = reRgbPercent.exec(format2)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) : (m = reRgbaInteger.exec(format2)) ? rgba(m[1], m[2], m[3], m[4]) : (m = reRgbaPercent.exec(format2)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) : (m = reHslPercent.exec(format2)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) : (m = reHslaPercent.exec(format2)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) : named.hasOwnProperty(format2) ? rgbn(named[format2]) : format2 === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
}
function rgbn(n) {
  return new Rgb(n >> 16 & 255, n >> 8 & 255, n & 255, 1);
}
function rgba(r2, g, b, a) {
  if (a <= 0) r2 = g = b = NaN;
  return new Rgb(r2, g, b, a);
}
function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb();
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}
function rgb(r2, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r2) : new Rgb(r2, g, b, opacity == null ? 1 : opacity);
}
function Rgb(r2, g, b, opacity) {
  this.r = +r2;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}
define_default(Rgb, rgb, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex,
  // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex,
  formatHex8: rgb_formatHex8,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));
function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}
function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function rgb_formatRgb() {
  const a = clampa(this.opacity);
  return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
}
function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}
function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}
function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}
function hsla(h2, s, l, a) {
  if (a <= 0) h2 = s = l = NaN;
  else if (l <= 0 || l >= 1) h2 = s = NaN;
  else if (s <= 0) h2 = NaN;
  return new Hsl(h2, s, l, a);
}
function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl();
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r2 = o.r / 255, g = o.g / 255, b = o.b / 255, min = Math.min(r2, g, b), max2 = Math.max(r2, g, b), h2 = NaN, s = max2 - min, l = (max2 + min) / 2;
  if (s) {
    if (r2 === max2) h2 = (g - b) / s + (g < b) * 6;
    else if (g === max2) h2 = (b - r2) / s + 2;
    else h2 = (r2 - g) / s + 4;
    s /= l < 0.5 ? max2 + min : 2 - max2 - min;
    h2 *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h2;
  }
  return new Hsl(h2, s, l, o.opacity);
}
function hsl(h2, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h2) : new Hsl(h2, s, l, opacity == null ? 1 : opacity);
}
function Hsl(h2, s, l, opacity) {
  this.h = +h2;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}
define_default(Hsl, hsl, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb() {
    var h2 = this.h % 360 + (this.h < 0) * 360, s = isNaN(h2) || isNaN(this.s) ? 0 : this.s, l = this.l, m2 = l + (l < 0.5 ? l : 1 - l) * s, m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h2 >= 240 ? h2 - 240 : h2 + 120, m1, m2),
      hsl2rgb(h2, m1, m2),
      hsl2rgb(h2 < 120 ? h2 + 240 : h2 - 120, m1, m2),
      this.opacity
    );
  },
  clamp() {
    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
  }
}));
function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}
function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}
function hsl2rgb(h2, m1, m2) {
  return (h2 < 60 ? m1 + (m2 - m1) * h2 / 60 : h2 < 180 ? m2 : h2 < 240 ? m1 + (m2 - m1) * (240 - h2) / 60 : m1) * 255;
}

// node_modules/d3-interpolate/src/basis.js
function basis(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1, t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
}
function basis_default(values) {
  var n = values.length - 1;
  return function(t) {
    var i = t <= 0 ? t = 0 : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n), v1 = values[i], v2 = values[i + 1], v0 = i > 0 ? values[i - 1] : 2 * v1 - v2, v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}

// node_modules/d3-interpolate/src/basisClosed.js
function basisClosed_default(values) {
  var n = values.length;
  return function(t) {
    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n), v0 = values[(i + n - 1) % n], v1 = values[i % n], v2 = values[(i + 1) % n], v3 = values[(i + 2) % n];
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}

// node_modules/d3-interpolate/src/constant.js
var constant_default = (x2) => () => x2;

// node_modules/d3-interpolate/src/color.js
function linear(a, d) {
  return function(t) {
    return a + t * d;
  };
}
function exponential(a, b, y2) {
  return a = Math.pow(a, y2), b = Math.pow(b, y2) - a, y2 = 1 / y2, function(t) {
    return Math.pow(a + t * b, y2);
  };
}
function gamma(y2) {
  return (y2 = +y2) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y2) : constant_default(isNaN(a) ? b : a);
  };
}
function nogamma(a, b) {
  var d = b - a;
  return d ? linear(a, d) : constant_default(isNaN(a) ? b : a);
}

// node_modules/d3-interpolate/src/rgb.js
var rgb_default = (function rgbGamma(y2) {
  var color2 = gamma(y2);
  function rgb2(start2, end) {
    var r2 = color2((start2 = rgb(start2)).r, (end = rgb(end)).r), g = color2(start2.g, end.g), b = color2(start2.b, end.b), opacity = nogamma(start2.opacity, end.opacity);
    return function(t) {
      start2.r = r2(t);
      start2.g = g(t);
      start2.b = b(t);
      start2.opacity = opacity(t);
      return start2 + "";
    };
  }
  rgb2.gamma = rgbGamma;
  return rgb2;
})(1);
function rgbSpline(spline) {
  return function(colors) {
    var n = colors.length, r2 = new Array(n), g = new Array(n), b = new Array(n), i, color2;
    for (i = 0; i < n; ++i) {
      color2 = rgb(colors[i]);
      r2[i] = color2.r || 0;
      g[i] = color2.g || 0;
      b[i] = color2.b || 0;
    }
    r2 = spline(r2);
    g = spline(g);
    b = spline(b);
    color2.opacity = 1;
    return function(t) {
      color2.r = r2(t);
      color2.g = g(t);
      color2.b = b(t);
      return color2 + "";
    };
  };
}
var rgbBasis = rgbSpline(basis_default);
var rgbBasisClosed = rgbSpline(basisClosed_default);

// node_modules/d3-interpolate/src/numberArray.js
function numberArray_default(a, b) {
  if (!b) b = [];
  var n = a ? Math.min(b.length, a.length) : 0, c = b.slice(), i;
  return function(t) {
    for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
    return c;
  };
}
function isNumberArray(x2) {
  return ArrayBuffer.isView(x2) && !(x2 instanceof DataView);
}

// node_modules/d3-interpolate/src/array.js
function genericArray(a, b) {
  var nb = b ? b.length : 0, na = a ? Math.min(nb, a.length) : 0, x2 = new Array(na), c = new Array(nb), i;
  for (i = 0; i < na; ++i) x2[i] = value_default(a[i], b[i]);
  for (; i < nb; ++i) c[i] = b[i];
  return function(t) {
    for (i = 0; i < na; ++i) c[i] = x2[i](t);
    return c;
  };
}

// node_modules/d3-interpolate/src/date.js
function date_default(a, b) {
  var d = /* @__PURE__ */ new Date();
  return a = +a, b = +b, function(t) {
    return d.setTime(a * (1 - t) + b * t), d;
  };
}

// node_modules/d3-interpolate/src/number.js
function number_default(a, b) {
  return a = +a, b = +b, function(t) {
    return a * (1 - t) + b * t;
  };
}

// node_modules/d3-interpolate/src/object.js
function object_default(a, b) {
  var i = {}, c = {}, k;
  if (a === null || typeof a !== "object") a = {};
  if (b === null || typeof b !== "object") b = {};
  for (k in b) {
    if (k in a) {
      i[k] = value_default(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }
  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
}

// node_modules/d3-interpolate/src/string.js
var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");
function zero2(b) {
  return function() {
    return b;
  };
}
function one(b) {
  return function(t) {
    return b(t) + "";
  };
}
function string_default(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i = -1, s = [], q = [];
  a = a + "", b = b + "";
  while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) {
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs;
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      if (s[i]) s[i] += bm;
      else s[++i] = bm;
    } else {
      s[++i] = null;
      q.push({ i, x: number_default(am, bm) });
    }
    bi = reB.lastIndex;
  }
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs;
    else s[++i] = bs;
  }
  return s.length < 2 ? q[0] ? one(q[0].x) : zero2(b) : (b = q.length, function(t) {
    for (var i2 = 0, o; i2 < b; ++i2) s[(o = q[i2]).i] = o.x(t);
    return s.join("");
  });
}

// node_modules/d3-interpolate/src/value.js
function value_default(a, b) {
  var t = typeof b, c;
  return b == null || t === "boolean" ? constant_default(b) : (t === "number" ? number_default : t === "string" ? (c = color(b)) ? (b = c, rgb_default) : string_default : b instanceof color ? rgb_default : b instanceof Date ? date_default : isNumberArray(b) ? numberArray_default : Array.isArray(b) ? genericArray : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object_default : number_default)(a, b);
}

// node_modules/d3-interpolate/src/round.js
function round_default(a, b) {
  return a = +a, b = +b, function(t) {
    return Math.round(a * (1 - t) + b * t);
  };
}

// node_modules/d3-scale/src/constant.js
function constants(x2) {
  return function() {
    return x2;
  };
}

// node_modules/d3-scale/src/number.js
function number2(x2) {
  return +x2;
}

// node_modules/d3-scale/src/continuous.js
var unit = [0, 1];
function identity2(x2) {
  return x2;
}
function normalize(a, b) {
  return (b -= a = +a) ? function(x2) {
    return (x2 - a) / b;
  } : constants(isNaN(b) ? NaN : 0.5);
}
function clamper(a, b) {
  var t;
  if (a > b) t = a, a = b, b = t;
  return function(x2) {
    return Math.max(a, Math.min(b, x2));
  };
}
function bimap(domain, range, interpolate) {
  var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
  if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
  else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
  return function(x2) {
    return r0(d0(x2));
  };
}
function polymap(domain, range, interpolate) {
  var j = Math.min(domain.length, range.length) - 1, d = new Array(j), r2 = new Array(j), i = -1;
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }
  while (++i < j) {
    d[i] = normalize(domain[i], domain[i + 1]);
    r2[i] = interpolate(range[i], range[i + 1]);
  }
  return function(x2) {
    var i2 = bisect_default(domain, x2, 1, j) - 1;
    return r2[i2](d[i2](x2));
  };
}
function copy(source2, target) {
  return target.domain(source2.domain()).range(source2.range()).interpolate(source2.interpolate()).clamp(source2.clamp()).unknown(source2.unknown());
}
function transformer() {
  var domain = unit, range = unit, interpolate = value_default, transform, untransform, unknown, clamp = identity2, piecewise, output, input;
  function rescale() {
    var n = Math.min(domain.length, range.length);
    if (clamp !== identity2) clamp = clamper(domain[0], domain[n - 1]);
    piecewise = n > 2 ? polymap : bimap;
    output = input = null;
    return scale;
  }
  function scale(x2) {
    return x2 == null || isNaN(x2 = +x2) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x2)));
  }
  scale.invert = function(y2) {
    return clamp(untransform((input || (input = piecewise(range, domain.map(transform), number_default)))(y2)));
  };
  scale.domain = function(_) {
    return arguments.length ? (domain = Array.from(_, number2), rescale()) : domain.slice();
  };
  scale.range = function(_) {
    return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
  };
  scale.rangeRound = function(_) {
    return range = Array.from(_), interpolate = round_default, rescale();
  };
  scale.clamp = function(_) {
    return arguments.length ? (clamp = _ ? true : identity2, rescale()) : clamp !== identity2;
  };
  scale.interpolate = function(_) {
    return arguments.length ? (interpolate = _, rescale()) : interpolate;
  };
  scale.unknown = function(_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };
  return function(t, u) {
    transform = t, untransform = u;
    return rescale();
  };
}
function continuous() {
  return transformer()(identity2, identity2);
}

// node_modules/d3-format/src/formatDecimal.js
function formatDecimal_default(x2) {
  return Math.abs(x2 = Math.round(x2)) >= 1e21 ? x2.toLocaleString("en").replace(/,/g, "") : x2.toString(10);
}
function formatDecimalParts(x2, p) {
  if (!isFinite(x2) || x2 === 0) return null;
  var i = (x2 = p ? x2.toExponential(p - 1) : x2.toExponential()).indexOf("e"), coefficient = x2.slice(0, i);
  return [
    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
    +x2.slice(i + 1)
  ];
}

// node_modules/d3-format/src/exponent.js
function exponent_default(x2) {
  return x2 = formatDecimalParts(Math.abs(x2)), x2 ? x2[1] : NaN;
}

// node_modules/d3-format/src/formatGroup.js
function formatGroup_default(grouping, thousands) {
  return function(value, width) {
    var i = value.length, t = [], j = 0, g = grouping[0], length = 0;
    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }
    return t.reverse().join(thousands);
  };
}

// node_modules/d3-format/src/formatNumerals.js
function formatNumerals_default(numerals) {
  return function(value) {
    return value.replace(/[0-9]/g, function(i) {
      return numerals[+i];
    });
  };
}

// node_modules/d3-format/src/formatSpecifier.js
var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
function formatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
  var match;
  return new FormatSpecifier({
    fill: match[1],
    align: match[2],
    sign: match[3],
    symbol: match[4],
    zero: match[5],
    width: match[6],
    comma: match[7],
    precision: match[8] && match[8].slice(1),
    trim: match[9],
    type: match[10]
  });
}
formatSpecifier.prototype = FormatSpecifier.prototype;
function FormatSpecifier(specifier) {
  this.fill = specifier.fill === void 0 ? " " : specifier.fill + "";
  this.align = specifier.align === void 0 ? ">" : specifier.align + "";
  this.sign = specifier.sign === void 0 ? "-" : specifier.sign + "";
  this.symbol = specifier.symbol === void 0 ? "" : specifier.symbol + "";
  this.zero = !!specifier.zero;
  this.width = specifier.width === void 0 ? void 0 : +specifier.width;
  this.comma = !!specifier.comma;
  this.precision = specifier.precision === void 0 ? void 0 : +specifier.precision;
  this.trim = !!specifier.trim;
  this.type = specifier.type === void 0 ? "" : specifier.type + "";
}
FormatSpecifier.prototype.toString = function() {
  return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width === void 0 ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision === void 0 ? "" : "." + Math.max(0, this.precision | 0)) + (this.trim ? "~" : "") + this.type;
};

// node_modules/d3-format/src/formatTrim.js
function formatTrim_default(s) {
  out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (s[i]) {
      case ".":
        i0 = i1 = i;
        break;
      case "0":
        if (i0 === 0) i0 = i;
        i1 = i;
        break;
      default:
        if (!+s[i]) break out;
        if (i0 > 0) i0 = 0;
        break;
    }
  }
  return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
}

// node_modules/d3-format/src/formatPrefixAuto.js
var prefixExponent;
function formatPrefixAuto_default(x2, p) {
  var d = formatDecimalParts(x2, p);
  if (!d) return prefixExponent = void 0, x2.toPrecision(p);
  var coefficient = d[0], exponent = d[1], i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1, n = coefficient.length;
  return i === n ? coefficient : i > n ? coefficient + new Array(i - n + 1).join("0") : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i) : "0." + new Array(1 - i).join("0") + formatDecimalParts(x2, Math.max(0, p + i - 1))[0];
}

// node_modules/d3-format/src/formatRounded.js
function formatRounded_default(x2, p) {
  var d = formatDecimalParts(x2, p);
  if (!d) return x2 + "";
  var coefficient = d[0], exponent = d[1];
  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1) : coefficient + new Array(exponent - coefficient.length + 2).join("0");
}

// node_modules/d3-format/src/formatTypes.js
var formatTypes_default = {
  "%": (x2, p) => (x2 * 100).toFixed(p),
  "b": (x2) => Math.round(x2).toString(2),
  "c": (x2) => x2 + "",
  "d": formatDecimal_default,
  "e": (x2, p) => x2.toExponential(p),
  "f": (x2, p) => x2.toFixed(p),
  "g": (x2, p) => x2.toPrecision(p),
  "o": (x2) => Math.round(x2).toString(8),
  "p": (x2, p) => formatRounded_default(x2 * 100, p),
  "r": formatRounded_default,
  "s": formatPrefixAuto_default,
  "X": (x2) => Math.round(x2).toString(16).toUpperCase(),
  "x": (x2) => Math.round(x2).toString(16)
};

// node_modules/d3-format/src/identity.js
function identity_default(x2) {
  return x2;
}

// node_modules/d3-format/src/locale.js
var map = Array.prototype.map;
var prefixes = ["y", "z", "a", "f", "p", "n", "\xB5", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];
function locale_default(locale2) {
  var group2 = locale2.grouping === void 0 || locale2.thousands === void 0 ? identity_default : formatGroup_default(map.call(locale2.grouping, Number), locale2.thousands + ""), currencyPrefix = locale2.currency === void 0 ? "" : locale2.currency[0] + "", currencySuffix = locale2.currency === void 0 ? "" : locale2.currency[1] + "", decimal = locale2.decimal === void 0 ? "." : locale2.decimal + "", numerals = locale2.numerals === void 0 ? identity_default : formatNumerals_default(map.call(locale2.numerals, String)), percent = locale2.percent === void 0 ? "%" : locale2.percent + "", minus = locale2.minus === void 0 ? "\u2212" : locale2.minus + "", nan = locale2.nan === void 0 ? "NaN" : locale2.nan + "";
  function newFormat(specifier, options) {
    specifier = formatSpecifier(specifier);
    var fill = specifier.fill, align = specifier.align, sign2 = specifier.sign, symbol = specifier.symbol, zero3 = specifier.zero, width = specifier.width, comma = specifier.comma, precision = specifier.precision, trim = specifier.trim, type = specifier.type;
    if (type === "n") comma = true, type = "g";
    else if (!formatTypes_default[type]) precision === void 0 && (precision = 12), trim = true, type = "g";
    if (zero3 || fill === "0" && align === "=") zero3 = true, fill = "0", align = "=";
    var prefix = (options && options.prefix !== void 0 ? options.prefix : "") + (symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : ""), suffix = (symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "") + (options && options.suffix !== void 0 ? options.suffix : "");
    var formatType = formatTypes_default[type], maybeSuffix = /[defgprs%]/.test(type);
    precision = precision === void 0 ? 6 : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));
    function format2(value) {
      var valuePrefix = prefix, valueSuffix = suffix, i, n, c;
      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;
        var valueNegative = value < 0 || 1 / value < 0;
        value = isNaN(value) ? nan : formatType(Math.abs(value), precision);
        if (trim) value = formatTrim_default(value);
        if (valueNegative && +value === 0 && sign2 !== "+") valueNegative = false;
        valuePrefix = (valueNegative ? sign2 === "(" ? sign2 : minus : sign2 === "-" || sign2 === "(" ? "" : sign2) + valuePrefix;
        valueSuffix = (type === "s" && !isNaN(value) && prefixExponent !== void 0 ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign2 === "(" ? ")" : "");
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }
      if (comma && !zero3) value = group2(value, Infinity);
      var length = valuePrefix.length + value.length + valueSuffix.length, padding = length < width ? new Array(width - length + 1).join(fill) : "";
      if (comma && zero3) value = group2(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";
      switch (align) {
        case "<":
          value = valuePrefix + value + valueSuffix + padding;
          break;
        case "=":
          value = valuePrefix + padding + value + valueSuffix;
          break;
        case "^":
          value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
          break;
        default:
          value = padding + valuePrefix + value + valueSuffix;
          break;
      }
      return numerals(value);
    }
    format2.toString = function() {
      return specifier + "";
    };
    return format2;
  }
  function formatPrefix2(specifier, value) {
    var e = Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3, k = Math.pow(10, -e), f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier), { suffix: prefixes[8 + e / 3] });
    return function(value2) {
      return f(k * value2);
    };
  }
  return {
    format: newFormat,
    formatPrefix: formatPrefix2
  };
}

// node_modules/d3-format/src/defaultLocale.js
var locale;
var format;
var formatPrefix;
defaultLocale({
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});
function defaultLocale(definition) {
  locale = locale_default(definition);
  format = locale.format;
  formatPrefix = locale.formatPrefix;
  return locale;
}

// node_modules/d3-format/src/precisionFixed.js
function precisionFixed_default(step) {
  return Math.max(0, -exponent_default(Math.abs(step)));
}

// node_modules/d3-format/src/precisionPrefix.js
function precisionPrefix_default(step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3 - exponent_default(Math.abs(step)));
}

// node_modules/d3-format/src/precisionRound.js
function precisionRound_default(step, max2) {
  step = Math.abs(step), max2 = Math.abs(max2) - step;
  return Math.max(0, exponent_default(max2) - exponent_default(step)) + 1;
}

// node_modules/d3-scale/src/tickFormat.js
function tickFormat(start2, stop, count, specifier) {
  var step = tickStep(start2, stop, count), precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s": {
      var value = Math.max(Math.abs(start2), Math.abs(stop));
      if (specifier.precision == null && !isNaN(precision = precisionPrefix_default(step, value))) specifier.precision = precision;
      return formatPrefix(specifier, value);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (specifier.precision == null && !isNaN(precision = precisionRound_default(step, Math.max(Math.abs(start2), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
      break;
    }
    case "f":
    case "%": {
      if (specifier.precision == null && !isNaN(precision = precisionFixed_default(step))) specifier.precision = precision - (specifier.type === "%") * 2;
      break;
    }
  }
  return format(specifier);
}

// node_modules/d3-scale/src/linear.js
function linearish(scale) {
  var domain = scale.domain;
  scale.ticks = function(count) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
  };
  scale.tickFormat = function(count, specifier) {
    var d = domain();
    return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
  };
  scale.nice = function(count) {
    if (count == null) count = 10;
    var d = domain();
    var i0 = 0;
    var i1 = d.length - 1;
    var start2 = d[i0];
    var stop = d[i1];
    var prestep;
    var step;
    var maxIter = 10;
    if (stop < start2) {
      step = start2, start2 = stop, stop = step;
      step = i0, i0 = i1, i1 = step;
    }
    while (maxIter-- > 0) {
      step = tickIncrement(start2, stop, count);
      if (step === prestep) {
        d[i0] = start2;
        d[i1] = stop;
        return domain(d);
      } else if (step > 0) {
        start2 = Math.floor(start2 / step) * step;
        stop = Math.ceil(stop / step) * step;
      } else if (step < 0) {
        start2 = Math.ceil(start2 * step) / step;
        stop = Math.floor(stop * step) / step;
      } else {
        break;
      }
      prestep = step;
    }
    return scale;
  };
  return scale;
}
function linear2() {
  var scale = continuous();
  scale.copy = function() {
    return copy(scale, linear2());
  };
  initRange.apply(scale, arguments);
  return linearish(scale);
}

// node_modules/d3-shape/src/constant.js
function constant_default2(x2) {
  return function constant() {
    return x2;
  };
}

// node_modules/d3-path/src/path.js
var pi = Math.PI;
var tau = 2 * pi;
var epsilon = 1e-6;
var tauEpsilon = tau - epsilon;
function append3(strings) {
  this._ += strings[0];
  for (let i = 1, n = strings.length; i < n; ++i) {
    this._ += arguments[i] + strings[i];
  }
}
function appendRound(digits) {
  let d = Math.floor(digits);
  if (!(d >= 0)) throw new Error(`invalid digits: ${digits}`);
  if (d > 15) return append3;
  const k = 10 ** d;
  return function(strings) {
    this._ += strings[0];
    for (let i = 1, n = strings.length; i < n; ++i) {
      this._ += Math.round(arguments[i] * k) / k + strings[i];
    }
  };
}
var Path = class {
  constructor(digits) {
    this._x0 = this._y0 = // start of current subpath
    this._x1 = this._y1 = null;
    this._ = "";
    this._append = digits == null ? append3 : appendRound(digits);
  }
  moveTo(x2, y2) {
    this._append`M${this._x0 = this._x1 = +x2},${this._y0 = this._y1 = +y2}`;
  }
  closePath() {
    if (this._x1 !== null) {
      this._x1 = this._x0, this._y1 = this._y0;
      this._append`Z`;
    }
  }
  lineTo(x2, y2) {
    this._append`L${this._x1 = +x2},${this._y1 = +y2}`;
  }
  quadraticCurveTo(x1, y1, x2, y2) {
    this._append`Q${+x1},${+y1},${this._x1 = +x2},${this._y1 = +y2}`;
  }
  bezierCurveTo(x1, y1, x2, y2, x3, y3) {
    this._append`C${+x1},${+y1},${+x2},${+y2},${this._x1 = +x3},${this._y1 = +y3}`;
  }
  arcTo(x1, y1, x2, y2, r2) {
    x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r2 = +r2;
    if (r2 < 0) throw new Error(`negative radius: ${r2}`);
    let x0 = this._x1, y0 = this._y1, x21 = x2 - x1, y21 = y2 - y1, x01 = x0 - x1, y01 = y0 - y1, l01_2 = x01 * x01 + y01 * y01;
    if (this._x1 === null) {
      this._append`M${this._x1 = x1},${this._y1 = y1}`;
    } else if (!(l01_2 > epsilon)) ;
    else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r2) {
      this._append`L${this._x1 = x1},${this._y1 = y1}`;
    } else {
      let x20 = x2 - x0, y20 = y2 - y0, l21_2 = x21 * x21 + y21 * y21, l20_2 = x20 * x20 + y20 * y20, l21 = Math.sqrt(l21_2), l01 = Math.sqrt(l01_2), l = r2 * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2), t01 = l / l01, t21 = l / l21;
      if (Math.abs(t01 - 1) > epsilon) {
        this._append`L${x1 + t01 * x01},${y1 + t01 * y01}`;
      }
      this._append`A${r2},${r2},0,0,${+(y01 * x20 > x01 * y20)},${this._x1 = x1 + t21 * x21},${this._y1 = y1 + t21 * y21}`;
    }
  }
  arc(x2, y2, r2, a0, a1, ccw) {
    x2 = +x2, y2 = +y2, r2 = +r2, ccw = !!ccw;
    if (r2 < 0) throw new Error(`negative radius: ${r2}`);
    let dx = r2 * Math.cos(a0), dy = r2 * Math.sin(a0), x0 = x2 + dx, y0 = y2 + dy, cw = 1 ^ ccw, da = ccw ? a0 - a1 : a1 - a0;
    if (this._x1 === null) {
      this._append`M${x0},${y0}`;
    } else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
      this._append`L${x0},${y0}`;
    }
    if (!r2) return;
    if (da < 0) da = da % tau + tau;
    if (da > tauEpsilon) {
      this._append`A${r2},${r2},0,1,${cw},${x2 - dx},${y2 - dy}A${r2},${r2},0,1,${cw},${this._x1 = x0},${this._y1 = y0}`;
    } else if (da > epsilon) {
      this._append`A${r2},${r2},0,${+(da >= pi)},${cw},${this._x1 = x2 + r2 * Math.cos(a1)},${this._y1 = y2 + r2 * Math.sin(a1)}`;
    }
  }
  rect(x2, y2, w, h2) {
    this._append`M${this._x0 = this._x1 = +x2},${this._y0 = this._y1 = +y2}h${w = +w}v${+h2}h${-w}Z`;
  }
  toString() {
    return this._;
  }
};
function path() {
  return new Path();
}
path.prototype = Path.prototype;

// node_modules/d3-shape/src/path.js
function withPath(shape) {
  let digits = 3;
  shape.digits = function(_) {
    if (!arguments.length) return digits;
    if (_ == null) {
      digits = null;
    } else {
      const d = Math.floor(_);
      if (!(d >= 0)) throw new RangeError(`invalid digits: ${_}`);
      digits = d;
    }
    return shape;
  };
  return () => new Path(digits);
}

// node_modules/d3-shape/src/array.js
var slice = Array.prototype.slice;
function array_default(x2) {
  return typeof x2 === "object" && "length" in x2 ? x2 : Array.from(x2);
}

// node_modules/d3-shape/src/curve/linear.js
function Linear(context) {
  this._context = context;
}
Linear.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    x2 = +x2, y2 = +y2;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x2, y2) : this._context.moveTo(x2, y2);
        break;
      case 1:
        this._point = 2;
      // falls through
      default:
        this._context.lineTo(x2, y2);
        break;
    }
  }
};
function linear_default(context) {
  return new Linear(context);
}

// node_modules/d3-shape/src/point.js
function x(p) {
  return p[0];
}
function y(p) {
  return p[1];
}

// node_modules/d3-shape/src/line.js
function line_default(x2, y2) {
  var defined = constant_default2(true), context = null, curve = linear_default, output = null, path2 = withPath(line);
  x2 = typeof x2 === "function" ? x2 : x2 === void 0 ? x : constant_default2(x2);
  y2 = typeof y2 === "function" ? y2 : y2 === void 0 ? y : constant_default2(y2);
  function line(data) {
    var i, n = (data = array_default(data)).length, d, defined0 = false, buffer;
    if (context == null) output = curve(buffer = path2());
    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) output.lineStart();
        else output.lineEnd();
      }
      if (defined0) output.point(+x2(d, i, data), +y2(d, i, data));
    }
    if (buffer) return output = null, buffer + "" || null;
  }
  line.x = function(_) {
    return arguments.length ? (x2 = typeof _ === "function" ? _ : constant_default2(+_), line) : x2;
  };
  line.y = function(_) {
    return arguments.length ? (y2 = typeof _ === "function" ? _ : constant_default2(+_), line) : y2;
  };
  line.defined = function(_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant_default2(!!_), line) : defined;
  };
  line.curve = function(_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
  };
  line.context = function(_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
  };
  return line;
}

// node_modules/d3-shape/src/curve/monotone.js
function sign(x2) {
  return x2 < 0 ? -1 : 1;
}
function slope3(that, x2, y2) {
  var h0 = that._x1 - that._x0, h1 = x2 - that._x1, s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0), s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0), p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}
function slope2(that, t) {
  var h2 = that._x1 - that._x0;
  return h2 ? (3 * (that._y1 - that._y0) / h2 - t) / 2 : t;
}
function point(that, t0, t1) {
  var x0 = that._x0, y0 = that._y0, x1 = that._x1, y1 = that._y1, dx = (x1 - x0) / 3;
  that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
}
function MonotoneX(context) {
  this._context = context;
}
MonotoneX.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x1, this._y1);
        break;
      case 3:
        point(this, this._t0, slope2(this, this._t0));
        break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x2, y2) {
    var t1 = NaN;
    x2 = +x2, y2 = +y2;
    if (x2 === this._x1 && y2 === this._y1) return;
    switch (this._point) {
      case 0:
        this._point = 1;
        this._line ? this._context.lineTo(x2, y2) : this._context.moveTo(x2, y2);
        break;
      case 1:
        this._point = 2;
        break;
      case 2:
        this._point = 3;
        point(this, slope2(this, t1 = slope3(this, x2, y2)), t1);
        break;
      default:
        point(this, this._t0, t1 = slope3(this, x2, y2));
        break;
    }
    this._x0 = this._x1, this._x1 = x2;
    this._y0 = this._y1, this._y1 = y2;
    this._t0 = t1;
  }
};
function MonotoneY(context) {
  this._context = new ReflectContext(context);
}
(MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function(x2, y2) {
  MonotoneX.prototype.point.call(this, y2, x2);
};
function ReflectContext(context) {
  this._context = context;
}
ReflectContext.prototype = {
  moveTo: function(x2, y2) {
    this._context.moveTo(y2, x2);
  },
  closePath: function() {
    this._context.closePath();
  },
  lineTo: function(x2, y2) {
    this._context.lineTo(y2, x2);
  },
  bezierCurveTo: function(x1, y1, x2, y2, x3, y3) {
    this._context.bezierCurveTo(y1, x1, y2, x2, y3, x3);
  }
};
function monotoneX(context) {
  return new MonotoneX(context);
}

// ../ui/src/lib/components/Trend.svelte
var root5 = from_svg(`<circle r="2.5"></circle>`);
var root_16 = from_svg(`<svg role="img" aria-label="Score over time"><line x1="2" stroke="var(--border)" stroke-width="1"></line><path fill="none" stroke="var(--text)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path><!></svg>`);
var root_22 = from_html(`<span class="small muted">one reading</span>`);
var root_32 = from_html(`<span class="small muted">not yet encountered</span>`);
function Trend($$anchor, $$props) {
  push($$props, true);
  let history2 = prop($$props, "history", 19, () => []), width = prop($$props, "width", 3, 220), height = prop($$props, "height", 3, 44);
  const points = user_derived(() => history2().filter((d) => typeof d.score === "number"));
  const path2 = user_derived(() => {
    if (get(points).length < 2) return "";
    const x2 = linear2().domain([0, get(points).length - 1]).range([2, width() - 2]);
    const y2 = linear2().domain([0, 1]).range([height() - 3, 3]);
    return line_default().x((_, i) => x2(i)).y((d) => y2(d.score)).curve(monotoneX)(get(points)) ?? "";
  });
  const last = user_derived(() => get(points).at(-1));
  var fragment = comment();
  var node = first_child(fragment);
  {
    var consequent_1 = ($$anchor2) => {
      var svg = root_16();
      var line = child(svg);
      var path_1 = sibling(line);
      var node_1 = sibling(path_1);
      {
        var consequent = ($$anchor3) => {
          var circle = root5();
          template_effect(() => {
            set_attribute2(circle, "cx", width() - 2);
            set_attribute2(circle, "cy", height() - 3 - get(last).score * (height() - 6));
            set_attribute2(circle, "fill", get(last).score >= 0.999 ? "var(--ok)" : "var(--warn)");
          });
          append2($$anchor3, circle);
        };
        if_block(node_1, ($$render) => {
          if (get(last)) $$render(consequent);
        });
      }
      reset(svg);
      template_effect(() => {
        set_attribute2(svg, "width", width());
        set_attribute2(svg, "height", height());
        set_attribute2(line, "x2", width() - 2);
        set_attribute2(line, "y1", height() - 3);
        set_attribute2(line, "y2", height() - 3);
        set_attribute2(path_1, "d", get(path2));
      });
      append2($$anchor2, svg);
    };
    var consequent_2 = ($$anchor2) => {
      var span = root_22();
      append2($$anchor2, span);
    };
    var alternate = ($$anchor2) => {
      var span_1 = root_32();
      append2($$anchor2, span_1);
    };
    if_block(node, ($$render) => {
      if (get(points).length >= 2) $$render(consequent_1);
      else if (get(points).length === 1) $$render(consequent_2, 1);
      else $$render(alternate, -1);
    });
  }
  append2($$anchor, fragment);
  pop();
}

// ../ui/src/lib/components/JobCard.svelte
var root6 = from_html(`<div class="stack" style="gap:8px;margin-top:10px"><div><span></span></div> <div class="spread"><span class="small muted"> </span> <button class="small"><!> </button></div></div>`);
var root_17 = from_html(`<p class="small" style="margin-top:4px"> </p>`);
var root_23 = from_html(`<p> </p> <!>`, 1);
var root_33 = from_html(`<div style="margin-top:10px"><!></div>`);
var root_42 = from_html(`<p class="small" style="color:var(--bad);margin-top:6px"> </p>`);
var root_52 = from_html(`<div class="job svelte-xh2zpq"><div class="spread"><div class="row grow"><!> <a class="title svelte-xh2zpq"> </a></div> <span class="small faint num"> </span></div> <!></div>`);
var $$css = {
  hash: "svelte-xh2zpq",
  code: ".job.svelte-xh2zpq {padding:12px 16px;}.title.svelte-xh2zpq {color:var(--text);font-weight:500;overflow-wrap:anywhere;}"
};
function JobCard($$anchor, $$props) {
  push($$props, true);
  append_styles($$anchor, $$css);
  let compact = prop($$props, "compact", 3, false);
  let cancelling = state(false);
  let now = state(proxy(Date.now()));
  user_effect(() => {
    if ($$props.job.status !== "running") return;
    const timer2 = setInterval(
      () => {
        set(now, Date.now(), true);
      },
      1e3
    );
    return () => clearInterval(timer2);
  });
  const meta = user_derived(() => JOB[$$props.job.status] ?? { label: $$props.job.status, tone: "" });
  const fraction = user_derived(() => $$props.job.progress?.total ? Math.min(1, ($$props.job.progress.done ?? 0) / $$props.job.progress.total) : null);
  async function cancel() {
    set(cancelling, true);
    try {
      await api(`/api/jobs/${$$props.job.id}/cancel`, { method: "POST" });
      await refreshJobs();
    } finally {
      set(cancelling, false);
    }
  }
  var div = root_52();
  var div_1 = child(div);
  var div_2 = child(div_1);
  var node = child(div_2);
  Pill(node, {
    get tone() {
      return get(meta).tone;
    },
    children: ($$anchor2, $$slotProps) => {
      next();
      var text2 = text();
      template_effect(() => set_text(text2, get(meta).label));
      append2($$anchor2, text2);
    },
    $$slots: { default: true }
  });
  var a = sibling(node, 2);
  var text_1 = only_child(a, true);
  reset(div_2);
  var span = sibling(div_2, 2);
  var text_2 = only_child(span, true);
  reset(div_1);
  var node_1 = sibling(div_1, 2);
  {
    var consequent = ($$anchor2) => {
      var div_3 = root6();
      var div_4 = child(div_3);
      let classes;
      var span_1 = only_child(div_4);
      var div_5 = sibling(div_4, 2);
      var span_2 = child(div_5);
      var text_3 = only_child(span_2, true);
      var button = sibling(span_2, 2);
      var node_2 = child(button);
      Icon(node_2, { name: "square", size: 12 });
      var text_4 = sibling(node_2);
      reset(button);
      reset(div_5);
      reset(div_3);
      template_effect(
        ($0) => {
          classes = set_class(div_4, 1, "progress", null, classes, { indeterminate: get(fraction) === null });
          set_style(span_1, $0);
          set_text(text_3, $$props.job.progress?.message ?? "Working");
          button.disabled = get(cancelling);
          set_text(text_4, ` ${get(cancelling) ? "Cancelling\u2026" : "Cancel"}`);
        },
        [
          () => get(fraction) === null ? "" : `width:${Math.max(4, get(fraction) * 100)}%`
        ]
      );
      delegated("click", button, cancel);
      append2($$anchor2, div_3);
    };
    var consequent_2 = ($$anchor2) => {
      var div_6 = root_33();
      var node_3 = child(div_6);
      {
        let $0 = user_derived(() => $$props.job.status === "cancelled" ? "" : "bad");
        Notice(node_3, {
          get tone() {
            return get($0);
          },
          children: ($$anchor3, $$slotProps) => {
            var fragment_1 = root_23();
            var p = first_child(fragment_1);
            var text_5 = only_child(p, true);
            var node_4 = sibling(p, 2);
            {
              var consequent_1 = ($$anchor4) => {
                var p_1 = root_17();
                var text_6 = only_child(p_1, true);
                template_effect(() => set_text(text_6, $$props.job.hint));
                append2($$anchor4, p_1);
              };
              if_block(node_4, ($$render) => {
                if ($$props.job.hint) $$render(consequent_1);
              });
            }
            template_effect(() => set_text(text_5, $$props.job.error));
            append2($$anchor3, fragment_1);
          },
          $$slots: { default: true }
        });
      }
      reset(div_6);
      append2($$anchor2, div_6);
    };
    var consequent_3 = ($$anchor2) => {
      var p_2 = root_42();
      var text_7 = only_child(p_2, true);
      template_effect(() => set_text(text_7, $$props.job.error));
      append2($$anchor2, p_2);
    };
    if_block(node_1, ($$render) => {
      if ($$props.job.status === "running") $$render(consequent);
      else if ($$props.job.error && !compact()) $$render(consequent_2, 1);
      else if ($$props.job.error) $$render(consequent_3, 2);
    });
  }
  reset(div);
  template_effect(
    ($0) => {
      set_attribute2(a, "href", `#/runs?job=${$$props.job.id ?? ""}`);
      set_text(text_1, $$props.job.title);
      set_attribute2(span, "title", $$props.job.started_at);
      set_text(text_2, $0);
    },
    [
      () => $$props.job.status === "running" ? duration($$props.job.started_at, null, get(now)) : `${ago($$props.job.finished_at)} \xB7 took ${duration($$props.job.started_at, $$props.job.finished_at)}`
    ]
  );
  append2($$anchor, div);
  pop();
}
delegate(["click"]);

// ../ui/src/routes/+page.svelte
var root7 = from_html(`<p class="empty small">Loading\u2026</p>`);
var root_18 = from_html(`<div class="empty"><strong>No proposals to review.</strong> Run <code>/improve propose</code> or <code>/improve review</code> in Claude Code. Each writes a proposal to <code>.harness/proposals/</code>, and it shows up here.</div>`);
var root_24 = from_html(`<li><a class="list-row"><span class="title"> </span> <!> <!> <span class="meta"> </span> <!></a></li>`);
var root_34 = from_html(`<ul class="list"></ul>`);
var root_43 = from_html(`<div class="panel-body" style="border-top:1px solid var(--border)"><a href="#/findings" class="row"><!> </a></div>`);
var root_53 = from_html(`<p class="empty small">No evaluations, drafts or background reviews have run from this page yet.</p>`);
var root_62 = from_html(`<li><!></li>`);
var root_72 = from_html(`<li> </li>`);
var root_82 = from_html(`<div><div class="section-label">Why a review is due</div> <ul class="small"></ul></div>`);
var root_92 = from_html(`<div><div class="section-label">Most repeated correction</div> <p class="small"> <code> </code></p></div>`);
var root_102 = from_html(`<dl class="kv small"><dt>Sessions</dt><dd class="num"> </dd> <dt>Tool calls</dt><dd class="num"> </dd> <dt>Tool failures</dt><dd class="num"> </dd> <dt>Corrections</dt><dd class="num"> </dd> <dt>Last review</dt><dd> </dd></dl>`);
var root_112 = from_html(`<p class="small muted">No hook observations were found for this repository. They appear once the plugin's hooks have run in a
              Claude Code session here.</p>`);
var root_123 = from_html(`<span style="color:var(--warn)"> </span>`);
var root_132 = from_html(` <!>`, 1);
var root_142 = from_html(`<p class="empty small">No objectives declared. Add them to <code>.harness/objectives.yaml</code>.</p>`);
var root_152 = from_html(`<!> <span class="num"> </span>`, 1);
var root_162 = from_html(`<li><a class="list-row"><span class="title"> </span> <!></a></li>`);
var root_172 = from_html(`<div class="page-head"><div><h1>Overview</h1> <p> </p></div></div> <div class="grid cols-main"><div class="stack" style="gap:16px"><section class="panel" aria-labelledby="waiting"><div class="panel-head"><h2 id="waiting"><!>Waiting for you</h2> <a class="small" href="#/proposals">All proposals</a></div> <!> <!></section> <section class="panel" aria-labelledby="runs"><div class="panel-head"><h2 id="runs"><!>Recent runs</h2> <a class="small" href="#/runs">All runs</a></div> <!></section></div> <div class="stack" style="gap:16px"><section class="panel" aria-labelledby="health"><div class="panel-head"><h2 id="health"><!>Harness health</h2> <!></div> <div class="panel-body stack"><!> <!> <div><div class="section-label">Since the last review</div> <!></div> <div><div class="section-label">Evidence for evaluations</div> <dl class="kv small"><dt>Session transcripts</dt> <dd> </dd> <dt>Eval rig</dt> <dd><!></dd> <dt>Background reviews</dt> <dd> </dd></dl></div></div></section> <section class="panel" aria-labelledby="objectives"><div class="panel-head"><h2 id="objectives"><!>Objectives</h2> <a class="small" href="#/objectives">Details</a></div> <!></section></div></div>`, 1);
function _page($$anchor, $$props) {
  push($$props, true);
  let objectives = state(proxy([]));
  user_effect(() => {
    api("/api/objectives").then((value) => {
      set(objectives, value.objectives ?? [], true);
    }).catch(() => {
    });
  });
  const status = user_derived(() => summary.status);
  const queue = user_derived(() => summary.proposals.filter(waiting));
  const due = user_derived(() => get(status)?.review_due_reasons);
  const observed = user_derived(() => get(status)?.data_location != null);
  const state2 = user_derived(() => get(status)?.state ?? {});
  const recent = user_derived(() => jobs.list.slice(0, 5));
  const findings = user_derived(findingCount);
  const headline = user_derived(() => {
    if (!get(status)) return "";
    if (!get(status).harness_initialized) return "This repository has no .harness directory yet. Run /improve init in Claude Code to start.";
    const parts = [];
    if (get(due)?.length) parts.push("A harness review is due");
    parts.push(get(queue).length ? `${plural2(get(queue).length, "proposal")} waiting for you` : "Nothing is waiting for your review");
    return `${parts.join(". ")}.`;
  });
  var fragment = root_172();
  var div = first_child(fragment);
  var div_1 = child(div);
  var p = sibling(child(div_1), 2);
  var text2 = only_child(p, true);
  reset(div_1);
  reset(div);
  var div_2 = sibling(div, 2);
  var div_3 = child(div_2);
  var section = child(div_3);
  var div_4 = child(section);
  var h2 = child(div_4);
  var node = child(h2);
  Icon(node, { name: "inbox" });
  next();
  reset(h2);
  next(2);
  reset(div_4);
  var node_1 = sibling(div_4, 2);
  {
    var consequent = ($$anchor2) => {
      var p_1 = root7();
      append2($$anchor2, p_1);
    };
    var consequent_1 = ($$anchor2) => {
      var div_5 = root_18();
      append2($$anchor2, div_5);
    };
    var alternate = ($$anchor2) => {
      var ul = root_34();
      each(ul, 21, () => get(queue), (proposal) => proposal.file, ($$anchor3, proposal) => {
        const scope = user_derived(() => scopeLabel(get(proposal).check));
        var li = root_24();
        var a = child(li);
        var span = child(a);
        var text_1 = only_child(span, true);
        var node_2 = sibling(span, 2);
        {
          var consequent_2 = ($$anchor4) => {
            Pill($$anchor4, {
              children: ($$anchor5, $$slotProps) => {
                next();
                var text_2 = text("Draft");
                append2($$anchor5, text_2);
              },
              $$slots: { default: true }
            });
          };
          if_block(node_2, ($$render) => {
            if (get(proposal).status === "draft") $$render(consequent_2);
          });
        }
        var node_3 = sibling(node_2, 2);
        {
          var consequent_3 = ($$anchor4) => {
            Pill($$anchor4, {
              get tone() {
                return get(scope).tone;
              },
              get title() {
                return get(scope).meaning;
              },
              children: ($$anchor5, $$slotProps) => {
                next();
                var text_3 = text();
                template_effect(() => set_text(text_3, get(scope).label));
                append2($$anchor5, text_3);
              },
              $$slots: { default: true }
            });
          };
          var d = user_derived(() => showScope(get(proposal).check));
          if_block(node_3, ($$render) => {
            if (get(d)) $$render(consequent_3);
          });
        }
        var span_1 = sibling(node_3, 2);
        var text_4 = only_child(span_1, true);
        var node_4 = sibling(span_1, 2);
        Icon(node_4, { name: "chevron" });
        reset(a);
        reset(li);
        template_effect(
          ($0, $1) => {
            set_attribute2(a, "href", `#/proposals?p=${$0 ?? ""}`);
            set_text(text_1, get(proposal).title);
            set_text(text_4, $1);
          },
          [
            () => encodeURIComponent(get(proposal).file),
            () => ago(get(proposal).created_at)
          ]
        );
        append2($$anchor3, li);
      });
      reset(ul);
      append2($$anchor2, ul);
    };
    if_block(node_1, ($$render) => {
      if (!summary.loaded) $$render(consequent);
      else if (get(queue).length === 0) $$render(consequent_1, 1);
      else $$render(alternate, -1);
    });
  }
  var node_5 = sibling(node_1, 2);
  {
    var consequent_4 = ($$anchor2) => {
      var div_6 = root_43();
      var a_1 = child(div_6);
      var node_6 = child(a_1);
      Icon(node_6, { name: "sparkles" });
      var text_5 = sibling(node_6);
      reset(a_1);
      reset(div_6);
      template_effect(($0) => set_text(text_5, `${$0 ?? ""} not yet triaged`), [() => plural2(get(findings), "background finding")]);
      append2($$anchor2, div_6);
    };
    if_block(node_5, ($$render) => {
      if (get(findings)) $$render(consequent_4);
    });
  }
  reset(section);
  var section_1 = sibling(section, 2);
  var div_7 = child(section_1);
  var h2_1 = child(div_7);
  var node_7 = child(h2_1);
  Icon(node_7, { name: "activity" });
  next();
  reset(h2_1);
  next(2);
  reset(div_7);
  var node_8 = sibling(div_7, 2);
  {
    var consequent_5 = ($$anchor2) => {
      var p_2 = root_53();
      append2($$anchor2, p_2);
    };
    var alternate_1 = ($$anchor2) => {
      var ul_1 = root_34();
      each(ul_1, 21, () => get(recent), (job) => job.id, ($$anchor3, job) => {
        var li_1 = root_62();
        var node_9 = child(li_1);
        JobCard(node_9, {
          get job() {
            return get(job);
          },
          compact: true
        });
        reset(li_1);
        append2($$anchor3, li_1);
      });
      reset(ul_1);
      append2($$anchor2, ul_1);
    };
    if_block(node_8, ($$render) => {
      if (get(recent).length === 0) $$render(consequent_5);
      else $$render(alternate_1, -1);
    });
  }
  reset(section_1);
  reset(div_3);
  var div_8 = sibling(div_3, 2);
  var section_2 = child(div_8);
  var div_9 = child(section_2);
  var h2_2 = child(div_9);
  var node_10 = child(h2_2);
  Icon(node_10, { name: "gauge" });
  next();
  reset(h2_2);
  var node_11 = sibling(h2_2, 2);
  {
    var consequent_6 = ($$anchor2) => {
      Pill($$anchor2, {
        title: "No plugin data directory was found, so hook observations cannot be read",
        children: ($$anchor3, $$slotProps) => {
          next();
          var text_6 = text("Not observed");
          append2($$anchor3, text_6);
        },
        $$slots: { default: true }
      });
    };
    var consequent_7 = ($$anchor2) => {
      Pill($$anchor2, {
        tone: "warn",
        children: ($$anchor3, $$slotProps) => {
          next();
          var text_7 = text("Review due");
          append2($$anchor3, text_7);
        },
        $$slots: { default: true }
      });
    };
    var alternate_2 = ($$anchor2) => {
      Pill($$anchor2, {
        tone: "ok",
        children: ($$anchor3, $$slotProps) => {
          next();
          var text_8 = text("No review due");
          append2($$anchor3, text_8);
        },
        $$slots: { default: true }
      });
    };
    if_block(node_11, ($$render) => {
      if (get(due) == null) $$render(consequent_6);
      else if (get(due).length) $$render(consequent_7, 1);
      else $$render(alternate_2, -1);
    });
  }
  reset(div_9);
  var div_10 = sibling(div_9, 2);
  var node_12 = child(div_10);
  {
    var consequent_8 = ($$anchor2) => {
      var div_11 = root_82();
      var ul_2 = sibling(child(div_11), 2);
      each(ul_2, 21, () => get(due), index, ($$anchor3, reason) => {
        var li_2 = root_72();
        var text_9 = only_child(li_2, true);
        template_effect(() => set_text(text_9, get(reason)));
        append2($$anchor3, li_2);
      });
      reset(ul_2);
      reset(div_11);
      append2($$anchor2, div_11);
    };
    if_block(node_12, ($$render) => {
      if (get(due)?.length) $$render(consequent_8);
    });
  }
  var node_13 = sibling(node_12, 2);
  {
    var consequent_9 = ($$anchor2) => {
      var div_12 = root_92();
      var p_3 = sibling(child(div_12), 2);
      var text_10 = child(p_3);
      var code = sibling(text_10);
      var text_11 = only_child(code, true);
      reset(p_3);
      reset(div_12);
      template_effect(
        ($0) => {
          set_text(text_10, `Made ${get(status).repeated_correction.count ?? ""} times. Key words: `);
          set_text(text_11, $0);
        },
        [
          () => get(status).repeated_correction.key.replaceAll("-", " ")
        ]
      );
      append2($$anchor2, div_12);
    };
    if_block(node_13, ($$render) => {
      if (get(status)?.repeated_correction && get(status).repeated_correction.count > 1) $$render(consequent_9);
    });
  }
  var div_13 = sibling(node_13, 2);
  var node_14 = sibling(child(div_13), 2);
  {
    var consequent_10 = ($$anchor2) => {
      var dl = root_102();
      var dd = sibling(child(dl));
      var text_12 = only_child(dd, true);
      var dd_1 = sibling(dd, 3);
      var text_13 = only_child(dd_1, true);
      var dd_2 = sibling(dd_1, 3);
      var text_14 = only_child(dd_2, true);
      var dd_3 = sibling(dd_2, 3);
      var text_15 = only_child(dd_3, true);
      var dd_4 = sibling(dd_3, 3);
      var text_16 = only_child(dd_4, true);
      reset(dl);
      template_effect(
        ($0) => {
          set_text(text_12, get(state2).sessions_since_review ?? 0);
          set_text(text_13, get(state2).tool_calls_since_review ?? 0);
          set_text(text_14, get(state2).tool_failures_since_review ?? 0);
          set_text(text_15, get(state2).corrections_since_review ?? 0);
          set_text(text_16, $0);
        },
        [
          () => get(state2).last_reviewed_at ? ago(get(state2).last_reviewed_at) : "never"
        ]
      );
      append2($$anchor2, dl);
    };
    var alternate_3 = ($$anchor2) => {
      var p_4 = root_112();
      append2($$anchor2, p_4);
    };
    if_block(node_14, ($$render) => {
      if (get(observed)) $$render(consequent_10);
      else $$render(alternate_3, -1);
    });
  }
  reset(div_13);
  var div_14 = sibling(div_13, 2);
  var dl_1 = sibling(child(div_14), 2);
  var dd_5 = sibling(child(dl_1), 2);
  var text_17 = only_child(dd_5, true);
  var dd_6 = sibling(dd_5, 4);
  var node_15 = child(dd_6);
  {
    var consequent_12 = ($$anchor2) => {
      var fragment_7 = root_132();
      var text_18 = first_child(fragment_7, true);
      var node_16 = sibling(text_18);
      {
        var consequent_11 = ($$anchor3) => {
          var span_2 = root_123();
          var text_19 = only_child(span_2);
          template_effect(() => set_text(text_19, `(plugin has ${get(status).eval_rig.available ?? ""})`));
          append2($$anchor3, span_2);
        };
        if_block(node_16, ($$render) => {
          if (get(status).eval_rig.drifted) $$render(consequent_11);
        });
      }
      template_effect(() => set_text(text_18, get(status).eval_rig.installed));
      append2($$anchor2, fragment_7);
    };
    var alternate_4 = ($$anchor2) => {
      var text_20 = text("not installed");
      append2($$anchor2, text_20);
    };
    if_block(node_15, ($$render) => {
      if (get(status)?.eval_rig?.installed) $$render(consequent_12);
      else $$render(alternate_4, -1);
    });
  }
  reset(dd_6);
  var dd_7 = sibling(dd_6, 4);
  var text_21 = only_child(dd_7, true);
  reset(dl_1);
  reset(div_14);
  reset(div_10);
  reset(section_2);
  var section_3 = sibling(section_2, 2);
  var div_15 = child(section_3);
  var h2_3 = child(div_15);
  var node_17 = child(h2_3);
  Icon(node_17, { name: "target" });
  next();
  reset(h2_3);
  next(2);
  reset(div_15);
  var node_18 = sibling(div_15, 2);
  {
    var consequent_13 = ($$anchor2) => {
      var p_5 = root_142();
      append2($$anchor2, p_5);
    };
    var alternate_6 = ($$anchor2) => {
      var ul_3 = root_34();
      each(ul_3, 21, () => get(objectives), (objective) => objective.id, ($$anchor3, objective) => {
        var li_3 = root_162();
        var a_2 = child(li_3);
        var span_3 = child(a_2);
        var text_22 = only_child(span_3, true);
        var node_19 = sibling(span_3, 2);
        {
          var consequent_14 = ($$anchor4) => {
            Pill($$anchor4, {
              tone: "bad",
              children: ($$anchor5, $$slotProps) => {
                next();
                var text_23 = text("No suite");
                append2($$anchor5, text_23);
              },
              $$slots: { default: true }
            });
          };
          var consequent_15 = ($$anchor4) => {
            Pill($$anchor4, {
              children: ($$anchor5, $$slotProps) => {
                next();
                var text_24 = text("Not measured yet");
                append2($$anchor5, text_24);
              },
              $$slots: { default: true }
            });
          };
          var alternate_5 = ($$anchor4) => {
            var fragment_10 = root_152();
            var node_20 = first_child(fragment_10);
            Trend(node_20, {
              get history() {
                return get(objective).history;
              },
              width: 72,
              height: 22
            });
            var span_4 = sibling(node_20, 2);
            var text_25 = only_child(span_4, true);
            template_effect(
              ($0) => {
                set_style(span_4, `min-width:36px;text-align:right;color:${get(objective).latest?.success ? "var(--ok)" : "var(--bad)"}`);
                set_text(text_25, $0);
              },
              [() => score(get(objective).latest?.score)]
            );
            append2($$anchor4, fragment_10);
          };
          if_block(node_19, ($$render) => {
            if (!get(objective).covered) $$render(consequent_14);
            else if (!get(objective).encountered) $$render(consequent_15, 1);
            else $$render(alternate_5, -1);
          });
        }
        reset(a_2);
        reset(li_3);
        template_effect(() => {
          set_attribute2(a_2, "href", `#/objectives#${get(objective).id ?? ""}`);
          set_text(text_22, get(objective).id);
        });
        append2($$anchor3, li_3);
      });
      reset(ul_3);
      append2($$anchor2, ul_3);
    };
    if_block(node_18, ($$render) => {
      if (get(objectives).length === 0) $$render(consequent_13);
      else $$render(alternate_6, -1);
    });
  }
  reset(section_3);
  reset(div_8);
  reset(div_2);
  template_effect(() => {
    set_text(text2, get(headline));
    set_text(text_17, get(status)?.transcripts?.count ? `${get(status).transcripts.count}, oldest ${get(status).transcripts.oldest_age_days} days` : "none found");
    set_text(text_21, get(status)?.background_dreaming_enabled ? "on, after sessions" : "off; run one from Background findings");
  });
  append2($$anchor, fragment);
  pop();
}

// ../ui/src/lib/components/Diff.svelte
var root8 = from_html(`<p class="empty small">Both versions are empty.</p>`);
var root_19 = from_html(`<tr class="fold svelte-n0dad0"><td colspan="3" class="svelte-n0dad0"><button class="ghost small"> </button></td></tr>`);
var root_25 = from_html(`<tr><td class="ln svelte-n0dad0"> </td><td class="ln svelte-n0dad0"> </td><td class="code svelte-n0dad0"><span class="sign svelte-n0dad0" aria-hidden="true"> </span> <span class="sr-only"> </span></td></tr>`);
var root_35 = from_html(`<table class="svelte-n0dad0"><tbody></tbody></table>`);
var root_44 = from_html(`<div class="diff svelte-n0dad0"><div class="diff-head svelte-n0dad0"><span class="mono diff-path svelte-n0dad0"> </span> <span class="num small"><span class="plus svelte-n0dad0"> </span> <span class="minus svelte-n0dad0"> </span></span></div> <!></div>`);
var $$css2 = {
  hash: "svelte-n0dad0",
  code: ".diff.svelte-n0dad0 {border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;background:var(--surface);}.diff-head.svelte-n0dad0 {display:flex;justify-content:space-between;gap:12px;padding:8px 12px;background:var(--surface-2);border-bottom:1px solid var(--border);}.diff-path.svelte-n0dad0 {overflow-wrap:anywhere;}.plus.svelte-n0dad0 {color:var(--ok);font-weight:600;}.minus.svelte-n0dad0 {color:var(--bad);font-weight:600;}table.svelte-n0dad0 {font:12.5px/1.6 var(--mono);table-layout:fixed;}td.svelte-n0dad0 {padding:0 10px;border:0;vertical-align:top;}.ln.svelte-n0dad0 {width:46px;text-align:right;color:var(--text-3);user-select:none;padding:0 8px;}.code.svelte-n0dad0 {white-space:pre-wrap;overflow-wrap:anywhere;}.sign.svelte-n0dad0 {display:inline-block;width:14px;color:var(--text-3);user-select:none;}tr.add.svelte-n0dad0 td:where(.svelte-n0dad0) {background:var(--add-bg);}tr.add.svelte-n0dad0 .ln:where(.svelte-n0dad0) {background:var(--add-gutter);}tr.del.svelte-n0dad0 td:where(.svelte-n0dad0) {background:var(--del-bg);}tr.del.svelte-n0dad0 .ln:where(.svelte-n0dad0) {background:var(--del-gutter);}tr.fold.svelte-n0dad0 td:where(.svelte-n0dad0) {background:var(--surface-2);padding:2px 8px;color:var(--text-2);}"
};
function Diff($$anchor, $$props) {
  push($$props, true);
  append_styles($$anchor, $$css2);
  let current = prop($$props, "current", 3, ""), proposed = prop($$props, "proposed", 3, ""), path2 = prop($$props, "path", 3, "");
  const CONTEXT = 3;
  let expanded = state(proxy(/* @__PURE__ */ new Set()));
  function diffLines(a, b) {
    const n = a.length;
    const m = b.length;
    const table = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
    for (let i2 = n - 1; i2 >= 0; i2 -= 1) {
      for (let j2 = m - 1; j2 >= 0; j2 -= 1) {
        table[i2][j2] = a[i2] === b[j2] ? table[i2 + 1][j2 + 1] + 1 : Math.max(table[i2 + 1][j2], table[i2][j2 + 1]);
      }
    }
    const out = [];
    let i = 0;
    let j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[i] === b[j]) {
        out.push({ kind: "same", text: a[i], old: i + 1, new: j + 1 });
        i += 1;
        j += 1;
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
  const split = (text2) => text2 ? text2.replace(/\n$/, "").split("\n") : [];
  const lines = user_derived(() => diffLines(split(current()), split(proposed())));
  const added = user_derived(() => get(lines).filter((l) => l.kind === "add").length);
  const removed = user_derived(() => get(lines).filter((l) => l.kind === "del").length);
  const rows = user_derived(() => {
    const keep = get(lines).map((line, index4) => line.kind !== "same" || get(lines).slice(Math.max(0, index4 - CONTEXT), index4 + CONTEXT + 1).some((l) => l.kind !== "same"));
    const out = [];
    let index3 = 0;
    while (index3 < get(lines).length) {
      if (keep[index3] || get(expanded).has(index3)) {
        out.push({ line: get(lines)[index3] });
        index3 += 1;
        continue;
      }
      const start2 = index3;
      while (index3 < get(lines).length && !keep[index3] && !get(expanded).has(index3)) index3 += 1;
      out.push({ fold: { start: start2, end: index3 } });
    }
    return out;
  });
  function unfold(fold) {
    const next2 = new Set(get(expanded));
    for (let i = fold.start; i < fold.end; i += 1) next2.add(i);
    set(expanded, next2, true);
  }
  var div = root_44();
  var div_1 = child(div);
  var span = child(div_1);
  var text_1 = only_child(span, true);
  var span_1 = sibling(span, 2);
  var span_2 = child(span_1);
  var text_2 = only_child(span_2);
  var span_3 = sibling(span_2, 2);
  var text_3 = only_child(span_3);
  reset(span_1);
  reset(div_1);
  var node = sibling(div_1, 2);
  {
    var consequent = ($$anchor2) => {
      var p = root8();
      append2($$anchor2, p);
    };
    var alternate_1 = ($$anchor2) => {
      var table_1 = root_35();
      var tbody = child(table_1);
      each(tbody, 21, () => get(rows), index, ($$anchor3, row) => {
        var fragment = comment();
        var node_1 = first_child(fragment);
        {
          var consequent_1 = ($$anchor4) => {
            var tr = root_19();
            var td = child(tr);
            var button = child(td);
            var text_4 = only_child(button);
            reset(td);
            reset(tr);
            template_effect(() => set_text(text_4, `Show ${get(row).fold.end - get(row).fold.start} unchanged lines`));
            delegated("click", button, () => unfold(get(row).fold));
            append2($$anchor4, tr);
          };
          var alternate = ($$anchor4) => {
            var tr_1 = root_25();
            var td_1 = child(tr_1);
            var text_5 = only_child(td_1, true);
            var td_2 = sibling(td_1);
            var text_6 = only_child(td_2, true);
            var td_3 = sibling(td_2);
            var span_4 = child(td_3);
            var text_7 = only_child(span_4, true);
            var text_8 = sibling(span_4, 1, true);
            var span_5 = sibling(text_8);
            var text_9 = only_child(span_5, true);
            reset(td_3);
            reset(tr_1);
            template_effect(() => {
              set_class(tr_1, 1, clsx2(get(row).line.kind), "svelte-n0dad0");
              set_text(text_5, get(row).line.old ?? "");
              set_text(text_6, get(row).line.new ?? "");
              set_text(text_7, get(row).line.kind === "add" ? "+" : get(row).line.kind === "del" ? "\u2212" : " ");
              set_text(text_8, get(row).line.text || " ");
              set_text(text_9, get(row).line.kind === "add" ? " (added)" : get(row).line.kind === "del" ? " (removed)" : "");
            });
            append2($$anchor4, tr_1);
          };
          if_block(node_1, ($$render) => {
            if (get(row).fold) $$render(consequent_1);
            else $$render(alternate, -1);
          });
        }
        append2($$anchor3, fragment);
      });
      reset(tbody);
      reset(table_1);
      append2($$anchor2, table_1);
    };
    if_block(node, ($$render) => {
      if (get(lines).length === 0) $$render(consequent);
      else $$render(alternate_1, -1);
    });
  }
  reset(div);
  template_effect(() => {
    set_text(text_1, path2());
    set_text(text_2, `+${get(added) ?? ""}`);
    set_text(text_3, `\u2212${get(removed) ?? ""}`);
  });
  append2($$anchor, div);
  pop();
}
delegate(["click"]);

// ../ui/src/lib/components/LogView.svelte
var root9 = from_html(`<p class="small faint"> </p>`);
var root_110 = from_html(`<p class="small faint">Nothing has been logged yet.</p>`);
var root_26 = from_html(`<p class="small faint" style="margin-bottom:6px">Showing the end of the log.</p>`);
var root_36 = from_html(`<!> <pre class="log"> </pre>`, 1);
function LogView($$anchor, $$props) {
  push($$props, true);
  let live = prop($$props, "live", 3, false);
  let text2 = state("");
  let truncated = state(false);
  let error = state(
    /** @type {string | null} */
    null
  );
  let box = state(void 0);
  async function load() {
    try {
      const value = await api($$props.url);
      const stick = get(box) ? get(box).scrollHeight - get(box).scrollTop - get(box).clientHeight < 40 : true;
      set(text2, (value.text ?? "").replace(/^\d{4}-\d\d-\d\dT(\d\d:\d\d:\d\d)\.\d+Z /gm, "$1  "), true);
      set(truncated, Boolean(value.truncated), true);
      set(error, null);
      if (stick) requestAnimationFrame(() => {
        if (get(box)) get(box).scrollTop = get(box).scrollHeight;
      });
    } catch (cause) {
      set(
        error,
        /** @type {Error} */
        cause.message,
        true
      );
    }
  }
  user_effect(() => {
    $$props.url;
    load();
    if (!live()) return;
    const timer2 = setInterval(load, 1500);
    return () => clearInterval(timer2);
  });
  var fragment = comment();
  var node = first_child(fragment);
  {
    var consequent = ($$anchor2) => {
      var p = root9();
      var text_1 = only_child(p);
      template_effect(() => set_text(text_1, `The log could not be read: ${get(error) ?? ""}`));
      append2($$anchor2, p);
    };
    var consequent_1 = ($$anchor2) => {
      var p_1 = root_110();
      append2($$anchor2, p_1);
    };
    var alternate = ($$anchor2) => {
      var fragment_1 = root_36();
      var node_1 = first_child(fragment_1);
      {
        var consequent_2 = ($$anchor3) => {
          var p_2 = root_26();
          append2($$anchor3, p_2);
        };
        if_block(node_1, ($$render) => {
          if (get(truncated)) $$render(consequent_2);
        });
      }
      var pre = sibling(node_1, 2);
      var text_2 = only_child(pre, true);
      bind_this(pre, ($$value) => set(box, $$value), () => get(box));
      template_effect(() => set_text(text_2, get(text2)));
      append2($$anchor2, fragment_1);
    };
    if_block(node, ($$render) => {
      if (get(error)) $$render(consequent);
      else if (!get(text2)) $$render(consequent_1, 1);
      else $$render(alternate, -1);
    });
  }
  append2($$anchor, fragment);
  pop();
}

// ../ui/src/lib/components/ApplyResult.svelte
var root10 = from_html(`<p class="small" style="margin-top:4px"> </p>`);
var root_111 = from_html(`<p> </p> <!>`, 1);
var root_27 = from_html(`<span> </span>`);
var root_37 = from_html(`<span class="muted"> </span>`);
var root_45 = from_html(`<li class="svelte-1u1y199"><span><!></span> <span><strong> </strong><!></span></li>`);
var root_54 = from_html(`<ul class="checks small svelte-1u1y199"></ul>`);
var root_63 = from_html(`<div><div class="section-label">Evaluation</div> <div class="row" style="margin-bottom:6px"><!> <!></div> <!> <p class="small faint" style="margin-top:6px">Reported by the apply run.</p></div>`);
var root_73 = from_html(`as <code> </code>`, 1);
var root_83 = from_html(`<p>Committed on branch <code> </code><!>. This checkout is unchanged.</p> <!>`, 1);
var root_93 = from_html(`<p> </p>`);
var root_103 = from_html(`<li> </li>`);
var root_113 = from_html(`<p><strong>Changed outside the confirmed files, and left for you to inspect:</strong></p> <ul class="small mono" style="margin-top:4px"></ul>`, 1);
var root_124 = from_html(`<span class="faint" style="font-weight:400;text-transform:none;letter-spacing:0">\xB7 put back as they were</span>`);
var root_133 = from_html(`<p class="small faint">Loading the diff\u2026</p>`);
var root_143 = from_html(`<p class="small muted">No confirmed file was changed.</p>`);
var root_153 = from_html(`<p class="small faint">This file is long; the diff shows its start.</p>`);
var root_163 = from_html(`<!> <!>`, 1);
var root_173 = from_html(`<div class="stack" style="gap:10px"></div>`);
var root_182 = from_html(`<div><div class="section-label"> <!></div> <!></div>`);
var root_192 = from_html(`<div class="stack" style="gap:14px"><div class="row"><!> <span class="small faint"> </span> <a class="small">Open in Runs</a></div> <!> <!> <!> <!> <!> <!> <details><summary class="small muted">Log</summary> <div style="margin-top:8px"><!></div></details></div>`);
var $$css3 = {
  hash: "svelte-1u1y199",
  code: ".checks.svelte-1u1y199 {list-style:none;padding:0;margin:0;display:grid;gap:4px;}.checks.svelte-1u1y199 li:where(.svelte-1u1y199) {display:flex;gap:8px;align-items:baseline;}"
};
function ApplyResult($$anchor, $$props) {
  push($$props, true);
  append_styles($$anchor, $$css3);
  let changes = state(
    /** @type {any} */
    null
  );
  const running = user_derived(() => $$props.job.status === "running");
  const result = user_derived(() => $$props.job.result ?? {});
  const upstream = user_derived(() => $$props.job.detail?.mode === "upstream-pr");
  const outcome = user_derived(() => get(running) ? { label: "Running", tone: "accent live" } : $$props.job.status === "completed" ? get(upstream) ? { label: "Branch prepared", tone: "ok" } : { label: "Applied", tone: "ok" } : $$props.job.status === "cancelled" ? { label: "Cancelled", tone: "" } : { label: "Not applied", tone: "bad" });
  const changed = user_derived(() => (get(
    changes
    /** @type {any} */
  )?.files ?? []).filter((f) => f.change !== "unchanged"));
  user_effect(() => {
    const key2 = `${$$props.job.id}|${$$props.job.status}`;
    set(changes, null);
    if (get(running)) return;
    api(`/api/jobs/${encodeURIComponent(key2.split("|")[0])}/changes`).then((v) => {
      set(changes, v, true);
    }).catch(() => {
      set(changes, { files: [] }, true);
    });
  });
  var div = root_192();
  var div_1 = child(div);
  var node = child(div_1);
  Pill(node, {
    get tone() {
      return get(outcome).tone;
    },
    children: ($$anchor2, $$slotProps) => {
      next();
      var text2 = text();
      template_effect(() => set_text(text2, get(outcome).label));
      append2($$anchor2, text2);
    },
    $$slots: { default: true }
  });
  var span = sibling(node, 2);
  var text_1 = only_child(span);
  var a = sibling(span, 2);
  reset(div_1);
  var node_1 = sibling(div_1, 2);
  {
    var consequent_1 = ($$anchor2) => {
      {
        let $0 = user_derived(() => $$props.job.status === "cancelled" ? "" : "bad");
        Notice($$anchor2, {
          get tone() {
            return get($0);
          },
          children: ($$anchor3, $$slotProps) => {
            var fragment_2 = root_111();
            var p = first_child(fragment_2);
            var text_2 = only_child(p, true);
            var node_2 = sibling(p, 2);
            {
              var consequent = ($$anchor4) => {
                var p_1 = root10();
                var text_3 = only_child(p_1, true);
                template_effect(() => set_text(text_3, $$props.job.hint));
                append2($$anchor4, p_1);
              };
              if_block(node_2, ($$render) => {
                if ($$props.job.hint) $$render(consequent);
              });
            }
            template_effect(() => set_text(text_2, $$props.job.error));
            append2($$anchor3, fragment_2);
          },
          $$slots: { default: true }
        });
      }
    };
    if_block(node_1, ($$render) => {
      if (!get(running) && $$props.job.error) $$render(consequent_1);
    });
  }
  var node_3 = sibling(node_1, 2);
  {
    var consequent_5 = ($$anchor2) => {
      var div_2 = root_63();
      var div_3 = sibling(child(div_2), 2);
      var node_4 = child(div_3);
      {
        let $0 = user_derived(() => get(result).evaluation.passed ? "ok" : "bad");
        Pill(node_4, {
          get tone() {
            return get($0);
          },
          children: ($$anchor3, $$slotProps) => {
            next();
            var text_4 = text();
            template_effect(() => set_text(text_4, get(result).evaluation.passed ? "Passed" : "Failed"));
            append2($$anchor3, text_4);
          },
          $$slots: { default: true }
        });
      }
      var node_5 = sibling(node_4, 2);
      {
        var consequent_2 = ($$anchor3) => {
          var span_1 = root_27();
          var text_5 = only_child(span_1, true);
          template_effect(() => set_text(text_5, get(result).evaluation.summary));
          append2($$anchor3, span_1);
        };
        if_block(node_5, ($$render) => {
          if (get(result).evaluation.summary) $$render(consequent_2);
        });
      }
      reset(div_3);
      var node_6 = sibling(div_3, 2);
      {
        var consequent_4 = ($$anchor3) => {
          var ul = root_54();
          each(ul, 21, () => get(result).evaluation.checks, index, ($$anchor4, check) => {
            var li = root_45();
            var span_2 = child(li);
            var node_7 = child(span_2);
            {
              let $0 = user_derived(() => get(check).passed ? "check" : "x");
              let $1 = user_derived(() => get(check).passed ? "passed" : "failed");
              Icon(node_7, {
                get name() {
                  return get($0);
                },
                size: 13,
                get label() {
                  return get($1);
                }
              });
            }
            reset(span_2);
            var span_3 = sibling(span_2, 2);
            var strong = child(span_3);
            var text_6 = only_child(strong, true);
            var node_8 = sibling(strong);
            {
              var consequent_3 = ($$anchor5) => {
                var span_4 = root_37();
                var text_7 = only_child(span_4);
                template_effect(() => set_text(text_7, `: ${get(check).detail ?? ""}`));
                append2($$anchor5, span_4);
              };
              if_block(node_8, ($$render) => {
                if (get(check).detail) $$render(consequent_3);
              });
            }
            reset(span_3);
            reset(li);
            template_effect(() => {
              set_style(span_2, `color:var(${get(check).passed ? "--ok" : "--bad"})`);
              set_text(text_6, get(check).name);
            });
            append2($$anchor4, li);
          });
          reset(ul);
          append2($$anchor3, ul);
        };
        if_block(node_6, ($$render) => {
          if (get(result).evaluation.checks?.length) $$render(consequent_4);
        });
      }
      next(2);
      reset(div_2);
      append2($$anchor2, div_2);
    };
    if_block(node_3, ($$render) => {
      if (get(result).evaluation) $$render(consequent_5);
    });
  }
  var node_9 = sibling(node_3, 2);
  {
    var consequent_8 = ($$anchor2) => {
      Notice($$anchor2, {
        tone: "ok",
        children: ($$anchor3, $$slotProps) => {
          var fragment_5 = root_83();
          var p_2 = first_child(fragment_5);
          var code = sibling(child(p_2));
          var text_8 = only_child(code, true);
          var node_10 = sibling(code);
          {
            var consequent_6 = ($$anchor4) => {
              var fragment_6 = root_73();
              var code_1 = sibling(first_child(fragment_6));
              var text_9 = only_child(code_1, true);
              template_effect(($0) => set_text(text_9, $0), [() => get(result).commit.slice(0, 10)]);
              append2($$anchor4, fragment_6);
            };
            if_block(node_10, ($$render) => {
              if (get(result).commit) $$render(consequent_6);
            });
          }
          next();
          reset(p_2);
          var node_11 = sibling(p_2, 2);
          {
            var consequent_7 = ($$anchor4) => {
              var p_3 = root10();
              var text_10 = only_child(p_3, true);
              template_effect(() => set_text(text_10, get(result).next));
              append2($$anchor4, p_3);
            };
            if_block(node_11, ($$render) => {
              if (get(result).next) $$render(consequent_7);
            });
          }
          template_effect(() => set_text(text_8, get(result).branch));
          append2($$anchor3, fragment_5);
        },
        $$slots: { default: true }
      });
    };
    if_block(node_9, ($$render) => {
      if ($$props.job.status === "completed" && get(upstream) && get(result).branch) $$render(consequent_8);
    });
  }
  var node_12 = sibling(node_9, 2);
  {
    var consequent_9 = ($$anchor2) => {
      Notice($$anchor2, {
        tone: "warn",
        children: ($$anchor3, $$slotProps) => {
          var p_4 = root_93();
          var text_11 = only_child(p_4, true);
          template_effect(() => set_text(text_11, get(result).unchecked));
          append2($$anchor3, p_4);
        },
        $$slots: { default: true }
      });
    };
    if_block(node_12, ($$render) => {
      if (get(result).unchecked) $$render(consequent_9);
    });
  }
  var node_13 = sibling(node_12, 2);
  {
    var consequent_10 = ($$anchor2) => {
      Notice($$anchor2, {
        tone: "warn",
        children: ($$anchor3, $$slotProps) => {
          var fragment_9 = root_113();
          var ul_1 = sibling(first_child(fragment_9), 2);
          each(ul_1, 21, () => get(result).stray, index, ($$anchor4, file) => {
            var li_1 = root_103();
            var text_12 = only_child(li_1, true);
            template_effect(() => set_text(text_12, get(file)));
            append2($$anchor4, li_1);
          });
          reset(ul_1);
          append2($$anchor3, fragment_9);
        },
        $$slots: { default: true }
      });
    };
    if_block(node_13, ($$render) => {
      if (get(result).stray?.length) $$render(consequent_10);
    });
  }
  var node_14 = sibling(node_13, 2);
  {
    var consequent_15 = ($$anchor2) => {
      var div_4 = root_182();
      var div_5 = child(div_4);
      var text_13 = child(div_5);
      var node_15 = sibling(text_13);
      {
        var consequent_11 = ($$anchor3) => {
          var span_5 = root_124();
          append2($$anchor3, span_5);
        };
        if_block(node_15, ($$render) => {
          if (get(changes)?.restored) $$render(consequent_11);
        });
      }
      reset(div_5);
      var node_16 = sibling(div_5, 2);
      {
        var consequent_12 = ($$anchor3) => {
          var p_5 = root_133();
          append2($$anchor3, p_5);
        };
        var consequent_13 = ($$anchor3) => {
          var p_6 = root_143();
          append2($$anchor3, p_6);
        };
        var alternate = ($$anchor3) => {
          var div_6 = root_173();
          each(div_6, 21, () => get(changed), (file) => file.path, ($$anchor4, file) => {
            var fragment_10 = root_163();
            var node_17 = first_child(fragment_10);
            {
              let $0 = user_derived(() => get(file).before ?? "");
              let $1 = user_derived(() => get(file).after ?? "");
              Diff(node_17, {
                get current() {
                  return get($0);
                },
                get proposed() {
                  return get($1);
                },
                get path() {
                  return get(file).path;
                }
              });
            }
            var node_18 = sibling(node_17, 2);
            {
              var consequent_14 = ($$anchor5) => {
                var p_7 = root_153();
                append2($$anchor5, p_7);
              };
              if_block(node_18, ($$render) => {
                if (get(file).truncated) $$render(consequent_14);
              });
            }
            append2($$anchor4, fragment_10);
          });
          reset(div_6);
          append2($$anchor3, div_6);
        };
        if_block(node_16, ($$render) => {
          if (!get(changes)) $$render(consequent_12);
          else if (get(changed).length === 0) $$render(consequent_13, 1);
          else $$render(alternate, -1);
        });
      }
      reset(div_4);
      template_effect(() => set_text(text_13, `${$$props.job.status === "completed" ? get(upstream) ? "Changes on the branch" : "Changes" : "What the run tried"} `));
      append2($$anchor2, div_4);
    };
    if_block(node_14, ($$render) => {
      if (!get(running)) $$render(consequent_15);
    });
  }
  var details2 = sibling(node_14, 2);
  var div_7 = sibling(child(details2), 2);
  var node_19 = child(div_7);
  LogView(node_19, {
    get url() {
      return `/api/jobs/${$$props.job.id ?? ""}/log`;
    },
    get live() {
      return get(running);
    }
  });
  reset(div_7);
  reset(details2);
  reset(div);
  template_effect(
    ($0) => {
      set_text(text_1, `${get(running) ? "started" : "finished"} ${$0 ?? ""}`);
      set_attribute2(a, "href", `#/runs?job=${$$props.job.id ?? ""}`);
      details2.open = get(running);
    },
    [
      () => ago(get(running) ? $$props.job.started_at : $$props.job.finished_at)
    ]
  );
  append2($$anchor, div);
  pop();
}

// ../ui/src/routes/proposals/+page.svelte
var root11 = from_html(`<button> <span class="faint num"> </span></button>`);
var root_114 = from_html(`<p class="empty small">Loading\u2026</p>`);
var root_28 = from_html(`New proposals come from <code>/improve propose</code>, <code>/improve review</code>, or an imported background finding.`, 1);
var root_38 = from_html(`<div class="empty small"><strong> </strong> <!></div>`);
var root_46 = from_html(`<li><button class="list-row stacked svelte-19ebguo"><span class="title"> </span> <span class="row small faint"><!> <!> <!> <span> </span></span></button></li>`);
var root_55 = from_html(`<ul class="list"></ul>`);
var root_64 = from_html(`<div class="panel empty"><strong> </strong> Its evidence, the files it changes, and the decision controls appear here.</div>`);
var root_74 = from_html(`\xB7 objective <a> </a>`, 1);
var root_84 = from_html(`<div class="panel-body"><!></div>`);
var root_94 = from_html(`<div><div class="section-label">What changes</div> <p class="prose"> </p></div>`);
var root_104 = from_html(`<div><div class="section-label">Why</div> <p class="prose"> </p></div>`);
var root_115 = from_html(`<span class="faint"> </span>`);
var root_125 = from_html(`<span><!> <!></span>`);
var root_134 = from_html(`<div class="row"></div>`);
var root_144 = from_html(`<p class="small muted">None listed.</p>`);
var root_154 = from_html(`<p class="small" style="color:var(--warn);margin-top:6px">Changes permissions.</p>`);
var root_164 = from_html(`<tr><td class="mono small svelte-19ebguo" style="width:34%"> </td><td class="svelte-19ebguo"> </td></tr>`);
var root_174 = from_html(`<div class="table-wrap evidence svelte-19ebguo"><table><thead><tr><th class="svelte-19ebguo">Source</th><th class="svelte-19ebguo">What it shows</th></tr></thead><tbody></tbody></table></div>`);
var root_183 = from_html(`<p class="small" style="color:var(--warn)">No evidence is given. A proposal without evidence is a guess.</p>`);
var root_193 = from_html(`<dt>Today</dt><dd> </dd>`, 1);
var root_20 = from_html(`<dt>Measured by</dt><dd> </dd>`, 1);
var root_21 = from_html(`<dt>Passes if</dt><dd> </dd>`, 1);
var root_222 = from_html(`<dt>Fails if</dt><dd> </dd>`, 1);
var root_232 = from_html(`<div><div class="section-label">How we will know it worked</div> <dl class="kv"><!> <!> <!> <!></dl></div>`);
var root_242 = from_html(`<li> </li>`);
var root_252 = from_html(`<p><strong>Reasons to reject, from whoever wrote it</strong></p> <ul class="small" style="margin-top:4px"></ul>`, 1);
var root_262 = from_html(`<div><div class="section-label">Risks</div> <ul></ul></div>`);
var root_272 = from_html(`<div><div class="section-label">How to undo it</div> <p> </p></div>`);
var root_282 = from_html(`<div class="grid cols-2"><!> <!></div>`);
var root_29 = from_html(`<li><span class="faint"> </span> </li>`);
var root_30 = from_html(`<details><summary class="small muted"> </summary> <ul class="small" style="margin-top:8px"></ul></details>`);
var root_31 = from_html(`<button class="small"><!> </button>`);
var root_322 = from_html(`<div class="panel"><!></div>`);
var root_332 = from_html(`<p class="small faint">Loading the diff\u2026</p>`);
var root_342 = from_html(`<strong style="color:var(--warn)">The current file was not written by improve.</strong>`);
var root_352 = from_html(`<li><span class="mono"> </span> </li>`);
var root_362 = from_html(`<p><strong> </strong></p> <ul class="small" style="margin-top:4px"></ul>`, 1);
var root_372 = from_html(`<div class="stack" style="gap:10px"><p class="small muted"> <code> </code> <!></p> <!> <!></div>`);
var root_382 = from_html(`<p class="small muted">A read-only agent can draft the skill this proposal describes. Nothing is written until you apply the reviewed diff.</p>`);
var root_39 = from_html(`<div><div class="spread" style="margin-bottom:8px"><div class="section-label" style="margin:0">Skill draft</div> <!></div> <!> <!></div>`);
var root_40 = from_html(`<div><div class="section-label"> </div> <div class="panel panel-body"><!></div></div>`);
var root_41 = from_html(`<p style="margin-top:6px"> </p>`);
var root_422 = from_html(`<p class="small faint" style="margin-top:4px"> </p>`);
var root_432 = from_html(`<li class="panel-body" style="padding:10px 14px"><div class="row"><!> <span class="small faint"> </span></div> <!> <!></li>`);
var root_442 = from_html(`<div><div class="section-label">Decisions</div> <ul class="list panel"></ul></div>`);
var root_452 = from_html(`<p class="small"> </p>`);
var root_462 = from_html(`<p> </p> <!>`, 1);
var root_47 = from_html(`<div class="panel-body" style="padding-top:0"><!></div>`);
var root_48 = from_html(`<p id="reason-error" class="field-error"> </p>`);
var root_49 = from_html(`Approving writes <code> </code> exactly as shown.`, 1);
var root_50 = from_html(`Approving records your decision only. Nothing changes until you apply it, here or with <code> </code>.`, 1);
var root_51 = from_html(`<button class="danger">Overwrite the hand-written file</button>`);
var root_522 = from_html(`<button class="primary"><!> </button>`);
var root_532 = from_html(`<footer class="decision svelte-19ebguo"><label for="reason">Your reason <span class="faint" style="font-weight:400">(required to reject, kept with the decision)</span></label> <textarea id="reason" rows="2" placeholder="What convinced you, or what is wrong with it"></textarea> <!> <div class="decision-actions svelte-19ebguo"><p id="reason-help" class="small faint svelte-19ebguo"><!></p> <div class="row svelte-19ebguo"><button class="danger"><!> </button> <!> <!></div></div></footer>`);
var root_542 = from_html(`<p class="small faint">Checking what applying would change\u2026</p>`);
var root_552 = from_html(`<p> </p> <p class="small faint" style="margin-top:4px">Fix the proposal, or run <code> </code> in Claude Code.</p>`, 1);
var root_56 = from_html(`<li><span class="chip"><!> </span></li>`);
var root_57 = from_html(`<li><code> </code></li>`);
var root_58 = from_html(`<ul class="confirm-commands small mono svelte-19ebguo"></ul>`);
var root_59 = from_html(`<p class="small muted">Nothing else.</p>`);
var root_60 = from_html(`<div class="stack" style="gap:10px" role="group" aria-labelledby="confirm-title"><p id="confirm-title"><strong> </strong></p> <p class="small"> </p> <ul class="confirm-files svelte-19ebguo"></ul> <p class="small">The only commands it may run:</p> <ul class="confirm-commands small mono svelte-19ebguo"></ul> <p class="small">What the evaluation may rewrite, besides <code>.harness/evals/results/</code>:</p> <!> <p class="small muted"> </p> <div class="row" style="justify-content:flex-end"><button>Back</button> <button class="primary"><!> </button></div></div>`);
var root_61 = from_html(`Prepared on <code> </code>; open its pull request, or prepare it again.`, 1);
var root_622 = from_html(`<div class="decision-actions svelte-19ebguo" style="margin-top:0"><p class="small svelte-19ebguo"><!></p> <div class="row svelte-19ebguo"><button class="primary"><!> </button></div></div>`);
var root_632 = from_html(`<footer class="decision svelte-19ebguo"><!></footer>`);
var root_642 = from_html(`<div class="panel-body stack" style="gap:20px"><!> <!> <!> <div><div class="section-label">Files</div> <!> <!></div> <div><div class="section-label">Evidence</div> <!></div> <!> <!> <!> <!> <!> <!> <!></div> <!> <!>`, 1);
var root_65 = from_html(`<article class="panel"><header class="panel-body stack" style="gap:10px;border-bottom:1px solid var(--border)"><div class="row"><!> <!> <!> <!></div> <h2 style="font-size:18px"> </h2> <p class="small faint"><span class="mono"> </span> <!> <!> <!> <!></p></header> <!></article>`);
var root_66 = from_html(`<div class="page-head"><div><h1>Proposals</h1> <p>Changes to the harness, waiting for a decision. A proposal is not approval: nothing changes until you approve it.</p></div></div> <div class="split svelte-19ebguo"><section class="panel list-pane svelte-19ebguo" aria-label="Proposal list"><div class="panel-head svelte-19ebguo"><div class="segmented" role="group" aria-label="Filter"></div></div> <!></section> <section class="detail" aria-live="polite"><!></section></div>`, 1);
var $$css4 = {
  hash: "svelte-19ebguo",
  code: ".split.svelte-19ebguo {display:grid;grid-template-columns:minmax(300px, 380px) minmax(0, 1fr);gap:16px;align-items:start;}.list-pane.svelte-19ebguo {position:sticky;top:16px;max-height:calc(100vh - 32px);overflow-y:auto;}.list-pane.svelte-19ebguo .panel-head:where(.svelte-19ebguo) {position:sticky;top:0;background:var(--surface);z-index:1;}.stacked.svelte-19ebguo {flex-direction:column;align-items:flex-start;gap:6px;}.decision.svelte-19ebguo {position:sticky;bottom:0;padding:14px 16px;background:var(--surface);border-top:1px solid var(--border);border-radius:0 0 var(--radius) var(--radius);}.decision-actions.svelte-19ebguo {display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin-top:10px;}.decision-actions.svelte-19ebguo p:where(.svelte-19ebguo) {flex:1 1 260px;}.decision-actions.svelte-19ebguo .row:where(.svelte-19ebguo) {flex:none;margin-left:auto;}.evidence.svelte-19ebguo {border:1px solid var(--border);border-radius:var(--radius-sm);}.confirm-files.svelte-19ebguo {list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:6px;}.confirm-commands.svelte-19ebguo {list-style:none;padding:0;margin:0;display:grid;gap:4px;overflow-wrap:anywhere;}.evidence.svelte-19ebguo th:where(.svelte-19ebguo), .evidence.svelte-19ebguo td:where(.svelte-19ebguo) {padding:8px 12px;}\n  @media (max-width: 960px) {.split.svelte-19ebguo {grid-template-columns:1fr;}.list-pane.svelte-19ebguo {position:static;max-height:none;}\n  }"
};
function _page2($$anchor, $$props) {
  push($$props, true);
  append_styles($$anchor, $$css4);
  const VIEWS2 = [
    ["waiting", "Waiting", waiting],
    [
      "approved",
      "Approved",
      (p) => p.status === "approved" || p.status === "applying"
    ],
    [
      "decided",
      "Decided",
      (p) => ["validated", "rejected", "rolled-back"].includes(p.status)
    ],
    ["all", "All", () => true]
  ];
  const view = user_derived(() => page.url.searchParams.get("view") ?? "waiting");
  const selectedFile = user_derived(() => page.url.searchParams.get("p"));
  const filter = user_derived(() => VIEWS2.find(([key2]) => key2 === get(view))?.[2] ?? waiting);
  const shown = user_derived(() => summary.proposals.filter(get(filter)));
  const selected = user_derived(() => summary.proposals.find((p) => p.file === get(selectedFile)) ?? null);
  let decisions = state(proxy(
    /** @type {any[]} */
    []
  ));
  let diff = state(
    /** @type {any} */
    null
  );
  let reason = state("");
  let busy = state(
    /** @type {string | null} */
    null
  );
  let notice = state(
    /** @type {{ tone: "ok" | "warn" | "bad" | "", text: string, hint?: string } | null} */
    null
  );
  let reasonError = state(
    /** @type {string | null} */
    null
  );
  let reasonBox = state(
    /** @type {HTMLTextAreaElement | undefined} */
    void 0
  );
  let confirmOverwrite = state(false);
  let plan = state(
    /** @type {any} */
    null
  );
  let confirming = state(false);
  function go(params) {
    const url = new URL(page.url);
    for (const [key2, value] of Object.entries(params)) {
      if (value == null) url.searchParams.delete(key2);
      else url.searchParams.set(key2, value);
    }
    goto(url, { keepFocus: true, noScroll: true, replaceState: false });
  }
  user_effect(() => {
    if (!get(selectedFile) && summary.loaded && get(shown).length) go({ p: get(shown)[0].file });
  });
  const openFile = user_derived(() => get(selected)?.file ?? null);
  const draftKey = user_derived(() => get(selected)?.skill_draft ? `${get(selected).file}|${get(selected).skill_draft.drafted_at ?? ""}` : null);
  user_effect(() => {
    const file = get(openFile);
    set(decisions, [], true);
    set(reason, "");
    set(reasonError, null);
    set(confirmOverwrite, false);
    set(notice, null);
    if (!file) return;
    api(`/api/decisions?proposal=${encodeURIComponent(file)}`).then((v) => {
      set(decisions, v.decisions ?? [], true);
    }).catch(() => {
    });
  });
  user_effect(() => {
    const key2 = get(draftKey);
    set(diff, null);
    if (key2) loadDiff(key2.split("|")[0]);
  });
  const planKey = user_derived(() => get(selected)?.status === "approved" ? `${get(selected).file}|${get(selected).last_apply?.at ?? ""}|${get(selected).upstream_change?.commit ?? ""}` : null);
  user_effect(() => {
    const key2 = get(planKey);
    set(plan, null);
    set(confirming, false);
    if (key2) loadPlan(key2.split("|")[0]);
  });
  async function loadPlan(file) {
    try {
      set(plan, await api(`/api/proposals/${encodeURIComponent(file)}/apply-run`), true);
    } catch (error) {
      set(plan, { error: (
        /** @type {Error} */
        error.message
      ) }, true);
    }
  }
  const applyJob = user_derived(() => get(selected) ? jobs.list.find((job) => job.kind === "apply" && job.detail?.proposal === get(selected).file && job.status === "running") : null);
  const lastApplyJob = user_derived(() => get(selected) ? jobs.list.find((job) => job.kind === "apply" && job.detail?.proposal === get(selected).file) : null);
  async function startApply() {
    set(busy, "apply-run");
    set(notice, null);
    const file = get(selected).file;
    try {
      const { job } = await api(`/api/proposals/${encodeURIComponent(file)}/apply-run`, {
        method: "POST",
        body: {
          digest: get(plan).digest,
          files: get(plan).files,
          commands: get(plan).commands,
          branch: get(plan).branch
        }
      });
      set(confirming, false);
      set(busy, null);
      await refreshJobs();
      await settled2(job.id);
      await refreshSummary();
      set(decisions, (await api(`/api/decisions?proposal=${encodeURIComponent(file)}`)).decisions ?? [], true);
    } catch (cause) {
      const error = (
        /** @type {any} */
        cause
      );
      set(notice, { tone: "bad", text: error.message, hint: error.hint }, true);
      set(confirming, false);
      if (error.status === 409 || error.status === 403) loadPlan(file);
    } finally {
      set(busy, null);
    }
  }
  async function loadDiff(file) {
    try {
      set(diff, await api(`/api/proposals/${encodeURIComponent(file)}/diff`), true);
    } catch (error) {
      set(diff, { error: (
        /** @type {Error} */
        error.message
      ) }, true);
    }
  }
  const draftJob = user_derived(() => get(selected) ? jobs.list.find((job) => job.kind === "draft-skill" && job.detail?.proposal === get(selected).file && job.status === "running") : null);
  const lastDraftJob = user_derived(() => get(selected) ? jobs.list.find((job) => job.kind === "draft-skill" && job.detail?.proposal === get(selected).file) : null);
  async function draft() {
    set(notice, null);
    try {
      const { job } = await api(`/api/proposals/${encodeURIComponent(get(selected).file)}/draft-skill`, { method: "POST" });
      await refreshJobs();
      const file = get(selected).file;
      const done = await settled2(job.id);
      if (done.status === "completed") {
        await refreshSummary();
        if (get(selected)?.file === file) await loadDiff(file);
      }
    } catch (cause) {
      const error = (
        /** @type {any} */
        cause
      );
      set(notice, { tone: "bad", text: error.message, hint: error.hint }, true);
    }
  }
  async function decide(kind, { overwrite = false } = {}) {
    set(reasonError, null);
    if (kind === "reject" && get(reason).trim().length < 3) {
      set(reasonError, "Say why. The reason is kept so the same idea is not proposed again.");
      get(reasonBox)?.focus();
      return;
    }
    set(busy, kind, true);
    set(notice, null);
    const file = get(selected).file;
    try {
      if (kind === "apply") {
        const value = await api(`/api/proposals/${encodeURIComponent(file)}/apply`, {
          method: "POST",
          body: {
            rationale: get(reason),
            digest: get(diff)?.digest,
            idempotency_key: `${file}:${get(diff)?.digest}`,
            allow_unmarked_overwrite: overwrite
          }
        });
        set(
          notice,
          {
            tone: "ok",
            text: `Approved and wrote ${value.written}.${value.archived ? ` The previous version is in ${value.archived}.` : ""}`
          },
          true
        );
      } else {
        const value = await api(`/api/proposals/${encodeURIComponent(file)}/${kind}`, {
          method: "POST",
          body: {
            rationale: get(reason),
            idempotency_key: `${kind}:${file}:${Date.now()}`
          }
        });
        set(
          notice,
          kind === "approve" ? { tone: "ok", text: `Approved. ${value.next}` } : {
            tone: "",
            text: "Rejected. The reason is recorded with the decision."
          },
          true
        );
      }
      set(reason, "");
      await refreshSummary();
      set(decisions, (await api(`/api/decisions?proposal=${encodeURIComponent(file)}`)).decisions ?? [], true);
    } catch (cause) {
      const error = (
        /** @type {any} */
        cause
      );
      if (error.detail?.requires === "allow_unmarked_overwrite") set(confirmOverwrite, true);
      set(notice, { tone: "bad", text: error.message, hint: error.hint }, true);
    } finally {
      set(busy, null);
    }
  }
  const scope = user_derived(() => scopeLabel(get(selected)?.check));
  const status = user_derived(() => STATUS[get(selected)?.status] ?? { label: get(selected)?.status, tone: "" });
  const decidable = user_derived(() => get(selected) && waiting(get(selected)) && !get(selected).malformed);
  var fragment = root_66();
  var div = sibling(first_child(fragment), 2);
  var section = child(div);
  var div_1 = child(section);
  var div_2 = child(div_1);
  each(div_2, 21, () => VIEWS2, index, ($$anchor2, $$item) => {
    var $$array = user_derived(() => to_array(get($$item), 3));
    let key2 = () => get($$array)[0];
    let label = () => get($$array)[1];
    let test = () => get($$array)[2];
    var button = root11();
    var text2 = child(button);
    var span = sibling(text2);
    var text_1 = only_child(span, true);
    reset(button);
    template_effect(
      ($0) => {
        set_attribute2(button, "aria-pressed", get(view) === key2());
        set_text(text2, `${label() ?? ""} `);
        set_text(text_1, $0);
      },
      [() => summary.proposals.filter(test()).length]
    );
    delegated("click", button, () => go({ view: key2(), p: null }));
    append2($$anchor2, button);
  });
  reset(div_2);
  reset(div_1);
  var node = sibling(div_1, 2);
  {
    var consequent = ($$anchor2) => {
      var p_1 = root_114();
      append2($$anchor2, p_1);
    };
    var consequent_2 = ($$anchor2) => {
      var div_3 = root_38();
      var strong = child(div_3);
      var text_2 = only_child(strong, true);
      var node_1 = sibling(strong, 2);
      {
        var consequent_1 = ($$anchor3) => {
          var fragment_1 = root_28();
          next(4);
          append2($$anchor3, fragment_1);
        };
        if_block(node_1, ($$render) => {
          if (get(view) === "waiting") $$render(consequent_1);
        });
      }
      reset(div_3);
      template_effect(() => set_text(text_2, get(view) === "waiting" ? "Nothing is waiting for you." : "Nothing here."));
      append2($$anchor2, div_3);
    };
    var alternate = ($$anchor2) => {
      var ul = root_55();
      each(ul, 21, () => get(shown), (proposal) => proposal.file, ($$anchor3, proposal) => {
        const s = user_derived(() => STATUS[get(proposal).status] ?? { label: get(proposal).status, tone: "" });
        var li = root_46();
        var button_1 = child(li);
        var span_1 = child(button_1);
        var text_3 = only_child(span_1, true);
        var span_2 = sibling(span_1, 2);
        var node_2 = child(span_2);
        Pill(node_2, {
          get tone() {
            return get(s).tone;
          },
          children: ($$anchor4, $$slotProps) => {
            next();
            var text_4 = text();
            template_effect(() => set_text(text_4, get(s).label));
            append2($$anchor4, text_4);
          },
          $$slots: { default: true }
        });
        var node_3 = sibling(node_2, 2);
        {
          var consequent_3 = ($$anchor4) => {
            Pill($$anchor4, {
              tone: "bad",
              children: ($$anchor5, $$slotProps) => {
                next();
                var text_5 = text("Unreadable");
                append2($$anchor5, text_5);
              },
              $$slots: { default: true }
            });
          };
          if_block(node_3, ($$render) => {
            if (get(proposal).malformed) $$render(consequent_3);
          });
        }
        var node_4 = sibling(node_3, 2);
        {
          var consequent_4 = ($$anchor4) => {
            {
              let $0 = user_derived(() => scopeLabel(get(proposal).check).tone);
              Pill($$anchor4, {
                get tone() {
                  return get($0);
                },
                children: ($$anchor5, $$slotProps) => {
                  next();
                  var text_6 = text();
                  template_effect(($02) => set_text(text_6, $02), [() => scopeLabel(get(proposal).check).label]);
                  append2($$anchor5, text_6);
                },
                $$slots: { default: true }
              });
            }
          };
          var d = user_derived(() => showScope(get(proposal).check));
          if_block(node_4, ($$render) => {
            if (get(d)) $$render(consequent_4);
          });
        }
        var span_3 = sibling(node_4, 2);
        var text_7 = only_child(span_3, true);
        reset(span_2);
        reset(button_1);
        reset(li);
        template_effect(
          ($0) => {
            set_attribute2(button_1, "aria-current", get(proposal).file === get(selectedFile) ? "true" : void 0);
            set_text(text_3, get(proposal).title);
            set_text(text_7, $0);
          },
          [() => ago(get(proposal).created_at)]
        );
        delegated("click", button_1, () => go({ p: get(proposal).file }));
        append2($$anchor3, li);
      });
      reset(ul);
      append2($$anchor2, ul);
    };
    if_block(node, ($$render) => {
      if (!summary.loaded) $$render(consequent);
      else if (get(shown).length === 0) $$render(consequent_2, 1);
      else $$render(alternate, -1);
    });
  }
  reset(section);
  var section_1 = sibling(section, 2);
  var node_5 = child(section_1);
  {
    var consequent_6 = ($$anchor2) => {
      var fragment_6 = comment();
      var node_6 = first_child(fragment_6);
      {
        var consequent_5 = ($$anchor3) => {
          var div_4 = root_64();
          var strong_1 = child(div_4);
          var text_8 = only_child(strong_1, true);
          next();
          reset(div_4);
          template_effect(() => set_text(text_8, get(selectedFile) ? "That proposal no longer exists." : "Pick a proposal."));
          append2($$anchor3, div_4);
        };
        if_block(node_6, ($$render) => {
          if (summary.loaded) $$render(consequent_5);
        });
      }
      append2($$anchor2, fragment_6);
    };
    var alternate_10 = ($$anchor2) => {
      var article = root_65();
      var header = child(article);
      var div_5 = child(header);
      var node_7 = child(div_5);
      Pill(node_7, {
        get tone() {
          return get(status).tone;
        },
        children: ($$anchor3, $$slotProps) => {
          next();
          var text_9 = text();
          template_effect(() => set_text(text_9, get(status).label));
          append2($$anchor3, text_9);
        },
        $$slots: { default: true }
      });
      var node_8 = sibling(node_7, 2);
      {
        var consequent_7 = ($$anchor3) => {
          Pill($$anchor3, {
            get tone() {
              return get(scope).tone;
            },
            get title() {
              return get(scope).meaning;
            },
            children: ($$anchor4, $$slotProps) => {
              next();
              var text_10 = text();
              template_effect(() => set_text(text_10, get(scope).label));
              append2($$anchor4, text_10);
            },
            $$slots: { default: true }
          });
        };
        if_block(node_8, ($$render) => {
          if (get(selected).check) $$render(consequent_7);
        });
      }
      var node_9 = sibling(node_8, 2);
      {
        var consequent_8 = ($$anchor3) => {
          Pill($$anchor3, {
            plain: true,
            children: ($$anchor4, $$slotProps) => {
              next();
              var text_11 = text();
              template_effect(() => set_text(text_11, `Confidence: ${get(selected).confidence ?? ""}`));
              append2($$anchor4, text_11);
            },
            $$slots: { default: true }
          });
        };
        if_block(node_9, ($$render) => {
          if (get(selected).confidence) $$render(consequent_8);
        });
      }
      var node_10 = sibling(node_9, 2);
      {
        var consequent_9 = ($$anchor3) => {
          Pill($$anchor3, {
            tone: "warn",
            children: ($$anchor4, $$slotProps) => {
              next();
              var text_12 = text("From a background review, unverified");
              append2($$anchor4, text_12);
            },
            $$slots: { default: true }
          });
        };
        if_block(node_10, ($$render) => {
          if (get(selected).provenance?.kind === "background-dream") $$render(consequent_9);
        });
      }
      reset(div_5);
      var h2 = sibling(div_5, 2);
      var text_13 = only_child(h2, true);
      var p_2 = sibling(h2, 2);
      var span_4 = child(p_2);
      var text_14 = only_child(span_4, true);
      var node_11 = sibling(span_4, 2);
      {
        var consequent_10 = ($$anchor3) => {
          var fragment_13 = root_74();
          var a = sibling(first_child(fragment_13));
          var text_15 = only_child(a, true);
          template_effect(() => {
            set_attribute2(a, "href", `#/objectives#${get(selected).objective_id ?? get(selected).objective ?? ""}`);
            set_text(text_15, get(selected).objective_id ?? get(selected).objective);
          });
          append2($$anchor3, fragment_13);
        };
        if_block(node_11, ($$render) => {
          if (get(selected).objective_id || typeof get(selected).objective === "string") $$render(consequent_10);
        });
      }
      var node_12 = sibling(node_11, 2);
      {
        var consequent_11 = ($$anchor3) => {
          var text_16 = text();
          template_effect(() => set_text(text_16, `\xB7 owner ${get(selected).owner ?? ""}`));
          append2($$anchor3, text_16);
        };
        if_block(node_12, ($$render) => {
          if (get(selected).owner) $$render(consequent_11);
        });
      }
      var node_13 = sibling(node_12, 2);
      {
        var consequent_12 = ($$anchor3) => {
          var text_17 = text();
          template_effect(($0) => set_text(text_17, `\xB7 proposed ${$0 ?? ""}`), [() => ago(get(selected).created_at)]);
          append2($$anchor3, text_17);
        };
        if_block(node_13, ($$render) => {
          if (get(selected).created_at) $$render(consequent_12);
        });
      }
      var node_14 = sibling(node_13, 2);
      {
        var consequent_13 = ($$anchor3) => {
          var text_18 = text();
          template_effect(($0) => set_text(text_18, `\xB7 review by ${$0 ?? ""}`), [() => when(get(selected).review_by)]);
          append2($$anchor3, text_18);
        };
        if_block(node_14, ($$render) => {
          if (get(selected).review_by) $$render(consequent_13);
        });
      }
      reset(p_2);
      reset(header);
      var node_15 = sibling(header, 2);
      {
        var consequent_14 = ($$anchor3) => {
          var div_6 = root_84();
          var node_16 = child(div_6);
          Notice(node_16, {
            tone: "bad",
            children: ($$anchor4, $$slotProps) => {
              next();
              var text_19 = text();
              template_effect(() => set_text(text_19, `This file could not be parsed: ${get(selected).malformed ?? ""}`));
              append2($$anchor4, text_19);
            },
            $$slots: { default: true }
          });
          reset(div_6);
          append2($$anchor3, div_6);
        };
        var alternate_9 = ($$anchor3) => {
          var fragment_18 = root_642();
          var div_7 = first_child(fragment_18);
          var node_17 = child(div_7);
          each(node_17, 17, () => get(selected).check?.findings ?? [], index, ($$anchor4, finding) => {
            {
              let $0 = user_derived(() => get(selected).check.scope === "codebase" ? "bad" : "warn");
              Notice($$anchor4, {
                get tone() {
                  return get($0);
                },
                children: ($$anchor5, $$slotProps) => {
                  next();
                  var text_20 = text();
                  template_effect(() => set_text(text_20, get(finding).detail));
                  append2($$anchor5, text_20);
                },
                $$slots: { default: true }
              });
            }
          });
          var node_18 = sibling(node_17, 2);
          {
            var consequent_15 = ($$anchor4) => {
              var div_8 = root_94();
              var p_3 = sibling(child(div_8), 2);
              var text_21 = only_child(p_3, true);
              reset(div_8);
              template_effect(() => set_text(text_21, get(selected).intervention.summary));
              append2($$anchor4, div_8);
            };
            if_block(node_18, ($$render) => {
              if (get(selected).intervention?.summary) $$render(consequent_15);
            });
          }
          var node_19 = sibling(node_18, 2);
          {
            var consequent_16 = ($$anchor4) => {
              var div_9 = root_104();
              var p_4 = sibling(child(div_9), 2);
              var text_22 = only_child(p_4, true);
              reset(div_9);
              template_effect(() => set_text(text_22, get(selected).hypothesis));
              append2($$anchor4, div_9);
            };
            if_block(node_19, ($$render) => {
              if (get(selected).hypothesis) $$render(consequent_16);
            });
          }
          var div_10 = sibling(node_19, 2);
          var node_20 = sibling(child(div_10), 2);
          {
            var consequent_18 = ($$anchor4) => {
              var div_11 = root_134();
              each(div_11, 21, () => get(selected).scope.files, index, ($$anchor5, file) => {
                const side = user_derived(() => get(selected).check?.firstmate?.files?.[get(file)]);
                var span_5 = root_125();
                let classes;
                var node_21 = child(span_5);
                Icon(node_21, { name: "file", size: 12 });
                var text_23 = sibling(node_21, 1, true);
                var node_22 = sibling(text_23);
                {
                  var consequent_17 = ($$anchor6) => {
                    var span_6 = root_115();
                    var text_24 = only_child(span_6, true);
                    template_effect(() => set_text(text_24, get(side) === "captain-private" ? "captain-private" : "shared"));
                    append2($$anchor6, span_6);
                  };
                  if_block(node_22, ($$render) => {
                    if (get(side) === "captain-private" || get(side) === "shared-tracked") $$render(consequent_17);
                  });
                }
                reset(span_5);
                template_effect(
                  ($0) => {
                    classes = set_class(span_5, 1, "chip", null, classes, { outside: $0 });
                    set_text(text_23, get(file));
                  },
                  [() => get(selected).check?.outside?.includes(get(file))]
                );
                append2($$anchor5, span_5);
              });
              reset(div_11);
              append2($$anchor4, div_11);
            };
            var alternate_1 = ($$anchor4) => {
              var p_5 = root_144();
              append2($$anchor4, p_5);
            };
            if_block(node_20, ($$render) => {
              if (get(selected).scope?.files?.length) $$render(consequent_18);
              else $$render(alternate_1, -1);
            });
          }
          var node_23 = sibling(node_20, 2);
          {
            var consequent_19 = ($$anchor4) => {
              var p_6 = root_154();
              append2($$anchor4, p_6);
            };
            if_block(node_23, ($$render) => {
              if (get(selected).scope?.permissions_changed) $$render(consequent_19);
            });
          }
          reset(div_10);
          var div_12 = sibling(div_10, 2);
          var node_24 = sibling(child(div_12), 2);
          {
            var consequent_20 = ($$anchor4) => {
              var div_13 = root_174();
              var table = child(div_13);
              var tbody = sibling(child(table));
              each(tbody, 21, () => get(selected).evidence, index, ($$anchor5, item) => {
                var tr = root_164();
                var td = child(tr);
                var text_25 = only_child(td, true);
                var td_1 = sibling(td);
                var text_26 = only_child(td_1, true);
                reset(tr);
                template_effect(
                  ($0) => {
                    set_text(text_25, get(item).source ?? "unspecified");
                    set_text(text_26, $0);
                  },
                  [() => get(item).observation ?? JSON.stringify(get(item))]
                );
                append2($$anchor5, tr);
              });
              reset(tbody);
              reset(table);
              reset(div_13);
              append2($$anchor4, div_13);
            };
            var alternate_2 = ($$anchor4) => {
              var p_7 = root_183();
              append2($$anchor4, p_7);
            };
            if_block(node_24, ($$render) => {
              if (get(selected).evidence.length) $$render(consequent_20);
              else $$render(alternate_2, -1);
            });
          }
          reset(div_12);
          var node_25 = sibling(div_12, 2);
          {
            var consequent_25 = ($$anchor4) => {
              var div_14 = root_232();
              var dl = sibling(child(div_14), 2);
              var node_26 = child(dl);
              {
                var consequent_21 = ($$anchor5) => {
                  var fragment_21 = root_193();
                  var dd = sibling(first_child(fragment_21));
                  var text_27 = only_child(dd, true);
                  template_effect(() => set_text(text_27, get(selected).evaluation.baseline));
                  append2($$anchor5, fragment_21);
                };
                if_block(node_26, ($$render) => {
                  if (get(selected).evaluation.baseline) $$render(consequent_21);
                });
              }
              var node_27 = sibling(node_26, 2);
              {
                var consequent_22 = ($$anchor5) => {
                  var fragment_22 = root_20();
                  var dd_1 = sibling(first_child(fragment_22));
                  var text_28 = only_child(dd_1, true);
                  template_effect(() => set_text(text_28, get(selected).evaluation.candidate));
                  append2($$anchor5, fragment_22);
                };
                if_block(node_27, ($$render) => {
                  if (get(selected).evaluation.candidate) $$render(consequent_22);
                });
              }
              var node_28 = sibling(node_27, 2);
              {
                var consequent_23 = ($$anchor5) => {
                  var fragment_23 = root_21();
                  var dd_2 = sibling(first_child(fragment_23));
                  var text_29 = only_child(dd_2, true);
                  template_effect(($0) => set_text(text_29, $0), [() => get(selected).evaluation.pass_conditions.join("; ")]);
                  append2($$anchor5, fragment_23);
                };
                if_block(node_28, ($$render) => {
                  if (get(selected).evaluation.pass_conditions?.length) $$render(consequent_23);
                });
              }
              var node_29 = sibling(node_28, 2);
              {
                var consequent_24 = ($$anchor5) => {
                  var fragment_24 = root_222();
                  var dd_3 = sibling(first_child(fragment_24));
                  var text_30 = only_child(dd_3, true);
                  template_effect(($0) => set_text(text_30, $0), [
                    () => get(selected).evaluation.regression_conditions.join("; ")
                  ]);
                  append2($$anchor5, fragment_24);
                };
                if_block(node_29, ($$render) => {
                  if (get(selected).evaluation.regression_conditions?.length) $$render(consequent_24);
                });
              }
              reset(dl);
              reset(div_14);
              append2($$anchor4, div_14);
            };
            if_block(node_25, ($$render) => {
              if (get(selected).evaluation && (get(selected).evaluation.baseline || get(selected).evaluation.candidate || get(selected).evaluation.pass_conditions?.length)) $$render(consequent_25);
            });
          }
          var node_30 = sibling(node_25, 2);
          {
            var consequent_26 = ($$anchor4) => {
              Notice($$anchor4, {
                tone: "warn",
                children: ($$anchor5, $$slotProps) => {
                  var fragment_26 = root_252();
                  var ul_1 = sibling(first_child(fragment_26), 2);
                  each(ul_1, 21, () => get(selected).reasons_to_reject, index, ($$anchor6, item) => {
                    var li_1 = root_242();
                    var text_31 = only_child(li_1, true);
                    template_effect(() => set_text(text_31, get(item)));
                    append2($$anchor6, li_1);
                  });
                  reset(ul_1);
                  append2($$anchor5, fragment_26);
                },
                $$slots: { default: true }
              });
            };
            if_block(node_30, ($$render) => {
              if (get(selected).reasons_to_reject.length) $$render(consequent_26);
            });
          }
          var node_31 = sibling(node_30, 2);
          {
            var consequent_29 = ($$anchor4) => {
              var div_15 = root_282();
              var node_32 = child(div_15);
              {
                var consequent_27 = ($$anchor5) => {
                  var div_16 = root_262();
                  var ul_2 = sibling(child(div_16), 2);
                  each(ul_2, 21, () => get(selected).risks, index, ($$anchor6, risk) => {
                    var li_2 = root_242();
                    var text_32 = only_child(li_2, true);
                    template_effect(() => set_text(text_32, get(risk)));
                    append2($$anchor6, li_2);
                  });
                  reset(ul_2);
                  reset(div_16);
                  append2($$anchor5, div_16);
                };
                if_block(node_32, ($$render) => {
                  if (get(selected).risks.length) $$render(consequent_27);
                });
              }
              var node_33 = sibling(node_32, 2);
              {
                var consequent_28 = ($$anchor5) => {
                  var div_17 = root_272();
                  var p_8 = sibling(child(div_17), 2);
                  var text_33 = only_child(p_8, true);
                  reset(div_17);
                  template_effect(() => set_text(text_33, get(selected).rollback));
                  append2($$anchor5, div_17);
                };
                if_block(node_33, ($$render) => {
                  if (get(selected).rollback) $$render(consequent_28);
                });
              }
              reset(div_15);
              append2($$anchor4, div_15);
            };
            if_block(node_31, ($$render) => {
              if (get(selected).risks.length || get(selected).rollback) $$render(consequent_29);
            });
          }
          var node_34 = sibling(node_31, 2);
          {
            var consequent_30 = ($$anchor4) => {
              var details2 = root_30();
              var summary_1 = child(details2);
              var text_34 = only_child(summary_1);
              var ul_3 = sibling(summary_1, 2);
              each(ul_3, 21, () => get(selected).check.prose, index, ($$anchor5, issue) => {
                var li_3 = root_29();
                var span_7 = child(li_3);
                var text_35 = only_child(span_7);
                var text_36 = sibling(span_7);
                reset(li_3);
                template_effect(() => {
                  set_text(text_35, `${get(issue).field ?? ""}:`);
                  set_text(text_36, ` "${get(issue).match ?? ""}". ${get(issue).fix ?? ""}`);
                });
                append2($$anchor5, li_3);
              });
              reset(ul_3);
              reset(details2);
              template_effect(($0) => set_text(text_34, `Writing check: ${$0 ?? ""}`), [() => plural2(get(selected).check.prose.length, "issue")]);
              append2($$anchor4, details2);
            };
            if_block(node_34, ($$render) => {
              if (get(selected).check?.prose?.length) $$render(consequent_30);
            });
          }
          var node_35 = sibling(node_34, 2);
          {
            var consequent_40 = ($$anchor4) => {
              var div_18 = root_39();
              var div_19 = child(div_18);
              var node_36 = sibling(child(div_19), 2);
              {
                var consequent_31 = ($$anchor5) => {
                  var button_2 = root_31();
                  var node_37 = child(button_2);
                  Icon(node_37, { name: "sparkles", size: 13 });
                  var text_37 = sibling(node_37, 1, true);
                  reset(button_2);
                  template_effect(() => set_text(text_37, get(selected).skill_draft ? "Draft again" : "Draft a skill"));
                  delegated("click", button_2, draft);
                  append2($$anchor5, button_2);
                };
                if_block(node_36, ($$render) => {
                  if (get(decidable) && !get(draftJob)) $$render(consequent_31);
                });
              }
              reset(div_19);
              var node_38 = sibling(div_19, 2);
              {
                var consequent_32 = ($$anchor5) => {
                  var div_20 = root_322();
                  var node_39 = child(div_20);
                  JobCard(node_39, {
                    get job() {
                      return get(draftJob);
                    }
                  });
                  reset(div_20);
                  append2($$anchor5, div_20);
                };
                var consequent_33 = ($$anchor5) => {
                  var div_21 = root_322();
                  var node_40 = child(div_21);
                  JobCard(node_40, {
                    get job() {
                      return get(lastDraftJob);
                    }
                  });
                  reset(div_21);
                  append2($$anchor5, div_21);
                };
                if_block(node_38, ($$render) => {
                  if (get(draftJob)) $$render(consequent_32);
                  else if (get(lastDraftJob) && get(lastDraftJob).status !== "completed" && !get(selected).skill_draft) $$render(consequent_33, 1);
                });
              }
              var node_41 = sibling(node_38, 2);
              {
                var consequent_38 = ($$anchor5) => {
                  var fragment_27 = comment();
                  var node_42 = first_child(fragment_27);
                  {
                    var consequent_34 = ($$anchor6) => {
                      var p_9 = root_332();
                      append2($$anchor6, p_9);
                    };
                    var consequent_35 = ($$anchor6) => {
                      Notice($$anchor6, {
                        tone: "bad",
                        children: ($$anchor7, $$slotProps) => {
                          next();
                          var text_38 = text();
                          template_effect(() => set_text(text_38, get(diff).error));
                          append2($$anchor7, text_38);
                        },
                        $$slots: { default: true }
                      });
                    };
                    var alternate_3 = ($$anchor6) => {
                      var div_22 = root_372();
                      var p_10 = child(div_22);
                      var text_39 = child(p_10);
                      var code = sibling(text_39);
                      var text_40 = only_child(code, true);
                      var text_41 = sibling(code);
                      var node_43 = sibling(text_41);
                      {
                        var consequent_36 = ($$anchor7) => {
                          var strong_2 = root_342();
                          append2($$anchor7, strong_2);
                        };
                        if_block(node_43, ($$render) => {
                          if (get(diff).exists && get(diff).plugin_authored === false) $$render(consequent_36);
                        });
                      }
                      reset(p_10);
                      var node_44 = sibling(p_10, 2);
                      {
                        var consequent_37 = ($$anchor7) => {
                          {
                            let $0 = user_derived(() => get(diff).blocked ? "bad" : "warn");
                            Notice($$anchor7, {
                              get tone() {
                                return get($0);
                              },
                              children: ($$anchor8, $$slotProps) => {
                                var fragment_31 = root_362();
                                var p_11 = first_child(fragment_31);
                                var strong_3 = child(p_11);
                                var text_42 = only_child(strong_3, true);
                                reset(p_11);
                                var ul_4 = sibling(p_11, 2);
                                each(ul_4, 21, () => get(diff).findings, index, ($$anchor9, $$item) => {
                                  var $$array_1 = user_derived(() => to_array(get($$item), 2));
                                  let family = () => get($$array_1)[0];
                                  let detail = () => get($$array_1)[1];
                                  var li_4 = root_352();
                                  var span_8 = child(li_4);
                                  var text_43 = only_child(span_8, true);
                                  var text_44 = sibling(span_8);
                                  reset(li_4);
                                  template_effect(() => {
                                    set_text(text_43, family());
                                    set_text(text_44, `: ${detail() ?? ""}`);
                                  });
                                  append2($$anchor9, li_4);
                                });
                                reset(ul_4);
                                template_effect(() => set_text(text_42, get(diff).blocked ? "This draft cannot be applied." : "Check these before applying."));
                                append2($$anchor8, fragment_31);
                              },
                              $$slots: { default: true }
                            });
                          }
                        };
                        if_block(node_44, ($$render) => {
                          if (get(diff).findings?.length) $$render(consequent_37);
                        });
                      }
                      var node_45 = sibling(node_44, 2);
                      Diff(node_45, {
                        get current() {
                          return get(diff).current;
                        },
                        get proposed() {
                          return get(diff).proposed;
                        },
                        get path() {
                          return get(diff).target;
                        }
                      });
                      reset(div_22);
                      template_effect(
                        ($0) => {
                          set_text(text_39, `${get(diff).exists ? "Replaces" : "Creates"} `);
                          set_text(text_40, get(diff).target);
                          set_text(text_41, `.
                        Drafted ${$0 ?? ""} by a read-only agent. `);
                        },
                        [() => ago(get(selected).skill_draft.drafted_at)]
                      );
                      append2($$anchor6, div_22);
                    };
                    if_block(node_42, ($$render) => {
                      if (!get(diff)) $$render(consequent_34);
                      else if (get(diff).error) $$render(consequent_35, 1);
                      else $$render(alternate_3, -1);
                    });
                  }
                  append2($$anchor5, fragment_27);
                };
                var consequent_39 = ($$anchor5) => {
                  var p_12 = root_382();
                  append2($$anchor5, p_12);
                };
                if_block(node_41, ($$render) => {
                  if (get(selected).skill_draft) $$render(consequent_38);
                  else if (!get(draftJob)) $$render(consequent_39, 1);
                });
              }
              reset(div_18);
              append2($$anchor4, div_18);
            };
            if_block(node_35, ($$render) => {
              if (get(selected).skill_draft || get(decidable) && get(selected).check?.scope !== "codebase") $$render(consequent_40);
            });
          }
          var node_46 = sibling(node_35, 2);
          {
            var consequent_41 = ($$anchor4) => {
              var div_23 = root_40();
              var div_24 = child(div_23);
              var text_45 = only_child(div_24, true);
              var div_25 = sibling(div_24, 2);
              var node_47 = child(div_25);
              ApplyResult(node_47, {
                get job() {
                  return get(lastApplyJob);
                }
              });
              reset(div_25);
              reset(div_23);
              template_effect(() => set_text(text_45, get(lastApplyJob).detail?.mode === "upstream-pr" ? "Upstream change" : "Apply run"));
              append2($$anchor4, div_23);
            };
            if_block(node_46, ($$render) => {
              if (get(lastApplyJob)) $$render(consequent_41);
            });
          }
          var node_48 = sibling(node_46, 2);
          {
            var consequent_44 = ($$anchor4) => {
              var div_26 = root_442();
              var ul_5 = sibling(child(div_26), 2);
              each(ul_5, 21, () => get(decisions), index, ($$anchor5, decision) => {
                var li_5 = root_432();
                var div_27 = child(li_5);
                var node_49 = child(div_27);
                {
                  let $0 = user_derived(() => get(decision).decision === "rejected" ? "bad" : "ok");
                  Pill(node_49, {
                    get tone() {
                      return get($0);
                    },
                    children: ($$anchor6, $$slotProps) => {
                      next();
                      var text_46 = text();
                      template_effect(() => set_text(text_46, get(decision).decision === "rejected" ? "Rejected" : "Approved"));
                      append2($$anchor6, text_46);
                    },
                    $$slots: { default: true }
                  });
                }
                var span_9 = sibling(node_49, 2);
                var text_47 = only_child(span_9);
                reset(div_27);
                var node_50 = sibling(div_27, 2);
                {
                  var consequent_42 = ($$anchor6) => {
                    var p_13 = root_41();
                    var text_48 = only_child(p_13, true);
                    template_effect(() => set_text(text_48, get(decision).rationale));
                    append2($$anchor6, p_13);
                  };
                  if_block(node_50, ($$render) => {
                    if (get(decision).rationale) $$render(consequent_42);
                  });
                }
                var node_51 = sibling(node_50, 2);
                {
                  var consequent_43 = ($$anchor6) => {
                    var p_14 = root_422();
                    var text_49 = only_child(p_14);
                    template_effect(($0) => set_text(text_49, `Wrote ${$0 ?? ""}`), [() => get(decision).applied_files.join(", ")]);
                    append2($$anchor6, p_14);
                  };
                  if_block(node_51, ($$render) => {
                    if (get(decision).applied_files.length) $$render(consequent_43);
                  });
                }
                reset(li_5);
                template_effect(($0) => set_text(text_47, `${$0 ?? ""} \xB7 ${get(decision).decided_by ?? "unknown" ?? ""}`), [() => when(get(decision).decided_at)]);
                append2($$anchor5, li_5);
              });
              reset(ul_5);
              reset(div_26);
              append2($$anchor4, div_26);
            };
            if_block(node_48, ($$render) => {
              if (get(decisions).length) $$render(consequent_44);
            });
          }
          reset(div_7);
          var node_52 = sibling(div_7, 2);
          {
            var consequent_46 = ($$anchor4) => {
              var div_28 = root_47();
              var node_53 = child(div_28);
              Notice(node_53, {
                get tone() {
                  return get(notice).tone;
                },
                children: ($$anchor5, $$slotProps) => {
                  var fragment_33 = root_462();
                  var p_15 = first_child(fragment_33);
                  var text_50 = only_child(p_15, true);
                  var node_54 = sibling(p_15, 2);
                  {
                    var consequent_45 = ($$anchor6) => {
                      var p_16 = root_452();
                      var text_51 = only_child(p_16, true);
                      template_effect(() => set_text(text_51, get(notice).hint));
                      append2($$anchor6, p_16);
                    };
                    if_block(node_54, ($$render) => {
                      if (get(notice).hint) $$render(consequent_45);
                    });
                  }
                  template_effect(() => set_text(text_50, get(notice).text));
                  append2($$anchor5, fragment_33);
                },
                $$slots: { default: true }
              });
              reset(div_28);
              append2($$anchor4, div_28);
            };
            if_block(node_52, ($$render) => {
              if (get(notice)) $$render(consequent_46);
            });
          }
          var node_55 = sibling(node_52, 2);
          {
            var consequent_51 = ($$anchor4) => {
              var footer = root_532();
              var textarea = sibling(child(footer), 2);
              remove_textarea_child(textarea);
              bind_this(textarea, ($$value) => set(reasonBox, $$value), () => get(reasonBox));
              var node_56 = sibling(textarea, 2);
              {
                var consequent_47 = ($$anchor5) => {
                  var p_17 = root_48();
                  var text_52 = only_child(p_17, true);
                  template_effect(() => set_text(text_52, get(reasonError)));
                  append2($$anchor5, p_17);
                };
                if_block(node_56, ($$render) => {
                  if (get(reasonError)) $$render(consequent_47);
                });
              }
              var div_29 = sibling(node_56, 2);
              var p_18 = child(div_29);
              var node_57 = child(p_18);
              {
                var consequent_48 = ($$anchor5) => {
                  var fragment_34 = root_49();
                  var code_1 = sibling(first_child(fragment_34));
                  var text_53 = only_child(code_1, true);
                  next();
                  template_effect(() => set_text(text_53, get(diff).target));
                  append2($$anchor5, fragment_34);
                };
                var alternate_4 = ($$anchor5) => {
                  var fragment_35 = root_50();
                  var code_2 = sibling(first_child(fragment_35));
                  var text_54 = only_child(code_2);
                  next();
                  template_effect(() => set_text(text_54, `/improve apply ${get(selected).id ?? ""}`));
                  append2($$anchor5, fragment_35);
                };
                if_block(node_57, ($$render) => {
                  if (get(selected).skill_draft && get(diff) && !get(diff).error) $$render(consequent_48);
                  else $$render(alternate_4, -1);
                });
              }
              reset(p_18);
              var div_30 = sibling(p_18, 2);
              var button_3 = child(div_30);
              var node_58 = child(button_3);
              Icon(node_58, { name: "x", size: 14 });
              var text_55 = sibling(node_58, 1, true);
              reset(button_3);
              var node_59 = sibling(button_3, 2);
              {
                var consequent_49 = ($$anchor5) => {
                  var button_4 = root_51();
                  template_effect(($0) => button_4.disabled = $0, [() => get(busy) !== null || Boolean(get(draftJob))]);
                  delegated("click", button_4, () => decide("apply", { overwrite: true }));
                  append2($$anchor5, button_4);
                };
                if_block(node_59, ($$render) => {
                  if (get(confirmOverwrite)) $$render(consequent_49);
                });
              }
              var node_60 = sibling(node_59, 2);
              {
                var consequent_50 = ($$anchor5) => {
                  var button_5 = root_522();
                  var node_61 = child(button_5);
                  Icon(node_61, { name: "check", size: 14 });
                  var text_56 = sibling(node_61, 1, true);
                  reset(button_5);
                  template_effect(
                    ($0) => {
                      button_5.disabled = $0;
                      set_text(text_56, get(busy) === "apply" ? "Writing\u2026" : "Approve and write skill");
                    },
                    [
                      () => get(busy) !== null || Boolean(get(draftJob)) || get(diff).blocked
                    ]
                  );
                  delegated("click", button_5, () => decide("apply"));
                  append2($$anchor5, button_5);
                };
                var alternate_5 = ($$anchor5) => {
                  var button_6 = root_522();
                  var node_62 = child(button_6);
                  Icon(node_62, { name: "check", size: 14 });
                  var text_57 = sibling(node_62, 1, true);
                  reset(button_6);
                  template_effect(
                    ($0) => {
                      button_6.disabled = $0;
                      set_text(text_57, get(busy) === "approve" ? "Approving\u2026" : "Approve");
                    },
                    [() => get(busy) !== null || Boolean(get(draftJob))]
                  );
                  delegated("click", button_6, () => decide("approve"));
                  append2($$anchor5, button_6);
                };
                if_block(node_60, ($$render) => {
                  if (get(selected).skill_draft && get(diff) && !get(diff).error) $$render(consequent_50);
                  else $$render(alternate_5, -1);
                });
              }
              reset(div_30);
              reset(div_29);
              reset(footer);
              template_effect(
                ($0) => {
                  set_attribute2(textarea, "aria-invalid", get(reasonError) ? "true" : void 0);
                  set_attribute2(textarea, "aria-describedby", get(reasonError) ? "reason-error" : "reason-help");
                  button_3.disabled = $0;
                  set_text(text_55, get(busy) === "reject" ? "Rejecting\u2026" : "Reject");
                },
                [() => get(busy) !== null || Boolean(get(draftJob))]
              );
              bind_value(textarea, () => get(reason), ($$value) => set(reason, $$value));
              delegated("click", button_3, () => decide("reject"));
              append2($$anchor4, footer);
            };
            var consequent_58 = ($$anchor4) => {
              var footer_1 = root_632();
              var node_63 = child(footer_1);
              {
                var consequent_52 = ($$anchor5) => {
                  JobCard($$anchor5, {
                    get job() {
                      return get(applyJob);
                    }
                  });
                };
                var consequent_53 = ($$anchor5) => {
                  var p_19 = root_542();
                  append2($$anchor5, p_19);
                };
                var consequent_54 = ($$anchor5) => {
                  var fragment_37 = root_552();
                  var p_20 = first_child(fragment_37);
                  var text_58 = only_child(p_20);
                  var p_21 = sibling(p_20, 2);
                  var code_3 = sibling(child(p_21));
                  var text_59 = only_child(code_3);
                  next();
                  reset(p_21);
                  template_effect(() => {
                    set_text(text_58, `Approved, but it cannot be applied from here: ${get(plan).error ?? ""}`);
                    set_text(text_59, `/improve apply ${get(selected).id ?? ""}`);
                  });
                  append2($$anchor5, fragment_37);
                };
                var consequent_56 = ($$anchor5) => {
                  var div_31 = root_60();
                  var p_22 = child(div_31);
                  var strong_4 = child(p_22);
                  var text_60 = only_child(strong_4, true);
                  reset(p_22);
                  var p_23 = sibling(p_22, 2);
                  var text_61 = only_child(p_23, true);
                  var ul_6 = sibling(p_23, 2);
                  each(ul_6, 21, () => get(plan).files, index, ($$anchor6, file) => {
                    var li_6 = root_56();
                    var span_10 = child(li_6);
                    var node_64 = child(span_10);
                    Icon(node_64, { name: "file", size: 12 });
                    var text_62 = sibling(node_64, 1, true);
                    reset(span_10);
                    reset(li_6);
                    template_effect(() => set_text(text_62, get(file)));
                    append2($$anchor6, li_6);
                  });
                  reset(ul_6);
                  var ul_7 = sibling(ul_6, 4);
                  each(ul_7, 21, () => get(plan).commands, index, ($$anchor6, command) => {
                    var li_7 = root_57();
                    var code_4 = child(li_7);
                    var text_63 = only_child(code_4, true);
                    reset(li_7);
                    template_effect(() => set_text(text_63, get(command)));
                    append2($$anchor6, li_7);
                  });
                  reset(ul_7);
                  var node_65 = sibling(ul_7, 4);
                  {
                    var consequent_55 = ($$anchor6) => {
                      var ul_8 = root_58();
                      each(ul_8, 21, () => get(plan).outputs, index, ($$anchor7, output) => {
                        var li_8 = root_57();
                        var code_5 = child(li_8);
                        var text_64 = only_child(code_5, true);
                        reset(li_8);
                        template_effect(() => set_text(text_64, get(output)));
                        append2($$anchor7, li_8);
                      });
                      reset(ul_8);
                      append2($$anchor6, ul_8);
                    };
                    var alternate_6 = ($$anchor6) => {
                      var p_24 = root_59();
                      append2($$anchor6, p_24);
                    };
                    if_block(node_65, ($$render) => {
                      if (get(plan).outputs?.length) $$render(consequent_55);
                      else $$render(alternate_6, -1);
                    });
                  }
                  var p_25 = sibling(node_65, 2);
                  var text_65 = only_child(p_25);
                  var div_32 = sibling(p_25, 2);
                  var button_7 = child(div_32);
                  var button_8 = sibling(button_7, 2);
                  var node_66 = child(button_8);
                  Icon(node_66, { name: "check", size: 14 });
                  var text_66 = sibling(node_66, 1, true);
                  reset(button_8);
                  reset(div_32);
                  reset(div_31);
                  template_effect(() => {
                    set_text(text_60, get(plan).mode === "upstream-pr" ? `Prepare branch ${get(plan).branch}?` : "Apply this proposal?");
                    set_text(text_61, get(plan).mode === "upstream-pr" ? "The run changes exactly these files on the new branch, not here:" : "The run changes exactly these files in this repository:");
                    set_text(text_65, `${get(plan).explanation ?? ""} A change to any other file fails the run, and a command not listed stops it.`);
                    button_7.disabled = get(busy) !== null;
                    button_8.disabled = get(busy) !== null;
                    set_text(text_66, get(busy) === "apply-run" ? "Starting\u2026" : get(plan).mode === "upstream-pr" ? "Confirm and prepare branch" : "Confirm and apply");
                  });
                  delegated("click", button_7, () => {
                    set(confirming, false);
                  });
                  delegated("click", button_8, startApply);
                  append2($$anchor5, div_31);
                };
                var alternate_8 = ($$anchor5) => {
                  var div_33 = root_622();
                  var p_26 = child(div_33);
                  var node_67 = child(p_26);
                  {
                    var consequent_57 = ($$anchor6) => {
                      var fragment_38 = root_61();
                      var code_6 = sibling(first_child(fragment_38));
                      var text_67 = only_child(code_6, true);
                      next();
                      template_effect(() => set_text(text_67, get(selected).upstream_change.branch));
                      append2($$anchor6, fragment_38);
                    };
                    var alternate_7 = ($$anchor6) => {
                      var text_68 = text();
                      template_effect(() => set_text(text_68, `Approved and waiting to be applied. ${get(plan).mode === "upstream-pr" ? "These are shared Firstmate files, so the change is prepared on a branch for a pull request." : "Applying rechecks the proposal, makes the change, and runs its evaluation, as /improve apply does."}`));
                      append2($$anchor6, text_68);
                    };
                    if_block(node_67, ($$render) => {
                      if (get(selected).upstream_change) $$render(consequent_57);
                      else $$render(alternate_7, -1);
                    });
                  }
                  reset(p_26);
                  var div_34 = sibling(p_26, 2);
                  var button_9 = child(div_34);
                  var node_68 = child(button_9);
                  Icon(node_68, { name: "play", size: 14 });
                  var text_69 = sibling(node_68);
                  reset(button_9);
                  reset(div_34);
                  reset(div_33);
                  template_effect(() => {
                    button_9.disabled = get(busy) !== null;
                    set_text(text_69, `${get(plan).action ?? ""}\u2026`);
                  });
                  delegated("click", button_9, () => {
                    set(confirming, true);
                  });
                  append2($$anchor5, div_33);
                };
                if_block(node_63, ($$render) => {
                  if (get(applyJob)) $$render(consequent_52);
                  else if (!get(plan)) $$render(consequent_53, 1);
                  else if (get(plan).error) $$render(consequent_54, 2);
                  else if (get(confirming)) $$render(consequent_56, 3);
                  else $$render(alternate_8, -1);
                });
              }
              reset(footer_1);
              append2($$anchor4, footer_1);
            };
            if_block(node_55, ($$render) => {
              if (get(decidable)) $$render(consequent_51);
              else if (get(selected).status === "approved") $$render(consequent_58, 1);
            });
          }
          append2($$anchor3, fragment_18);
        };
        if_block(node_15, ($$render) => {
          if (get(selected).malformed) $$render(consequent_14);
          else $$render(alternate_9, -1);
        });
      }
      reset(article);
      template_effect(() => {
        set_text(text_13, get(selected).title);
        set_text(text_14, get(selected).id);
      });
      append2($$anchor2, article);
    };
    if_block(node_5, ($$render) => {
      if (!get(selected)) $$render(consequent_6);
      else $$render(alternate_10, -1);
    });
  }
  reset(section_1);
  reset(div);
  append2($$anchor, fragment);
  pop();
}
delegate(["click"]);

// ../ui/src/routes/findings/+page.svelte
var root12 = from_html(`<div class="panel"><!></div>`);
var root_116 = from_html(`<p class="small"> </p>`);
var root_210 = from_html(`<p> </p><!>`, 1);
var root_310 = from_html(`<div class="panel empty"><strong>No background findings.</strong> Run a background review here, or enable <code>background_dreaming</code> in <code>.harness/improve.json</code> to run one after sessions. The agent cannot edit anything; it only reports.</div>`);
var root_410 = from_html(`<span class="small faint num"> </span>`);
var root_510 = from_html(`<button class="ghost small"><!> </button>`);
var root_67 = from_html(`<div class="panel-body"><!></div>`);
var root_75 = from_html(`<p class="prose muted" style="margin-top:6px"> </p>`);
var root_85 = from_html(`<p class="prose" style="margin-top:8px"><span class="faint">Suggested change:</span> </p>`);
var root_95 = from_html(`<li><span class="mono faint"> </span> </li>`);
var root_105 = from_html(`<ul class="small" style="margin-top:8px"></ul>`);
var root_117 = from_html(`<p class="small" style="margin-top:8px;color:var(--warn)"> </p>`);
var root_126 = from_html(`<li class="finding svelte-z6npyg"><div class="spread" style="align-items:flex-start"><h3 class="grow"> </h3> <button class="small">Review as a proposal</button></div> <!> <!> <!> <!></li>`);
var root_135 = from_html(`<section class="panel"><div class="panel-head"><h2> <!> <!></h2> <div class="row"><!> <button class="ghost small danger">Dismiss report</button></div></div> <!> <!> <ul class="list"></ul></section>`);
var root_145 = from_html(
  `<div class="page-head"><div><h1>Background findings</h1> <p>Ideas from a read-only agent that looked through this repository. They are unverified and stay outside the
      repository. Import one to review it as a proposal, or dismiss the report.</p></div> <button class="primary"><!> </button></div> <div class="stack" style="gap:16px"><!> <!> <!> <!></div>`,
  1
);
var $$css5 = {
  hash: "svelte-z6npyg",
  code: ".finding.svelte-z6npyg {padding:14px 16px;}"
};
function _page3($$anchor, $$props) {
  push($$props, true);
  append_styles($$anchor, $$css5);
  let notice = state(
    /** @type {{ tone: "ok" | "warn" | "bad" | "", text: string, hint?: string } | null} */
    null
  );
  let busy = state(
    /** @type {string | null} */
    null
  );
  let openLog = state(
    /** @type {string | null} */
    null
  );
  const reports = user_derived(() => summary.dreams);
  const running = user_derived(() => jobs.list.find((job) => job.kind === "dream" && job.status === "running"));
  const lastRun = user_derived(() => jobs.list.find((job) => job.kind === "dream"));
  async function runReview() {
    set(notice, null);
    try {
      const { job } = await api("/api/dreams", { method: "POST" });
      await refreshJobs();
      await settled2(job.id);
      await refreshSummary();
    } catch (cause) {
      const error = (
        /** @type {any} */
        cause
      );
      set(notice, { tone: "bad", text: error.message, hint: error.hint }, true);
    }
  }
  async function importFinding(file, index3) {
    set(busy, `${file}:${index3}`);
    set(notice, null);
    try {
      const value = await api(`/api/dreams/${encodeURIComponent(file)}/import`, { method: "POST", body: { index: index3 } });
      await refreshSummary();
      goto(`/proposals?view=waiting&p=${encodeURIComponent(value.proposal)}`);
    } catch (error) {
      set(notice, { tone: "bad", text: (
        /** @type {Error} */
        error.message
      ) }, true);
    } finally {
      set(busy, null);
    }
  }
  async function dismiss(file) {
    set(busy, file, true);
    set(notice, null);
    try {
      await api(`/api/dreams/${encodeURIComponent(file)}/dismiss`, { method: "POST" });
      set(
        notice,
        {
          tone: "",
          text: "Dismissed. The report is deleted; nothing was imported."
        },
        true
      );
      await refreshSummary();
    } catch (error) {
      set(notice, { tone: "bad", text: (
        /** @type {Error} */
        error.message
      ) }, true);
    } finally {
      set(busy, null);
    }
  }
  function reportTitle(report) {
    return report.produced_at ? `Background review, ${ago(report.produced_at)}` : report.file;
  }
  var fragment = root_145();
  var div = first_child(fragment);
  var button = sibling(child(div), 2);
  var node = child(button);
  Icon(node, { name: "play", size: 14 });
  var text2 = sibling(node, 1, true);
  reset(button);
  reset(div);
  var div_1 = sibling(div, 2);
  var node_1 = child(div_1);
  {
    var consequent = ($$anchor2) => {
      var div_2 = root12();
      var node_2 = child(div_2);
      JobCard(node_2, {
        get job() {
          return get(running);
        }
      });
      reset(div_2);
      append2($$anchor2, div_2);
    };
    var consequent_1 = ($$anchor2) => {
      var div_3 = root12();
      var node_3 = child(div_3);
      JobCard(node_3, {
        get job() {
          return get(lastRun);
        }
      });
      reset(div_3);
      append2($$anchor2, div_3);
    };
    if_block(node_1, ($$render) => {
      if (get(running)) $$render(consequent);
      else if (get(lastRun) && get(lastRun).status !== "completed" && get(lastRun).error) $$render(consequent_1, 1);
    });
  }
  var node_4 = sibling(node_1, 2);
  {
    var consequent_3 = ($$anchor2) => {
      Notice($$anchor2, {
        get tone() {
          return get(notice).tone;
        },
        children: ($$anchor3, $$slotProps) => {
          var fragment_2 = root_210();
          var p = first_child(fragment_2);
          var text_1 = only_child(p, true);
          var node_5 = sibling(p);
          {
            var consequent_2 = ($$anchor4) => {
              var p_1 = root_116();
              var text_2 = only_child(p_1, true);
              template_effect(() => set_text(text_2, get(notice).hint));
              append2($$anchor4, p_1);
            };
            if_block(node_5, ($$render) => {
              if (get(notice).hint) $$render(consequent_2);
            });
          }
          template_effect(() => set_text(text_1, get(notice).text));
          append2($$anchor3, fragment_2);
        },
        $$slots: { default: true }
      });
    };
    if_block(node_4, ($$render) => {
      if (get(notice)) $$render(consequent_3);
    });
  }
  var node_6 = sibling(node_4, 2);
  {
    var consequent_4 = ($$anchor2) => {
      var div_4 = root_310();
      append2($$anchor2, div_4);
    };
    if_block(node_6, ($$render) => {
      if (summary.loaded && get(reports).length === 0) $$render(consequent_4);
    });
  }
  var node_7 = sibling(node_6, 2);
  each(node_7, 17, () => get(reports), (report) => report.file, ($$anchor2, report) => {
    var section = root_135();
    var div_5 = child(section);
    var h2 = child(div_5);
    var text_3 = child(h2);
    var node_8 = sibling(text_3);
    {
      var consequent_5 = ($$anchor3) => {
        Pill($$anchor3, {
          plain: true,
          children: ($$anchor4, $$slotProps) => {
            next();
            var text_4 = text();
            template_effect(($0) => set_text(text_4, $0), [() => plural2(get(report).findings.length, "finding")]);
            append2($$anchor4, text_4);
          },
          $$slots: { default: true }
        });
      };
      var alternate = ($$anchor3) => {
        {
          let $0 = user_derived(() => get(report).status === "cancelled" ? "" : "bad");
          Pill($$anchor3, {
            get tone() {
              return get($0);
            },
            children: ($$anchor4, $$slotProps) => {
              next();
              var text_5 = text();
              template_effect(() => set_text(text_5, get(report).status === "unreadable" ? "Unreadable" : get(report).status === "cancelled" ? "Cancelled" : "Failed"));
              append2($$anchor4, text_5);
            },
            $$slots: { default: true }
          });
        }
      };
      if_block(node_8, ($$render) => {
        if (get(report).status === "completed") $$render(consequent_5);
        else $$render(alternate, -1);
      });
    }
    var node_9 = sibling(node_8, 2);
    {
      var consequent_6 = ($$anchor3) => {
        var span = root_410();
        var text_6 = only_child(span);
        template_effect(($0) => set_text(text_6, `$${$0 ?? ""}`), [() => get(report).cost_usd.toFixed(2)]);
        append2($$anchor3, span);
      };
      if_block(node_9, ($$render) => {
        if (get(report).cost_usd) $$render(consequent_6);
      });
    }
    reset(h2);
    var div_6 = sibling(h2, 2);
    var node_10 = child(div_6);
    {
      var consequent_7 = ($$anchor3) => {
        var button_1 = root_510();
        var node_11 = child(button_1);
        Icon(node_11, { name: "terminal", size: 13 });
        var text_7 = sibling(node_11, 1, true);
        reset(button_1);
        template_effect(() => set_text(text_7, get(openLog) === get(report).file ? "Hide log" : "Log"));
        delegated("click", button_1, () => {
          set(openLog, get(openLog) === get(report).file ? null : get(report).file, true);
        });
        append2($$anchor3, button_1);
      };
      if_block(node_10, ($$render) => {
        if (get(report).log) $$render(consequent_7);
      });
    }
    var button_2 = sibling(node_10, 2);
    reset(div_6);
    reset(div_5);
    var node_12 = sibling(div_5, 2);
    {
      var consequent_8 = ($$anchor3) => {
        var div_7 = root_67();
        var node_13 = child(div_7);
        Notice(node_13, {
          tone: "bad",
          children: ($$anchor4, $$slotProps) => {
            next();
            var text_8 = text();
            template_effect(() => set_text(text_8, get(report).error));
            append2($$anchor4, text_8);
          },
          $$slots: { default: true }
        });
        reset(div_7);
        append2($$anchor3, div_7);
      };
      if_block(node_12, ($$render) => {
        if (get(report).error) $$render(consequent_8);
      });
    }
    var node_14 = sibling(node_12, 2);
    {
      var consequent_9 = ($$anchor3) => {
        var div_8 = root_67();
        var node_15 = child(div_8);
        {
          let $0 = user_derived(() => encodeURIComponent(get(report).file));
          LogView(node_15, {
            get url() {
              return `/api/dreams/${get($0) ?? ""}/log`;
            }
          });
        }
        reset(div_8);
        append2($$anchor3, div_8);
      };
      if_block(node_14, ($$render) => {
        if (get(openLog) === get(report).file) $$render(consequent_9);
      });
    }
    var ul = sibling(node_14, 2);
    each(ul, 21, () => get(report).findings, index, ($$anchor3, finding) => {
      var li = root_126();
      var div_9 = child(li);
      var h3 = child(div_9);
      var text_9 = only_child(h3, true);
      var button_3 = sibling(h3, 2);
      reset(div_9);
      var node_16 = sibling(div_9, 2);
      {
        var consequent_10 = ($$anchor4) => {
          var p_2 = root_75();
          var text_10 = only_child(p_2, true);
          template_effect(() => set_text(text_10, get(finding).hypothesis));
          append2($$anchor4, p_2);
        };
        if_block(node_16, ($$render) => {
          if (get(finding).hypothesis) $$render(consequent_10);
        });
      }
      var node_17 = sibling(node_16, 2);
      {
        var consequent_11 = ($$anchor4) => {
          var p_3 = root_85();
          var text_11 = sibling(child(p_3));
          reset(p_3);
          template_effect(() => set_text(text_11, ` ${get(finding).intervention ?? ""}`));
          append2($$anchor4, p_3);
        };
        if_block(node_17, ($$render) => {
          if (get(finding).intervention) $$render(consequent_11);
        });
      }
      var node_18 = sibling(node_17, 2);
      {
        var consequent_12 = ($$anchor4) => {
          var ul_1 = root_105();
          each(ul_1, 21, () => get(finding).evidence, index, ($$anchor5, item) => {
            var li_1 = root_95();
            var span_1 = child(li_1);
            var text_12 = only_child(span_1, true);
            var text_13 = sibling(span_1);
            reset(li_1);
            template_effect(() => {
              set_text(text_12, get(item).source);
              set_text(text_13, ` ${get(item).observation ?? ""}`);
            });
            append2($$anchor5, li_1);
          });
          reset(ul_1);
          append2($$anchor4, ul_1);
        };
        if_block(node_18, ($$render) => {
          if (get(finding).evidence.length) $$render(consequent_12);
        });
      }
      var node_19 = sibling(node_18, 2);
      {
        var consequent_13 = ($$anchor4) => {
          var p_4 = root_117();
          var text_14 = only_child(p_4);
          template_effect(($0) => set_text(text_14, `Reasons to reject: ${$0 ?? ""}`), [() => get(finding).reasons_to_reject.join(" ")]);
          append2($$anchor4, p_4);
        };
        if_block(node_19, ($$render) => {
          if (get(finding).reasons_to_reject.length) $$render(consequent_13);
        });
      }
      reset(li);
      template_effect(() => {
        set_text(text_9, get(finding).title);
        button_3.disabled = get(busy) === `${get(report).file}:${get(finding).index}`;
      });
      delegated("click", button_3, () => importFinding(get(report).file, get(finding).index));
      append2($$anchor3, li);
    });
    reset(ul);
    reset(section);
    template_effect(
      ($0) => {
        set_text(text_3, `${$0 ?? ""} `);
        button_2.disabled = get(busy) === get(report).file;
      },
      [() => reportTitle(get(report))]
    );
    delegated("click", button_2, () => dismiss(get(report).file));
    append2($$anchor2, section);
  });
  reset(div_1);
  template_effect(
    ($0) => {
      button.disabled = $0;
      set_text(text2, get(running) ? "Review running\u2026" : "Run a background review");
    },
    [() => Boolean(get(running))]
  );
  delegated("click", button, runReview);
  append2($$anchor, fragment);
  pop();
}
delegate(["click"]);

// ../ui/src/lib/components/ScoreChart.svelte
var root13 = from_svg(`<line stroke="var(--border)" stroke-width="1"></line><text text-anchor="end" font-size="11" fill="var(--text-3)"> </text>`, 1);
var root_118 = from_svg(`<circle r="3"><title> </title></circle>`);
var root_211 = from_svg(`<path fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><!>`, 1);
var root_311 = from_html(`<span class="row" style="gap:5px"><span></span> </span>`);
var root_411 = from_html(`<svg style="width:100%;height:auto" role="img" aria-label="Objective scores over successive runs"><!><!><text font-size="11" fill="var(--text-3)">oldest run</text><text text-anchor="end" font-size="11" fill="var(--text-3)">latest run</text></svg> <div class="row small" style="margin-top:8px"></div>`, 1);
var root_511 = from_html(`<p class="empty">No scored runs yet. Run an evaluation to start a history.</p>`);
function ScoreChart($$anchor, $$props) {
  push($$props, true);
  let runs = prop($$props, "runs", 19, () => []), height = prop($$props, "height", 3, 200);
  const width = 720;
  const margin = { top: 12, right: 16, bottom: 26, left: 34 };
  const series = user_derived(() => {
    const byObjective = group(runs().filter((r2) => !r2.malformed && typeof r2.score === "number" && r2.objective_id), (r2) => r2.objective_id);
    return [...byObjective].map(([id, values]) => ({
      id,
      values: values.slice().sort((a, b) => String(a.occurred_at).localeCompare(String(b.occurred_at)))
    }));
  });
  const maxLength = user_derived(() => max(get(series), (s) => s.values.length) ?? 1);
  const x2 = user_derived(() => linear2().domain([0, Math.max(get(maxLength) - 1, 1)]).range([margin.left, width - margin.right]));
  const y2 = user_derived(() => linear2().domain([0, 1]).range([height() - margin.bottom, margin.top]));
  const colour = user_derived(() => ordinal().domain(get(series).map((s) => s.id)).range([
    "#3b82f6",
    "#d946ef",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444"
  ]));
  function linePath(values) {
    return line_default().x((_, i) => get(x2)(i)).y((d) => get(y2)(d.score)).curve(monotoneX)(values) ?? "";
  }
  var fragment = comment();
  var node = first_child(fragment);
  {
    var consequent = ($$anchor2) => {
      var fragment_1 = root_411();
      var svg = first_child(fragment_1);
      var node_1 = child(svg);
      each(node_1, 16, () => [0, 0.5, 1], index, ($$anchor3, tick3) => {
        var fragment_2 = root13();
        var line = first_child(fragment_2);
        var text2 = sibling(line);
        var text_1 = only_child(text2, true);
        template_effect(
          ($0, $1, $2) => {
            set_attribute2(line, "x1", margin.left);
            set_attribute2(line, "x2", width - margin.right);
            set_attribute2(line, "y1", $0);
            set_attribute2(line, "y2", $1);
            set_attribute2(text2, "x", margin.left - 8);
            set_attribute2(text2, "y", $2);
            set_text(text_1, tick3);
          },
          [
            () => get(y2)(tick3),
            () => get(y2)(tick3),
            () => get(y2)(tick3) + 4
          ]
        );
        append2($$anchor3, fragment_2);
      });
      var node_2 = sibling(node_1);
      each(node_2, 17, () => get(series), index, ($$anchor3, s) => {
        var fragment_3 = root_211();
        var path2 = first_child(fragment_3);
        var node_3 = sibling(path2);
        each(node_3, 17, () => get(s).values, index, ($$anchor4, point2, i) => {
          var circle = root_118();
          var title = child(circle);
          var text_2 = only_child(title);
          reset(circle);
          template_effect(
            ($0, $1, $2, $3) => {
              set_attribute2(circle, "cx", $0);
              set_attribute2(circle, "cy", $1);
              set_attribute2(circle, "fill", $2);
              set_text(text_2, `${get(s).id ?? ""} \xB7 ${$3 ?? ""} \xB7 ${get(point2).occurred_at ?? ""}`);
            },
            [
              () => get(x2)(i),
              () => get(y2)(get(point2).score),
              () => get(colour)(get(s).id),
              () => get(point2).score.toFixed(3)
            ]
          );
          append2($$anchor4, circle);
        });
        template_effect(
          ($0, $1) => {
            set_attribute2(path2, "d", $0);
            set_attribute2(path2, "stroke", $1);
          },
          [
            () => linePath(get(s).values),
            () => get(colour)(get(s).id)
          ]
        );
        append2($$anchor3, fragment_3);
      });
      var text_3 = sibling(node_2);
      var text_4 = sibling(text_3);
      reset(svg);
      var div = sibling(svg, 2);
      each(div, 21, () => get(series), index, ($$anchor3, s) => {
        var span = root_311();
        var span_1 = child(span);
        var text_5 = sibling(span_1);
        reset(span);
        template_effect(
          ($0) => {
            set_style(span_1, `width:10px;height:10px;border-radius:2px;background:${$0 ?? ""}`);
            set_text(text_5, ` ${get(s).id ?? ""}`);
          },
          [() => get(colour)(get(s).id)]
        );
        append2($$anchor3, span);
      });
      reset(div);
      template_effect(() => {
        set_attribute2(svg, "viewBox", `0 0 720 ${height() ?? ""}`);
        set_attribute2(text_3, "x", margin.left);
        set_attribute2(text_3, "y", height() - 6);
        set_attribute2(text_4, "x", width - margin.right);
        set_attribute2(text_4, "y", height() - 6);
      });
      append2($$anchor2, fragment_1);
    };
    var alternate = ($$anchor2) => {
      var p = root_511();
      append2($$anchor2, p);
    };
    if_block(node, ($$render) => {
      if (get(series).length) $$render(consequent);
      else $$render(alternate, -1);
    });
  }
  append2($$anchor, fragment);
  pop();
}

// ../ui/src/lib/components/StepBars.svelte
var root14 = from_svg(`<g><text x="0" font-size="12" fill="var(--text-3)"> </text><rect height="12" rx="3" fill="var(--surface-2)"></rect><rect height="12" rx="3"></rect><line stroke="var(--text)" stroke-width="1" stroke-dasharray="2 2" opacity="0.5"></line><text font-size="12" font-variant-numeric="tabular-nums" fill="var(--text)"> </text></g>`);
var root_119 = from_svg(`<svg role="img" aria-label="Score by evaluation step"></svg>`);
function StepBars($$anchor, $$props) {
  push($$props, true);
  let steps = prop($$props, "steps", 19, () => []);
  const rows = user_derived(() => steps().map((step) => ({
    id: step.id,
    score: typeof step.result?.score === "number" ? step.result.score : 0,
    status: step.status,
    passed: step.passed,
    threshold: step.threshold ?? 1
  })));
  const width = 520;
  const rowHeight = 26;
  const labelWidth = 170;
  const height = user_derived(() => Math.max(get(rows).length * rowHeight, rowHeight));
  const x2 = user_derived(() => linear2().domain([0, 1]).range([0, width - labelWidth - 54]));
  var fragment = comment();
  var node = first_child(fragment);
  {
    var consequent = ($$anchor2) => {
      var svg = root_119();
      set_style(svg, "width:100%;max-width:520px;height:auto");
      each(svg, 21, () => get(rows), index, ($$anchor3, row, i) => {
        var g = root14();
        set_attribute2(g, "transform", `translate(0,${i * rowHeight})`);
        var text2 = child(g);
        set_attribute2(text2, "y", rowHeight / 2 + 4);
        var text_1 = only_child(text2, true);
        var rect = sibling(text2);
        set_attribute2(rect, "x", labelWidth);
        set_attribute2(rect, "y", rowHeight / 2 - 6);
        var rect_1 = sibling(rect);
        set_attribute2(rect_1, "x", labelWidth);
        set_attribute2(rect_1, "y", rowHeight / 2 - 6);
        var line = sibling(rect_1);
        set_attribute2(line, "y1", rowHeight / 2 - 9);
        set_attribute2(line, "y2", rowHeight / 2 + 9);
        var text_2 = sibling(line);
        set_attribute2(text_2, "y", rowHeight / 2 + 4);
        var text_3 = only_child(text_2, true);
        reset(g);
        template_effect(
          ($0, $1, $2, $3, $4, $5, $6) => {
            set_text(text_1, $0);
            set_attribute2(rect, "width", $1);
            set_attribute2(rect_1, "width", $2);
            set_attribute2(rect_1, "fill", get(row).status !== "completed" ? "var(--text-3)" : get(row).passed ? "var(--ok)" : "var(--bad)");
            set_attribute2(line, "x1", $3);
            set_attribute2(line, "x2", $4);
            set_attribute2(text_2, "x", $5);
            set_text(text_3, $6);
          },
          [
            () => get(row).id.length > 24 ? `${get(row).id.slice(0, 23)}\u2026` : get(row).id,
            () => get(x2)(1),
            () => Math.max(get(x2)(get(row).score), get(row).score > 0 ? 2 : 0),
            () => labelWidth + get(x2)(get(row).threshold),
            () => labelWidth + get(x2)(get(row).threshold),
            () => labelWidth + get(x2)(1) + 10,
            () => get(row).status === "completed" ? get(row).score.toFixed(2) : get(row).status
          ]
        );
        append2($$anchor3, g);
      });
      reset(svg);
      template_effect(() => set_attribute2(svg, "viewBox", `0 0 520 ${get(height) ?? ""}`));
      append2($$anchor2, svg);
    };
    if_block(node, ($$render) => {
      if (get(rows).length) $$render(consequent);
    });
  }
  append2($$anchor, fragment);
  pop();
}

// ../ui/src/routes/evals/+page.svelte
var root15 = from_html(`<div class="panel"><!></div>`);
var root_120 = from_html(`<div class="panel-body"><!></div>`);
var root_212 = from_html(`<p class="empty small">Loading\u2026</p>`);
var root_312 = from_html(`<p class="muted prose"> </p>`);
var root_412 = from_html(`<p> </p>`);
var root_512 = from_html(`<p class="faint"> </p>`);
var root_68 = from_html(`<p style="color:var(--bad)"> </p>`);
var root_76 = from_html(`<tr><td class="mono small"> </td><td><!></td><td class="num"> </td><td class="small"><!> <!> <!></td></tr>`);
var root_86 = from_html(`<div class="panel-body stack" style="gap:16px"><div class="grid cols-3"><div><div class="section-label">Score</div><div class="stat-value"> </div></div> <div><div class="section-label">Needed</div><div class="stat-value"> </div></div> <div><div class="section-label">Objective</div><p style="margin-top:4px"> </p></div></div> <!> <!> <!> <div class="table-wrap" style="border:1px solid var(--border);border-radius:var(--radius-sm)"><table><thead><tr><th>Step</th><th>Result</th><th>Score</th><th>What it found</th></tr></thead><tbody></tbody></table></div></div>`);
var root_96 = from_html(`<section class="panel"><div class="panel-head"><h2> <!></h2> <button class="ghost small" aria-label="Close the report"><!></button></div> <!></section>`);
var root_106 = from_html(`<p class="empty small">No runs recorded yet.</p>`);
var root_1110 = from_html(`<span class="num"> </span>`);
var root_127 = from_html(`<tr class="clickable"><td class="small"><a> </a></td><td class="mono small"> </td><td class="small"> </td><td class="small faint"> </td><td><!></td></tr>`);
var root_136 = from_html(`<div class="table-wrap"><table><thead><tr><th>When</th><th>Suite</th><th>Objective</th><th>Covered</th><th>Score</th></tr></thead><tbody></tbody></table></div>`);
var root_146 = from_html(`<div class="empty small"><strong>No suites yet.</strong> Copy the plugin's <code>assets/eval-rig</code> into <code>.harness/evals</code> and add a suite under <code>.harness/evals/suites/</code>.</div>`);
var root_155 = from_html(`<option> </option>`);
var root_165 = from_html(`<p class="help"> </p>`);
var root_175 = from_html(`<input style="margin-top:8px" placeholder="~/.claude/projects/\u2026/session.jsonl" aria-label="Transcript path"/>`);
var root_184 = from_html(`<p class="small"> </p>`);
var root_194 = from_html(`<p> </p><!>`, 1);
var root_202 = from_html(`<form class="panel-body stack" style="gap:16px"><div><label for="suite">Suite</label> <select id="suite"></select> <!></div> <div><label for="transcript">Session</label> <select id="transcript"><option>No session: grade the changes only</option><!><option>Another file\u2026</option></select> <!> <p class="help"> </p></div> <fieldset class="revisions svelte-lfj6yv"><legend class="label">Changes</legend> <div class="grid cols-2" style="gap:10px"><div><label for="base" class="faint">From</label><input id="base" placeholder="HEAD~1"/></div> <div><label for="head" class="faint">To</label><input id="head" placeholder="HEAD"/></div></div> <p class="help">Leave both empty to use uncommitted changes.</p></fieldset> <label class="check"><input type="checkbox"/> <span>Include message and tool content<br/><span class="help" style="margin:0">Needed to check which commands ran. The content is redacted and passed to the evaluators.</span></span></label> <!> <button class="primary" type="submit"><!> </button></form>`);
var root_213 = from_html(`<div class="page-head"><div><h1>Evaluations</h1> <p>Score a session or a range of commits against a suite. Nothing runs on a schedule: an observed session cannot be replayed, so a score is only taken when you ask.</p></div></div> <div class="grid cols-main"><div class="stack" style="gap:16px"><!> <!> <section class="panel"><div class="panel-head"><h2>Score over runs</h2></div> <div class="panel-body"><!></div></section> <section class="panel"><div class="panel-head"><h2>History</h2><span class="small faint"> </span></div> <!></section></div> <section class="panel run-form svelte-lfj6yv" aria-labelledby="run-a-suite"><div class="panel-head"><h2 id="run-a-suite">Run a suite</h2></div> <!></section></div>`, 1);
var $$css6 = {
  hash: "svelte-lfj6yv",
  code: ".run-form.svelte-lfj6yv {position:sticky;top:16px;align-self:start;}.revisions.svelte-lfj6yv {border:0;padding:0;margin:0;}\n  @media (max-width: 1100px) {.run-form.svelte-lfj6yv {position:static;order:-1;} }"
};
function _page4($$anchor, $$props) {
  push($$props, true);
  append_styles($$anchor, $$css6);
  let suites = state(proxy(
    /** @type {any[]} */
    []
  ));
  let runs = state(proxy(
    /** @type {any[]} */
    []
  ));
  let transcripts = state(proxy(
    /** @type {any[]} */
    []
  ));
  let report = state(
    /** @type {any} */
    null
  );
  let reportError = state(
    /** @type {string | null} */
    null
  );
  let notice = state(
    /** @type {{ tone: "ok" | "warn" | "bad" | "", text: string, hint?: string } | null} */
    null
  );
  let suite = state("");
  let pick = state("");
  let customPath = state("");
  let base = state("");
  let head2 = state("");
  let includeContent = state(false);
  async function load() {
    const [s, r2, t] = await Promise.all([
      api("/api/suites").catch(() => ({ suites: [] })),
      api("/api/runs").catch(() => ({ runs: [] })),
      api("/api/transcripts").catch(() => ({ transcripts: [] }))
    ]);
    set(suites, s.suites ?? [], true);
    set(runs, r2.runs ?? [], true);
    set(transcripts, t.transcripts ?? [], true);
    if (!get(suite) && get(suites).length) set(suite, get(suites).find((x2) => !x2.malformed)?.file ?? "", true);
  }
  user_effect(() => {
    load();
  });
  const runId = user_derived(() => page.url.searchParams.get("run"));
  user_effect(() => {
    const id = get(runId);
    set(report, null);
    set(reportError, null);
    if (!id) return;
    api(`/api/runs/${id}`).then((v) => {
      set(report, v.report, true);
    }).catch((error) => {
      set(reportError, error.message, true);
    });
  });
  const running = user_derived(() => jobs.list.find((job) => job.kind === "evaluate" && job.status === "running"));
  const lastEval = user_derived(() => jobs.list.find((job) => job.kind === "evaluate"));
  const transcript = user_derived(() => get(pick) === "custom" ? get(customPath).trim() : get(pick));
  const recent = user_derived(() => get(runs).filter((r2) => !r2.malformed).slice().reverse());
  const selectedSuite = user_derived(() => get(suites).find((s) => s.file === get(suite)));
  async function run3() {
    set(notice, null);
    try {
      const { job } = await api("/api/runs", {
        method: "POST",
        body: {
          suite: get(suite),
          transcript: get(transcript) || void 0,
          base: get(base).trim() || void 0,
          head: get(head2).trim() || void 0,
          include_content: get(includeContent)
        }
      });
      await refreshJobs();
      const done = await settled2(job.id);
      await load();
      if (done.status === "completed" && done.result?.run) goto(`/evals?run=${done.result.run.run_id}`, { noScroll: true });
    } catch (cause) {
      const error = (
        /** @type {any} */
        cause
      );
      set(notice, { tone: "bad", text: error.message, hint: error.hint }, true);
    }
  }
  const unreadable = user_derived(() => (get(
    report
    /** @type {any} */
    /** @type {string} */
  )?.steps ?? []).some((step) => (step.result?.notes ?? []).some((note) => /not captured/.test(note))));
  var fragment = root_213();
  var div = sibling(first_child(fragment), 2);
  var div_1 = child(div);
  var node = child(div_1);
  {
    var consequent = ($$anchor2) => {
      var div_2 = root15();
      var node_1 = child(div_2);
      JobCard(node_1, {
        get job() {
          return get(running);
        }
      });
      reset(div_2);
      append2($$anchor2, div_2);
    };
    var consequent_1 = ($$anchor2) => {
      var div_3 = root15();
      var node_2 = child(div_3);
      JobCard(node_2, {
        get job() {
          return get(lastEval);
        }
      });
      reset(div_3);
      append2($$anchor2, div_3);
    };
    if_block(node, ($$render) => {
      if (get(running)) $$render(consequent);
      else if (get(lastEval) && get(lastEval).status !== "completed" && get(lastEval).error && !get(runId)) $$render(consequent_1, 1);
    });
  }
  var node_3 = sibling(node, 2);
  {
    var consequent_10 = ($$anchor2) => {
      var section = root_96();
      var div_4 = child(section);
      var h2 = child(div_4);
      var text2 = child(h2);
      var node_4 = sibling(text2);
      {
        var consequent_2 = ($$anchor3) => {
          {
            let $0 = user_derived(() => get(report).success ? "ok" : "bad");
            Pill($$anchor3, {
              get tone() {
                return get($0);
              },
              children: ($$anchor4, $$slotProps) => {
                next();
                var text_1 = text();
                template_effect(() => set_text(text_1, get(report).success ? "Passed" : "Did not pass"));
                append2($$anchor4, text_1);
              },
              $$slots: { default: true }
            });
          }
        };
        if_block(node_4, ($$render) => {
          if (get(report)) $$render(consequent_2);
        });
      }
      reset(h2);
      var button = sibling(h2, 2);
      var node_5 = child(button);
      Icon(node_5, { name: "x", size: 14 });
      reset(button);
      reset(div_4);
      var node_6 = sibling(div_4, 2);
      {
        var consequent_3 = ($$anchor3) => {
          var div_5 = root_120();
          var node_7 = child(div_5);
          Notice(node_7, {
            tone: "bad",
            children: ($$anchor4, $$slotProps) => {
              next();
              var text_2 = text();
              template_effect(() => set_text(text_2, get(reportError)));
              append2($$anchor4, text_2);
            },
            $$slots: { default: true }
          });
          reset(div_5);
          append2($$anchor3, div_5);
        };
        var consequent_4 = ($$anchor3) => {
          var p = root_212();
          append2($$anchor3, p);
        };
        var alternate_1 = ($$anchor3) => {
          var div_6 = root_86();
          var div_7 = child(div_6);
          var div_8 = child(div_7);
          var div_9 = sibling(child(div_8));
          var text_3 = only_child(div_9, true);
          reset(div_8);
          var div_10 = sibling(div_8, 2);
          var div_11 = sibling(child(div_10));
          var text_4 = only_child(div_11, true);
          reset(div_10);
          var div_12 = sibling(div_10, 2);
          var p_1 = sibling(child(div_12));
          var text_5 = only_child(p_1, true);
          reset(div_12);
          reset(div_7);
          var node_8 = sibling(div_7, 2);
          {
            var consequent_5 = ($$anchor4) => {
              var p_2 = root_312();
              var text_6 = only_child(p_2, true);
              template_effect(() => set_text(text_6, get(report).objective.description));
              append2($$anchor4, p_2);
            };
            if_block(node_8, ($$render) => {
              if (get(report).objective?.description) $$render(consequent_5);
            });
          }
          var node_9 = sibling(node_8, 2);
          {
            var consequent_6 = ($$anchor4) => {
              Notice($$anchor4, {
                tone: "warn",
                children: ($$anchor5, $$slotProps) => {
                  next();
                  var text_7 = text("This run did not include message and tool content, so commands the agent ran could not be checked.\n                Run it again with content included to grade verification.");
                  append2($$anchor5, text_7);
                },
                $$slots: { default: true }
              });
            };
            if_block(node_9, ($$render) => {
              if (get(unreadable)) $$render(consequent_6);
            });
          }
          var node_10 = sibling(node_9, 2);
          {
            let $0 = user_derived(() => get(report).steps ?? []);
            StepBars(node_10, {
              get steps() {
                return get($0);
              }
            });
          }
          var div_13 = sibling(node_10, 2);
          var table = child(div_13);
          var tbody = sibling(child(table));
          each(tbody, 21, () => get(report).steps ?? [], index, ($$anchor4, step) => {
            var tr = root_76();
            var td = child(tr);
            var text_8 = only_child(td, true);
            var td_1 = sibling(td);
            var node_11 = child(td_1);
            {
              var consequent_7 = ($$anchor5) => {
                Pill($$anchor5, {
                  tone: "bad",
                  children: ($$anchor6, $$slotProps) => {
                    next();
                    var text_9 = text();
                    template_effect(() => set_text(text_9, get(step).status));
                    append2($$anchor6, text_9);
                  },
                  $$slots: { default: true }
                });
              };
              var consequent_8 = ($$anchor5) => {
                Pill($$anchor5, {
                  tone: "ok",
                  children: ($$anchor6, $$slotProps) => {
                    next();
                    var text_10 = text("Passed");
                    append2($$anchor6, text_10);
                  },
                  $$slots: { default: true }
                });
              };
              var alternate = ($$anchor5) => {
                Pill($$anchor5, {
                  tone: "bad",
                  children: ($$anchor6, $$slotProps) => {
                    next();
                    var text_11 = text("Failed");
                    append2($$anchor6, text_11);
                  },
                  $$slots: { default: true }
                });
              };
              if_block(node_11, ($$render) => {
                if (get(step).status !== "completed") $$render(consequent_7);
                else if (get(step).passed) $$render(consequent_8, 1);
                else $$render(alternate, -1);
              });
            }
            reset(td_1);
            var td_2 = sibling(td_1);
            var text_12 = only_child(td_2, true);
            var td_3 = sibling(td_2);
            var node_12 = child(td_3);
            each(node_12, 17, () => get(step).result?.notes ?? [], index, ($$anchor5, note) => {
              var p_3 = root_412();
              var text_13 = only_child(p_3, true);
              template_effect(() => set_text(text_13, get(note)));
              append2($$anchor5, p_3);
            });
            var node_13 = sibling(node_12, 2);
            each(node_13, 17, () => get(step).result?.evidence ?? [], index, ($$anchor5, item) => {
              var p_4 = root_512();
              var text_14 = only_child(p_4, true);
              template_effect(() => set_text(text_14, get(item).message));
              append2($$anchor5, p_4);
            });
            var node_14 = sibling(node_13, 2);
            {
              var consequent_9 = ($$anchor5) => {
                var p_5 = root_68();
                var text_15 = only_child(p_5, true);
                template_effect(() => set_text(text_15, get(step).error));
                append2($$anchor5, p_5);
              };
              if_block(node_14, ($$render) => {
                if (get(step).error) $$render(consequent_9);
              });
            }
            reset(td_3);
            reset(tr);
            template_effect(
              ($0) => {
                set_text(text_8, get(step).id);
                set_text(text_12, $0);
              },
              [() => score(get(step).result?.score)]
            );
            append2($$anchor4, tr);
          });
          reset(tbody);
          reset(table);
          reset(div_13);
          reset(div_6);
          template_effect(
            ($0, $1) => {
              set_style(div_9, `color:${get(report).success ? "var(--ok)" : "var(--bad)"}`);
              set_text(text_3, $0);
              set_text(text_4, $1);
              set_text(text_5, get(report).objective?.id ?? "\u2013");
            },
            [
              () => score(get(report).score),
              () => score(get(report).threshold)
            ]
          );
          append2($$anchor3, div_6);
        };
        if_block(node_6, ($$render) => {
          if (get(reportError)) $$render(consequent_3);
          else if (!get(report)) $$render(consequent_4, 1);
          else $$render(alternate_1, -1);
        });
      }
      reset(section);
      template_effect(() => set_text(text2, `${get(report)?.suite?.id ?? "Report" ?? ""} `));
      delegated("click", button, () => goto("/evals", { noScroll: true }));
      append2($$anchor2, section);
    };
    if_block(node_3, ($$render) => {
      if (get(runId)) $$render(consequent_10);
    });
  }
  var section_1 = sibling(node_3, 2);
  var div_14 = sibling(child(section_1), 2);
  var node_15 = child(div_14);
  ScoreChart(node_15, {
    get runs() {
      return get(runs);
    }
  });
  reset(div_14);
  reset(section_1);
  var section_2 = sibling(section_1, 2);
  var div_15 = child(section_2);
  var span = sibling(child(div_15));
  var text_16 = only_child(span);
  reset(div_15);
  var node_16 = sibling(div_15, 2);
  {
    var consequent_11 = ($$anchor2) => {
      var p_6 = root_106();
      append2($$anchor2, p_6);
    };
    var alternate_2 = ($$anchor2) => {
      var div_16 = root_136();
      var table_1 = child(div_16);
      var tbody_1 = sibling(child(table_1));
      each(tbody_1, 21, () => get(recent), (r2) => r2.run_id, ($$anchor3, r2) => {
        var tr_1 = root_127();
        var td_4 = child(tr_1);
        var a = child(td_4);
        var text_17 = only_child(a, true);
        reset(td_4);
        var td_5 = sibling(td_4);
        var text_18 = only_child(td_5, true);
        var td_6 = sibling(td_5);
        var text_19 = only_child(td_6, true);
        var td_7 = sibling(td_6);
        var text_20 = only_child(td_7);
        var td_8 = sibling(td_7);
        var node_17 = child(td_8);
        {
          let $0 = user_derived(() => get(r2).success ? "ok" : "bad");
          Pill(node_17, {
            get tone() {
              return get($0);
            },
            children: ($$anchor4, $$slotProps) => {
              var span_1 = root_1110();
              var text_21 = only_child(span_1, true);
              template_effect(($02) => set_text(text_21, $02), [() => score(get(r2).score)]);
              append2($$anchor4, span_1);
            },
            $$slots: { default: true }
          });
        }
        reset(td_8);
        reset(tr_1);
        template_effect(
          ($0, $1) => {
            set_attribute2(tr_1, "aria-selected", get(r2).run_id === get(runId));
            set_attribute2(td_4, "title", $0);
            set_attribute2(a, "href", `#/evals?run=${get(r2).run_id ?? ""}`);
            set_text(text_17, $1);
            set_text(text_18, get(r2).suite_id);
            set_text(text_19, get(r2).objective_id ?? "\u2013");
            set_text(text_20, `${get(r2).context?.transcript ? "session" : ""}${get(r2).context?.transcript && (get(r2).context?.base || get(r2).context?.head) ? " + " : ""}${get(r2).context?.base || get(r2).context?.head ? `${get(r2).context.base ?? ""}..${get(r2).context.head ?? "HEAD"}` : ""}${!get(r2).context?.transcript && !get(r2).context?.base && !get(r2).context?.head ? "working tree" : ""}`);
          },
          [
            () => when(get(r2).occurred_at),
            () => ago(get(r2).occurred_at)
          ]
        );
        delegated("click", tr_1, () => goto(`/evals?run=${get(r2).run_id}`, { noScroll: true }));
        delegated("click", a, (e) => e.stopPropagation());
        append2($$anchor3, tr_1);
      });
      reset(tbody_1);
      reset(table_1);
      reset(div_16);
      append2($$anchor2, div_16);
    };
    if_block(node_16, ($$render) => {
      if (get(recent).length === 0) $$render(consequent_11);
      else $$render(alternate_2, -1);
    });
  }
  reset(section_2);
  reset(div_1);
  var section_3 = sibling(div_1, 2);
  var node_18 = sibling(child(section_3), 2);
  {
    var consequent_12 = ($$anchor2) => {
      var div_17 = root_146();
      append2($$anchor2, div_17);
    };
    var alternate_3 = ($$anchor2) => {
      var form = root_202();
      var div_18 = child(form);
      var select = sibling(child(div_18), 2);
      each(select, 21, () => get(suites), index, ($$anchor3, item) => {
        var option = root_155();
        var text_22 = only_child(option);
        var option_value = {};
        template_effect(
          ($0) => {
            option.disabled = $0;
            set_text(text_22, `${get(item).id ?? ""}${get(item).objective_id ? ` (${get(item).objective_id})` : ""}${get(item).malformed ? " \u2013 unreadable" : ""}`);
            if (option_value !== (option_value = get(item).file)) {
              option.value = (option.__value = option_value) ?? "";
            }
          },
          [() => Boolean(get(item).malformed)]
        );
        append2($$anchor3, option);
      });
      reset(select);
      init_select(select);
      var node_19 = sibling(select, 2);
      {
        var consequent_13 = ($$anchor3) => {
          var p_7 = root_165();
          var text_23 = only_child(p_7);
          template_effect(() => set_text(text_23, `${get(selectedSuite).steps ?? ""} ${get(selectedSuite).steps === 1 ? "step" : "steps"}${get(selectedSuite).threshold != null ? `, passes at ${get(selectedSuite).threshold}` : ""}.`));
          append2($$anchor3, p_7);
        };
        if_block(node_19, ($$render) => {
          if (get(selectedSuite)) $$render(consequent_13);
        });
      }
      reset(div_18);
      var div_19 = sibling(div_18, 2);
      var select_1 = sibling(child(div_19), 2);
      var option_1 = child(select_1);
      option_1.value = option_1.__value = "";
      var node_20 = sibling(option_1);
      each(node_20, 17, () => get(transcripts), index, ($$anchor3, item) => {
        var option_2 = root_155();
        var text_24 = only_child(option_2);
        var option_2_value = {};
        template_effect(
          ($0) => {
            set_text(text_24, `${$0 ?? ""}: ${get(item).preview ?? get(item).name ?? ""}`);
            if (option_2_value !== (option_2_value = get(item).file)) {
              option_2.value = (option_2.__value = option_2_value) ?? "";
            }
          },
          [() => ago(get(item).modified)]
        );
        append2($$anchor3, option_2);
      });
      var option_3 = sibling(node_20);
      option_3.value = option_3.__value = "custom";
      reset(select_1);
      init_select(select_1);
      var node_21 = sibling(select_1, 2);
      {
        var consequent_14 = ($$anchor3) => {
          var input = root_175();
          remove_input_defaults(input);
          bind_value(input, () => get(customPath), ($$value) => set(customPath, $$value));
          append2($$anchor3, input);
        };
        if_block(node_21, ($$render) => {
          if (get(pick) === "custom") $$render(consequent_14);
        });
      }
      var p_8 = sibling(node_21, 2);
      var text_25 = only_child(p_8, true);
      reset(div_19);
      var fieldset = sibling(div_19, 2);
      var div_20 = sibling(child(fieldset), 2);
      var div_21 = child(div_20);
      var input_1 = sibling(child(div_21));
      remove_input_defaults(input_1);
      reset(div_21);
      var div_22 = sibling(div_21, 2);
      var input_2 = sibling(child(div_22));
      remove_input_defaults(input_2);
      reset(div_22);
      reset(div_20);
      next(2);
      reset(fieldset);
      var label = sibling(fieldset, 2);
      var input_3 = child(label);
      remove_input_defaults(input_3);
      next(2);
      reset(label);
      var node_22 = sibling(label, 2);
      {
        var consequent_16 = ($$anchor3) => {
          Notice($$anchor3, {
            get tone() {
              return get(notice).tone;
            },
            children: ($$anchor4, $$slotProps) => {
              var fragment_10 = root_194();
              var p_9 = first_child(fragment_10);
              var text_26 = only_child(p_9, true);
              var node_23 = sibling(p_9);
              {
                var consequent_15 = ($$anchor5) => {
                  var p_10 = root_184();
                  var text_27 = only_child(p_10, true);
                  template_effect(() => set_text(text_27, get(notice).hint));
                  append2($$anchor5, p_10);
                };
                if_block(node_23, ($$render) => {
                  if (get(notice).hint) $$render(consequent_15);
                });
              }
              template_effect(() => set_text(text_26, get(notice).text));
              append2($$anchor4, fragment_10);
            },
            $$slots: { default: true }
          });
        };
        if_block(node_22, ($$render) => {
          if (get(notice)) $$render(consequent_16);
        });
      }
      var button_1 = sibling(node_22, 2);
      var node_24 = child(button_1);
      Icon(node_24, { name: "play", size: 14 });
      var text_28 = sibling(node_24, 1, true);
      reset(button_1);
      reset(form);
      template_effect(
        ($0) => {
          set_text(text_25, get(transcripts).length ? "Recent Claude Code sessions in this repository." : "No sessions found for this repository on this machine.");
          button_1.disabled = $0;
          set_text(text_28, get(running) ? "An evaluation is running" : "Run evaluation");
        },
        [() => Boolean(get(running)) || !get(suite)]
      );
      event("submit", form, (event2) => {
        event2.preventDefault();
        run3();
      });
      bind_select_value(select, () => get(suite), ($$value) => set(suite, $$value));
      bind_select_value(select_1, () => get(pick), ($$value) => set(pick, $$value));
      bind_value(input_1, () => get(base), ($$value) => set(base, $$value));
      bind_value(input_2, () => get(head2), ($$value) => set(head2, $$value));
      bind_checked(input_3, () => get(includeContent), ($$value) => set(includeContent, $$value));
      append2($$anchor2, form);
    };
    if_block(node_18, ($$render) => {
      if (get(suites).length === 0) $$render(consequent_12);
      else $$render(alternate_3, -1);
    });
  }
  reset(section_3);
  reset(div);
  template_effect(() => set_text(text_16, `${get(recent).length ?? ""} runs`));
  append2($$anchor, fragment);
  pop();
}
delegate(["click"]);

// ../ui/src/routes/objectives/+page.svelte
var root16 = from_html(`<p class="empty small">Loading\u2026</p>`);
var root_121 = from_html(`<div class="empty"><strong>No objectives declared.</strong> Add them to <code>.harness/objectives.yaml</code>, or name one in a suite under <code>.harness/evals/suites/</code>.</div>`);
var root_214 = from_html(`<p class="muted prose"> </p>`);
var root_313 = from_html(`<li> </li>`);
var root_413 = from_html(`<details><summary class="small muted">Success criteria</summary> <ul class="small" style="margin-top:6px"></ul></details>`);
var root_513 = from_html(`<div class="small"> </div>`);
var root_69 = from_html(`<li class="objective svelte-1ai8zh7"><div class="grow stack" style="gap:6px"><div class="row"><h2 class="mono" style="font-size:14px"> </h2> <!> <!> <!></div> <!> <p class="small faint"> <!> <!></p> <!></div> <div class="reading svelte-1ai8zh7"><!> <div style="text-align:right"><div class="stat-value"> </div> <!></div></div></li>`);
var root_77 = from_html(`<ul class="list"></ul>`);
var root_87 = from_html(`<p class="empty small">None yet. A skill applied from a proposal gets a <code>.improve.json</code> record beside it, and its use shows here.</p>`);
var root_97 = from_html(`<tr><td class="mono small"> </td><td class="num"> </td><td class="num"> </td><td class="small num"> </td><td class="small faint"> </td><td class="small faint"> </td></tr>`);
var root_107 = from_html(`<div class="table-wrap"><table><thead><tr><th>Skill</th><th>Used</th><th>Read</th><th>Revisions</th><th>From</th><th>Last used</th></tr></thead><tbody></tbody></table></div> <p class="small faint panel-body" style="border-top:1px solid var(--border)">Used counts invocations; read counts reads of the file. Being read is not being followed, and neither shows the skill helped.</p>`, 1);
var root_1111 = from_html(`<div class="page-head"><div><h1>Objectives</h1> <p>What this harness is supposed to be good at, and how its last readings went. A score shows a trend; it cannot prove a harness change caused it.</p></div></div> <div class="stack" style="gap:16px"><!> <section class="panel"><!></section> <section class="panel"><div class="panel-head"><h2>Skills applied from this page</h2></div> <!></section></div>`, 1);
var $$css7 = {
  hash: "svelte-1ai8zh7",
  code: ".objective.svelte-1ai8zh7 {display:flex;gap:24px;padding:16px;align-items:flex-start;}.reading.svelte-1ai8zh7 {display:flex;align-items:center;gap:16px;flex:none;}\n  @media (max-width: 700px) {.objective.svelte-1ai8zh7 {flex-direction:column;} }"
};
function _page5($$anchor, $$props) {
  push($$props, true);
  append_styles($$anchor, $$css7);
  let objectives = state(proxy([]));
  let skills = state(proxy([]));
  let cover = state(null);
  let loading = state(true);
  user_effect(() => {
    Promise.all([
      api("/api/objectives").catch(() => ({})),
      api("/api/skills").catch(() => ({})),
      api("/api/coverage").catch(() => null)
    ]).then(([o, s, c]) => {
      set(objectives, o.objectives ?? [], true);
      set(skills, s.skills ?? [], true);
      set(cover, c, true);
      set(loading, false);
    });
  });
  function trendWords(trend) {
    if (trend === null) return null;
    if (trend === 0) return { text: "no change", tone: "" };
    return trend > 0 ? { text: `up ${trend.toFixed(2)}`, tone: "ok" } : { text: `down ${Math.abs(trend).toFixed(2)}`, tone: "bad" };
  }
  var fragment = root_1111();
  var div = sibling(first_child(fragment), 2);
  var node = child(div);
  {
    var consequent = ($$anchor2) => {
      Notice($$anchor2, {
        tone: "warn",
        children: ($$anchor3, $$slotProps) => {
          next();
          var text2 = text();
          template_effect(
            ($0, $1) => set_text(text2, `${$0 ?? ""} no suite, so nothing measures
      ${get(cover).uncovered.length === 1 ? "it" : "them"}: ${$1 ?? ""}.`),
            [
              () => plural2(get(cover).uncovered.length, "objective has", "objectives have"),
              () => get(cover).uncovered.join(", ")
            ]
          );
          append2($$anchor3, text2);
        },
        $$slots: { default: true }
      });
    };
    if_block(node, ($$render) => {
      if (get(cover)?.uncovered?.length) $$render(consequent);
    });
  }
  var section = sibling(node, 2);
  var node_1 = child(section);
  {
    var consequent_1 = ($$anchor2) => {
      var p = root16();
      append2($$anchor2, p);
    };
    var consequent_2 = ($$anchor2) => {
      var div_1 = root_121();
      append2($$anchor2, div_1);
    };
    var alternate = ($$anchor2) => {
      var ul = root_77();
      each(ul, 21, () => get(objectives), (objective) => objective.id, ($$anchor3, objective) => {
        const t = user_derived(() => trendWords(get(objective).trend));
        var li = root_69();
        var div_2 = child(li);
        var div_3 = child(div_2);
        var h2 = child(div_3);
        var text_1 = only_child(h2, true);
        var node_2 = sibling(h2, 2);
        {
          var consequent_3 = ($$anchor4) => {
            {
              let $0 = user_derived(() => get(objective).regime === "observed" ? "Graded from what happened; one reading per run" : "A fixed task that can be re-run");
              Pill($$anchor4, {
                plain: true,
                get title() {
                  return get($0);
                },
                children: ($$anchor5, $$slotProps) => {
                  next();
                  var text_2 = text();
                  template_effect(() => set_text(text_2, get(objective).regime));
                  append2($$anchor5, text_2);
                },
                $$slots: { default: true }
              });
            }
          };
          if_block(node_2, ($$render) => {
            if (get(objective).regime) $$render(consequent_3);
          });
        }
        var node_3 = sibling(node_2, 2);
        {
          var consequent_4 = ($$anchor4) => {
            Pill($$anchor4, {
              tone: "warn",
              title: "Declared inside a suite, not in .harness/objectives.yaml",
              children: ($$anchor5, $$slotProps) => {
                next();
                var text_3 = text("Not registered");
                append2($$anchor5, text_3);
              },
              $$slots: { default: true }
            });
          };
          if_block(node_3, ($$render) => {
            if (!get(objective).registered) $$render(consequent_4);
          });
        }
        var node_4 = sibling(node_3, 2);
        {
          var consequent_5 = ($$anchor4) => {
            Pill($$anchor4, {
              tone: "bad",
              children: ($$anchor5, $$slotProps) => {
                next();
                var text_4 = text("No suite");
                append2($$anchor5, text_4);
              },
              $$slots: { default: true }
            });
          };
          var consequent_6 = ($$anchor4) => {
            Pill($$anchor4, {
              children: ($$anchor5, $$slotProps) => {
                next();
                var text_5 = text("Not measured yet");
                append2($$anchor5, text_5);
              },
              $$slots: { default: true }
            });
          };
          if_block(node_4, ($$render) => {
            if (!get(objective).covered) $$render(consequent_5);
            else if (!get(objective).encountered) $$render(consequent_6, 1);
          });
        }
        reset(div_3);
        var node_5 = sibling(div_3, 2);
        {
          var consequent_7 = ($$anchor4) => {
            var p_1 = root_214();
            var text_6 = only_child(p_1, true);
            template_effect(() => set_text(text_6, get(objective).description));
            append2($$anchor4, p_1);
          };
          if_block(node_5, ($$render) => {
            if (get(objective).description) $$render(consequent_7);
          });
        }
        var p_2 = sibling(node_5, 2);
        var text_7 = child(p_2);
        var node_6 = sibling(text_7);
        {
          var consequent_8 = ($$anchor4) => {
            var text_8 = text();
            template_effect(() => set_text(text_8, `\xB7 owner ${get(objective).owner ?? ""}`));
            append2($$anchor4, text_8);
          };
          if_block(node_6, ($$render) => {
            if (get(objective).owner) $$render(consequent_8);
          });
        }
        var node_7 = sibling(node_6, 2);
        {
          var consequent_9 = ($$anchor4) => {
            var text_9 = text();
            template_effect(($0) => set_text(text_9, `\xB7 last ${$0 ?? ""}`), [() => ago(get(objective).latest.occurred_at)]);
            append2($$anchor4, text_9);
          };
          if_block(node_7, ($$render) => {
            if (get(objective).latest) $$render(consequent_9);
          });
        }
        reset(p_2);
        var node_8 = sibling(p_2, 2);
        {
          var consequent_10 = ($$anchor4) => {
            var details2 = root_413();
            var ul_1 = sibling(child(details2), 2);
            each(ul_1, 21, () => get(objective).success_criteria, index, ($$anchor5, criterion) => {
              var li_1 = root_313();
              var text_10 = only_child(li_1, true);
              template_effect(() => set_text(text_10, get(criterion)));
              append2($$anchor5, li_1);
            });
            reset(ul_1);
            reset(details2);
            append2($$anchor4, details2);
          };
          if_block(node_8, ($$render) => {
            if (get(objective).success_criteria?.length) $$render(consequent_10);
          });
        }
        reset(div_2);
        var div_4 = sibling(div_2, 2);
        var node_9 = child(div_4);
        Trend(node_9, {
          get history() {
            return get(objective).history;
          },
          width: 140,
          height: 36
        });
        var div_5 = sibling(node_9, 2);
        var div_6 = child(div_5);
        var text_11 = only_child(div_6, true);
        var node_10 = sibling(div_6, 2);
        {
          var consequent_11 = ($$anchor4) => {
            var div_7 = root_513();
            var text_12 = only_child(div_7, true);
            template_effect(() => {
              set_style(div_7, `color:${get(t).tone ? `var(--${get(t).tone})` : "var(--text-3)"}`);
              set_text(text_12, get(t).text);
            });
            append2($$anchor4, div_7);
          };
          if_block(node_10, ($$render) => {
            if (get(t)) $$render(consequent_11);
          });
        }
        reset(div_5);
        reset(div_4);
        reset(li);
        template_effect(
          ($0, $1, $2, $3) => {
            set_attribute2(li, "id", get(objective).id);
            set_text(text_1, get(objective).id);
            set_text(text_7, `${$0 ?? ""} \xB7 ${$1 ?? ""}${$2 ?? ""} `);
            set_style(div_6, `font-size:22px;color:${get(objective).latest ? get(objective).latest.success ? "var(--ok)" : "var(--bad)" : "var(--text-3)"}`);
            set_text(text_11, $3);
          },
          [
            () => plural2(get(objective).history.length, "reading"),
            () => plural2(get(objective).suites.length, "suite"),
            () => get(objective).suites.length ? `: ${get(objective).suites.join(", ")}` : "",
            () => score(get(objective).latest?.score)
          ]
        );
        append2($$anchor3, li);
      });
      reset(ul);
      append2($$anchor2, ul);
    };
    if_block(node_1, ($$render) => {
      if (get(loading)) $$render(consequent_1);
      else if (get(objectives).length === 0) $$render(consequent_2, 1);
      else $$render(alternate, -1);
    });
  }
  reset(section);
  var section_1 = sibling(section, 2);
  var node_11 = sibling(child(section_1), 2);
  {
    var consequent_12 = ($$anchor2) => {
      var p_3 = root_87();
      append2($$anchor2, p_3);
    };
    var alternate_1 = ($$anchor2) => {
      var fragment_10 = root_107();
      var div_8 = first_child(fragment_10);
      var table = child(div_8);
      var tbody = sibling(child(table));
      each(tbody, 21, () => get(skills), index, ($$anchor3, skill) => {
        var tr = root_97();
        var td = child(tr);
        var text_13 = only_child(td, true);
        var td_1 = sibling(td);
        var text_14 = only_child(td_1, true);
        var td_2 = sibling(td_1);
        var text_15 = only_child(td_2, true);
        var td_3 = sibling(td_2);
        var text_16 = only_child(td_3);
        var td_4 = sibling(td_3);
        var text_17 = only_child(td_4, true);
        var td_5 = sibling(td_4);
        var text_18 = only_child(td_5, true);
        reset(tr);
        template_effect(
          ($0) => {
            set_text(text_13, get(skill).name);
            set_text(text_14, get(skill).use);
            set_text(text_15, get(skill).view);
            set_text(text_16, `${get(skill).patch ?? ""}${get(skill).archived_versions ? ` (${get(skill).archived_versions} archived)` : ""}`);
            set_text(text_17, get(skill).proposal ?? "unknown");
            set_text(text_18, $0);
          },
          [
            () => get(skill).use_last_at ? ago(get(skill).use_last_at) : "never"
          ]
        );
        append2($$anchor3, tr);
      });
      reset(tbody);
      reset(table);
      reset(div_8);
      next(2);
      append2($$anchor2, fragment_10);
    };
    if_block(node_11, ($$render) => {
      if (get(skills).length === 0) $$render(consequent_12);
      else $$render(alternate_1, -1);
    });
  }
  reset(section_1);
  reset(div);
  append2($$anchor, fragment);
  pop();
}

// ../ui/src/routes/runs/+page.svelte
var root17 = from_html(`<dt>Finished</dt><dd> </dd>`, 1);
var root_128 = from_html(`<dt>Suite</dt><dd class="mono"> </dd>`, 1);
var root_215 = from_html(`<dt>Revisions</dt><dd class="mono"> </dd>`, 1);
var root_314 = from_html(`<dt>Transcript</dt><dd class="mono"> </dd>`, 1);
var root_414 = from_html(`<dt>Proposal</dt><dd><a> </a></dd>`, 1);
var root_514 = from_html(`<dt>Result</dt><dd><a> </a></dd>`, 1);
var root_610 = from_html(`<dt>Evaluation</dt><dd> </dd>`, 1);
var root_78 = from_html(`<dt>Branch</dt><dd class="mono"> </dd>`, 1);
var root_88 = from_html(`<dt>Report</dt><dd><a href="#/findings"> </a></dd>`, 1);
var root_98 = from_html(`<section class="panel" style="margin-bottom:16px"><div class="panel-head"><h2><button class="ghost small" aria-label="Back to all runs"><!></button> </h2></div> <!> <div class="panel-body stack" style="border-top:1px solid var(--border)"><dl class="kv small"><dt>Started</dt><dd> </dd> <!> <!> <!> <!> <!> <!> <!> <!> <!></dl> <div><div class="section-label">Log</div> <!></div></div></section>`);
var root_108 = from_html(`<div style="margin-bottom:16px"><p class="muted">That run is no longer recorded. Older runs are pruned after a hundred.</p></div>`);
var root_1112 = from_html(`<p class="empty small">Loading\u2026</p>`);
var root_129 = from_html(`<div class="empty"><strong>No runs yet.</strong> Run an evaluation, draft a skill from a proposal, or run a background review, and it shows up here with its progress and log.</div>`);
var root_137 = from_html(`<tr class="clickable"><td><!></td><td><a> </a> <div class="small faint"> </div></td><td class="small faint"> </td><td class="small num"> </td><td class="small muted"> </td></tr>`);
var root_147 = from_html(`<div class="table-wrap"><table><thead><tr><th>Status</th><th>What</th><th>Started</th><th>Took</th><th>Now</th></tr></thead><tbody></tbody></table></div>`);
var root_156 = from_html(`<div class="page-head"><div><h1>Runs</h1> <p>Evaluations, skill drafts and background reviews started from this page. Each keeps a log, and a running one can be cancelled.</p></div></div> <!> <section class="panel"><!></section>`, 1);
function _page6($$anchor, $$props) {
  push($$props, true);
  const KIND = {
    evaluate: "Evaluation",
    "draft-skill": "Skill draft",
    dream: "Background review",
    apply: "Apply"
  };
  const selectedId = user_derived(() => page.url.searchParams.get("job"));
  const selected = user_derived(() => jobs.list.find((job) => job.id === get(selectedId)) ?? null);
  function open(id) {
    goto(`/runs?job=${id}`, { noScroll: true, keepFocus: true });
  }
  var fragment = root_156();
  var node = sibling(first_child(fragment), 2);
  {
    var consequent_9 = ($$anchor2) => {
      var section = root_98();
      var div = child(section);
      var h2 = child(div);
      var button = child(h2);
      var node_1 = child(button);
      Icon(node_1, { name: "arrowLeft", size: 14 });
      reset(button);
      var text2 = sibling(button, 1, true);
      reset(h2);
      reset(div);
      var node_2 = sibling(div, 2);
      JobCard(node_2, {
        get job() {
          return get(selected);
        }
      });
      var div_1 = sibling(node_2, 2);
      var dl = child(div_1);
      var dd = sibling(child(dl));
      var text_1 = only_child(dd, true);
      var node_3 = sibling(dd, 2);
      {
        var consequent = ($$anchor3) => {
          var fragment_1 = root17();
          var dd_1 = sibling(first_child(fragment_1));
          var text_2 = only_child(dd_1);
          template_effect(($0, $1) => set_text(text_2, `${$0 ?? ""} (took ${$1 ?? ""})`), [
            () => when(get(selected).finished_at),
            () => duration(get(selected).started_at, get(selected).finished_at)
          ]);
          append2($$anchor3, fragment_1);
        };
        if_block(node_3, ($$render) => {
          if (get(selected).finished_at) $$render(consequent);
        });
      }
      var node_4 = sibling(node_3, 2);
      {
        var consequent_1 = ($$anchor3) => {
          var fragment_2 = root_128();
          var dd_2 = sibling(first_child(fragment_2));
          var text_3 = only_child(dd_2, true);
          template_effect(() => set_text(text_3, get(selected).detail.suite));
          append2($$anchor3, fragment_2);
        };
        if_block(node_4, ($$render) => {
          if (get(selected).detail?.suite) $$render(consequent_1);
        });
      }
      var node_5 = sibling(node_4, 2);
      {
        var consequent_2 = ($$anchor3) => {
          var fragment_3 = root_215();
          var dd_3 = sibling(first_child(fragment_3));
          var text_4 = only_child(dd_3);
          template_effect(() => set_text(text_4, `${get(selected).detail.base ?? "working tree" ?? ""}..${get(selected).detail.head ?? "HEAD" ?? ""}`));
          append2($$anchor3, fragment_3);
        };
        if_block(node_5, ($$render) => {
          if (get(selected).detail?.base || get(selected).detail?.head) $$render(consequent_2);
        });
      }
      var node_6 = sibling(node_5, 2);
      {
        var consequent_3 = ($$anchor3) => {
          var fragment_4 = root_314();
          var dd_4 = sibling(first_child(fragment_4));
          var text_5 = only_child(dd_4, true);
          template_effect(() => set_text(text_5, get(selected).detail.transcript));
          append2($$anchor3, fragment_4);
        };
        if_block(node_6, ($$render) => {
          if (get(selected).detail?.transcript) $$render(consequent_3);
        });
      }
      var node_7 = sibling(node_6, 2);
      {
        var consequent_4 = ($$anchor3) => {
          var fragment_5 = root_414();
          var dd_5 = sibling(first_child(fragment_5));
          var a = child(dd_5);
          var text_6 = only_child(a, true);
          reset(dd_5);
          template_effect(
            ($0) => {
              set_attribute2(a, "href", `#/proposals?view=all&p=${$0 ?? ""}`);
              set_text(text_6, get(selected).detail.proposal);
            },
            [() => encodeURIComponent(get(selected).detail.proposal)]
          );
          append2($$anchor3, fragment_5);
        };
        if_block(node_7, ($$render) => {
          if (get(selected).detail?.proposal) $$render(consequent_4);
        });
      }
      var node_8 = sibling(node_7, 2);
      {
        var consequent_5 = ($$anchor3) => {
          var fragment_6 = root_514();
          var dd_6 = sibling(first_child(fragment_6));
          var a_1 = child(dd_6);
          var text_7 = only_child(a_1);
          reset(dd_6);
          template_effect(
            ($0) => {
              set_attribute2(a_1, "href", `#/evals?run=${get(selected).result.run.run_id ?? ""}`);
              set_text(text_7, `Score ${$0 ?? ""}, ${get(selected).result.run.success ? "passed" : "did not pass"}`);
            },
            [() => get(selected).result.run.score?.toFixed(2)]
          );
          append2($$anchor3, fragment_6);
        };
        if_block(node_8, ($$render) => {
          if (get(selected).result?.run) $$render(consequent_5);
        });
      }
      var node_9 = sibling(node_8, 2);
      {
        var consequent_6 = ($$anchor3) => {
          var fragment_7 = root_610();
          var dd_7 = sibling(first_child(fragment_7));
          var text_8 = only_child(dd_7);
          template_effect(() => set_text(text_8, `${get(selected).result.evaluation.passed ? "Passed" : "Failed"}${get(selected).result.evaluation.summary ? `: ${get(selected).result.evaluation.summary}` : ""}`));
          append2($$anchor3, fragment_7);
        };
        if_block(node_9, ($$render) => {
          if (get(selected).result?.evaluation) $$render(consequent_6);
        });
      }
      var node_10 = sibling(node_9, 2);
      {
        var consequent_7 = ($$anchor3) => {
          var fragment_8 = root_78();
          var dd_8 = sibling(first_child(fragment_8));
          var text_9 = only_child(dd_8, true);
          template_effect(() => set_text(text_9, get(selected).result.branch));
          append2($$anchor3, fragment_8);
        };
        if_block(node_10, ($$render) => {
          if (get(selected).result?.branch) $$render(consequent_7);
        });
      }
      var node_11 = sibling(node_10, 2);
      {
        var consequent_8 = ($$anchor3) => {
          var fragment_9 = root_88();
          var dd_9 = sibling(first_child(fragment_9));
          var a_2 = child(dd_9);
          var text_10 = only_child(a_2, true);
          reset(dd_9);
          template_effect(($0) => set_text(text_10, $0), [() => plural2(get(selected).result.findings, "finding")]);
          append2($$anchor3, fragment_9);
        };
        if_block(node_11, ($$render) => {
          if (get(selected).result?.file) $$render(consequent_8);
        });
      }
      reset(dl);
      var div_2 = sibling(dl, 2);
      var node_12 = sibling(child(div_2), 2);
      {
        let $0 = user_derived(() => get(selected).status === "running");
        LogView(node_12, {
          get url() {
            return `/api/jobs/${get(selected).id ?? ""}/log`;
          },
          get live() {
            return get($0);
          }
        });
      }
      reset(div_2);
      reset(div_1);
      reset(section);
      template_effect(
        ($0) => {
          set_text(text2, KIND[get(selected).kind] ?? get(selected).kind);
          set_text(text_1, $0);
        },
        [() => when(get(selected).started_at)]
      );
      delegated("click", button, () => goto("/runs"));
      append2($$anchor2, section);
    };
    var consequent_10 = ($$anchor2) => {
      var div_3 = root_108();
      append2($$anchor2, div_3);
    };
    if_block(node, ($$render) => {
      if (get(selected)) $$render(consequent_9);
      else if (get(selectedId) && jobs.loaded) $$render(consequent_10, 1);
    });
  }
  var section_1 = sibling(node, 2);
  var node_13 = child(section_1);
  {
    var consequent_11 = ($$anchor2) => {
      var p = root_1112();
      append2($$anchor2, p);
    };
    var consequent_12 = ($$anchor2) => {
      var div_4 = root_129();
      append2($$anchor2, div_4);
    };
    var alternate = ($$anchor2) => {
      var div_5 = root_147();
      var table = child(div_5);
      var tbody = sibling(child(table));
      each(tbody, 21, () => jobs.list, (job) => job.id, ($$anchor3, job) => {
        const meta = user_derived(() => JOB[get(job).status] ?? { label: get(job).status, tone: "" });
        var tr = root_137();
        var td = child(tr);
        var node_14 = child(td);
        Pill(node_14, {
          get tone() {
            return get(meta).tone;
          },
          children: ($$anchor4, $$slotProps) => {
            next();
            var text_11 = text();
            template_effect(() => set_text(text_11, get(meta).label));
            append2($$anchor4, text_11);
          },
          $$slots: { default: true }
        });
        reset(td);
        var td_1 = sibling(td);
        var a_3 = child(td_1);
        var text_12 = only_child(a_3, true);
        var div_6 = sibling(a_3, 2);
        var text_13 = only_child(div_6, true);
        reset(td_1);
        var td_2 = sibling(td_1);
        var text_14 = only_child(td_2, true);
        var td_3 = sibling(td_2);
        var text_15 = only_child(td_3, true);
        var td_4 = sibling(td_3);
        var text_16 = only_child(td_4, true);
        reset(tr);
        template_effect(
          ($0, $1) => {
            set_attribute2(tr, "aria-selected", get(job).id === get(selectedId));
            set_attribute2(a_3, "href", `#/runs?job=${get(job).id ?? ""}`);
            set_text(text_12, get(job).title);
            set_text(text_13, KIND[get(job).kind] ?? get(job).kind);
            set_attribute2(td_2, "title", get(job).started_at);
            set_text(text_14, $0);
            set_text(text_15, $1);
            set_text(text_16, get(job).status === "running" ? get(job).progress?.message : get(job).error ?? "");
          },
          [
            () => ago(get(job).started_at),
            () => duration(get(job).started_at, get(job).finished_at)
          ]
        );
        delegated("click", tr, () => open(get(job).id));
        delegated("click", a_3, (event2) => event2.stopPropagation());
        append2($$anchor3, tr);
      });
      reset(tbody);
      reset(table);
      reset(div_5);
      append2($$anchor2, div_5);
    };
    if_block(node_13, ($$render) => {
      if (!jobs.loaded) $$render(consequent_11);
      else if (jobs.list.length === 0) $$render(consequent_12, 1);
      else $$render(alternate, -1);
    });
  }
  reset(section_1);
  append2($$anchor, fragment);
  pop();
}
delegate(["click"]);

// src/ui/app/Live.svelte
function Live($$anchor, $$props) {
  push($$props, true);
  watchJobs();
  user_effect(() => {
    void page.url.href;
    untrack(refreshSummary);
  });
  user_effect(() => {
    const timer2 = setInterval(refreshSummary, 2e4);
    return () => clearInterval(timer2);
  });
  const PAGES = {
    "/": _page,
    "/proposals": _page2,
    "/findings": _page3,
    "/evals": _page4,
    "/objectives": _page5,
    "/runs": _page6
  };
  const Page = user_derived(() => PAGES[$$props.view] ?? _page);
  var fragment = comment();
  var node = first_child(fragment);
  key(node, () => $$props.view, ($$anchor2) => {
    var fragment_1 = comment();
    var node_1 = first_child(fragment_1);
    component(node_1, () => get(Page), ($$anchor3, Page_1) => {
      Page_1($$anchor3, {});
    });
    append2($$anchor2, fragment_1);
  });
  append2($$anchor, fragment);
  pop();
}

// src/ui/app/App.svelte
var root_130 = from_html(`<span class="count"> </span>`);
var root_216 = from_html(`<a><!> <!></a>`);
var root_315 = from_html(`<!> <improve-firstmate-view></improve-firstmate-view>`, 3);
var root_415 = from_html(`<span class="faint">improve\u2019s review UI for <span class="mono"> </span></span>`);
var root_515 = from_html(`<span style="color:var(--warn)"> </span>`);
var root_611 = from_html(`<span style="color:var(--bad)"> </span>`);
var root_79 = from_html(`<div class="strip small"><!> <a target="_blank" rel="noreferrer">Open in its own tab</a> <!> <!></div>`);
var root_89 = from_html(`<!> <!>`, 1);
var root_99 = from_html(`<div class="improve-app"><nav class="tabs" aria-label="improve"></nav> <!></div>`);
function App($$anchor, $$props) {
  push($$props, true);
  let link2 = state("checking");
  let root18 = state(
    /** @type {HTMLElement | undefined} */
    void 0
  );
  const ui = user_derived(() => $$props.data?.ui ?? null);
  const view = user_derived(() => chosen() || get(link2) === "ready" ? page.url.pathname : "/firstmate");
  const running = user_derived(() => jobs.list.filter((job) => job.status === "running").length);
  const project = user_derived(() => summary.status?.project ?? "");
  const blocked = user_derived(() => get(ui) ? get(ui).connects === false || get(ui).servesHome === false : false);
  const TABS = user_derived(() => [
    { href: "/", label: "Overview", icon: "home" },
    {
      href: "/proposals",
      label: "Proposals",
      icon: "inbox",
      count: (get(link2) === "ready" ? waitingCount() : $$props.data?.waiting) || null
    },
    {
      href: "/findings",
      label: "Background findings",
      icon: "sparkles",
      count: get(link2) === "ready" ? findingCount() || null : null
    },
    { href: "/evals", label: "Evaluations", icon: "gauge" },
    { href: "/objectives", label: "Objectives", icon: "target" },
    {
      href: "/runs",
      label: "Runs",
      icon: "activity",
      count: get(link2) === "ready" && get(running) ? `${get(running)} running` : null
    },
    { href: "/firstmate", label: "Firstmate", icon: "clock" }
  ]);
  const target = user_derived(() => get(ui) ? `${get(ui).url}|${get(ui).token ?? ""}|${get(blocked)}` : "");
  user_effect(() => {
    if (!get(target)) return;
    connection.url = get(ui)?.url ?? "";
    connection.token = get(ui)?.token ?? "";
    untrack(check);
  });
  async function check() {
    if (get(blocked)) {
      set(link2, "down");
      return;
    }
    if (get(link2) !== "ready") set(link2, "checking");
    connection.refused = false;
    try {
      await api("/api/status");
      set(link2, "ready");
    } catch (cause) {
      const error = (
        /** @type {any} */
        cause
      );
      set(link2, error.status === 403 ? "refused" : "down", true);
    }
  }
  user_effect(() => {
    if (connection.refused && get(link2) === "ready") set(link2, "refused");
  });
  user_effect(() => {
    const onHash = () => sync();
    addEventListener("hashchange", onHash);
    addEventListener("popstate", onHash);
    return () => {
      removeEventListener("hashchange", onHash);
      removeEventListener("popstate", onHash);
    };
  });
  user_effect(() => {
    setAnchorHome(get(root18) ?? null);
    return () => setAnchorHome(null);
  });
  user_effect(() => {
    const id = page.url.hash.slice(1);
    if (!id || get(link2) !== "ready") return;
    const t = setTimeout(() => (
      /** @type {ShadowRoot} */
      get(root18)?.getRootNode()?.getElementById?.(decodeURIComponent(id))?.scrollIntoView({ block: "start" })
    ), 120);
    return () => clearTimeout(t);
  });
  var div = root_99();
  var nav = child(div);
  each(nav, 21, () => get(TABS), index, ($$anchor2, tab) => {
    var a = root_216();
    var node = child(a);
    Icon(node, {
      get name() {
        return get(tab).icon;
      },
      size: 15
    });
    var text2 = sibling(node);
    var node_1 = sibling(text2);
    {
      var consequent = ($$anchor3) => {
        var span = root_130();
        var text_1 = only_child(span, true);
        template_effect(() => set_text(text_1, get(tab).count));
        append2($$anchor3, span);
      };
      if_block(node_1, ($$render) => {
        if (get(tab).count) $$render(consequent);
      });
    }
    reset(a);
    template_effect(() => {
      set_attribute2(a, "href", `#${get(tab).href ?? ""}`);
      set_attribute2(a, "aria-current", get(view) === get(tab).href ? "page" : void 0);
      set_text(text2, `${get(tab).label ?? ""} `);
    });
    append2($$anchor2, a);
  });
  reset(nav);
  var node_2 = sibling(nav, 2);
  {
    var consequent_2 = ($$anchor2) => {
      var fragment = root_315();
      var node_3 = first_child(fragment);
      {
        var consequent_1 = ($$anchor3) => {
          Connect($$anchor3, {
            get ui() {
              return get(ui);
            },
            get host() {
              return $$props.host;
            },
            get link() {
              return get(link2);
            },
            onready: check,
            compact: true
          });
        };
        if_block(node_3, ($$render) => {
          if (get(link2) !== "ready") $$render(consequent_1);
        });
      }
      var improve_firstmate_view = sibling(node_3, 2);
      template_effect(() => set_custom_element_data(improve_firstmate_view, "data", $$props.data));
      append2($$anchor2, fragment);
    };
    var consequent_7 = ($$anchor2) => {
      var fragment_2 = root_89();
      var node_4 = first_child(fragment_2);
      {
        var consequent_6 = ($$anchor3) => {
          var div_1 = root_79();
          var node_5 = child(div_1);
          {
            var consequent_3 = ($$anchor4) => {
              var span_1 = root_415();
              var span_2 = sibling(child(span_1));
              var text_2 = only_child(span_2, true);
              reset(span_1);
              template_effect(() => {
                set_attribute2(span_1, "title", get(project));
                set_text(text_2, get(project));
              });
              append2($$anchor4, span_1);
            };
            if_block(node_5, ($$render) => {
              if (get(project)) $$render(consequent_3);
            });
          }
          var a_1 = sibling(node_5, 2);
          var node_6 = sibling(a_1, 2);
          {
            var consequent_4 = ($$anchor4) => {
              var span_3 = root_515();
              var text_3 = only_child(span_3);
              template_effect(() => set_text(text_3, `This repository's eval rig is ${summary.status.eval_rig.installed ?? ""}; the plugin has ${summary.status.eval_rig.available ?? ""}.`));
              append2($$anchor4, span_3);
            };
            if_block(node_6, ($$render) => {
              if (summary.status?.eval_rig?.drifted) $$render(consequent_4);
            });
          }
          var node_7 = sibling(node_6, 2);
          {
            var consequent_5 = ($$anchor4) => {
              var span_4 = root_611();
              var text_4 = only_child(span_4, true);
              template_effect(() => set_text(text_4, summary.error));
              append2($$anchor4, span_4);
            };
            if_block(node_7, ($$render) => {
              if (summary.error) $$render(consequent_5);
            });
          }
          reset(div_1);
          template_effect(() => set_attribute2(a_1, "href", `${get(ui).url ?? ""}${page.url.pathname ?? ""}${page.url.search ?? ""}`));
          append2($$anchor3, div_1);
        };
        if_block(node_4, ($$render) => {
          if (get(ui)) $$render(consequent_6);
        });
      }
      var node_8 = sibling(node_4, 2);
      Live(node_8, {
        get view() {
          return get(view);
        }
      });
      append2($$anchor2, fragment_2);
    };
    var alternate = ($$anchor2) => {
      Connect($$anchor2, {
        get ui() {
          return get(ui);
        },
        get host() {
          return $$props.host;
        },
        get link() {
          return get(link2);
        },
        onready: check
      });
    };
    if_block(node_2, ($$render) => {
      if (get(view) === "/firstmate") $$render(consequent_2);
      else if (get(link2) === "ready") $$render(consequent_7, 1);
      else $$render(alternate, -1);
    });
  }
  reset(div);
  bind_this(div, ($$value) => set(root18, $$value), () => get(root18));
  append2($$anchor, div);
  pop();
}

// src/ui/app/mount.svelte.js
function mountApp(target, initial) {
  let data = state(initial.data);
  let host = state(initial.host);
  const app = mount(App, {
    target,
    props: {
      get data() {
        return get(data);
      },
      get host() {
        return get(host);
      }
    }
  });
  return {
    /** @param {unknown} v */
    setData(v) {
      set(data, v);
    },
    /** @param {unknown} v */
    setHost(v) {
      set(host, v);
    },
    destroy() {
      unmount(app);
    }
  };
}

// src/ui/index.mjs
var ImproveElement = class extends HTMLElement {
  /** @type {unknown} */
  #data = null;
  /** @type {unknown} */
  #entry = null;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  set data(value) {
    this.#data = value;
    this.render();
  }
  get data() {
    return this.#data;
  }
  set entry(value) {
    this.#entry = value;
  }
  get entry() {
    return this.#entry;
  }
  connectedCallback() {
    this.render();
  }
  render() {
    if (!this.#data || !this.shadowRoot) return;
    const style = document.createElement("style");
    style.textContent = STYLE + this.extraStyle();
    this.shadowRoot.replaceChildren(style, ...[this.view(this.#data)].flat());
  }
  extraStyle() {
    return "";
  }
  /** @param {unknown} _data @returns {Node | Node[]} */
  view(_data) {
    return [];
  }
};
var ImproveFirstmateView = class extends ImproveElement {
  /** Cards whose Details are open, by file. */
  open = /* @__PURE__ */ new Set();
  /** Repeated patterns opened, by their question. */
  patternsOpen = /* @__PURE__ */ new Set();
  /** @param {HarnessView} v */
  view(v) {
    const now = Date.now();
    const groups2 = GROUPS.map((g) => ({ ...g, items: v.proposals.filter((p) => p.group === g.id) })).filter((g) => g.items.length);
    const waiting2 = v.proposals.filter((p) => p.waiting);
    const privateWaiting = waiting2.filter((p) => p.visibility === "captain-private").length;
    const sharedWaiting = waiting2.filter((p) => p.visibility === "shared-tracked").length;
    const tasksRead = v.evidence.counts.find((c) => c.label === "Tasks")?.value ?? null;
    const tiles = h(
      "div",
      { class: "tiles" },
      h(
        "section",
        { class: "card tile", "aria-label": "Review" },
        h("h2", { class: "section-label small" }, "Review"),
        h("div", { class: "mt3" }, reviewBadge(v.review)),
        h("p", { class: "mt2 clamp2 xs relaxed muted" }, v.review.due ? v.review.reasons[0] ?? v.review.headline : v.review.headline),
        h("p", { class: "mt1 xs muted" }, v.review.lastReviewedAt ? `Last review ${since(v.review.lastReviewedAt, now)}` : "No review yet")
      ),
      h(
        "section",
        { class: "card tile", "aria-label": "Waiting for you" },
        h("h2", { class: "section-label small" }, "Waiting for you"),
        h(
          "p",
          { class: "mt2 row", style: "align-items:baseline;gap:0.5rem" },
          h("span", { class: "big" }, v.waiting),
          h("span", { class: "sm muted" }, v.waiting === 1 ? "proposal" : "proposals")
        ),
        v.waiting ? h(
          "p",
          { class: "mt3 row wrap xs muted", style: "gap:0.75rem" },
          h("span", { class: "row", style: "gap:0.25rem" }, icon(Lock, "icon i35"), h("span", { class: "tabular medium fg" }, privateWaiting), " private"),
          h("span", { class: "row", style: "gap:0.25rem" }, icon(GitPullRequest, "icon i35 sea"), h("span", { class: "tabular medium fg" }, sharedWaiting), " shared")
        ) : null
      ),
      h(
        "section",
        { class: "card tile", "aria-label": "What improve read" },
        h("h2", { class: "section-label small" }, "What improve read"),
        tasksRead !== null ? [
          h(
            "p",
            { class: "mt2 row", style: "align-items:baseline;gap:0.5rem" },
            h("span", { class: "big" }, tasksRead),
            h("span", { class: "sm muted" }, tasksRead === 1 ? "task" : "tasks")
          ),
          h("div", { class: "mt3" }, evidenceBar(v.evidence.mix, true))
        ] : h("p", { class: "mt2 sm muted" }, "improve\u2019s import could not be read.")
      )
    );
    const proposals = groups2.length ? groups2.map(
      (g) => h(
        "section",
        { "aria-label": g.label },
        h("h2", { class: "section-label" }, g.label, h("span", { class: "count" }, g.items.length)),
        h(
          "div",
          { class: "cards" },
          g.items.map(
            (p) => proposalCard(p, {
              open: this.open.has(p.file),
              onToggle: (o) => {
                if (o) this.open.add(p.file);
                else this.open.delete(p.file);
                this.render();
              }
            })
          )
        )
      )
    ) : h(
      "p",
      { class: "empty sm muted" },
      "improve has not proposed anything yet. Run /improve propose in Firstmate\u2019s session to draft a change."
    );
    return [
      h("p", { class: "lede sm muted" }, "Changes improve proposes to Firstmate\u2019s harness from what it has seen go wrong. Nothing changes until you approve."),
      tiles,
      v.problems.length ? h("ul", { class: "problems" }, v.problems.map((p) => h("li", null, icon(Info, "icon i4"), p))) : [],
      h("div", { class: "layout" }, h("div", { class: "column" }, proposals), h("aside", { class: "column" }, this.patterns(v), this.size(v)))
    ].flat();
  }
  /** @param {HarnessView} v */
  patterns(v) {
    if (!v.evidence.patterns.length) return null;
    return h(
      "section",
      null,
      h("h2", { class: "section-label" }, "Repeated patterns"),
      h(
        "ul",
        { class: "patterns" },
        v.evidence.patterns.map((p) => {
          const d = h(
            "details",
            { class: "card", open: this.patternsOpen.has(p.example) },
            h(
              "summary",
              { title: p.sentence },
              icon(p.kind === "review" ? MessageSquareText : Hand, "icon i35 muted"),
              h("span", { class: "grow truncate" }, chipText(p.example, 80)),
              h("span", { class: "times", "aria-label": `${p.count} times` }, `\xD7${p.count}`)
            ),
            h(
              "div",
              { class: "more xs relaxed" },
              h("p", null, p.sentence),
              p.answers.length ? h("p", { class: "mt1 muted" }, `Answered: ${p.answers.join("; ")}`) : null
            )
          );
          d.addEventListener("toggle", () => {
            if (
              /** @type {HTMLDetailsElement} */
              d.open
            ) this.patternsOpen.add(p.example);
            else this.patternsOpen.delete(p.example);
          });
          return h("li", null, d);
        })
      )
    );
  }
  /** @param {HarnessView} v */
  size(v) {
    const s = v.size;
    if (!s) return null;
    const budget = [];
    if (s.budgetShare !== null) {
      const pct = Math.round(s.budgetShare * 100);
      const fill = h("span", { class: s.budgetShare > 0.8 ? "over" : null });
      fill.style.width = `${Math.min(100, s.budgetShare * 100)}%`;
      budget.push(
        h("div", { class: "meter", role: "img", "aria-label": `${pct}% of the startup budget` }, fill),
        h("p", { class: "mt1 muted" }, `${pct}% of the startup budget`)
      );
    }
    return h(
      "section",
      null,
      h("h2", { class: "section-label" }, "Harness size"),
      h(
        "div",
        { class: "card size" },
        h(
          "p",
          { class: "head" },
          h("span", { class: "medium" }, s.contractFile),
          h("span", { class: "tabular muted" }, `${s.contractTokens.toLocaleString("en")} tokens`)
        ),
        budget,
        s.skills !== null ? h(
          "p",
          { class: "mt2 muted" },
          h("span", { class: "tabular medium fg" }, s.skills),
          ` ${s.skills === 1 ? "skill" : "skills"}${s.largestSkill ? `, the largest ${s.largestSkill}` : ""}`
        ) : null
      )
    );
  }
};
var ImproveImprovements = class extends HTMLElement {
  /** @type {ReturnType<typeof mountApp> | null} */
  #app = null;
  /** @type {unknown} */
  #data = null;
  /** @type {unknown} */
  #host = null;
  /** @type {unknown} */
  #entry = null;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  set data(value) {
    this.#data = value;
    this.#app?.setData(value);
  }
  get data() {
    return this.#data;
  }
  set host(value) {
    this.#host = value;
    this.#app?.setHost(value);
  }
  get host() {
    return this.#host;
  }
  set entry(value) {
    this.#entry = value;
  }
  get entry() {
    return this.#entry;
  }
  connectedCallback() {
    const root18 = (
      /** @type {ShadowRoot} */
      this.shadowRoot
    );
    if (this.#app) return;
    const style = document.createElement("style");
    style.textContent = APP_STYLE;
    root18.replaceChildren(style);
    this.#app = mountApp(root18, { data: this.#data, host: this.#host });
  }
  disconnectedCallback() {
    this.#app?.destroy();
    this.#app = null;
  }
};
var ImproveHealth = class extends ImproveElement {
  /** @param {HarnessView} v */
  view(v) {
    const now = Date.now();
    const waiting2 = v.proposals.filter((p) => p.waiting);
    const priv = waiting2.filter((p) => p.visibility === "captain-private").length;
    const shared = waiting2.filter((p) => p.visibility === "shared-tracked").length;
    return h(
      "div",
      { class: "card health" },
      h(
        "div",
        { class: "head" },
        reviewBadge(v.review),
        h("span", { class: "xs muted" }, v.review.lastReviewedAt ? `Last ${since(v.review.lastReviewedAt, now)}` : "No review yet")
      ),
      h(
        "a",
        { class: "waits", href: `${IMPROVEMENTS}#/proposals` },
        h("span", { class: "big" }, v.waiting),
        h(
          "span",
          { class: "sm", style: "padding-bottom:0.125rem;line-height:1.25" },
          v.waiting === 1 ? "proposal waits" : "proposals wait",
          h("br"),
          h("span", { class: "muted" }, "for your call")
        ),
        v.waiting ? h(
          "span",
          { class: "split xs muted" },
          h("span", { class: "row", style: "gap:0.25rem" }, icon(Lock, "icon i3"), `${priv} private`),
          h("span", { class: "row", style: "gap:0.25rem" }, icon(GitPullRequest, "icon i3 sea"), `${shared} shared`)
        ) : null
      ),
      v.evidence.mix.length ? h("div", { class: "mt3" }, evidenceBar(v.evidence.mix, true)) : null,
      v.evidence.patterns.length ? h(
        "ul",
        { class: "chips" },
        v.evidence.patterns.slice(0, 3).map(
          (p) => h(
            "li",
            { title: p.sentence },
            icon(p.kind === "review" ? MessageSquareText : Hand, "icon i3 muted"),
            h("span", { class: "grow truncate" }, chipText(p.example, 64)),
            h("span", { class: "tabular strong sea shrink0", "aria-label": `${p.count} times` }, `\xD7${p.count}`)
          )
        )
      ) : null,
      v.problems.length ? h("p", { class: "mt2 row xs warn", style: "align-items:flex-start;gap:0.375rem" }, icon(Info, "icon i35"), h("span", { class: "clamp2" }, v.problems[0])) : null,
      h("a", { class: "more-link", href: IMPROVEMENTS }, "Open Improvements", icon(ArrowRight, "icon i35"))
    );
  }
};
var ImproveIndicator = class extends ImproveElement {
  extraStyle() {
    return ":host { display: contents; }";
  }
  /** @param {HarnessView} v */
  view(v) {
    const label = [v.review.due ? "Review due" : null, v.waiting ? `${v.waiting} to decide` : null].filter(Boolean).join(" \xB7 ");
    if (!label) return [];
    const title = [v.review.due ? v.review.headline : null, v.waiting ? `${v.waiting} harness improvements wait for your call.` : null].filter(Boolean).join(" ");
    return h("a", { class: "pill", href: IMPROVEMENTS, title, "aria-label": `Harness: ${label}` }, icon(Wrench, "icon i35"), label);
  }
};
var ImproveProposal = class extends ImproveElement {
  open = true;
  /** @param {ProposalSection} v */
  view(v) {
    return h(
      "div",
      { class: "section" },
      proposalCard(v.proposal, {
        open: this.open,
        showDecisionLink: false,
        onToggle: (o) => {
          this.open = o;
          this.render();
        }
      }),
      h("a", { class: "more-link", href: v.improvementsHref }, "Decide it on the Improvements page", icon(ArrowRight, "icon i35"))
    );
  }
};
for (
  const [tag2, cls] of
  /** @type {[string, CustomElementConstructor][]} */
  [
    ["improve-improvements", ImproveImprovements],
    ["improve-health", ImproveHealth],
    ["improve-indicator", ImproveIndicator],
    ["improve-proposal", ImproveProposal],
    ["improve-firstmate-view", ImproveFirstmateView]
  ]
) {
  if (!customElements.get(tag2)) customElements.define(tag2, cls);
}
/*! Bundled license information:

lucide/dist/esm/icons/arrow-right.mjs:
lucide/dist/esm/icons/arrow-up-right.mjs:
lucide/dist/esm/icons/book-open.mjs:
lucide/dist/esm/icons/calendar-check.mjs:
lucide/dist/esm/icons/calendar-clock.mjs:
lucide/dist/esm/icons/calendar-off.mjs:
lucide/dist/esm/icons/chevron-down.mjs:
lucide/dist/esm/icons/file-search.mjs:
lucide/dist/esm/icons/file-text.mjs:
lucide/dist/esm/icons/git-pull-request.mjs:
lucide/dist/esm/icons/hand.mjs:
lucide/dist/esm/icons/info.mjs:
lucide/dist/esm/icons/lock.mjs:
lucide/dist/esm/icons/message-square-text.mjs:
lucide/dist/esm/icons/notebook-pen.mjs:
lucide/dist/esm/icons/scroll-text.mjs:
lucide/dist/esm/icons/settings-2.mjs:
lucide/dist/esm/icons/sliders-horizontal.mjs:
lucide/dist/esm/icons/split.mjs:
lucide/dist/esm/icons/square-terminal.mjs:
lucide/dist/esm/icons/wrench.mjs:
lucide/dist/esm/lucide.mjs:
  (**
   * @license lucide v1.62.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
