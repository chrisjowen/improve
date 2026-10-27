// Built from wheelhouse/src by wheelhouse/build.mjs; do not edit. Run `npm run build` in wheelhouse/.

// src/urls.mjs
function proposalUrl(ui, file) {
  return ui.deepLinks ? `${ui.url}/proposals?p=${encodeURIComponent(file)}` : ui.url;
}
var IMPROVEMENTS = "/plugins/improve/improvements";

// src/words.mjs
var GROUPS = [
  { id: "waiting", label: "Waiting for your call" },
  { id: "drafting", label: "Being drafted" },
  { id: "approved", label: "Approved, not applied yet" },
  { id: "done", label: "Applied" },
  { id: "declined", label: "Rejected or rolled back" }
];
var plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
function since(iso, now) {
  const s = Math.max(0, (now - Date.parse(iso)) / 1e3);
  if (s < 3600) return "within the hour";
  if (s < 86400) return plural(Math.floor(s / 3600), "hour") + " ago";
  return plural(Math.floor(s / 86400), "day") + " ago";
}
var chipText = (s, max = 56) => s.length > max ? `${s.slice(0, max - 1).trimEnd()}\u2026` : s;

// src/ui/dom.mjs
function h(tag, attrs = null, ...children) {
  const el = document.createElement(tag);
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
  for (const [tag, attrs] of node) {
    const part = document.createElementNS(SVG, tag);
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

// node_modules/lucide/dist/esm/icons/check.mjs
var Check = [["path", { d: "M20 6 9 17l-5-5" }]];

// node_modules/lucide/dist/esm/icons/chevron-down.mjs
var ChevronDown = [["path", { d: "m6 9 6 6 6-6" }]];

// node_modules/lucide/dist/esm/icons/copy.mjs
var Copy = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" }]
];

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

// node_modules/lucide/dist/esm/icons/loader-circle.mjs
var LoaderCircle = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }]];

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
  const color = (key) => MIX_COLOR[key] ?? "var(--muted-foreground)";
  const bar = h("div", { class: `bar${compact ? " compact" : ""}`, role: "img", "aria-label": `What improve read: ${label}` });
  for (const m of sorted) {
    const s = h("span");
    s.style.width = `${m.value / total * 100}%`;
    s.style.background = color(m.key);
    bar.append(s);
  }
  const legend = h(
    "ul",
    { class: `legend${compact ? " compact" : ""}`, "aria-hidden": "true" },
    sorted.map((m) => {
      const dot = h("span", { class: "dot" });
      dot.style.background = color(m.key);
      return h("li", null, dot, m.label, " ", h("span", { class: "tabular medium fg" }, m.value));
    })
  );
  return [bar, legend];
}
function proposalCard(p, o) {
  const evidence = `${p.evidence.length} ${p.evidence.length === 1 ? "piece" : "pieces"} of evidence`;
  const vis = p.visibility ? VIS_CHIP[p.visibility] : null;
  const detailId = `detail-${p.file}`;
  const title = p.openUrl ? h("a", { href: p.openUrl, target: "_blank", rel: "noreferrer", title: "Open in improve" }, p.title, icon(ArrowUpRight, "icon i35")) : p.title;
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
function serviceLine(o) {
  const name = "improve\u2019s review UI";
  const v = o.view;
  const href = o.open ?? v?.url ?? o.ui?.url ?? null;
  const running = v ? v.state === "running" : !!o.ui?.running;
  if (!v && !o.ui) return h("div", { class: "service" });
  if (running && href) {
    return h(
      "div",
      { class: "service", "data-service": "improve/ui" },
      h("a", { class: "open", href, target: "_blank", rel: "noreferrer" }, `Open ${name}`, icon(ArrowUpRight, "icon i35"))
    );
  }
  if (v?.state === "starting") {
    return h(
      "div",
      { class: "service", "data-service": "improve/ui" },
      h("span", { class: "row muted", role: "status", style: "gap:0.375rem" }, icon(LoaderCircle, "icon i35 spin"), `Starting ${name}; the first start can take a minute.`)
    );
  }
  const hint = v?.hint ?? o.ui?.start ?? null;
  const copy = h("button", { type: "button" }, o.copied ? [icon(Check, "icon i35"), "Copied"] : [icon(Copy, "icon i35"), "Copy"]);
  if (hint) copy.addEventListener("click", () => o.onCopy(hint));
  return h(
    "div",
    { class: "service", "data-service": "improve/ui" },
    h("p", { class: "muted" }, `${name} is not running.${v?.reason ? ` ${v.reason}` : ""}${hint ? " Start it with:" : ""}`),
    hint ? h("span", { class: "hint" }, h("code", null, hint), copy) : null,
    href && v?.state !== "occupied" ? h("a", { class: "later", href, target: "_blank", rel: "noreferrer" }, `Open ${name} once it runs`, icon(ArrowUpRight, "icon i35")) : null
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
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

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
.proposal h3 .icon { margin-left: 0.25rem; vertical-align: baseline; color: var(--muted-foreground); }
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

/* improve's review UI, in one line */
.service { display: flex; flex-direction: column; gap: 0.375rem; font-size: 0.8125rem; line-height: 1.25rem; }
.service .open {
  display: inline-flex; width: fit-content; align-items: center; gap: 0.25rem; border: 1px solid ${tint("--sea", 40)};
  border-radius: 9999px; padding: 0.25rem 0.625rem; font-weight: 500; color: var(--sea);
}
.service .open:hover { background: ${tint("--sea", 10)}; }
.service .hint {
  display: flex; align-items: flex-start; gap: 0.5rem; border: 1px solid var(--border); border-radius: calc(var(--radius) * 0.8);
  background: color-mix(in srgb, var(--muted) 60%, transparent); padding: 0.375rem 0.625rem; color: var(--muted-foreground);
}
.service .hint code { min-width: 0; flex: 1 1 0%; word-break: break-all; color: var(--foreground); user-select: all; }
.service .hint button { display: flex; flex-shrink: 0; align-items: center; gap: 0.25rem; }
.service .hint button:hover { color: var(--foreground); }
.service .later { display: inline-flex; width: fit-content; align-items: center; gap: 0.25rem; color: var(--sea); }
.service .later:hover { text-decoration: underline; }

.section { max-width: 48rem; }

a:focus-visible, button:focus-visible, summary:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .spin { animation: none; } * { transition: none !important; } }
`;

// src/ui/index.mjs
var SERVICE = "/api/services?plugin=improve&service=ui";
var ImproveElement = class extends HTMLElement {
  /** @type {unknown} */
  #data = null;
  /** @type {unknown} */
  #entry = null;
  /** improve's review UI as Wheelhouse last said, for the elements that show it. @type {ServiceView | null} */
  service = null;
  #serviceFor = (
    /** @type {boolean | null} */
    null
  );
  copied = false;
  /** Whether this element shows improve's review UI, and so asks Wheelhouse about it. */
  wantsService = false;
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }
  set data(value) {
    this.#data = value;
    this.render();
    this.refreshService();
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
    this.refreshService();
  }
  /** @returns {ImproveUi | null} */
  ui() {
    const d = (
      /** @type {{ ui?: ImproveUi } | null} */
      this.#data
    );
    return d?.ui ?? null;
  }
  /** Ask Wheelhouse whether improve's review UI runs: once, and again when the provider says it started or stopped. */
  async refreshService() {
    const ui = this.ui();
    if (!this.wantsService || !ui || !this.isConnected || this.#serviceFor === ui.running) return;
    this.#serviceFor = ui.running;
    try {
      const res = await fetch(SERVICE);
      this.service = res.ok ? await res.json() : null;
    } catch {
      this.service = null;
    }
    this.render();
  }
  /** @param {string} text */
  async copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.copied = true;
      this.render();
      setTimeout(() => {
        this.copied = false;
        this.render();
      }, 1500);
    } catch {
    }
  }
  /** @param {string | null} [open] */
  serviceLine(open = null) {
    return serviceLine({ view: this.service, ui: this.ui(), open, copied: this.copied, onCopy: (t) => this.copy(t) });
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
var ImproveImprovements = class extends ImproveElement {
  wantsService = true;
  /** Cards whose Details are open, by file. */
  open = /* @__PURE__ */ new Set();
  /** Repeated patterns opened, by their question. */
  patternsOpen = /* @__PURE__ */ new Set();
  #scrolled = false;
  #onHash = () => this.scrollToHash();
  connectedCallback() {
    super.connectedCallback();
    addEventListener("hashchange", this.#onHash);
  }
  disconnectedCallback() {
    removeEventListener("hashchange", this.#onHash);
  }
  render() {
    super.render();
    if (!this.#scrolled && this.data) {
      this.#scrolled = true;
      queueMicrotask(() => this.scrollToHash());
    }
  }
  /** A link to one proposal (`#IMP-1.yaml`) scrolls to its card, which sits in this shadow root. */
  scrollToHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id) this.shadowRoot?.getElementById(id)?.scrollIntoView({ block: "start" });
  }
  /** @param {HarnessView} v */
  view(v) {
    const now = Date.now();
    const groups = GROUPS.map((g) => ({ ...g, items: v.proposals.filter((p) => p.group === g.id) })).filter((g) => g.items.length);
    const waiting = v.proposals.filter((p) => p.waiting);
    const privateWaiting = waiting.filter((p) => p.visibility === "captain-private").length;
    const sharedWaiting = waiting.filter((p) => p.visibility === "shared-tracked").length;
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
    const proposals = groups.length ? groups.map(
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
      h("div", { class: "mt3" }, this.serviceLine()),
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
var ImproveHealth = class extends ImproveElement {
  /** @param {HarnessView} v */
  view(v) {
    const now = Date.now();
    const waiting = v.proposals.filter((p) => p.waiting);
    const priv = waiting.filter((p) => p.visibility === "captain-private").length;
    const shared = waiting.filter((p) => p.visibility === "shared-tracked").length;
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
        { class: "waits", href: IMPROVEMENTS },
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
  wantsService = true;
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
      v.ui.running ? null : h("div", { class: "mt3" }, this.serviceLine(proposalUrl(v.ui, v.proposal.file))),
      h("a", { class: "more-link", href: v.improvementsHref }, "Every improvement", icon(ArrowRight, "icon i35"))
    );
  }
};
for (
  const [tag, cls] of
  /** @type {[string, CustomElementConstructor][]} */
  [
    ["improve-improvements", ImproveImprovements],
    ["improve-health", ImproveHealth],
    ["improve-indicator", ImproveIndicator],
    ["improve-proposal", ImproveProposal]
  ]
) {
  if (!customElements.get(tag)) customElements.define(tag, cls);
}
/*! Bundled license information:

lucide/dist/esm/icons/arrow-right.mjs:
lucide/dist/esm/icons/arrow-up-right.mjs:
lucide/dist/esm/icons/book-open.mjs:
lucide/dist/esm/icons/calendar-check.mjs:
lucide/dist/esm/icons/calendar-clock.mjs:
lucide/dist/esm/icons/calendar-off.mjs:
lucide/dist/esm/icons/check.mjs:
lucide/dist/esm/icons/chevron-down.mjs:
lucide/dist/esm/icons/copy.mjs:
lucide/dist/esm/icons/file-search.mjs:
lucide/dist/esm/icons/file-text.mjs:
lucide/dist/esm/icons/git-pull-request.mjs:
lucide/dist/esm/icons/hand.mjs:
lucide/dist/esm/icons/info.mjs:
lucide/dist/esm/icons/loader-circle.mjs:
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
