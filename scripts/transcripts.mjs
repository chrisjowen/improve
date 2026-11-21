import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { machinePrompt } from "./detect.mjs";
import { redact } from "./redact.mjs";

/**
 * Claude Code session transcripts, read for replay.
 *
 * A transcript is `~/.claude/projects/<encoded cwd>/<session id>.jsonl`: one
 * entry per line, linked by `parentUuid`. A replay case resumes a copy cut
 * just before the turn the agent got wrong, so the person's prompt from that
 * turn runs again as the next real turn (`context.history_file` in
 * `claude plugin eval`). No top-level I/O, so tests and the UI can import it.
 */

/** Entry types a resumed session reads as conversation. */
const CONVERSATION = new Set(["user", "assistant"]);

/**
 * The transcript of `sessionId`, searched for under every project directory,
 * or undefined. A session's file is named by its id, whichever directory its
 * working directory encoded to.
 *
 * @param {string} sessionId
 * @param {{ home?: string, configDir?: string }} [options]
 */
export function findTranscript(sessionId, { home = os.homedir(), configDir = process.env.CLAUDE_CONFIG_DIR } = {}) {
  if (typeof sessionId !== "string" || !/^[\w-]+$/.test(sessionId)) return undefined;
  const base = path.join(configDir || path.join(home, ".claude"), "projects");
  let dirs;
  try {
    dirs = fs.readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return undefined;
  }
  for (const dir of dirs) {
    const file = path.join(base, dir, `${sessionId}.jsonl`);
    if (fs.existsSync(file)) return file;
  }
  return undefined;
}

/**
 * Every entry of a transcript, in file order. A torn line is skipped.
 *
 * @param {string} file
 * @returns {any[]}
 */
export function readTranscript(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return [];
  }
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      // a torn line is skipped, not fatal
    }
  }
  return rows;
}

/**
 * What a person typed in `row`, or undefined when the row is not a person's
 * prompt: a tool result, a meta entry, a sidechain, or a program's prompt.
 *
 * A prompt sent while the agent was working arrives as a `queued_command`
 * attachment rather than a user entry; `queued` says which.
 *
 * @param {any} row
 * @returns {{ text: string, queued: boolean } | undefined}
 */
export function humanPrompt(row) {
  if (!row || typeof row !== "object" || row.isSidechain) return undefined;
  let text;
  let queued = false;
  if (row.type === "user" && !row.isMeta) {
    const content = row.message?.content;
    if (typeof content === "string") text = content;
    else if (Array.isArray(content) && content.every((block) => block?.type === "text" || block?.type === "image")) {
      text = content.filter((block) => block.type === "text").map((block) => block.text).join("\n");
    }
  } else if (row.type === "attachment" && row.attachment?.type === "queued_command") {
    if (row.attachment.origin && row.attachment.origin.kind !== "human") return undefined;
    text = typeof row.attachment.prompt === "string" ? row.attachment.prompt : undefined;
    queued = true;
  }
  if (typeof text !== "string" || !text.trim() || machinePrompt(text)) return undefined;
  return { text, queued };
}

/** @param {string} text */
const squash = (text) => text.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * The index of the row where a recorded correction was typed, or -1.
 *
 * The hook keeps the first 280 characters of the prompt, redacted, so the
 * prompt is matched on the same treatment of its start. When the same words
 * were typed twice, the one nearest `occurredAt` wins.
 *
 * @param {any[]} rows
 * @param {{ excerpt: string, occurredAt?: string | null }} correction
 */
export function locateCorrection(rows, { excerpt, occurredAt }) {
  const want = squash(String(excerpt ?? "").replace(/…$/, "")).slice(0, 120);
  if (!want) return -1;
  const at = Date.parse(occurredAt ?? "");
  let best = -1;
  let bestGap = Number.POSITIVE_INFINITY;
  rows.forEach((row, index) => {
    const prompt = humanPrompt(row);
    if (!prompt) return;
    const seen = squash(redact(prompt.text.trim()).text);
    if (!seen.startsWith(want)) return;
    const time = Date.parse(row.timestamp ?? row.attachment?.timestamp ?? "");
    const gap = Number.isFinite(at) && Number.isFinite(time) ? Math.abs(time - at) : 0;
    if (gap < bestGap) {
      best = index;
      bestGap = gap;
    }
  });
  return best;
}

/**
 * The index of the person's prompt that started the turn before `index`: the
 * latest prompt a person typed before it that was not queued mid-turn, or -1.
 *
 * @param {any[]} rows
 * @param {number} index
 */
export function precedingTurn(rows, index) {
  for (let i = index - 1; i >= 0; i -= 1) {
    const prompt = humanPrompt(rows[i]);
    if (prompt && !prompt.queued) return i;
  }
  return -1;
}

/**
 * Tool calls between `start` and `end`, each paired with its result.
 *
 * @param {any[]} rows
 * @param {number} [start]
 * @param {number} [end]
 * @returns {{ index: number, id: string | null, name: string, input: any, isError: boolean, error: string | null }[]}
 */
