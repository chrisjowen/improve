import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
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
  const base = pluginDataDir();
  return path.join(base, "projects", projectDataId(root, { base, record: true }));
}

function readText(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return undefined;
  }
}

/**
 * The git directories for the checkout that contains `start`, read from disk.
 *
 * `top` is the working tree, `common` the directory every worktree of the
 * repository shares. A linked worktree's `.git` is a file naming its own git
 * directory, which names the shared one in `commondir`. Read rather than asked
 * of git, because hooks run on every tool call and must stay cheap.
 *
 * @param {string} start
 * @returns {{ top: string, common: string } | undefined}
 */
export function gitDirs(start) {
  let dir = path.resolve(start);
  for (;;) {
    const dotGit = path.join(dir, ".git");
    let stat;
    try {
      stat = fs.statSync(dotGit);
    } catch {
      stat = undefined;
    }
    if (stat?.isDirectory()) return { top: dir, common: dotGit };
    if (stat?.isFile()) {
      const match = /^gitdir:\s*(.+?)\s*$/m.exec(readText(dotGit) ?? "");
      if (!match) return undefined;
      const gitDir = path.resolve(dir, match[1]);
      const common = readText(path.join(gitDir, "commondir"))?.trim();
      return { top: dir, common: common ? path.resolve(gitDir, common) : gitDir };
    }
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

/**
 * The URL of a repository's `origin` remote, or of its first remote, from the
 * shared git config.
 *
 * @param {string} common
 */
function remoteUrl(common) {
  const text = readText(path.join(common, "config"));
  if (!text) return undefined;
  /** @type {Map<string, string>} */
  const urls = new Map();
  let remote;
  for (const line of text.split("\n")) {
    const section = /^\s*\[\s*remote\s+"([^"]+)"\s*\]/.exec(line);
    if (section) {
      remote = section[1];
      continue;
    }
    if (/^\s*\[/.test(line)) {
      remote = undefined;
      continue;
    }
    const url = /^\s*url\s*=\s*(.+?)\s*$/.exec(line);
    if (remote && url && !urls.has(remote)) urls.set(remote, url[1]);
  }
  return urls.get("origin") ?? urls.values().next().value;
}

/**
 * A remote URL with its transport, user and `.git` suffix removed, so the
 * HTTPS and SSH forms of one repository compare equal:
 * `git@github.com:me/app.git` and `https://github.com/me/app` are both
 * `github.com/me/app`. Undefined for a remote on this disk.
 *
 * @param {string} url
 */
export function normalizeRemote(url) {
  const text = String(url).trim();
  if (!text || text.startsWith("/") || text.startsWith(".") || /^file:/i.test(text)) return undefined;
  let rest;
  const scheme = /^[a-z][a-z0-9+.-]*:\/\/(.+)$/i.exec(text);
  if (scheme) rest = scheme[1].replace(/^[^@/]*@/, "");
  else {
    // scp-like syntax: [user@]host:path
    const scp = /^(?:[^@/:]+@)?([^/:]+):(.+)$/.exec(text);
    if (!scp) return undefined;
    rest = `${scp[1]}/${scp[2].replace(/^\/+/, "")}`;
  }
  const [host, ...parts] = rest.split("/");
  const repo = parts.join("/").replace(/\/+$/, "").replace(/\.git$/i, "");
  if (!host || !repo) return undefined;
  return `${host.toLowerCase().replace(/:\d+$/, "")}/${repo}`;
}

/**
 * The repository `root` belongs to.
 *
 * Keyed by the working directory, every disposable worktree and pool slot got
 * a bucket of its own, so a review in the main checkout never saw what its
 * workers' sessions recorded. Every worktree of a repository shares one git
 * directory, whose main working tree is the checkout:
 *
 * - `checkout`: the main working tree's path. It is also the key a main
 *   checkout had before, so existing observations stay where they are;
 * - `remote`: a worktree of a bare repository, such as the mirror a pipeline
 *   checks worktrees out from, has no main working tree. It is keyed by its
 *   normalized `origin` URL, which a checkout of the same remote maps to
 *   itself (see `projectDataId`);
 * - `path`: outside git, `root` itself, as before.
 *
 * @param {string} root
 * @returns {{ key: string, kind: "checkout" | "remote" | "path", checkout: string | null, remote: string | null }}
 */
export function repositoryKey(root) {
  const resolved = path.resolve(root);
  const dirs = gitDirs(resolved);
  if (!dirs) return { key: resolved, kind: "path", checkout: null, remote: null };
  const url = remoteUrl(dirs.common);
  const remote = (url && normalizeRemote(url)) || null;
  // A bare repository has no main working tree; its worktrees are all linked.
  const checkout = path.basename(dirs.common) === ".git" ? path.dirname(dirs.common) : null;
  if (checkout) return { key: checkout, kind: "checkout", checkout, remote };
  if (remote) return { key: `repo:${remote}`, kind: "remote", checkout: null, remote };
  return { key: dirs.common, kind: "checkout", checkout: null, remote: null };
}

/** Where a remote's checkout is recorded, so a bare mirror's worktree finds it. */
function aliasFile(base, remote) {
  return path.join(base, "repositories", `${projectId(`repo:${remote}`)}.json`);
}

/**
 * The id of `root`'s observation directory: its repository's, not its path's.
 *
 * With `base`, the plugin data directory, a checkout that has a remote records
 * itself as that remote's checkout (`record`), and a worktree of a bare mirror
 * of the same remote then uses the checkout's id. The first checkout recorded
 * keeps the alias until it is deleted, so two clones of one remote do not take
 * it from each other on every hook call. Without one recorded yet, the
 * mirror's worktrees share an id of their own.
 *
 * @param {string} root
 * @param {{ base?: string, record?: boolean }} [options]
 */
export function projectDataId(root, { base, record = false } = {}) {
  const repository = repositoryKey(root);
  const id = projectId(repository.key);
  if (!base || !repository.remote) return id;
  const file = aliasFile(base, repository.remote);
  if (repository.kind === "checkout" && repository.checkout) {
    const recorded = readJson(file, {});
    const held = typeof recorded.checkout === "string" && fs.existsSync(recorded.checkout);
    if (record && recorded.id !== id && !held) {
      try {
        writeJsonAtomic(file, { id, checkout: repository.checkout, remote: repository.remote });
      } catch {
        // without the alias, a mirror's worktrees keep a bucket of their own
      }
    }
    return id;
  }
  const alias = readJson(file, {});
  return typeof alias.id === "string" && /^[0-9a-f]{20}$/.test(alias.id) ? alias.id : id;
}

/**
 * Ids `root`'s observations were kept under before they were keyed by
 * repository: its own path's. They are left where they are, never moved, and
 * the status report names them.
 *
 * @param {string} root
 */
export function legacyDataIds(root) {
  const resolved = path.resolve(root);
  const current = projectId(repositoryKey(resolved).key);
  return projectId(resolved) === current ? [] : [projectId(resolved)];
}

/**
 * True inside an agent this plugin started (a skill draft or a dream).
 *
 * The child is a full Claude Code session, so it loads this plugin and fires
 * its hooks. Its prompt embeds recorded corrections and its tool calls are not
 * the human's work, so counting either would feed the plugin's own output back
 * into the review triggers.
 */
export function isImproveChild(env = process.env) {
  return env.IMPROVE_AGENT_CHILD === "1" || env.IMPROVE_DREAM_CHILD === "1";
}

/**
 * Why this session was launched by a program rather than a person, or
 * undefined.
 *
 * Claude Code marks a `-p` session with the `sdk-cli` entrypoint. Firstmate exports
 * FM_TASK_ID to the workers it launches, whose every prompt is Firstmate's.
 * Other SDK entrypoints are not enough: an interactive front end built on the
 * SDK has a person typing into it.
 * Their prompts are not corrections from a person; their tool calls are still
 * agent work in the repository, so only prompt capture skips them.
 *
 * @param {Record<string, string | undefined>} [env]
 */
export function automatedLaunch(env = process.env) {
  if (isImproveChild(env)) return "an agent improve started";
  if (env.CLAUDE_CODE_ENTRYPOINT === "sdk-cli") return "a print-mode session";
  if (env.FM_TASK_ID) return "a Firstmate worker";
  return undefined;
}

/**
 * The plugin data directory for `root`, from the environment or from disk.
 *
 * Claude Code exports CLAUDE_PLUGIN_DATA to hook processes only. A script a
 * skill runs, or the UI started from one, does not see it, so the status CLI
 * used to fail and the UI showed no observations. The directory lives at
 * `<config>/plugins/data/<plugin>-<marketplace>/`; look there for this
 * plugin's copy that already holds observations for `root`'s repository, under
 * its current key or a legacy one.
 *
 * Returns `{ dir, source }`, or undefined when nothing can be found. An empty
 * variable counts as unset, because an unsubstituted `${CLAUDE_PLUGIN_DATA}`
 * expands to "".
 *
 * @param {string} root
 * @param {{ env?: Record<string, string | undefined>, home?: string }} [options]
 */
export function resolvePluginDataDir(root, { env = process.env, home = os.homedir() } = {}) {
  if (env.CLAUDE_PLUGIN_DATA) return { dir: path.resolve(env.CLAUDE_PLUGIN_DATA), source: "env" };
  const base = path.join(env.CLAUDE_CONFIG_DIR || path.join(home, ".claude"), "plugins", "data");
  let names;
  try {
    names = fs.readdirSync(base).filter((name) => /^improve-/.test(name)).sort();
  } catch {
    return undefined;
  }
  const holding = names.filter((name) => {
    const dir = path.join(base, name);
    return [projectDataId(root, { base: dir }), ...legacyDataIds(root)]
      .some((id) => fs.existsSync(path.join(dir, "projects", id)));
  });
  const chosen = holding[0] ?? (names.length === 1 ? names[0] : undefined);
  return chosen ? { dir: path.join(base, chosen), source: "discovered" } : undefined;
}

/**
 * `root`'s observation directory inside the plugin data directory `base`,
 * found by `resolvePluginDataDir`. Reads only: it records no alias.
 *
 * @param {string} base
 * @param {string} root
 */
export function observationDir(base, root) {
  return path.join(base, "projects", projectDataId(root, { base }));
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

const LOCK_WAIT_MS = 2_000;
const LOCK_STALE_MS = 10_000;

/**
 * Read `file`, pass its value to `update`, and write what it returns, holding
 * `<file>.lock` throughout so another process's update is not lost.
 *
 * Every worktree and pool slot of a repository shares one state.json, and
 * hooks update it on every tool call. Without the lock, a hook that read the
 * file just before `review-cli reviewed` wrote back the old counts and undid
 * the review. A lock older than LOCK_STALE_MS was left by a process that died
 * and is taken over; past LOCK_WAIT_MS the update throws.
 *
 * @template T
 * @param {string} file
 * @param {(value: any) => T} update
 * @returns {T}
 */
export function updateJson(file, update) {
  ensureDir(path.dirname(file));
  const lock = `${file}.lock`;
  const deadline = Date.now() + LOCK_WAIT_MS;
  for (;;) {
    try {
      fs.closeSync(fs.openSync(lock, "wx", 0o600));
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      try {
        if (Date.now() - fs.statSync(lock).mtimeMs > LOCK_STALE_MS) fs.rmSync(lock, { force: true });
      } catch {
        // released between the open and the stat; try again
      }
      if (Date.now() > deadline) throw new Error(`${path.basename(file)} is locked by another process`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5 + Math.floor(Math.random() * 10));
    }
  }
  try {
    const value = update(readJson(file, {}));
    writeJsonAtomic(file, value);
    return value;
  } finally {
    fs.rmSync(lock, { force: true });
  }
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
      // Rates over opportunities, never raw totals: a total only grows, so
      // every repository with any activity used to be "due" for good. Each
      // rate waits for enough opportunities that one bad hour does not count.
      tool_failure_rate: 0.05,
      min_tool_calls: 300,
      // Candidate corrections per session a person ran.
      correction_rate: 2,
      min_sessions: 5,
      // The same correction, in this many separate sessions. One session that
      // repeats itself is one conversation, not a pattern.
      repeated_correction_sessions: 3,
      // Wall-clock is a long-stop after a review, never the signal.
      every_days: 90
    },
    capture: {
      enabled: true,
      corrections: true
    },
    background_dreaming: {
      enabled: false,
      every_days: 30,
      command: "claude",
      // A read-only review of a large repository can take a while; past this
      // it is stopped and reported as timed out rather than left running.
      timeout_minutes: 20
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

// Distinct sessions kept per correction group, and groups kept, so state.json
// stays small however long a repository goes without a review.
const MAX_GROUP_SESSIONS = 20;
const MAX_GROUPS = 500;

/**
 * Count a candidate correction into `state`: the total since the last review,
 * and its fingerprint's count and the sessions it was seen in.
 *
 * @param {Record<string, any>} state
 * @param {string} key
 * @param {string | undefined} sessionId
 */
export function recordCandidate(state, key, sessionId) {
  state.candidates_since_review = (state.candidates_since_review || 0) + 1;
  const groups = state.candidate_groups && typeof state.candidate_groups === "object" ? state.candidate_groups : {};
  const group = groups[key] ?? { count: 0, sessions: [] };
  group.count += 1;
  if (sessionId && !group.sessions.includes(sessionId)) {
    group.sessions = [...group.sessions, sessionId].slice(-MAX_GROUP_SESSIONS);
  }
  groups[key] = group;
  const keys = Object.keys(groups);
  if (keys.length > MAX_GROUPS) {
    for (const old of keys.sort((x, y) => groups[x].count - groups[y].count).slice(0, keys.length - MAX_GROUPS)) {
      if (old !== key) delete groups[old];
    }
  }
  state.candidate_groups = groups;
  return state;
}

/**
 * The candidate correction seen in the most separate sessions since the last
 * review, or undefined.
 *
 * Fingerprints are word sets, so near-identical keys are grouped here, at read
 * time; grouping by meaning needs a model and happens at review time
 * (`review-cli.mjs cluster`). Only candidates recorded since prompts from
 * programs stopped being captured count: the older `correction_fingerprints`
 * were mostly launch templates.
 *
 * @param {Record<string, any>} state
 * @returns {{ key: string, count: number, sessions: number, members: string[] } | undefined}
 */
export function topRepeatedCorrection(state, threshold = 0.6) {
  const entries = Object.entries(state.candidate_groups || {})
    .filter(([, group]) => group && typeof group.count === "number");
  if (entries.length === 0) return undefined;

  const groups = [];
  for (const [key, group] of entries.sort((a, b) => b[1].count - a[1].count)) {
    const existing = groups.find((g) => similarity(g.key, key) >= threshold);
    const sessions = Array.isArray(group.sessions) ? group.sessions : [];
    if (existing) {
      existing.count += group.count;
      existing.members.push(key);
      for (const id of sessions) existing.sessionIds.add(id);
    } else {
      groups.push({ key, count: group.count, members: [key], sessionIds: new Set(sessions) });
    }
  }
  const top = groups
    .map(({ sessionIds, ...g }) => ({ ...g, sessions: sessionIds.size }))
    .sort((a, b) => b.sessions - a.sessions || b.count - a.count)[0];
  return top;
}

/**
 * Why a review is due, if it is.
 *
 * Every trigger is a rate over opportunities, measured since the last review
 * on evidence a person produced:
 *
 * - tool calls that failed, as a share of tool calls;
 * - candidate corrections per session a person ran;
 * - one correction coming back in several separate sessions.
 *
 * A total that only grows (tool calls, sessions, corrections) used to fire on
 * its own, so 344 of 469 observed buckets were "due" and none was ever
 * reviewed. Days since the last review are a long-stop once a review has
 * happened. `markReviewed` resets the counts.
 *
 * @param {ReturnType<typeof loadConfig>} config
 * @param {Record<string, any>} state
 */
export function dueReasons(config, state, now = Date.now()) {
  const reasons = [];
  const review = config.review;

  const calls = state.tool_calls_since_review || 0;
  const failures = state.tool_failures_since_review || 0;
  if (calls >= review.min_tool_calls && failures / calls >= review.tool_failure_rate) {
    reasons.push(`${Math.round((failures / calls) * 100)}% of tool calls failed since the last harness review (${failures} of ${calls})`);
  }

  const repeated = topRepeatedCorrection(state);
  if (repeated && repeated.sessions >= review.repeated_correction_sessions) {
    reasons.push(`the same correction came up in ${repeated.sessions} separate sessions`);
  }

  const sessions = state.human_sessions_since_review || 0;
  const candidates = state.candidates_since_review || 0;
  if (sessions >= review.min_sessions && candidates / sessions >= review.correction_rate) {
    reasons.push(`${candidates} corrections in ${sessions} sessions since the last harness review`);
  }

  // Long-stop. Only fires once a review has happened, so a new repository is
  // never reported as overdue.
  if (state.last_reviewed_at && daysSince(state.last_reviewed_at, now) >= review.every_days) {
    reasons.push(`${review.every_days} days since the last harness review`);
  }

  return reasons;
}

/**
 * Record that a harness review ran: every count since the last review starts
 * again from zero. The counts it had are kept in `last_review` so the review
 * can be compared with the next one. Older counters that are no longer read
 * (`corrections_since_review`, `correction_fingerprints`) are dropped here and
 * nowhere else.
 *
 * @param {Record<string, any>} state
 */
export function markReviewed(state, now = Date.now()) {
  const at = new Date(now).toISOString();
  const {
    tool_calls_since_review: toolCalls = 0,
    tool_failures_since_review: toolFailures = 0,
    sessions_since_review: sessions = 0,
    human_sessions_since_review: humanSessions = 0,
    candidates_since_review: candidates = 0,
    candidate_groups: _groups,
    corrections_since_review: _corrections,
    correction_fingerprints: _fingerprints,
    machine_prompts_skipped: skipped = {},
    ...rest
  } = state;
  return {
    ...rest,
    last_reviewed_at: at,
    last_review: {
      at,
      tool_calls: toolCalls,
      tool_failures: toolFailures,
      sessions,
      human_sessions: humanSessions,
      candidates,
      machine_prompts_skipped: skipped
    },
    tool_calls_since_review: 0,
    tool_failures_since_review: 0,
    sessions_since_review: 0,
    human_sessions_since_review: 0,
    candidates_since_review: 0,
    candidate_groups: {},
    updated_at: at
  };
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

/**
 * The skill named by a path under `.claude/skills/<name>/`, if any.
 *
 * Lives here rather than beside the hook that uses it: that file reads stdin at
 * the top level, so importing it to reach a helper would block.
 */
export function skillFromPath(candidate) {
  if (typeof candidate !== "string") return undefined;
  const match = candidate.replaceAll("\\", "/").match(/\.claude\/skills\/([^/]+)\//);
  if (!match) return undefined;
  const name = match[1];
  return name.startsWith(".") ? undefined : name;
}
