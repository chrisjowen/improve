/**
 * @param {string | null | undefined} iso
 * @param {number} [now]
 */
export function ago(iso, now = Date.now()) {
  if (!iso) return "never";
  const seconds = Math.round((now - Date.parse(iso)) / 1000);
  if (!Number.isFinite(seconds)) return "unknown";
  if (seconds < 0) return `in ${until(-seconds)}`;
  if (seconds < 45) return "just now";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)} h ago`;
  const days = Math.round(seconds / 86_400);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/** @param {number} seconds */
function until(seconds) {
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min`;
  if (seconds < 86_400) return `${Math.round(seconds / 3600)} h`;
  return `${Math.round(seconds / 86_400)} days`;
}

/**
 * @param {string | null | undefined} startIso
 * @param {string | null | undefined} [endIso]
 * @param {number} [now]
 */
export function duration(startIso, endIso, now = Date.now()) {
  if (!startIso) return "";
  const ms = (endIso ? Date.parse(endIso) : now) - Date.parse(startIso);
  if (!Number.isFinite(ms) || ms < 0) return "";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** @param {string | null | undefined} iso */
export function when(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** @param {unknown} value */
export function score(value) {
  return typeof value === "number" ? value.toFixed(2) : "–";
}

/**
 * @param {number} count
 * @param {string} one
 * @param {string} [many]
 */
export function plural(count, one, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Proposal status in words a reviewer uses.
 * @type {Record<string, { label: string, tone: string }>}
 */
export const STATUS = {
  draft: { label: "Draft", tone: "" },
  proposed: { label: "Waiting for review", tone: "warn" },
  approved: { label: "Approved, not applied", tone: "accent" },
  applying: { label: "Applying", tone: "accent" },
  validated: { label: "Applied", tone: "ok" },
  rejected: { label: "Rejected", tone: "bad" },
  "rolled-back": { label: "Rolled back", tone: "bad" }
};

/**
 * Job status in words, and whether it is still moving.
 * @type {Record<string, { label: string, tone: string }>}
 */
export const JOB = {
  running: { label: "Running", tone: "accent live" },
  completed: { label: "Finished", tone: "ok" },
  failed: { label: "Failed", tone: "bad" },
  cancelled: { label: "Cancelled", tone: "" },
  "timed-out": { label: "Timed out", tone: "bad" },
  interrupted: { label: "Interrupted", tone: "warn" }
};

/** @type {Record<string, { label: string, tone: string, meaning: string }>} */
export const SCOPE = {
  harness: { label: "Harness only", tone: "ok", meaning: "Changes only files that shape the agent." },
  codebase: { label: "Changes application code", tone: "bad", meaning: "Changes application files, not the agent's setup. Rewrite it as a harness change." },
  mixed: { label: "Also changes application code", tone: "warn", meaning: "Changes the agent's setup and application files." },
  unknown: { label: "No files listed", tone: "warn", meaning: "The proposal does not say which files it changes." }
};

/**
 * Proposals a person still has to decide on.
 * @param {{ status?: string }} proposal
 */
export function waiting(proposal) {
  return proposal.status === "proposed" || proposal.status === "draft";
}
