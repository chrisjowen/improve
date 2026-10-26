import fs from "node:fs";
import path from "node:path";
import { similarity } from "../../scripts/lib.mjs";
import { detect, fingerprint } from "../../scripts/detect.mjs";
import { redact } from "../../scripts/redact.mjs";
import { homeRelative } from "./home.mjs";

/**
 * Turn a Firstmate home's records into improve observations. Read-only.
 *
 * Every file is opened for reading only, and nothing under the home is
 * written, renamed, or locked. The result is an observation set in the sense
 * of references/evaluation-and-memory.md: raw evidence for a review, never a
 * rule. Sanitized on the way out: each excerpt passes the shared redaction
 * rules (secrets, tokens, emails, home paths), the home's own absolute path is
 * replaced by `<home>`, excerpts are capped, and every path is relative to the
 * home. No status log, brief, report, or preference file is copied whole.
 *
 * Signals read, each from the file Firstmate documents as its owner:
 *
 *   state/<task>.status         needs-decision / resolved / blocked / failed lines
 *   data/<task>/*findings*      no-mistakes ask-user findings escalated by a worker
 *   state/.wake-queue           stale wakes (a worker that stopped making progress)
 *   state/fleet-ledger.jsonl    dispatch, PR-ready and merge times, when enabled
 *   data/captain.md             the captain's preferences and corrections
 *   data/learnings.md           curated operational learnings
 */

export const EXCERPT_LIMIT = 160;

export function sanitize(text, home, limit = EXCERPT_LIMIT) {
  if (typeof text !== "string") return "";
  let value = text;
  if (home) value = value.split(home).join("<home>");
  value = redact(value).text.replace(/\s+/g, " ").trim();
  return value.length > limit ? `${value.slice(0, limit)}…` : value;
}

function readText(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return undefined;
  }
}

function listDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

const VERBS = new Set([
  "working", "needs-decision", "blocked", "paused", "done", "failed", "resolved", "note", "captain-held"
]);

/**
 * One status line, in the grammar bin/fm-classify-lib.sh owns:
 * `<verb> [corr=<hex>] [at=<epoch>] [key=<slug>]: <text>`, with the tags in any
 * order before the first colon. The older `needs-decision: [key=x] text`
 * placement is accepted as well. Returns undefined for a line with no verb.
 */
export function parseStatusLine(line) {
  if (typeof line !== "string" || !line.trim()) return undefined;
  const colon = line.indexOf(":");
  if (colon === -1) return undefined;
  const head = line.slice(0, colon);
  let text = line.slice(colon + 1).trim();
  const verb = head.trim().split(/\s+/)[0];
  if (!VERBS.has(verb)) return undefined;
  const at = head.match(/\[at=(\d+)\]/)?.[1];
  let key = head.match(/\[key=([^\]\s]+)\]/)?.[1];
  if (!key) {
    const leading = text.match(/^\[key=([^\]\s]+)\]\s*/);
    if (leading) {
      key = leading[1];
      text = text.slice(leading[0].length);
    }
  }
  return { verb, at: at ? Number(at) : null, key: key ?? null, text };
}

/**
 * Open and closed decisions in one status log, folded the way the status
 * contract describes: a keyed `resolved` closes the opener with that key, and a
 * bare `resolved` closes the newest open one.
 */
export function foldDecisions(events) {
  const decisions = [];
  const open = [];
  for (const event of events) {
    if (event.verb === "needs-decision" || event.verb === "blocked") {
      const decision = { kind: event.verb, key: event.key, opened_at: event.at, text: event.text, resolution: null };
      decisions.push(decision);
      open.push(decision);
    } else if (event.verb === "resolved") {
      let index = -1;
      if (event.key) {
        for (let i = open.length - 1; i >= 0; i -= 1) {
          if (open[i].key === event.key) { index = i; break; }
        }
      } else {
        index = open.length - 1;
      }
      if (index !== -1) {
        const [decision] = open.splice(index, 1);
        decision.resolution = { at: event.at, text: event.text };
      }
    }
  }
  return decisions;
}

/**
 * Findings in a no-mistakes ask-user snapshot. The brief tells workers to copy
 * them verbatim with id, severity, file, line, description and authority, but
 * not in a fixed syntax, so three shapes are read: JSON (one array, or one
 * object per line), `key: value` blocks, and as a last resort one finding per
 * paragraph.
 */
