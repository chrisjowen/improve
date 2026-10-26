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
 *                               of tasks still running
 *   state/fleet-ledger.jsonl    when enabled: every task's status lines as
 *                               `task.status` records, which outlive teardown
 *                               retiring the status log, plus dispatch, PR-ready
 *                               and merge times
 *   data/<task>/*findings*      no-mistakes ask-user findings escalated by a worker
 *   data/<task>/brief.md        `## Progress note` sections bin/fm-control.sh
 *                               appends when it relaunches a worker
 *   state/.wake-queue           stale wakes not yet handled
 *   state/.watch-cycle-exits.log  each watcher exit; `reason=actionable-stale`
 *                               is a stale wake delivered to firstmate
 *   state/.watch-triage.log     stale panes the watcher absorbed as still working
 *   state/.stale-*, .wedge-escalations-*  per-window watcher markers: a pane
 *                               classified stale, and wedge escalations (stuck)
 *   state/.seen-procevent-*     process-event sources that failed to launch
 *   data/captain.md             the captain's preferences and corrections
 *   data/learnings.md           curated operational learnings
 *
 * Firstmate prints teardown refusals to the terminal and keeps no record of a
 * relaunch beyond the brief, so those counts are lower bounds. Tasks finished
 * before the ledger was turned on have no status history left at all.
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
 * order before the first colon. A time tag may hold colons of its own, so tags
 * are read before the colon is looked for. The older `needs-decision: [key=x]
 * text` placement is accepted as well. Returns undefined for a line with no
 * verb.
 */
export function parseStatusLine(line) {
  if (typeof line !== "string" || !line.trim()) return undefined;
  const verb = line.trim().split(/[\s:[]/)[0];
  if (!VERBS.has(verb)) return undefined;
  // Time tags before the colon come off first, as _fm_status_unstamped does.
  let head = "";
  let tail = line.trim().slice(verb.length);
  let at = null;
  for (;;) {
    const tag = tail.indexOf("[at=");
    const colon = tail.indexOf(":");
    const end = tail.indexOf("]", tag);
    if (tag === -1 || (colon !== -1 && colon < tag) || end === -1) break;
    const value = tail.slice(tag + 4, end);
    if (at === null && /^\d+$/.test(value)) at = Number(value);
    head += tail.slice(0, tag);
    tail = tail.slice(end + 1);
  }
  const colon = tail.indexOf(":");
  if (colon === -1) return undefined;
  head += tail.slice(0, colon);
  let key = head.match(/\[key=([^\]\s]+)\]/)?.[1] ?? null;
  let text = tail.slice(colon + 1).trim();
  if (!key) {
    const leading = text.match(/^\[key=([^\]\s]+)\]\s*/);
    if (leading) {
      key = leading[1];
      text = text.slice(leading[0].length);
    }
  }
  return { verb, at, key, text };
}

/**
 * Every decision and blocker one task raised, folded the way
 * bin/fm-classify-lib.sh folds them: a line with no key uses the key
 * `default`; an opener replaces an open decision with the same key; `resolved`
 * or `captain-held` closes the open decision with its key, so a bare
 * `resolved` closes only a keyless one; and, for a ship or scout task, `done`
 * or `failed` ends every open decision. Unlike that fold, closed decisions are
 * kept, with how each one closed.
 */
