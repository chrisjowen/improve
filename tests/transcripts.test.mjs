// Reading session transcripts for replay: where a correction was typed, the
// turn before it, and the conversation cut just before that turn.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { cutHistory, findTranscript, humanPrompt, locateCorrection, precedingTurn, readTranscript, toolCalls } from "../scripts/transcripts.mjs";
import { transcript } from "./fixtures/transcript.mjs";

const temp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "improve-transcripts-")));
const configDir = path.join(temp, "claude");

const long = "x".repeat(5000);
const session = transcript("aaaaaaaa-1111")
  .meta()
  .hook("SessionStart context the original session had")
  .user("set up the project")
  .say("Setting it up.", { thinking: "private reasoning" })
  .tool("Bash", { command: "npm install" }, long)
  .say("Done.")
  .user("<task-notification><summary>Background task finished</summary></task-notification>")
  .say("Noted.")
  .user("add a login page")
  .tool("Bash", { command: "npm run build" }, "Error: missing token ghp_abcdefghijklmnopqrstuvwxyz0123456789", { error: true })
  .say("I added the page with npm.")
  .queued("use bun instead of npm, always")
  .say("Switching to bun.")
  .user("use bun instead of npm, always")
  .sidechain("a subagent prompt");
const file = session.write(configDir);
const rows = readTranscript(file);

// --- finding and reading -----------------------------------------------------
assert.equal(findTranscript("aaaaaaaa-1111", { configDir }), file);
assert.equal(findTranscript("missing-session-id", { configDir }), undefined);
assert.equal(findTranscript("../../etc/passwd", { configDir }), undefined, "a session id is never a path");
assert.equal(rows.length, session.rows.length, "a torn line is skipped");

// --- what a person typed -----------------------------------------------------
const prompts = rows.map((row, i) => [i, humanPrompt(row)]).filter(([, p]) => p);
assert.deepEqual(prompts.map(([, p]) => p.text), [
  "set up the project",
  "add a login page",
  "use bun instead of npm, always",
  "use bun instead of npm, always"
], "tool results, notifications, hook output and sidechains are not a person's prompts");
assert.equal(prompts[2][1].queued, true, "a prompt sent mid-turn is a queued attachment");

// --- the correction and the turn before it -----------------------------------
const queuedAt = rows.findIndex((r) => r.type === "attachment" && r.attachment?.type === "queued_command");
const typedAt = rows.findLastIndex((r) => humanPrompt(r)?.text === "use bun instead of npm, always");
assert.equal(locateCorrection(rows, { excerpt: "use bun instead of npm, always", occurredAt: rows[queuedAt].timestamp }), queuedAt,
  "the same words typed twice: the one nearest the recorded time");
assert.equal(locateCorrection(rows, { excerpt: "use bun instead of npm, always", occurredAt: rows[typedAt].timestamp }), typedAt);
assert.equal(locateCorrection(rows, { excerpt: "USE   bun instead of npm…" }), queuedAt, "matched on the start, ignoring case, spacing and the ellipsis");
assert.equal(locateCorrection(rows, { excerpt: "nothing like this" }), -1);

const loginAt = rows.findIndex((r) => humanPrompt(r)?.text === "add a login page");
assert.equal(precedingTurn(rows, queuedAt), loginAt, "a queued correction: the turn it interrupted");
assert.equal(precedingTurn(rows, typedAt), loginAt, "a typed correction: the last turn a person started, skipping the queued one");
assert.equal(precedingTurn(rows, rows.findIndex((r) => humanPrompt(r)?.text === "set up the project")), -1);

// --- the conversation to resume ----------------------------------------------
const history = cutHistory(rows, loginAt);
assert.ok(history.rows.every((r) => r.type === "user" || r.type === "assistant"), "only conversation entries");
assert.equal(history.rows[0].parentUuid, null, "the first entry is a root");
const ids = new Set(history.rows.map((r) => r.uuid));
assert.ok(history.rows.slice(1).every((r) => ids.has(r.parentUuid)), "every parent is kept, so the chain is whole");
assert.ok(!JSON.stringify(history.rows).includes("private reasoning"), "thinking blocks are dropped");
assert.ok(!JSON.stringify(history.rows).includes("add a login page"), "the replayed turn is not in its own history");
const clipped = history.rows.flatMap((r) => (Array.isArray(r.message.content) ? r.message.content : [])).find((b) => b.type === "tool_result");
assert.ok(clipped.content[0].text.length < 2200 && /more characters cut for replay/.test(clipped.content[0].text), "a long tool result is cut");
assert.ok(history.rows.every((r) => !("toolUseResult" in r)), "the raw tool result copy is not kept");

// A secret in the history is redacted, and the redaction is counted.
const later = cutHistory(rows, typedAt);
assert.ok(!JSON.stringify(later.rows).includes("ghp_abcdefghijklmnopqrstuvwxyz0123456789"));
assert.ok(Object.values(later.redactions).reduce((a, b) => a + b, 0) >= 1);

// A secret that straddles the clip cutoff is still redacted, not cut in half.
// At the default 2000-char cutoff, only 20 characters of the secret land
// before it: fewer than the 20 the github_token rule needs after "ghp_", so a
// clip-before-redact bug would leave that fragment unredacted.
const secret = "ghp_abcdefghijklmnopqrstuvwxyz0123456789";
const straddling = transcript("bbbbbbbb-2222")
  .meta()
  .user("set up the project")
  .tool("Bash", { command: "env" }, `${"x".repeat(1980)}${secret}`)
  .say("Done.")
  .user("add a login page");
const straddlingFile = straddling.write(configDir);
const straddlingRows = readTranscript(straddlingFile);
const straddlingLoginAt = straddlingRows.findIndex((r) => humanPrompt(r)?.text === "add a login page");
const straddlingHistory = cutHistory(straddlingRows, straddlingLoginAt);
const straddlingJson = JSON.stringify(straddlingHistory.rows);
assert.ok(!straddlingJson.includes(secret), "the whole secret is redacted");
assert.ok(!straddlingJson.includes("ghp_abcdef"), "no unredacted fragment of the secret leaks past the cutoff");
assert.ok(Object.values(straddlingHistory.redactions).reduce((a, b) => a + b, 0) >= 1, "the redaction is counted");

// At most the last few turns a person started.
const windowed = cutHistory(rows, typedAt, { maxPrompts: 1 });
assert.equal(humanPrompt(windowed.rows[0])?.text, "add a login page", "one turn: the window starts at the last prompt");

// --- tool calls --------------------------------------------------------------
const calls = toolCalls(rows);
assert.deepEqual(calls.map((c) => [c.name, c.input.command, c.isError]), [["Bash", "npm install", false], ["Bash", "npm run build", true]]);
assert.match(calls[1].error, /missing token/);

fs.rmSync(temp, { recursive: true, force: true });
console.log("transcripts ok");
