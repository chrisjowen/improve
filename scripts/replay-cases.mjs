import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { redact } from "./redact.mjs";
import { cutHistory, findTranscript, humanPrompt, locateCorrection, precedingTurn, readTranscript, toolCalls } from "./transcripts.mjs";
import { toYaml } from "./yaml-emit.mjs";

/**
 * The replay suite: cases built from real corrections and real tool failures.
 *
 * Each case resumes a copy of the session cut just before the turn the agent
 * got wrong. The person's prompt from that turn is the case's prompt, so it
 * runs again as the next real turn, and graders derived from the correction
 * check whether the agent now does what the person had to ask for. The suite
 * lives in the repository, under `.harness/evals/replay/`, so it is reviewed
 * and kept like any other eval:
 *
 *   suite.json                  every case, its split and where it came from
 *   cases/<name>/case.yaml      a `claude plugin eval` case
 *   cases/<name>/history.jsonl  the redacted conversation it resumes
 */

export const SUITE_DIR = path.join(".harness", "evals", "replay");

/** Tools every case may use: they read and cannot change anything. */
export const READ_TOOLS = ["Read", "Glob", "Grep"];

/**
 * Tools `claude plugin eval` withholds until the operator grants them with
 * `--allow-tools`, besides every `mcp__` tool. Unless `replay.allow_tools` grants one, a grader that
 * needs it is left out at export, and a case that needs it is skipped at run
 * time with that reason.
 */
export const GATED_TOOLS = new Set(["Bash", "Write", "Edit", "NotebookEdit", "WebFetch", "WebSearch"]);

const MAX_TURNS = 6;
const RUNS = 3;

/** @param {string} text */
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** @param {string} text */
function slug(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "") || "case";
}

/** @param {string} text */
function shortHash(text) {
  return crypto.createHash("sha256").update(String(text)).digest("hex").slice(0, 6);
}

/** Words that start a shell command rather than name a thing. */
const COMMAND_WORDS = "npm|npx|pnpm|yarn|bun|node|deno|python3?|pip|uv|pytest|go|cargo|make|mix|bundle|rake|gradle|mvn|dotnet|git|gh|docker|kubectl|terraform|bash|sh|zsh|curl|eslint|prettier|tsc|jest|vitest|ruff|mypy|black|rspec|elixir|iex|swift|xcodebuild|just|task";
const COMMANDS = new RegExp(`^(${COMMAND_WORDS})\\b`, "i");

/** @param {string} token */
const isCommand = (token) => COMMANDS.test(token.trim());

/** Words that end a command phrase in prose. */
const PHRASE_END = "before|after|instead|and|or|then|for|to|in|on|when|unless|first|again|ever|every|each|anymore|please";

/**
 * A thing named in a correction: quoted, a command with up to three
 * arguments, or one plain word.
 */
const THING = String.raw`(?:\x60([^\x60]{2,80})\x60|"([^"]{2,80})"|'([^']{2,80})'|((?:${COMMAND_WORDS})(?:\s+(?!(?:${PHRASE_END})\b)[-\w=.:/]+){0,3})|([\w@./:+-]{2,40}))`;

/** Capture groups in THING. */
const GROUPS = 5;

/** @param {RegExpExecArray} match @param {number} at */
function thing(match, at) {
  for (let i = at; i < at + GROUPS; i += 1) if (match[i] !== undefined) return match[i].trim();
  return "";
}

const STOP_WORDS = new Set(["it", "that", "this", "the", "a", "an", "to", "me", "them", "those", "these", "so", "too", "again", "anything", "something", "everything"]);

/** @param {string} token */
function meaningful(token) {
  const words = token.toLowerCase().split(/\s+/);
  return token.length >= 2 && !words.every((w) => STOP_WORDS.has(w));
}

/**
 * What a grader needs granted, from what it checks.
 *
 * @param {any} grader
 * @returns {string[]}
 */
export function graderNeeds(grader) {
  if (grader?.type === "file_exists") return ["Write"];
  const tools = [];
  if (grader?.type === "tool_used") tools.push(grader.tool);
  if (grader?.type === "tool_order") {
    for (const side of [grader.before, grader.after]) tools.push(typeof side === "string" ? side : side?.tool);
  }
  // MCP tools are withheld too, and their servers do not run in an eval.
  return [...new Set(tools.filter((tool) => typeof tool === "string" && (GATED_TOOLS.has(tool) || tool.startsWith("mcp__"))))];
}

