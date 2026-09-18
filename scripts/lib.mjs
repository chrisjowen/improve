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
      every_days: 14,
      every_sessions: 20,
      tool_failure_threshold: 3
    },
    capture: {
      enabled: true
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

export function dueReasons(config, state, now = Date.now()) {
  const reasons = [];
  if (daysSince(state.last_reviewed_at, now) >= config.review.every_days) {
    reasons.push(`${config.review.every_days} days since the last harness review`);
  }
  if ((state.sessions_since_review || 0) >= config.review.every_sessions) {
    reasons.push(`${state.sessions_since_review} sessions since the last harness review`);
  }
  if ((state.tool_failures_since_review || 0) >= config.review.tool_failure_threshold) {
    reasons.push(`${state.tool_failures_since_review} captured tool failures since the last harness review`);
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
