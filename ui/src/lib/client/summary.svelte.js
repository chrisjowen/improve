import { api } from "./api.js";
import { waiting } from "./format.js";

/** What the sidebar and the home page both need: status and queue sizes. */
export const summary = $state({ status: null, proposals: [], dreams: [], loaded: false, error: null });

export async function refreshSummary() {
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
    summary.error = error.message;
  }
  summary.loaded = true;
}

export function waitingCount() {
  return summary.proposals.filter(waiting).length;
}

export function findingCount() {
  return summary.dreams.reduce((total, report) => total + (report.findings?.length ?? 0), 0);
}