export function foldDecisions(events, { kind = "ship" } = {}) {
  const decisions = [];
  const open = new Map();
  const close = (decision, at, text, how) => {
    decision.resolution = { at, text, how };
    open.delete(decision.key ?? "default");
  };
  for (const event of events) {
    const slot = event.key ?? "default";
    if (event.verb === "needs-decision" || event.verb === "blocked") {
      const previous = open.get(slot);
      if (previous) close(previous, event.at, null, "superseded");
      const decision = { kind: event.verb, key: event.key, opened_at: event.at, text: event.text, resolution: null };
      decisions.push(decision);
      open.set(slot, decision);
    } else if (event.verb === "resolved" || event.verb === "captain-held") {
      const decision = open.get(slot);
      if (!decision) continue;
      const how = event.verb === "captain-held" ? "captain-held" : /^answered:/i.test(event.text) ? "answered" : "resolved";
      close(decision, event.at, event.text, how);
    } else if ((event.verb === "done" || event.verb === "failed") && kind !== "secondmate") {
      for (const decision of [...open.values()]) close(decision, event.at, null, "task-ended");
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

/** Tasks the home knows about: status logs, per-task data directories, and the ledger. */
function taskIds(home, ledger) {
  const ids = new Set(ledger?.keys() ?? []);
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

/**
 * The task a watcher window or marker key names. Windows are
 * `<session>:fm-<task>`; marker keys are the same with `:`, `/` and `.` turned
 * into `_` (window_key in bin/fm-watch.sh). Anything else is returned as is.
 */
export function windowTask(name, tasks = new Set()) {
  const candidate = String(name).match(/[:_]fm-(.+)$/)?.[1];
  if (!candidate) return String(name);
  if (tasks.has(candidate)) return candidate;
  for (const task of tasks) {
    if (task.replace(/[:/.]/g, "_") === candidate) return task;
  }
  return candidate;
}

/**
 * Stale and stuck workers, from what the watcher leaves on disk. The wake
 * queue drains as firstmate handles wakes, so its `stale` rows are only the
 * ones still waiting; each delivered stale wake is also one
 * `reason=actionable-stale` exit in the watcher's cycle log. The triage log
 * keeps (bounded) the stale panes absorbed as provably working, and the
 * per-window markers survive teardown: `.stale-<key>` for a pane classified
 * stale, `.wedge-escalations-<key>` for how many times a quiet pane was
 * escalated as a possible wedge.
 */
function readWatcher(home, tasks) {
  const state = path.join(home, "state");
  const byTask = new Map();
  const entry = (task) => {
    if (!byTask.has(task)) {
      byTask.set(task, { task, queued_stale_wakes: 0, absorbed_stale: 0, stale_marker: false, wedge_escalations: 0, first_at: null, last_at: null });
    }
    return byTask.get(task);
  };
  const seen = (item, at) => {
    if (!at) return;
    if (!item.first_at || at < item.first_at) item.first_at = at;
    if (!item.last_at || at > item.last_at) item.last_at = at;
  };

  // `epoch<TAB>seq<TAB>kind<TAB>key<TAB>payload`, key being the window.
  for (const line of (readText(path.join(state, ".wake-queue")) ?? "").split("\n")) {
    const [epoch, , kind, key] = line.split("\t");
    if (kind !== "stale" || !key) continue;
    const item = entry(windowTask(key, tasks));
    item.queued_stale_wakes += 1;
    seen(item, Number(epoch) || null);
  }

  // `[<ISO time>] absorbed <why>: <window>`
  for (const line of (readText(path.join(state, ".watch-triage.log")) ?? "").split("\n")) {
    const match = line.match(/^\[([^\]]+)\]\s+absorbed\s+(.*\bstale\b.*):\s+(\S+)\s*$/);
    if (!match) continue;
    const item = entry(windowTask(match[3], tasks));
    item.absorbed_stale += 1;
    const at = Date.parse(match[1].replace(/([+-]\d\d)(\d\d)$/, "$1:$2"));
    seen(item, Number.isFinite(at) ? Math.floor(at / 1000) : null);
  }

  for (const marker of listDir(state)) {
    if (!marker.isFile()) continue;
    const escalations = marker.name.match(/^\.wedge-escalations-(.+)$/);
    if (escalations) {
      const count = Number.parseInt(readText(path.join(state, marker.name)) ?? "", 10);
      entry(windowTask(escalations[1], tasks)).wedge_escalations += Number.isFinite(count) && count > 0 ? count : 1;
      continue;
    }
    const stale = marker.name.match(/^\.stale-(?!since-)(.+)$/);
    if (stale) entry(windowTask(stale[1], tasks)).stale_marker = true;
  }

  let delivered;
  const cycles = readText(path.join(state, ".watch-cycle-exits.log"));
  if (cycles !== undefined) {
    delivered = cycles.split("\n").filter((line) => /(^|\t)reason=actionable-stale(\t|$)/.test(line)).length;
  }
  return { workers: [...byTask.values()].sort((a, b) => a.task.localeCompare(b.task)), delivered };
}

/**
 * Process-event sources that failed to launch. The watcher marks each event it
 * has seen with `.seen-procevent-<hex of the event id>`, and a launch failure's
 * id is `procevent:<source>:launch-failed:<attempt>`. These are supervision
 * extensions, not workers, so they are not spawn failures.
 */
function readProcessEventFailures(home) {
  let count = 0;
  for (const marker of listDir(path.join(home, "state"))) {
    const hex = marker.name.match(/^\.seen-procevent-((?:[0-9a-f]{2})+)$/)?.[1];
    if (hex && /^procevent:[^:]+:launch-failed:/.test(Buffer.from(hex, "hex").toString("utf8"))) count += 1;
  }
  return count;
}

/** Relaunches bin/fm-control.sh recorded in a task's brief, one per progress note. */
function readRelaunches(home, task) {
  const stamps = new Set();
  for (const name of ["brief.md", "launch-brief.md"]) {
    const text = readText(path.join(home, "data", task, name)) ?? "";
    for (const match of text.matchAll(/^## Progress note \(([^)\n]*)\)\s*$/gm)) stamps.add(match[1]);
  }
  return [...stamps].sort().map((stamp) => {
    const at = Date.parse(stamp);
    return Number.isFinite(at) ? Math.floor(at / 1000) : null;
  });
}

/** The task's kind from its record or its dispatch, which decides the `done` rule. */
function taskKind(home, task, records) {
  const meta = readText(path.join(home, "state", `${task}.meta`));
  return meta?.match(/^kind=(\S+)$/m)?.[1]
    ?? records.find((record) => record.event === "task.dispatched")?.kind
    ?? "ship";
}

/**
 * One task's status history. A running task still has its status log; a
 * finished one's log is retired at teardown, and only the ledger's
 * `task.status` copies remain. Both are read: a ledger record that repeats a
 * log line, or repeats an earlier record (the ledger delivers at least once),
 * is dropped. Events are ordered by time, a line with no time tag taking the
 * time before it.
 */
export function taskHistory(statusText, ledgerRecords = []) {
  const signature = (event) => `${event.verb}\u0000${event.key ?? ""}\u0000${event.text.slice(0, 200)}`;
  const fromLog = (statusText ?? "").split("\n").map(parseStatusLine).filter(Boolean)
    .map((event) => ({ ...event, source: "status" }));
  const inLog = new Map();
  for (const event of fromLog) inLog.set(signature(event), (inLog.get(signature(event)) ?? 0) + 1);

  const fromLedger = [];
  const recorded = new Set();
  for (const record of ledgerRecords) {
    if (record.event !== "task.status" || !VERBS.has(record.state)) continue;
    const key = typeof record.key === "string" && record.key ? record.key : null;
    let text = String(record.text ?? "").trim();
    if (key && text.startsWith(`[key=${key}]`)) text = text.slice(`[key=${key}]`.length).trim();
    const event = { verb: record.state, at: Number.isFinite(record.ts) ? record.ts : null, key, text, source: "ledger" };
    const sig = signature(event);
    const left = inLog.get(sig) ?? 0;
    if (left > 0) inLog.set(sig, left - 1);
    else if (!recorded.has(sig)) fromLedger.push(event);
    recorded.add(sig);
  }

  const timed = (events) => {
    let last = null;
    return events.map((event) => {
      last = event.at ?? last;
      return { event, t: last ?? -Infinity };
    });
  };
  return [...timed(fromLog), ...timed(fromLedger)].sort((a, b) => a.t - b.t).map(({ event }) => event);
}

const SPAWN_FAILURE = /\b(spawn|launch|start(ed)?|dispatch)\b.*\b(fail|failed|refused|could not|did not|timed out)\b|\b(fail|failed|could not|did not|never)\b.*\b(spawn|launch|dispatch|start)\b|\bbrief pointer\b|\bready signal\b|\bfolder-trust\b/i;
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
  const ids = taskIds(resolved, ledger);
  const watcher = readWatcher(resolved, new Set(ids));
  const workers = new Map(watcher.workers.map((worker) => [worker.task, worker]));
  let statusLogs = 0;
  let withoutHistory = 0;
  let recoveries = 0;

  for (const task of ids) {
    const statusText = readText(path.join(resolved, "state", `${task}.status`));
    if (statusText !== undefined) statusLogs += 1;
    const records = ledger?.get(task) ?? [];
    const events = taskHistory(statusText, records);
    if (events.length === 0) withoutHistory += 1;
    const kind = taskKind(resolved, task, records);
    const folded = foldDecisions(events, { kind });

    for (const decision of folded) {
      const resolution = decision.resolution;
      decisions.push({
        kind: decision.kind === "blocked" ? "blocker" : "decision",
        task,
        key: decision.key,
        opened_at: decision.opened_at,
        resolved_at: resolution?.at ?? null,
        open: resolution === null,
        // answered (firstmate recorded an answer), resolved (the worker cleared
        // it), captain-held, superseded (raised again), or task-ended.
        closed_by: resolution?.how ?? null,
        wait_s: resolution?.at && decision.opened_at ? resolution.at - decision.opened_at : null,
        question: clean(decision.text),
        answer: resolution?.text ? clean(resolution.text) : null,
        fingerprint: fingerprint(clean(decision.text, 400))
      });
    }

    const firstProgress = events.findIndex((event) => event.verb === "working" || event.verb === "done");
    let recovered = 0;
    events.forEach((event, index) => {
      const kind = TEARDOWN_REFUSAL.test(event.text) ? "teardown-refusal"
        : event.verb === "failed" && (SPAWN_FAILURE.test(event.text) || firstProgress === -1 || index < firstProgress) ? "spawn-failure"
        : (event.verb === "working" || event.verb === "resolved" || event.verb === "note") && RECOVERY.test(event.text) ? "recovery"
        : null;
      if (kind === "recovery") recovered += 1;
      if (kind) failures.push({ kind, task, at: event.at, verb: event.verb, via: "status", excerpt: clean(event.text) });
    });
    const relaunches = readRelaunches(resolved, task);
    for (const at of relaunches) {
      failures.push({ kind: "recovery", task, at, verb: null, via: "relaunch-note", excerpt: `relaunched by bin/fm-control.sh (progress note in data/${task}/brief.md)` });
    }
    // A worker's own "recovered after relaunch" line and the relaunch note can
    // describe the same recovery, so the larger of the two counts.
    recoveries += Math.max(recovered, relaunches.length);

    // Ask-user findings escalated through data/<task>/*findings*.
    const dataDir = path.join(resolved, "data", task);
    for (const entry of listDir(dataDir)) {
      if (!entry.isFile() || !/findings/i.test(entry.name)) continue;
      const file = path.join(dataDir, entry.name);
      const run = entry.name.match(/^nm-(.+?)-findings/)?.[1] ?? null;
      // The gate line names its snapshot file; a run's key prefix is the fallback.
      const gate = folded.find((decision) => decision.text.includes(entry.name))
        ?? (run ? folded.find((decision) => decision.key && decision.key.startsWith(`nm-${run}-`)) : undefined);
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
          decided: gate?.resolution?.text ? clean(gate.resolution.text) : null
        });
      }
    }

    // Review rounds: how many no-mistakes gates this task escalated, how many
    // times it reported done, and how long it ran.
    const stamps = events.map((event) => event.at).filter(Boolean);
    const at = (name) => records.find((record) => record.event === name)?.ts ?? null;
    const gateKeys = new Set(folded.filter((d) => d.key?.startsWith("nm-")).map((d) => d.key));
    const dispatched = at("task.dispatched") ?? (stamps.length ? Math.min(...stamps) : null);
    const finished = at("task.merged") ?? at("task.cleaned_up") ?? (stamps.length ? Math.max(...stamps) : null);
    const worker = workers.get(task);
    tasks.push({
      task,
      kind,
      status_lines: events.length,
      status_log: statusText !== undefined,
      review_rounds: gateKeys.size,
      decisions: folded.filter((d) => d.kind === "needs-decision").length,
      blockers: folded.filter((d) => d.kind === "blocked").length,
      open_decisions: folded.filter((d) => d.resolution === null).length,
      answered: folded.filter((d) => d.resolution?.how === "answered").length,
      done_reports: events.filter((event) => event.verb === "done").length,
      pr_ready_records: records.filter((record) => record.event === "task.pr_ready").length,
      stale_detections: worker ? worker.queued_stale_wakes + worker.absorbed_stale : 0,
      wedge_escalations: worker?.wedge_escalations ?? 0,
      relaunches: relaunches.length,
      dispatched_at: dispatched,
      finished_at: finished,
      duration_s: dispatched && finished && finished >= dispatched ? finished - dispatched : null,
      merged: records.some((record) => record.event === "task.merged")
    });
  }

  const stale = watcher.workers.map((worker) => ({ kind: "stale-worker", ...worker, task: clean(worker.task, 80) }));
  const staleWorkers = watcher.workers.filter((w) => w.stale_marker || w.queued_stale_wakes || w.absorbed_stale);
  const stuckWorkers = watcher.workers.filter((w) => w.wedge_escalations > 0);
  const queuedStale = watcher.workers.reduce((sum, w) => sum + w.queued_stale_wakes, 0);

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
    // Where task histories came from: live status logs, and the ledger for
    // tasks whose log teardown retired. Tasks with neither finished before the
    // ledger was on, and their decisions are not countable.
    history: {
      status_logs: statusLogs,
      ledger_tasks: ledger?.size ?? 0,
      tasks_without_history: withoutHistory
    },
    counts: {
      tasks: tasks.length,
      ask_user_findings: findings.length,
      decisions: count(decisions, "decision"),
      blockers: count(decisions, "blocker"),
      open: decisions.filter((d) => d.open).length,
      answered: decisions.filter((d) => d.closed_by === "answered").length,
      review_gates: decisions.filter((d) => d.key?.startsWith("nm-")).length,
      captain_held: decisions.filter((d) => d.closed_by === "captain-held").length,
      // Stale wakes delivered to firstmate, from the watcher's cycle log; the
      // still-queued count when that log is absent.
      stale_wakes: watcher.delivered ?? queuedStale,
      stale_workers: staleWorkers.length,
      stuck_workers: stuckWorkers.length,
      wedge_escalations: stuckWorkers.reduce((sum, w) => sum + w.wedge_escalations, 0),
      teardown_refusals: count(failures, "teardown-refusal"),
      spawn_failures: count(failures, "spawn-failure"),
      recoveries,
      relaunches: failures.filter((f) => f.via === "relaunch-note").length,
      process_event_launch_failures: readProcessEventFailures(resolved),
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
    stale_workers: stale,
    captain_preferences: preferences,
    learnings
  };
}