export function toolCalls(rows, start = 0, end = rows.length) {
  const calls = [];
  /** @type {Map<string, typeof calls[number]>} */
  const byId = new Map();
  for (let i = Math.max(0, start); i < Math.min(rows.length, end); i += 1) {
    const row = rows[i];
    if (row?.isSidechain) continue;
    const content = row?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (row.type === "assistant" && block?.type === "tool_use") {
        const call = { index: i, id: typeof block.id === "string" ? block.id : null, name: String(block.name ?? ""), input: block.input ?? {}, isError: false, error: null };
        calls.push(call);
        if (call.id) byId.set(call.id, call);
      } else if (row.type === "user" && block?.type === "tool_result" && block.is_error) {
        const call = byId.get(block.tool_use_id);
        if (!call) continue;
        call.isError = true;
        call.error = flatten(block.content).slice(0, 500);
      }
    }
  }
  return calls;
}

/** @param {any} content */
function flatten(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map((block) => (typeof block?.text === "string" ? block.text : "")).join("\n");
  return "";
}

/**
 * Redact every string in `value`, counting what fired.
 *
 * @param {any} value
 * @param {Map<string, number>} counts
 * @returns {any}
 */
function redactDeep(value, counts) {
  if (typeof value === "string") {
    const { text, redactions } = redact(value);
    for (const r of redactions) counts.set(r.rule, (counts.get(r.rule) ?? 0) + r.count);
    return text;
  }
  if (Array.isArray(value)) return value.map((item) => redactDeep(item, counts));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactDeep(item, counts)]));
  }
  return value;
}

/**
 * The conversation before row `end`, cut to resume from.
 *
 * - Only user and assistant entries of the main thread are kept. Each one's
 *   `parentUuid` is relinked to its nearest kept ancestor, and the first is a
 *   root, so the resumed chain is whole.
 * - At most the last `maxPrompts` turns a person started are kept, so a
 *   case does not carry a day's session.
 * - Thinking blocks are dropped: their signatures would not survive
 *   redaction, and a resumed session does not need earlier turns' thinking.
 * - Each tool result keeps its first `maxResultChars` characters.
 * - Every string passes the shared redaction rules; `redactions` counts what
 *   fired, so missing text is not mistaken for clean text.
 *
 * @param {any[]} rows
 * @param {number} end
 * @param {{ maxPrompts?: number, maxResultChars?: number }} [options]
 */
export function cutHistory(rows, end, { maxPrompts = 4, maxResultChars = 2000 } = {}) {
  const parent = new Map();
  for (const row of rows) if (typeof row?.uuid === "string") parent.set(row.uuid, row.parentUuid ?? null);

  let first = 0;
  let prompts = 0;
  for (let i = end - 1; i >= 0; i -= 1) {
    const prompt = humanPrompt(rows[i]);
    if (prompt && !prompt.queued) {
      prompts += 1;
      first = i;
      if (prompts >= maxPrompts) break;
    }
  }

  const kept = rows.slice(first, Math.max(first, end)).filter((row) => CONVERSATION.has(row?.type) && !row.isSidechain && typeof row.uuid === "string");
  const keptIds = new Set(kept.map((row) => row.uuid));
  const counts = new Map();
  const out = [];
  for (const row of kept) {
    let ancestor = row.parentUuid ?? null;
    const seen = new Set();
    while (ancestor && !keptIds.has(ancestor) && !seen.has(ancestor)) {
      seen.add(ancestor);
      ancestor = parent.get(ancestor) ?? null;
    }
    const copy = { ...row, parentUuid: out.length === 0 ? null : (ancestor && keptIds.has(ancestor) ? ancestor : out.at(-1).uuid) };
    const content = copy.message?.content;
    if (Array.isArray(content)) {
      const blocks = content
        .filter((block) => block?.type !== "thinking" && block?.type !== "redacted_thinking")
        .map((block) => (block?.type === "tool_result" ? { ...block, content: clip(block.content, maxResultChars) } : block));
      if (blocks.length === 0) continue;
      copy.message = { ...copy.message, content: blocks };
    }
    delete copy.toolUseResult;
    out.push(redactDeep(copy, counts));
  }
  // Relinking skipped rows can leave a parent that is no longer kept.
  const ids = new Set(out.map((row) => row.uuid));
  out.forEach((row, index) => {
    if (index > 0 && !ids.has(row.parentUuid)) row.parentUuid = out[index - 1].uuid;
  });
  return { rows: out, redactions: Object.fromEntries(counts) };
}

/**
 * @param {any} content
 * @param {number} limit
 */
function clip(content, limit) {
  const text = flatten(content);
  if (text.length <= limit) return typeof content === "string" ? content : [{ type: "text", text }];
  return [{ type: "text", text: `${text.slice(0, limit)}\n[improve: ${text.length - limit} more characters cut for replay]` }];
}

/** When a transcript's first entry was written, from its rows. */
export function startedAt(rows) {
  for (const row of rows) {
    const time = Date.parse(row?.timestamp ?? "");
    if (Number.isFinite(time)) return new Date(time).toISOString();
  }
  return null;
}
