import { parse } from "yaml";
import {
  countMix,
  countRows,
  countsSentence,
  deliveryLabel,
  firstSentence,
  KIND_LABEL,
  kindOf,
  patternSentence,
  statusGroup,
  statusLabel,
  statusShort,
  surfaceLabel,
  visibilityLabel,
  visibilityOfDelivery,
  visibilityShort
} from "./words.mjs";
import { openUrl } from "./urls.mjs";

/**
 * Turns what improve's Firstmate adapter printed, and improve's own proposal
 * files, into the HarnessView the elements draw. Pure: every input has already
 * been read; nothing here runs or reads anything, and nothing is decided that
 * improve did not decide (visibility, routing and due-ness are improve's).
 *
 * @typedef {import("./types.mjs").HarnessView} HarnessView
 * @typedef {import("./types.mjs").ImproveUi} ImproveUi
 * @typedef {import("./types.mjs").Pattern} Pattern
 * @typedef {import("./types.mjs").ProposalDecision} ProposalDecision
 * @typedef {import("./types.mjs").ProposalItem} ProposalItem
 * @typedef {import("./types.mjs").Visibility} Visibility
 *
 * @typedef {{ id: string; status: string; statusLabel?: string; attention?: { owner?: string } | null }} TaskSummary
 *   The fields of a Wheelhouse task this view reads.
 *
 * @typedef {object} Check improve's verdict on a proposal's files (`proposal-check-cli`'s `firstmate` block).
 * @property {Visibility} visibility
 * @property {string[]} surfaces
 * @property {string | null} delivery
 * @property {string | null} finding Why improve refuses or splits it, if it does.
 *
 * @typedef {object} Routed One record in `.harness/firstmate/routed.json`, as `decisions` prints it.
 * @property {string} file
 * @property {string | null} proposal
 * @property {string} taskId
 * @property {string | null} delivery
 * @property {string | null} routedAt
 *
 * @typedef {object} Raw
 * @property {unknown} detect `cli.mjs detect`.
 * @property {unknown} observations `cli.mjs import`, without --save.
 * @property {unknown} inventory `cli.mjs inventory`.
 * @property {{ ok: true; entries: unknown[] } | { ok: false; reason: string }} route
 *   `cli.mjs route` (a dry run): its entries, or why routing is unavailable.
 * @property {Routed[]} routed `cli.mjs decisions` (a dry run): the proposals already filed.
 * @property {{ file: string; text: string | null }[]} proposals Each file under `.harness/proposals/`, with its text when it could be read.
 * @property {Record<string, Check>} checks
 * @property {unknown} reviewState `.harness/firstmate/review-state.json`.
 * @property {unknown} due `cli.mjs due`, or null when it was not run (it would have started the count).
 * @property {TaskSummary[]} tasks
 * @property {ImproveUi} ui
 * @property {string[]} problems
 * @property {number} now
 */

/** @param {unknown} v @returns {v is Record<string, any>} */
const isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
/** @param {unknown} v */
const str = (v) => (typeof v === "string" && v.trim() ? v.replace(/\s+/g, " ").trim() : null);
/** @param {unknown} v */
const num = (v) => (typeof v === "number" && isFinite(v) ? v : null);
/** @param {unknown} v @returns {unknown[]} */
const arr = (v) => (Array.isArray(v) ? v : []);

/**
 * `cli.mjs decisions` output as routed records.
 * @param {unknown} v @returns {Routed[]}
 */
export function parseRouted(v) {
  return arr(v).flatMap((r) => {
    if (!isRecord(r) || !str(r.file) || !str(r.task_id)) return [];
    return [
      {
        file: /** @type {string} */ (str(r.file)),
        proposal: str(r.proposal),
        taskId: /** @type {string} */ (str(r.task_id)),
        delivery: str(r.delivery),
        routedAt: str(r.routed_at)
      }
    ];
  });
}

/**
 * `.harness/firstmate/routed.json` as routed records.
 * @param {string | null} text @returns {Routed[]}
 */
