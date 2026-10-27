/**
 * improve's words for things, said plainly. Pure functions, shared by the
 * server entry and the UI bundle.
 *
 * @typedef {import("./types.mjs").Kind} Kind
 * @typedef {import("./types.mjs").StatusGroup} StatusGroup
 * @typedef {import("./types.mjs").Visibility} Visibility
 */

/** @type {Record<string, string>} */
const STATUS = {
  draft: "Being drafted",
  proposed: "Waiting for your call",
  approved: "Approved, not applied yet",
  applying: "Being applied",
  validated: "Applied and checked",
  rejected: "Rejected",
  "rolled-back": "Rolled back"
};

/** @param {string} status */
export const statusLabel = (status) => STATUS[status] ?? status;

/** @type {Record<string, string>} */
const SHORT = {
  draft: "Draft",
  proposed: "Your call",
  approved: "Approved",
  applying: "Applying",
  validated: "Applied",
  rejected: "Rejected",
  "rolled-back": "Rolled back"
};

/** @param {string} status */
export const statusShort = (status) => SHORT[status] ?? status;

/** @param {string} status @returns {StatusGroup} */
export function statusGroup(status) {
  if (status === "proposed") return "waiting";
  if (status === "approved" || status === "applying") return "approved";
  if (status === "validated") return "done";
  if (status === "rejected" || status === "rolled-back") return "declined";
  return "drafting";
}

/** @type {{ id: StatusGroup; label: string }[]} */
export const GROUPS = [
  { id: "waiting", label: "Waiting for your call" },
  { id: "drafting", label: "Being drafted" },
  { id: "approved", label: "Approved, not applied yet" },
  { id: "done", label: "Applied" },
  { id: "declined", label: "Rejected or rolled back" }
];

/** @type {Record<string, Kind>} */
const KIND_OF_SURFACE = {
  contract: "instructions",
  "brief-scaffold": "script",
  skill: "skill",
  "public-skill": "skill",
  script: "script",
  docs: "docs",
  "brief-include": "preference",
  "captain-preferences": "preference",
  learnings: "memory",
  "home-data": "memory",
  "improve-record": "memory",
  "claude-config": "settings",
  "agent-config": "settings",
  "home-config": "settings"
};
/** @type {Record<string, Kind>} */
const KIND_OF_LAYER = {
  instructions: "instructions",
  delegation: "instructions",
  skills: "skill",
  tools: "script",
  hooks: "script",
  permissions: "settings",
  context: "preference",
  memory: "memory"
};

/**
 * The kind of change: its first surface as improve classified it, else its layer.
 * @param {string[]} surfaces @param {string | null} layer @returns {Kind}
 */
export function kindOf(surfaces, layer) {
  for (const s of surfaces) if (KIND_OF_SURFACE[s]) return KIND_OF_SURFACE[s];
  return (layer && KIND_OF_LAYER[layer]) || "other";
}

/** @type {Record<Kind, string>} */
export const KIND_LABEL = {
  instructions: "Instructions",
  skill: "Skill",
  script: "Script",
  preference: "Preference",
  memory: "Memory",
  settings: "Settings",
  docs: "Docs",
  other: "Change"
};

/**
 * The first sentence, at most `max` characters.
 * @param {string | null} text @param {number} [max]
 */
