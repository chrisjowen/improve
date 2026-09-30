import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { data += chunk; });
    process.stdin.on("end", () => resolve(data));
  });
}

export function parseJson(text) {
  try {
    return JSON.parse(text || "{}");
  } catch {
    return {};
  }
}

export function projectRoot(input = {}) {
  return path.resolve(
    process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
  );
}

export function projectId(root) {
  return crypto.createHash("sha256").update(root).digest("hex").slice(0, 20);
}

export function pluginDataDir() {
  const configured = process.env.CLAUDE_PLUGIN_DATA;
  if (!configured) {
    throw new Error("CLAUDE_PLUGIN_DATA is not available");
  }
  return path.resolve(configured);
}

export function projectDataDir(root) {
  return path.join(pluginDataDir(), "projects", projectId(root));
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function appendJsonl(file, value) {
  ensureDir(path.dirname(file));
  fs.appendFileSync(file, `${JSON.stringify(value)}\n`, { encoding: "utf8", mode: 0o600 });
}

export function readJson(file, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

export function writeJsonAtomic(file, value) {
  ensureDir(path.dirname(file));
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temp, file);
}

export function relativeSafe(root, candidate) {
  if (typeof candidate !== "string" || candidate.length === 0) return undefined;
  const absolute = path.resolve(root, candidate);
  const relative = path.relative(root, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return "[outside-project]";
  return relative || ".";
}

export function loadConfig(root) {
  const defaults = {
    schema_version: 1,
    review: {
      // Wall-clock remains a ceiling, not the primary signal: a repository
      // nobody is working in should not become due for review.
      every_days: 90,
      every_sessions: 20,
      tool_failure_threshold: 3,
      // Opportunity-relative counters. These advance only when work happens.
      every_tool_calls: 400,
      correction_threshold: 5,
      // Twice is a repeat. Fingerprints are word sets grouped by overlap, so
      // heavy rewording can still split a group; a low threshold keeps the
      // trigger usable rather than theoretical.
      repeated_correction_threshold: 2
    },
    capture: {
      enabled: true,
      corrections: true
    },
    background_dreaming: {
      enabled: false,
      every_days: 30,
      command: "claude"
    }
  };
  const repoConfig = readJson(path.join(root, ".harness", "improve.json"), {});
  return {
    ...defaults,
    ...repoConfig,
    review: { ...defaults.review, ...(repoConfig.review || {}) },
    capture: { ...defaults.capture, ...(repoConfig.capture || {}) },
    background_dreaming: {
      ...defaults.background_dreaming,
      ...(repoConfig.background_dreaming || {})
    }
  };
}

export function daysSince(value, now = Date.now()) {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY;
  return (now - time) / 86_400_000;
}

/** Overlap between two fingerprints, as a fraction of their combined words. */
export function similarity(a, b) {
  const left = new Set(String(a).split("-").filter(Boolean));
  const right = new Set(String(b).split("-").filter(Boolean));
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared += 1;
  return shared / (left.size + right.size - shared);
}

/**
 * The most repeated correction since the last review, or undefined.
 *
 * Fingerprints are word sets, so real rewording produces different keys: "use
 * the existing helper instead of a new one" and "use the existing helper
 * instead of writing one" do not match exactly. Near-identical keys are
 * therefore grouped here, at read time, rather than by forcing the hot path to
 * be cleverer. True semantic grouping needs a model and belongs at review time.
 */
export function topRepeatedCorrection(state, threshold = 0.6) {
  const counts = Object.entries(state.correction_fingerprints || {});
  if (counts.length === 0) return undefined;

  const groups = [];
  for (const [key, count] of counts.sort((a, b) => b[1] - a[1])) {
    const existing = groups.find((group) => similarity(group.key, key) >= threshold);
    if (existing) {
      existing.count += count;
      existing.members.push(key);
    } else {
      groups.push({ key, count, members: [key] });
    }
  }
  return groups.sort((a, b) => b.count - a.count)[0];
}

/**
 * Why a review is due, if it is.
 *
 * Measured in opportunities rather than calendar time wherever possible. Days
 * and sessions advance whether or not anyone is working, so a quiet repository
 * used to report itself overdue; the day threshold is now a long-stop.
 */
export function dueReasons(config, state, now = Date.now()) {
  const reasons = [];
  const review = config.review;

  if ((state.tool_calls_since_review || 0) >= review.every_tool_calls) {
    reasons.push(`${state.tool_calls_since_review} tool calls since the last harness review`);
  }

  const repeated = topRepeatedCorrection(state);
  if (repeated && repeated.count >= review.repeated_correction_threshold) {
    reasons.push(`the same correction has been made ${repeated.count} times`);
  }

  if ((state.corrections_since_review || 0) >= review.correction_threshold) {
    reasons.push(`${state.corrections_since_review} corrections captured since the last harness review`);
  }

  if ((state.tool_failures_since_review || 0) >= review.tool_failure_threshold) {
    reasons.push(`${state.tool_failures_since_review} captured tool failures since the last harness review`);
  }

  if ((state.sessions_since_review || 0) >= review.every_sessions) {
    reasons.push(`${state.sessions_since_review} sessions since the last harness review`);
  }

  // Long-stop. Only fires once a review has happened, so a new repository is
  // never reported as overdue.
  if (state.last_reviewed_at && daysSince(state.last_reviewed_at, now) >= review.every_days) {
    reasons.push(`${review.every_days} days since the last harness review`);
  }

  return reasons;
}

export function eventRecord(eventName, input, root) {
  const toolInput = input.tool_input || {};
  const fileCandidate = toolInput.file_path || toolInput.notebook_path || toolInput.path;
  return {
    schema_version: 1,
    occurred_at: new Date().toISOString(),
    event: eventName,
    session_id: typeof input.session_id === "string" ? input.session_id : undefined,
    agent_id: typeof input.agent_id === "string" ? input.agent_id : undefined,
    agent_type: typeof input.agent_type === "string" ? input.agent_type : undefined,
    source: typeof input.source === "string" ? input.source : undefined,
    tool_name: typeof input.tool_name === "string" ? input.tool_name : undefined,
    file: relativeSafe(root, fileCandidate),
    error_type: typeof input.error === "string" ? input.error.slice(0, 120) : undefined,
    permission_mode: typeof input.permission_mode === "string" ? input.permission_mode : undefined
  };
}
