import { proposalUrl } from "../urls.mjs";
import { h, icon } from "./dom.mjs";
import {
  ArrowUpRight,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  CalendarOff,
  Check,
  ChevronDown,
  Copy,
  FileSearch,
  FileText,
  GitPullRequest,
  Hand,
  LoaderCircle,
  Lock,
  NotebookPen,
  ScrollText,
  Settings2,
  SlidersHorizontal,
  Split,
  SquareTerminal,
  Wrench
} from "./icons.mjs";

/**
 * The pieces the elements share: the review badge, the evidence bar, a
 * proposal card and improve's review UI in one line. Each returns DOM nodes
 * built from plain JSON.
 *
 * @typedef {import("../types.mjs").HarnessView} HarnessView
 * @typedef {import("../types.mjs").ImproveUi} ImproveUi
 * @typedef {import("../types.mjs").Kind} Kind
 * @typedef {import("../types.mjs").ProposalItem} ProposalItem
 * @typedef {import("../types.mjs").StatusGroup} StatusGroup
 */

/** One icon per kind of change. @type {Record<Kind, [string, Record<string, string>][]>} */
const KIND_ICON = {
  instructions: ScrollText,
  skill: BookOpen,
  script: SquareTerminal,
  preference: SlidersHorizontal,
  memory: NotebookPen,
  settings: Settings2,
  docs: FileText,
  other: Wrench
};

const VIS_CHIP = {
  "captain-private": { icon: Lock, cls: "plain-fg" },
  "shared-tracked": { icon: GitPullRequest, cls: "soft-sea" },
  mixed: { icon: Split, cls: "soft-warning" }
};

/** @type {Record<StatusGroup, string>} */
const STATUS_CHIP = {
  waiting: "solid-sea",
  drafting: "dashed",
  approved: "soft-success",
  done: "solid-success",
  declined: ""
};

/** One colour per kind of evidence, from the theme's own tokens. @type {Record<string, string>} */
const MIX_COLOR = {
  ask_user_findings: "var(--seg-review, var(--foreground))",
  decisions: "var(--sea)",
  blockers: "var(--warning)",
  captain_preferences: "var(--brass)",
  learnings: "var(--seg-ci, var(--success))"
};

/**
 * Whether a harness review is due, as one badge; the full reason is its tooltip.
 * @param {HarnessView["review"]} review
 */
export function reviewBadge(review) {
  const b =
    review.due === true
      ? { icon: CalendarClock, label: "Review due", cls: "solid-sea" }
      : review.due === false
        ? { icon: CalendarCheck, label: "No review due", cls: "soft-success" }
        : { icon: CalendarOff, label: "Not scheduled", cls: "" };
  return h("span", { class: `chip badge ${b.cls}`, title: review.headline }, icon(b.icon, "icon i35"), b.label);
}

/**
 * What improve read, by kind: one stacked bar, largest first, with a legend
 * that carries the numbers, so the colours are never the only way to read it.
 * @param {HarnessView["evidence"]["mix"]} mix @param {boolean} [compact]
 */
export function evidenceBar(mix, compact = false) {
  const sorted = [...mix].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((n, m) => n + m.value, 0);
  if (total <= 0) return [];
  const label = sorted.map((m) => `${m.value} ${m.label.toLowerCase()}`).join(", ");
  const color = (/** @type {string} */ key) => MIX_COLOR[key] ?? "var(--muted-foreground)";
  const bar = h("div", { class: `bar${compact ? " compact" : ""}`, role: "img", "aria-label": `What improve read: ${label}` });
  for (const m of sorted) {
    const s = h("span");
    s.style.width = `${(m.value / total) * 100}%`;
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

/**
 * One improve proposal as a card: the kind of change, a short title and one
 * line, then chips for where it stands and whose files it touches, and an
 * evidence count. The rest (what it changes in full, its files, why, the
 * evidence) opens under Details. Its title opens it in improve's own UI while
 * that UI runs. A proposal filed as a decision links to its task.
 * @param {ProposalItem} p
 * @param {{ open: boolean; onToggle: (open: boolean) => void; showDecisionLink?: boolean }} o
 */
export function proposalCard(p, o) {
  const evidence = `${p.evidence.length} ${p.evidence.length === 1 ? "piece" : "pieces"} of evidence`;
  const vis = p.visibility ? VIS_CHIP[p.visibility] : null;
  const detailId = `detail-${p.file}`;

  const title = p.openUrl
    ? h("a", { href: p.openUrl, target: "_blank", rel: "noreferrer", title: "Open in improve" }, p.title, icon(ArrowUpRight, "icon i35"))
    : p.title;

  /** @type {Node[]} */
  const chips = [
    h("span", { class: `chip status ${STATUS_CHIP[p.group]}` }, p.statusShort),
    h("span", { class: `chip vis ${vis?.cls ?? ""}`, title: p.visibilityLabel }, vis ? icon(vis.icon, "icon i3") : null, p.visibilityShort)
  ];
  if (p.decision) {
    chips.push(
      (o.showDecisionLink ?? true) && p.decision.href
        ? h("a", { class: "chip soft-sea", href: p.decision.href, title: "Open the decision task" }, icon(Hand, "icon i3"), p.decision.state)
        : h("span", { class: "chip" }, icon(Hand, "icon i3"), p.decision.state)
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

/** @param {ProposalItem} p @param {string} id */
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
    p.why
      ? h(
          "p",
          { class: "xs relaxed" },
          h("span", { class: "strong" }, "Why:"),
          ` ${p.why}`,
          p.confidence ? h("span", { class: "muted" }, ` (confidence ${p.confidence})`) : null
        )
      : null,
    p.evidence.length
      ? h(
          "ul",
          { class: "evidence" },
          p.evidence.map((e) => h("li", null, h("span", { class: "source" }, e.source), h("span", { style: "min-width:0" }, e.observation)))
        )
      : null
  );
}

/**
 * What Wheelhouse knows about improve's review UI, as `GET /api/services` says.
 * @typedef {{ state: string; url: string | null; reason?: string | null; launchable: boolean; hint: string | null; title: string }} ServiceView
 */

/**
 * improve's review UI, in one line: a link while it runs; else that it is not
 * running and why, the command that starts it, ready to copy, and a link to
 * open once it runs.
 * @param {{ view: ServiceView | null; ui: ImproveUi | null; open?: string | null; copied: boolean; onCopy: (text: string) => void }} o
 */
export function serviceLine(o) {
  const name = "improve’s review UI";
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
    href && v?.state !== "occupied"
      ? h("a", { class: "later", href, target: "_blank", rel: "noreferrer" }, `Open ${name} once it runs`, icon(ArrowUpRight, "icon i35"))
      : null
  );
}

/** Where a proposal opens in improve's UI. */
export { proposalUrl };
