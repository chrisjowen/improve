import fs from "node:fs";
import path from "node:path";
import { daysSince, readJson, writeJsonAtomic } from "../../scripts/lib.mjs";

/**
 * Optional periodic review for a Firstmate home. Off by default.
 *
 * Measured in work, as the rest of the plugin is: a task is one brief under
 * `data/<task>/brief.md`, so "every N tasks" counts briefs written since the
 * last review. `every_days` is a long-stop that only fires once a review has
 * happened, so turning this on never makes a home overdue on day one.
 *
 * Cheap enough for the SessionStart hook: one directory listing and one stat
 * per task, no file contents.
 */

function stateFile(root) {
  return path.join(root, ".harness", "firstmate", "review-state.json");
}

export function readReviewState(root) {
  return readJson(stateFile(root), {});
}

/** Record that a review ran. Called at the end of `/improve review`. */
export function markReviewed(root, now = Date.now()) {
  const state = { ...readReviewState(root), last_reviewed_at: new Date(now).toISOString() };
  writeJsonAtomic(stateFile(root), state);
  return state;
}

export function tasksSince(home, since) {
  const cutoff = since ? Date.parse(since) : Number.NEGATIVE_INFINITY;
  let entries = [];
  try {
    entries = fs.readdirSync(path.join(home, "data"), { withFileTypes: true });
  } catch {
    return 0;
  }
  let count = 0;
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    try {
      if (fs.statSync(path.join(home, "data", entry.name, "brief.md")).mtimeMs > cutoff) count += 1;
    } catch {
      // no brief: not a dispatched task
    }
  }
  return count;
}

/** Reasons a periodic review is due, or an empty list. */
export function periodicDueReasons(root, detection, now = Date.now()) {
  if (!detection?.detected || !detection.enabled) return [];
  const periodic = detection.config.periodic_review;
  if (!periodic.enabled) return [];
  const { last_reviewed_at: last } = readReviewState(root);
  const reasons = [];
  const tasks = tasksSince(detection.home, last);
  if (periodic.every_tasks > 0 && tasks >= periodic.every_tasks) {
    reasons.push(`${tasks} Firstmate tasks dispatched since the last harness review`);
  }
  if (last && periodic.every_days > 0 && daysSince(last, now) >= periodic.every_days) {
    reasons.push(`${periodic.every_days} days since the last Firstmate harness review`);
  }
  return reasons;
}