/**
 * Graders for a correction, deterministic wherever the correction names
 * something a check can see, and an LLM grader only when nothing fits.
 *
 * A check never targets the whole `trace`: it holds the context a SessionStart
 * hook adds, which is where a CLAUDE.md lesson rides, so a lesson that names
 * a command would pass a trace check by being loaded. Tool calls are checked
 * with `tool_used` and `tool_order`, the reply with `last_message`.
 *
 * A grader that needs a tool `grants` does not include is left out of
 * `graders` and named in `dropped`; `checks` keeps every deterministic check,
 * because reading a transcript needs no grant.
 *
 * @param {{ text: string, guidance?: string | null, label?: string | null, grants?: string[] | null }} correction
 * @returns {{ graders: any[], method: "deterministic" | "llm", checks: any[], dropped: string[] }}
 */
export function deriveGraders({ text, guidance, label, grants = null }) {
  const source = [text, guidance].filter((t) => typeof t === "string" && t.trim()).join("\n");
  /** @type {any[]} */
  const graders = [];
  const names = new Set();
  /** @param {any} grader */
  const add = (grader) => {
    let name = grader.name;
    for (let n = 2; names.has(name); n += 1) name = `${grader.name}-${n}`;
    names.add(name);
    graders.push({ ...grader, name });
  };

  /** @param {string} token */
  const require = (token) => {
    if (!meaningful(token)) return;
    if (isCommand(token)) {
      add({ type: "tool_used", name: `runs-${slug(token)}`, tool: "Bash", input_match: escapeRegex(token), min: 1 });
    }
    add({ type: "regex", name: `mentions-${slug(token)}`, target: "last_message", pattern: escapeRegex(token), flags: "i" });
  };
  /** @param {string} token */
  const forbid = (token) => {
    // Only a command can be checked without reading the reply, which may
    // name the thing to say it will not use it.
    if (!meaningful(token) || !isCommand(token)) return;
    // input_match runs against the tool input as JSON, so the command may
    // open or close a quoted string.
    add({ type: "tool_used", name: `avoids-${slug(token)}`, tool: "Bash", input_match: `(^|[\\s;&|("])${escapeRegex(token)}([\\s;&|)"]|$)`, max: 0 });
  };

  const insteadOf = new RegExp(String.raw`\b(?:use|run|call)\s+${THING}\s+instead\s+of\s+${THING}`, "i").exec(source);
  if (insteadOf) {
    require(thing(insteadOf, 1));
    forbid(thing(insteadOf, 1 + GROUPS));
  } else {
    const after = new RegExp(String.raw`\binstead\s+of\s+${THING}`, "i").exec(source);
    if (after) forbid(thing(after, 1));
  }
  for (const match of source.matchAll(new RegExp(String.raw`\b(?:don'?t|do not|never|stop)\s+(?:use|using|run|running|call|calling)\s+${THING}`, "gi"))) {
    forbid(thing(/** @type {RegExpExecArray} */ (match), 1));
  }
  if (!insteadOf) {
    for (const match of source.matchAll(new RegExp(String.raw`\b(?:always|make sure (?:you|to)|please)\s+(?:use|run|call)\s+${THING}`, "gi"))) {
      require(thing(/** @type {RegExpExecArray} */ (match), 1));
    }
  }
  const order = new RegExp(String.raw`\b(?:run|use)\s+${THING}\s+before\s+(?:you\s+)?(?:run(?:ning)?\s+|use\s+)?${THING}`, "i").exec(source);
  if (order && isCommand(thing(order, 1)) && isCommand(thing(order, 1 + GROUPS))) {
    const [first, then] = [thing(order, 1), thing(order, 1 + GROUPS)];
    add({
      type: "tool_order",
      name: `${slug(first)}-before-${slug(then)}`,
      before: { tool: "Bash", input_match: escapeRegex(first) },
      after: { tool: "Bash", input_match: escapeRegex(then) }
    });
  }
  const file = /\b(?:create|write|add|keep|put|update)\b[^.\n]{0,40}?\b((?:[\w.-]+\/)*[\w.-]+\.(?:md|json|ya?ml|txt|toml|sh))\b/i.exec(source);
  if (file && !file[1].includes("..")) {
    add({ type: "file_exists", name: `writes-${slug(file[1])}`, path: file[1] });
  }

  const runnable = grants ? graders.filter((g) => graderNeeds(g).every((tool) => grants.includes(tool))) : graders;
  const dropped = graders.filter((g) => !runnable.includes(g)).map((g) => g.name);
  if (runnable.length > 0) return { graders: runnable, method: "deterministic", checks: graders, dropped };
  const rule = (guidance?.trim() || label?.trim() || text.trim()).slice(0, 500).replace(/([^.!?])$/, "$1.");
  return {
    method: "llm",
    checks: graders,
    dropped,
    graders: [{
      type: "llm",
      name: "follows-the-correction",
      criteria: [
        "Earlier, a person had to correct the agent at this point in the session.",
        `The standing rule they gave: ${rule}`,
        "PASS when the agent's reply and actions follow that rule without being told again. FAIL when they repeat what the person had to correct."
      ].join(" ")
    }]
  };
}