export function parseLedger(text) {
  if (!text) return [];
  try {
    const v = JSON.parse(text);
    if (!isRecord(v) || !isRecord(v.proposals)) return [];
    return parseRouted(
      Object.entries(v.proposals).map(([file, r]) => (isRecord(r) ? { file, ...r } : null))
    );
  } catch {
    return [];
  }
}

/**
 * `proposal-check-cli` prints one indented JSON object per file, back to back.
 * @param {string} stdout @returns {Record<string, Check>}
 */
export function parseChecks(stdout) {
  /** @type {Record<string, Check>} */
  const out = {};
  for (const chunk of stdout.split(/\n(?=\{)/)) {
    let r;
    try {
      r = JSON.parse(chunk);
    } catch {
      continue;
    }
    if (!isRecord(r) || !str(r.file)) continue;
    const fm = isRecord(r.firstmate) ? r.firstmate : {};
    const v = fm.visibility;
    const findings = arr(fm.findings).filter(isRecord);
    out[/** @type {string} */ (str(r.file)).split("/").pop() ?? ""] = {
      visibility: v === "captain-private" || v === "shared-tracked" || v === "mixed" ? v : null,
      surfaces: arr(fm.surfaces).filter((s) => typeof s === "string"),
      delivery: str(fm.delivery),
      finding: findings.length ? str(findings[0].detail) : null
    };
  }
  return out;
}

/**
 * The fields of a proposal file the pages show; a file that does not parse keeps its name.
 * @param {string} file @param {string | null} text
 */
export function readProposal(file, text) {
  /** @type {Record<string, any>} */
  let y = {};
  if (text) {
    try {
      const v = parse(text);
      if (isRecord(v)) y = v;
    } catch {
      // not YAML improve can use either; show the file by name
    }
  }
  const scope = isRecord(y.scope) ? y.scope : {};
  const intervention = isRecord(y.intervention) ? y.intervention : {};
  return {
    file,
    id: str(y.id) ?? file.replace(/\.ya?ml$/i, ""),
    title: str(y.title) ?? file,
    status: str(y.status) ?? "draft",
    layer: str(y.layer),
    changes: str(intervention.summary),
    why: str(y.hypothesis) ?? str(y.objective),
    files: /** @type {string[]} */ (arr(scope.files).filter((f) => typeof f === "string")),
    evidence: arr(y.evidence)
      .filter(isRecord)
      .map((e) => ({ source: str(e.source) ?? "evidence", observation: str(e.observation) ?? "" }))
      .filter((e) => e.observation),
    confidence: str(y.confidence),
    createdAt: str(y.created_at) ?? (y.created_at instanceof Date ? y.created_at.toISOString() : null)
  };
}

const LANDED = new Set(["done", "landed"]);

/**
 * Where a routed proposal's Firstmate task stands, in plain words.
 * @param {Routed} r @param {TaskSummary[]} tasks @param {boolean} changedSinceFiling
 * @returns {ProposalDecision}
 */
export function decisionOf(r, tasks, changedSinceFiling) {
  const t = tasks.find((x) => x.id === r.taskId);
  const state = !t
    ? "Filed as a decision"
    : t.attention?.owner === "captain"
      ? "Waiting for your call"
      : LANDED.has(t.status)
        ? "Answered"
        : t.statusLabel || "Filed as a decision";
  return {
    taskId: r.taskId,
    href: t ? `/tasks/${encodeURIComponent(t.id)}` : null,
    state,
    routedAt: r.routedAt,
    changedSinceFiling
  };
}

/**
 * One proposal, from its file, improve's check, its routing and its Firstmate task.
 * @param {ReturnType<typeof readProposal>} p
 * @param {{ check: Check | null; routed: Routed | null; route: Record<string, any> | null; tasks: TaskSummary[]; ui: ImproveUi }} o
 * @returns {ProposalItem}
 */
export function proposalItem(p, o) {
  const routeVis = o.route?.visibility;
  /** @type {Visibility} */
  const visibility =
    o.check?.visibility ??
    (routeVis === "captain-private" || routeVis === "shared-tracked"
      ? routeVis
      : visibilityOfDelivery(o.routed?.delivery ?? o.route?.delivery));
  const raw = o.check?.surfaces.length
    ? o.check.surfaces
    : /** @type {string[]} */ (arr(o.route?.surfaces).filter((s) => typeof s === "string"));
  const surfaces = raw.map(surfaceLabel);
  const kind = kindOf(raw, p.layer);
  const refused = o.check?.delivery === "refuse" ? o.check.finding : null;
  const filing = o.route?.action === "hold";
  const routing =
    p.status !== "proposed"
      ? null
      : o.routed && filing
        ? "Changed since it was filed; the next review files it again."
        : !o.routed && filing
          ? "Not filed yet: the next /improve review files it as a decision for you."
          : !o.routed && o.route?.action === "skip" && str(o.route.why)
            ? `Not filed: ${str(o.route.why)}.`
            : null;
  return {
    ...p,
    statusLabel: statusLabel(p.status),
    statusShort: statusShort(p.status),
    group: statusGroup(p.status),
    kind,
    kindLabel: KIND_LABEL[kind],
    summary: firstSentence(p.changes),
    waiting: p.status === "proposed",
    surfaces: [...new Set(surfaces)],
    visibility,
    visibilityLabel: visibilityLabel(visibility),
    visibilityShort: visibilityShort(visibility),
    deliveryLabel: deliveryLabel(
      visibility,
      refused?.replace(/^This proposal /, "").replace(/\.$/, "") ?? null
    ),
    decision: o.routed ? decisionOf(o.routed, o.tasks, !!o.routed && filing) : null,
    routing,
    openUrl: openUrl(o.ui, p.file)
  };
}

/** @param {Record<string, any>} obs @returns {Pattern[]} */
function patterns(obs) {
  const rep = isRecord(obs.repeated) ? obs.repeated : {};
  /** @param {"ask-user" | "decision"} kind @param {unknown} list @param {string} answers @returns {Pattern[]} */
  const from = (kind, list, answers) =>
    arr(list)
      .filter(isRecord)
      .flatMap((g) => {
        const example = str(g.example);
        const count = num(g.count);
        if (!example || !count) return [];
        const tasks = arr(g.tasks).length;
        return [
          {
            sentence: patternSentence(kind, count, tasks, example),
            example,
            kind: kind === "ask-user" ? "review" : "decision",
            count,
            tasks,
            answers: [
              ...new Set(
                arr(g[answers])
                  .filter((a) => typeof a === "string")
                  .map((a) => /** @type {string} */ (a).replace(/^answered:\s*/i, ""))
              )
            ]
          }
        ];
      });
  return [
    ...from("ask-user", rep.ask_user_findings, "decided_answers"),
    ...from("decision", rep.decisions, "answers")
  ].sort((a, b) => b.count - a.count);
}

/** @param {unknown} inv @returns {string[]} */
function inventoryLines(inv) {
  if (!isRecord(inv)) return [];
  const lines = [];
  const c = isRecord(inv.contract) ? inv.contract : null;
  const tokens = num(c?.estimated_tokens);
  if (c && tokens !== null) {
    const share = num(c.startup_memory_budget_tokens) ? num(c.share_of_budget) : null;
    lines.push(
      `${str(c.file) ?? "AGENTS.md"} is about ${tokens.toLocaleString("en")} tokens${
        share !== null ? `, ${Math.round(share * 100)}% of the startup budget` : ""
      }.`
    );
  }
  const sk = isRecord(inv.skills) ? inv.skills : null;
  const n = num(sk?.count);
  if (n !== null) {
    const largest = arr(sk?.largest).filter(isRecord)[0];
    lines.push(
      `${n} ${n === 1 ? "skill" : "skills"}${
        largest && str(largest.skill) ? `; the largest is ${str(largest.skill)}` : ""
      }.`
    );
  }
  return lines;
}

/** @param {unknown} inv @returns {HarnessView["size"]} */
function sizeOf(inv) {
  if (!isRecord(inv) || !isRecord(inv.contract)) return null;
  const c = inv.contract;
  const tokens = num(c.estimated_tokens);
  if (tokens === null) return null;
  const sk = isRecord(inv.skills) ? inv.skills : null;
  const largest = arr(sk?.largest).filter(isRecord)[0];
  return {
    contractFile: str(c.file) ?? "AGENTS.md",
    contractTokens: tokens,
    budgetShare: num(c.startup_memory_budget_tokens) ? num(c.share_of_budget) : null,
    skills: num(sk?.count),
    largestSkill: largest ? str(largest.skill) : null
  };
}

/** @param {Raw} raw @returns {HarnessView["review"]} */
function review(raw) {
  const state0 = isRecord(raw.reviewState) ? raw.reviewState : {};
  if (!isRecord(raw.detect)) {
    return {
      due: null,
      headline: "Wheelhouse could not read improve’s review schedule.",
      reasons: [],
      lastReviewedAt: str(state0.last_reviewed_at),
      periodic: ""
    };
  }
  const d = raw.detect;
  const periodic = isRecord(d.periodic_review) ? d.periodic_review : {};
  const state = isRecord(raw.reviewState) ? raw.reviewState : {};
  const lastReviewedAt = str(state.last_reviewed_at);
  const on = periodic.enabled === true;
  const tasks = num(periodic.every_tasks);
  const days = num(periodic.every_days);
  const every = [tasks ? `${tasks} tasks` : null, days ? `${days} days` : null].filter(Boolean);
  const periodicText = !on
    ? "Periodic review is off, so improve will not remind you; run /improve review when you want one."
    : `Periodic review comes after ${every.join(" or ") || "a while"}${every.length > 1 ? ", whichever is first" : ""}.`;
  const due = isRecord(raw.due) ? raw.due : null;
  const reasons = /** @type {string[]} */ (arr(due?.reasons).filter((r) => typeof r === "string"));
  if (!on) {
    return {
      due: null,
      headline: "No review is scheduled: periodic review is off.",
      reasons: [],
      lastReviewedAt,
      periodic: periodicText
    };
  }
  if (!due) {
    return {
      due: null,
      headline: "Periodic review is on; improve starts counting at its next Claude Code session.",
      reasons: [],
      lastReviewedAt,
      periodic: periodicText
    };
  }
  const isDue = due.due === true;
  return {
    due: isDue,
    headline: isDue
      ? `A harness review is due: ${reasons[0] ?? "improve says so"}.`
      : "No harness review is due.",
    reasons,
    lastReviewedAt,
    periodic: periodicText
  };
}

/** @param {Raw} raw @returns {HarnessView} */
export function buildHarness(raw) {
  const obs = isRecord(raw.observations) ? raw.observations : {};
  const counts = isRecord(obs.counts) ? obs.counts : {};
  const routeEntries = raw.route.ok ? raw.route.entries.filter(isRecord) : [];
  const proposals = raw.proposals
    .map(({ file, text }) =>
      proposalItem(readProposal(file, text), {
        check: raw.checks[file] ?? null,
        routed: raw.routed.find((r) => r.file === file) ?? null,
        route: routeEntries.find((e) => e.file === file) ?? null,
        tasks: raw.tasks,
        ui: raw.ui
      })
    )
    // Waiting first, then the newest.
    .sort(
      (a, b) =>
        Number(b.waiting) - Number(a.waiting) ||
        (b.createdAt ?? "").localeCompare(a.createdAt ?? "") ||
        a.file.localeCompare(b.file)
    );
  const problems = [...raw.problems];
  if (!raw.route.ok) problems.push(`Proposals are not filed as decisions here: ${raw.route.reason}`);
  return {
    schema: "wheelhouse-improve.v1",
    review: review(raw),
    waiting: proposals.filter((p) => p.waiting).length,
    proposals,
    evidence: {
      importedAt: str(obs.imported_at),
      summary: countsSentence(counts),
      counts: countRows(counts),
      mix: countMix(counts),
      patterns: patterns(obs)
    },
    inventory: inventoryLines(raw.inventory),
    size: sizeOf(raw.inventory),
    problems,
    ui: raw.ui
  };
}