export function parseFindings(text) {
  if (typeof text !== "string" || !text.trim()) return [];
  const trimmed = text.trim();
  const fromObject = (value, index) => ({
    id: String(value.id ?? `finding-${index + 1}`),
    severity: value.severity ? String(value.severity) : null,
    file: value.file ? String(value.file) : null,
    line: value.line ?? null,
    description: String(value.description ?? value.summary ?? value.title ?? ""),
    authority: value.authority ? String(value.authority) : null
  });

  try {
    const value = JSON.parse(trimmed);
    const list = Array.isArray(value) ? value : Array.isArray(value?.findings) ? value.findings : [value];
    return list.filter((item) => item && typeof item === "object").map(fromObject);
  } catch {
    // not one JSON document
  }
  const jsonLines = trimmed.split("\n").filter((line) => line.trim());
  if (jsonLines.every((line) => line.trim().startsWith("{"))) {
    const parsed = [];
    for (const line of jsonLines) {
      try {
        parsed.push(JSON.parse(line));
      } catch {
        parsed.length = 0;
        break;
      }
    }
    if (parsed.length) return parsed.map(fromObject);
  }

  const blocks = [];
  let current;
  for (const raw of trimmed.split("\n")) {
    const line = raw.replace(/^\s*-\s+/, "").trimEnd();
    const match = line.match(/^\s*(id|severity|file|line|description|authority)\s*:\s*(.*)$/i);
    if (!match) {
      if (current && line.trim() && current.lastKey === "description") {
        current.value.description += ` ${line.trim()}`;
      }
      continue;
    }
    const key = match[1].toLowerCase();
    if (key === "id" || !current) {
      current = { value: {}, lastKey: null };
      blocks.push(current);
    }
    current.value[key] = match[2];
    current.lastKey = key;
  }
  if (blocks.length && blocks.some((block) => block.value.description || block.value.id)) {
    return blocks.map((block, index) => fromObject(block.value, index));
  }

  return trimmed.split(/\n\s*\n/).filter((p) => p.trim()).map((paragraph, index) => fromObject({
    id: `finding-${index + 1}`,
    description: paragraph
  }, index));
}

/** Bulleted items under their nearest heading, for captain.md and learnings.md. */
export function parseBullets(text) {
  if (typeof text !== "string") return [];
  const items = [];
  let section = null;
  let current;
  for (const raw of text.split("\n")) {
    const heading = raw.match(/^#{1,6}\s+(.+?)\s*$/);
    if (heading) {
      section = heading[1];
      current = undefined;
      continue;
    }
    const bullet = raw.match(/^\s{0,3}[-*]\s+(.+)$/);
    if (bullet) {
      current = { section, text: bullet[1] };
      items.push(current);
      continue;
    }
    if (current && raw.trim() && /^\s{2,}\S/.test(raw)) {
      current.text += ` ${raw.trim()}`;
    } else if (!raw.trim()) {
      current = undefined;
    }
  }
  return items;
}

/** Tasks the home knows about: status logs and per-task data directories. */
function taskIds(home) {
  const ids = new Set();
  for (const entry of listDir(path.join(home, "state"))) {
    if (entry.isFile() && entry.name.endsWith(".status") && !entry.name.startsWith(".")) {
      ids.add(entry.name.slice(0, -".status".length));
    }
  }
  for (const entry of listDir(path.join(home, "data"))) {
    if (entry.isDirectory() && !entry.name.startsWith(".")) ids.add(entry.name);
  }
  return [...ids].sort();
}

function readLedger(home) {
  const text = readText(path.join(home, "state", "fleet-ledger.jsonl"));
  if (text === undefined) return undefined;
  const byTask = new Map();
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }
    if (!record || typeof record.task !== "string" || typeof record.event !== "string") continue;
    if (!byTask.has(record.task)) byTask.set(record.task, []);
    byTask.get(record.task).push(record);
  }
  return byTask;
}

/** Stale wakes per key from `epoch<TAB>seq<TAB>kind<TAB>key<TAB>payload`. */
function readStaleWakes(home) {
  const text = readText(path.join(home, "state", ".wake-queue"));
  if (text === undefined) return [];
  const byKey = new Map();
  for (const line of text.split("\n")) {
    const [epoch, , kind, key] = line.split("\t");
    if (kind !== "stale" || !key) continue;
    const at = Number(epoch) || null;
    const entry = byKey.get(key) ?? { key, count: 0, first_at: at, last_at: at };
    entry.count += 1;
    if (at && (!entry.first_at || at < entry.first_at)) entry.first_at = at;
    if (at && (!entry.last_at || at > entry.last_at)) entry.last_at = at;
    byKey.set(key, entry);
  }
  return [...byKey.values()];
}