/**
 * The split a new case joins: a third go to the sealed test split, by a hash
 * of the name so the same case always lands in the same split.
 *
 * @param {string} name
 * @returns {"validation" | "test"}
 */
export function splitFor(name) {
  return parseInt(crypto.createHash("sha256").update(name).digest("hex").slice(0, 8), 16) % 3 === 0 ? "test" : "validation";
}

/**
 * A `claude plugin eval` case.
 *
 * @param {{ name: string, description: string, kind: string, prompt: string, graders: any[] }} spec
 */
export function caseDocument({ name, description, kind, prompt, graders }) {
  const needs = [...new Set(graders.flatMap(graderNeeds))];
  return {
    schema_version: "1.0",
    name,
    description,
    tags: ["improve-replay", kind],
    context: { history_file: "history.jsonl" },
    execution: { prompt, max_turns: MAX_TURNS, timeout_seconds: 300, allowed_tools: [...READ_TOOLS, ...needs] },
    runs: RUNS,
    graders
  };
}

/**
 * The case for one correction group, built from the most recent member whose
 * session transcript can still be read. Undefined, with the reason, when none
 * can.
 *
 * @param {{ label: string, guidance?: string | null, members?: { session_id?: string | null, occurred_at?: string | null, excerpt?: string, fingerprint?: string }[] }} cluster
 * @param {{ home?: string, configDir?: string, maxPrompts?: number, grants?: string[] }} [options]
 */
export function correctionCase(cluster, options = {}) {
  const members = (Array.isArray(cluster.members) ? cluster.members : [])
    .filter((m) => typeof m?.session_id === "string" && typeof m.excerpt === "string")
    .sort((a, b) => String(b.occurred_at).localeCompare(String(a.occurred_at)));
  if (members.length === 0) return { skipped: "the group records no session to replay; run review-cli cluster again" };
  let reason = "no member's session transcript is on this machine any more";
  for (const member of members) {
    const file = findTranscript(/** @type {string} */ (member.session_id), options);
    if (!file) continue;
    const rows = readTranscript(file);
    const at = locateCorrection(rows, { excerpt: /** @type {string} */ (member.excerpt), occurredAt: member.occurred_at });
    if (at === -1) {
      reason = "the correction was not found in its session transcript";
      continue;
    }
    const start = precedingTurn(rows, at);
    if (start === -1) {
      reason = "the correction was the session's first prompt, so there is no earlier turn to replay";
      continue;
    }
    const prompt = redact(/** @type {{ text: string }} */ (humanPrompt(rows[start])).text.trim()).text;
    const history = cutHistory(rows, start, { maxPrompts: options.maxPrompts });
    const derived = deriveGraders({ text: /** @type {string} */ (member.excerpt), guidance: cluster.guidance, label: cluster.label, grants: options.grants ?? [] });
    const name = `correction-${slug(cluster.label)}-${shortHash(cluster.label)}`;
    return {
      name,
      kind: "correction",
      document: caseDocument({
        name,
        kind: "correction",
        description: `Replays the turn before a person corrected the agent: ${cluster.label}`,
        prompt,
        graders: derived.graders
      }),
      history: history.rows,
      entry: {
        name,
        kind: "correction",
        label: cluster.label,
        guidance: cluster.guidance ?? null,
        correction: member.excerpt,
        fingerprints: [...new Set((cluster.members ?? []).map((m) => m.fingerprint).filter((f) => typeof f === "string" && f))],
        session_id: member.session_id,
        occurred_at: member.occurred_at ?? null,
        graders: derived.method,
        needs: [...new Set(derived.graders.flatMap(graderNeeds))],
        // Every deterministic check, including ones left out for want of a
        // grant: the outcome reads them against later sessions' transcripts.
        checks: derived.checks,
        dropped_graders: derived.dropped,
        redactions: history.redactions
      }
    };
  }
  return { skipped: reason };
}