export function firstSentence(text, max = 140) {
  if (!text) return null;
  const s = text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/** @type {Record<string, string>} */
const SURFACE = {
  contract: "Firstmate’s contract",
  "brief-scaffold": "the brief every worker starts from",
  skill: "a Firstmate skill",
  "claude-config": "Claude Code settings",
  "public-skill": "a published skill",
  script: "a Firstmate script",
  docs: "Firstmate’s docs",
  "brief-include": "your additions to every brief",
  "captain-preferences": "your preferences",
  learnings: "Firstmate’s learnings",
  "home-data": "your home’s records",
  "home-config": "your home’s settings",
  "improve-record": "improve’s own records",
  "agent-config": "agent settings"
};

/** @param {string} surface */
export const surfaceLabel = (surface) => SURFACE[surface] ?? surface;

/** @param {Visibility} v */
export function visibilityLabel(v) {
  if (v === "captain-private") return "Private to you";
  if (v === "shared-tracked") return "Shared Firstmate code";
  if (v === "mixed") return "Mixes private and shared files";
  return "Not classified";
}

/** @param {Visibility} v */
export function visibilityShort(v) {
  if (v === "captain-private") return "Private";
  if (v === "shared-tracked") return "Shared";
  if (v === "mixed") return "Mixed";
  return "Unclassified";
}

/**
 * What improve read, by kind, for a bar; only the kinds it found any of.
 * @param {Record<string, unknown>} c
 * @returns {{ key: string; label: string; value: number }[]}
 */
export function countMix(c) {
  const rows = [
    ["ask_user_findings", "Review questions"],
    ["decisions", "Decisions"],
    ["blockers", "Blockers"],
    ["captain_preferences", "Your preferences"],
    ["learnings", "Learnings"]
  ];
  return rows
    .filter(([k]) => typeof c[k] === "number" && /** @type {number} */ (c[k]) > 0)
    .map(([k, label]) => ({ key: k, label, value: /** @type {number} */ (c[k]) }));
}

/** @param {Visibility} v @param {string | null} [refused] */
export function deliveryLabel(v, refused = null) {
  if (v === "captain-private") return "Once you approve it, improve edits your home’s own files.";
  if (v === "shared-tracked")
    return "Once you approve it, the change goes to Firstmate as a pull request; nothing is edited in place.";
  if (v === "mixed") return "improve will split it into one proposal per side before you decide.";
  return refused ? `improve will not file it: it ${refused}.` : "improve has not classified it yet.";
}

/**
 * A visibility from a delivery improve recorded when it filed the proposal.
 * @param {unknown} delivery @returns {Visibility}
 */
export function visibilityOfDelivery(delivery) {
  if (delivery === "local-apply") return "captain-private";
  if (delivery === "upstream-pr") return "shared-tracked";
  if (delivery === "split") return "mixed";
  return null;
}

/** @param {number} n @param {string} one @param {string} [many] */
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * "a, b and c".
 * @param {string[]} items
 */
export function list(items) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * The import's counts as one sentence, the ones that matter first.
 * @param {Record<string, unknown>} c
 */
export function countsSentence(c) {
  /** @param {string} k */
  const n = (k) => (typeof c[k] === "number" ? /** @type {number} */ (c[k]) : 0);
  if (typeof c.tasks !== "number") return null;
  const parts = /** @type {string[]} */ ([
    n("ask_user_findings") && plural(n("ask_user_findings"), "review question"),
    n("decisions") && plural(n("decisions"), "decision"),
    n("blockers") && plural(n("blockers"), "blocker")
  ].filter((p) => !!p));
  const home = /** @type {string[]} */ ([
    n("captain_preferences") && plural(n("captain_preferences"), "preference") + " of yours",
    n("learnings") && plural(n("learnings"), "learning")
  ].filter((p) => !!p));
  let s = `improve has read ${plural(n("tasks"), "task")}`;
  if (parts.length) s += ` with ${list(parts)}`;
  if (home.length) s += `, and ${list(home)}`;
  return `${s}.`;
}

/**
 * The counts the Improvements page lists, in order.
 * @param {Record<string, unknown>} c
 * @returns {{ label: string; value: number }[]}
 */
export function countRows(c) {
  const rows = [
    ["tasks", "Tasks"],
    ["ask_user_findings", "Review questions"],
    ["decisions", "Decisions"],
    ["blockers", "Blockers"],
    ["open", "Still open"],
    ["captain_preferences", "Your preferences"],
    ["learnings", "Learnings"],
    ["stale_wakes", "Stale wake-ups"],
    ["spawn_failures", "Failed launches"],
    ["teardown_refusals", "Refused clean-ups"]
  ];
  // Tasks always; the rest only when improve found some.
  return rows
    .filter(([k]) => typeof c[k] === "number" && (k === "tasks" || /** @type {number} */ (c[k]) > 0))
    .map(([k, label]) => ({ label, value: /** @type {number} */ (c[k]) }));
}

/** @param {string} s */
const quote = (s) => {
  const t = s.replace(/\s+/g, " ").trim();
  return `“${t.length > 140 ? `${t.slice(0, 139).trimEnd()}…` : t}”`;
};

/**
 * A repeated pattern from the import, as one sentence.
 * @param {"ask-user" | "decision"} kind @param {number} count @param {number} tasks @param {string} example
 */
export function patternSentence(kind, count, tasks, example) {
  const where = tasks > 1 ? `in ${plural(tasks, "task")}` : `${plural(count, "time")} in one task`;
  return kind === "ask-user"
    ? `The automated review asked the same question ${where}: ${quote(example)}`
    : `Firstmate asked you the same thing ${where}: ${quote(example)}`;
}

/**
 * "3 days ago", from an ISO time.
 * @param {string} iso @param {number} now
 */
export function since(iso, now) {
  const s = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (s < 3600) return "within the hour";
  if (s < 86400) return plural(Math.floor(s / 3600), "hour") + " ago";
  return plural(Math.floor(s / 86400), "day") + " ago";
}

/**
 * The repeated question, short enough for a chip.
 * @param {string} s @param {number} [max]
 */
export const chipText = (s, max = 56) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);