const SPAWN_FAILURE = /\b(spawn|launch|start(ed)?|dispatch)\b.*\b(fail|failed|refused|could not|did not|timed out)\b|\b(fail|failed|could not)\b.*\b(spawn|launch|dispatch)\b/i;
const TEARDOWN_REFUSAL = /\bteardown\b.*\brefus|\brefus\w*\b.*\bteardown\b/i;
const RECOVERY = /\b(recover(ed|y)?|relaunch(ed)?|respawn(ed)?|resumed after)\b/i;

/** Group observations whose fingerprints overlap, keeping every member. */
export function groupByFingerprint(items, threshold = 0.5) {
  const groups = [];
  for (const item of items) {
    if (!item.fingerprint) continue;
    const group = groups.find((candidate) => similarity(candidate.fingerprint, item.fingerprint) >= threshold);
    if (group) group.members.push(item);
    else groups.push({ fingerprint: item.fingerprint, members: [item] });
  }
  return groups;
}

/**
 * The full observation set for one home.
 *
 * `now` and `home` are the only inputs; the result carries no absolute path.
 */
export function importEvidence(home, { now = Date.now() } = {}) {
  const resolved = path.resolve(home);
  const clean = (text, limit) => sanitize(text, resolved, limit);
  const rel = (file) => homeRelative(resolved, file);
  const ledger = readLedger(resolved);

  const findings = [];
  const decisions = [];
  const failures = [];
  const tasks = [];

  for (const task of taskIds(resolved)) {
    const statusFile = path.join(resolved, "state", `${task}.status`);
    const statusText = readText(statusFile);
    const events = statusText === undefined ? [] : statusText.split("\n").map(parseStatusLine).filter(Boolean);
    const folded = foldDecisions(events);

    for (const decision of folded) {
      decisions.push({
        kind: decision.kind === "blocked" ? "blocker" : "decision",
        task,
        key: decision.key,
        opened_at: decision.opened_at,
        resolved_at: decision.resolution?.at ?? null,
        open: decision.resolution === null,
        wait_s: decision.resolution?.at && decision.opened_at ? decision.resolution.at - decision.opened_at : null,
        question: clean(decision.text),
        answer: decision.resolution ? clean(decision.resolution.text) : null,
        fingerprint: fingerprint(clean(decision.text, 400))
      });
    }

    for (const event of events) {
      const kind = TEARDOWN_REFUSAL.test(event.text) ? "teardown-refusal"
        : event.verb === "failed" && SPAWN_FAILURE.test(event.text) ? "spawn-failure"
        : (event.verb === "working" || event.verb === "resolved" || event.verb === "note") && RECOVERY.test(event.text) ? "recovery"
        : null;
      if (kind) failures.push({ kind, task, at: event.at, verb: event.verb, excerpt: clean(event.text) });
    }

    // Ask-user findings escalated through data/<task>/*findings*.
    const dataDir = path.join(resolved, "data", task);
    for (const entry of listDir(dataDir)) {
      if (!entry.isFile() || !/findings/i.test(entry.name)) continue;
      const file = path.join(dataDir, entry.name);
      const run = entry.name.match(/^nm-(.+?)-findings/)?.[1] ?? null;
      const gate = run
        ? folded.find((decision) => decision.key && decision.key.startsWith(`nm-${run}-`))
          ?? folded.find((decision) => decision.text.includes(entry.name))
        : folded.find((decision) => decision.text.includes(entry.name));
      for (const finding of parseFindings(readText(file))) {
        const description = clean(finding.description);
        findings.push({
          kind: "ask-user-finding",
          task,
          file: rel(file),
          run,
          id: clean(finding.id, 60),
          severity: finding.severity ? clean(finding.severity, 20) : null,
          target: finding.file ? clean(`${finding.file}${finding.line ? `:${finding.line}` : ""}`, 120) : null,
          authority: finding.authority ? clean(finding.authority, 60) : null,
          description,
          fingerprint: fingerprint(description),
          gate_key: gate?.key ?? null,
          decided: gate?.resolution ? clean(gate.resolution.text) : null
        });
      }
    }

    // Review rounds: how many no-mistakes gates this task escalated, how many
    // times it reported done, and how long it ran.
    const stamps = events.map((event) => event.at).filter(Boolean);
    const records = ledger?.get(task) ?? [];
    const at = (name) => records.find((record) => record.event === name)?.ts ?? null;
    const gateKeys = new Set(folded.filter((d) => d.key?.startsWith("nm-")).map((d) => d.key));
    const dispatched = at("task.dispatched") ?? (stamps.length ? Math.min(...stamps) : null);
    const finished = at("task.merged") ?? at("task.cleaned_up") ?? (stamps.length ? Math.max(...stamps) : null);
    tasks.push({
      task,
      status_lines: events.length,
      review_rounds: gateKeys.size,
      decisions: folded.filter((d) => d.kind === "needs-decision").length,
      blockers: folded.filter((d) => d.kind === "blocked").length,
      open_decisions: folded.filter((d) => d.resolution === null).length,
      done_reports: events.filter((event) => event.verb === "done").length,
      pr_ready_records: records.filter((record) => record.event === "task.pr_ready").length,
      dispatched_at: dispatched,
      finished_at: finished,
      duration_s: dispatched && finished && finished >= dispatched ? finished - dispatched : null,
      merged: records.some((record) => record.event === "task.merged")
    });
  }

  const stale = readStaleWakes(resolved).map((entry) => ({ kind: "stale-wake", ...entry, key: clean(entry.key, 80) }));

  const preferences = [];
  for (const name of ["captain.md", "captain-shared.md"]) {
    const file = path.join(resolved, "data", name);
    for (const item of parseBullets(readText(file))) {
      const excerpt = clean(item.text);
      const signal = detect(item.text);
      preferences.push({
        kind: "captain-preference",
        file: rel(file),
        section: item.section ? clean(item.section, 80) : null,
        category: signal.matched ? signal.category : "preference",
        excerpt,
        fingerprint: fingerprint(excerpt)
      });
    }
  }

  const learningsFile = path.join(resolved, "data", "learnings.md");
  const learnings = parseBullets(readText(learningsFile)).map((item) => {
    const excerpt = clean(item.text);
    return {
      kind: "learning",
      file: rel(learningsFile),
      section: item.section ? clean(item.section, 80) : null,
      date: item.text.match(/\b(20\d\d-\d\d-\d\d)\b/)?.[1] ?? item.section?.match(/\b(20\d\d-\d\d-\d\d)\b/)?.[1] ?? null,
      excerpt,
      fingerprint: fingerprint(excerpt)
    };
  });

  // Repeats are what make a review worth running: the same ask-user finding
  // or the same question across tasks is a harness gap, one is an anecdote.
  const repeatedFindings = groupByFingerprint(findings)
    .filter((group) => new Set(group.members.map((m) => m.task)).size >= 2 || group.members.length >= 3)
    .map((group) => ({
      kind: "repeated-ask-user",
      count: group.members.length,
      tasks: [...new Set(group.members.map((m) => m.task))],
      example: group.members[0].description,
      decided_answers: [...new Set(group.members.map((m) => m.decided).filter(Boolean))]
    }))
    .sort((a, b) => b.count - a.count);

  const repeatedQuestions = groupByFingerprint(decisions.filter((d) => d.kind === "decision" && !d.key?.startsWith("nm-")))
    .filter((group) => new Set(group.members.map((m) => m.task)).size >= 2)
    .map((group) => ({
      kind: "repeated-decision",
      count: group.members.length,
      tasks: [...new Set(group.members.map((m) => m.task))],
      example: group.members[0].question,
      answers: [...new Set(group.members.map((m) => m.answer).filter(Boolean))]
    }))
    .sort((a, b) => b.count - a.count);

  const count = (list, kind) => list.filter((item) => item.kind === kind).length;
  return {
    schema_version: 1,
    source: "firstmate",
    imported_at: new Date(now).toISOString(),
    // Observations, not rules: nothing here is approved or canonical.
    trust: "observation",
    fleet_ledger: ledger !== undefined,
    counts: {
      tasks: tasks.length,
      ask_user_findings: findings.length,
      decisions: count(decisions, "decision"),
      blockers: count(decisions, "blocker"),
      open: decisions.filter((d) => d.open).length,
      stale_wakes: stale.reduce((sum, entry) => sum + entry.count, 0),
      teardown_refusals: count(failures, "teardown-refusal"),
      spawn_failures: count(failures, "spawn-failure"),
      recoveries: count(failures, "recovery"),
      captain_preferences: preferences.length,
      learnings: learnings.length
    },
    repeated: {
      ask_user_findings: repeatedFindings,
      decisions: repeatedQuestions
    },
    tasks,
    findings,
    decisions,
    failures,
    stale_wakes: stale,
    captain_preferences: preferences,
    learnings
  };
}