/**
 * The distinctive part of a tool call's input: the command, path or pattern.
 *
 * @param {string} tool
 * @param {any} input
 */
function callKey(tool, input) {
  const value = input?.command ?? input?.file_path ?? input?.notebook_path ?? input?.path ?? input?.pattern ?? input?.url ?? input?.query
    ?? Object.values(input ?? {}).find((v) => typeof v === "string");
  return typeof value === "string" ? value.trim().split("\n")[0].slice(0, 80) : "";
}

/**
 * What a repeat of a failing call looks like, as `input_match` sees it: the
 * tool input as JSON. A shell command is the same command; any other call is
 * the same arguments, so a Read of the same file with `offset` and `limit`,
 * the usual fix for a file too large to read, is a different call.
 *
 * @param {{ name: string, input: any }} call
 */
export function repeatMatch(call) {
  if (call.name === "Bash") return escapeRegex(redact(callKey(call.name, call.input)).text);
  const json = redact(JSON.stringify(call.input ?? {})).text;
  return `^${escapeRegex(json).replace(/([:,])/g, "$1\\s*")}$`;
}

/** @param {string} error */
function errorShape(error) {
  return String(error ?? "").toLowerCase().replace(/\d+/g, "#").replace(/(["'`]).*?\1/g, "…").replace(/\/\S+/g, "/…").replace(/\s+/g, " ").trim().slice(0, 60);
}

/**
 * Tool failures that came back in at least `minSessions` sessions, grouped
 * by tool and the shape of the error, newest occurrence first.
 *
 * @param {any[]} events rows of events.jsonl
 * @param {{ minSessions?: number }} [options]
 */
export function failureGroups(events, { minSessions = 2 } = {}) {
  /** @type {Map<string, { tool: string, error: string, sessions: Set<string>, occurrences: any[] }>} */
  const groups = new Map();
  for (const event of events) {
    if (event?.event !== "PostToolUseFailure" || typeof event.tool_name !== "string" || typeof event.session_id !== "string") continue;
    const key = `${event.tool_name}|${errorShape(event.error_type)}`;
    const group = groups.get(key) ?? { tool: event.tool_name, error: String(event.error_type ?? ""), sessions: new Set(), occurrences: [] };
    group.sessions.add(event.session_id);
    group.occurrences.push(event);
    groups.set(key, group);
  }
  return [...groups.values()]
    .filter((g) => g.sessions.size >= minSessions)
    .map((g) => ({ ...g, sessions: g.sessions.size, occurrences: g.occurrences.sort((a, b) => String(b.occurred_at).localeCompare(String(a.occurred_at))) }))
    .sort((a, b) => b.sessions - a.sessions);
}

/**
 * The case for one recurring tool failure: the turn that made the failing
 * call, graded on not making that call again. Deterministic by construction.
 *
 * @param {ReturnType<typeof failureGroups>[number]} group
 * @param {{ home?: string, configDir?: string, maxPrompts?: number }} [options]
 */
export function failureCase(group, options = {}) {
  let reason = "no session transcript of this failure is on this machine any more";
  for (const event of group.occurrences.slice(0, 10)) {
    const file = findTranscript(event.session_id, options);
    if (!file) continue;
    const rows = readTranscript(file);
    const at = Date.parse(event.occurred_at ?? "");
    const failed = toolCalls(rows).filter((call) => call.isError && call.name === group.tool && callKey(call.name, call.input));
    if (failed.length === 0) {
      reason = "the failing call was not found in its session transcript";
      continue;
    }
    const time = (/** @type {{ index: number }} */ call) => Date.parse(rows[call.index]?.timestamp ?? "");
    const call = failed.reduce((best, c) => (Math.abs(time(c) - at) < Math.abs(time(best) - at) ? c : best));
    const start = precedingTurn(rows, call.index);
    if (start === -1) {
      reason = "no prompt a person typed came before the failing call";
      continue;
    }
    const key = redact(callKey(call.name, call.input)).text;
    const prompt = redact(/** @type {{ text: string }} */ (humanPrompt(rows[start])).text.trim()).text;
    const history = cutHistory(rows, start, { maxPrompts: options.maxPrompts });
    const graders = [{ type: "tool_used", name: "does-not-repeat-the-failing-call", tool: call.name, input_match: repeatMatch(call), max: 0 }];
    const label = `${group.tool} failed: ${group.error.slice(0, 100)}`;
    const name = `failure-${slug(`${group.tool} ${errorShape(group.error)}`)}-${shortHash(`${group.tool}|${errorShape(group.error)}`)}`;
    return {
      name,
      kind: "tool-failure",
      document: caseDocument({ name, kind: "tool-failure", description: `Replays the turn that made a failing ${group.tool} call (${group.sessions} sessions): ${key}`, prompt, graders }),
      history: history.rows,
      entry: {
        name,
        kind: "tool-failure",
        label,
        guidance: null,
        correction: null,
        failing_call: { tool: call.name, input: key },
        fingerprints: [],
        session_id: event.session_id,
        occurred_at: event.occurred_at ?? null,
        graders: "deterministic",
        needs: graderNeeds(graders[0]),
        checks: graders,
        dropped_graders: [],
        redactions: history.redactions
      }
    };
  }
  return { skipped: reason };
}

/**
 * The suite index, or an empty one.
 *
 * @param {string} root
 */
export function readSuite(root) {
  try {
    const value = JSON.parse(fs.readFileSync(path.join(root, SUITE_DIR, "suite.json"), "utf8"));
    return { schema_version: 1, generated_at: null, ...value, cases: Array.isArray(value?.cases) ? value.cases : [] };
  } catch {
    return { schema_version: 1, generated_at: null, cases: [] };
  }
}

/**
 * Write cases for every correction group and recurring tool failure into the
 * repository's replay suite.
 *
 * A case already in the suite keeps its files and its split unless `refresh`
 * is set, so the suite only grows and a test case never moves into
 * validation. At least one case stays in validation.
 *
 * @param {{ root: string, clusters?: any[], events?: any[], minFailureSessions?: number, refresh?: boolean, grants?: string[], home?: string, configDir?: string, now?: Date }} options
 */
export function exportSuite({ root, clusters = [], events = [], minFailureSessions = 2, refresh = false, grants = [], home, configDir, now = new Date() }) {
  const suiteDir = path.join(root, SUITE_DIR);
  const suite = readSuite(root);
  const byName = new Map(suite.cases.map((entry) => [entry.name, entry]));
  const written = [];
  const kept = [];
  const skipped = [];
  const built = [
    ...clusters.map((cluster) => ({ label: cluster.label, result: correctionCase(cluster, { home, configDir, grants }) })),
    ...failureGroups(events, { minSessions: minFailureSessions }).map((group) => ({ label: `${group.tool} failed: ${group.error.slice(0, 100)}`, result: failureCase(group, { home, configDir }) }))
  ];
  for (const { label, result } of built) {
    if (!("name" in result)) {
      skipped.push({ label, reason: result.skipped });
      continue;
    }
    const existing = byName.get(result.name);
    if (existing && !refresh) {
      kept.push(result.name);
      continue;
    }
    const caseDir = path.join(suiteDir, "cases", result.name);
    fs.mkdirSync(caseDir, { recursive: true });
    fs.writeFileSync(path.join(caseDir, "case.yaml"), toYaml(result.document), "utf8");
    fs.writeFileSync(path.join(caseDir, "history.jsonl"), result.history.map((row) => JSON.stringify(row)).join("\n") + (result.history.length ? "\n" : ""), "utf8");
    byName.set(result.name, { ...result.entry, split: existing?.split ?? splitFor(result.name), exported_at: now.toISOString() });
    written.push(result.name);
  }
  const cases = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  if (cases.length > 0 && !cases.some((c) => c.split === "validation")) {
    const first = cases.find((c) => written.includes(c.name)) ?? cases[0];
    first.split = "validation";
  }
  const index = { schema_version: 1, generated_at: now.toISOString(), cases };
  fs.mkdirSync(suiteDir, { recursive: true });
  fs.writeFileSync(path.join(suiteDir, "suite.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8");
  return {
    suite: path.join(SUITE_DIR, "suite.json"),
    written,
    kept,
    skipped,
    counts: {
      cases: cases.length,
      validation: cases.filter((c) => c.split === "validation").length,
      test: cases.filter((c) => c.split === "test").length,
      deterministic: cases.filter((c) => c.graders === "deterministic").length,
      llm: cases.filter((c) => c.graders === "llm").length
    }
  };
}
