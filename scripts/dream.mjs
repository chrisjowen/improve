import path from "node:path";
import { ensureDir, readJson, writeJsonAtomic } from "./lib.mjs";
import { runAgent } from "./spawn-agent.mjs";

const PROMPT = (root, dataDir) => [
  "Act as a read-only coding-harness improvement researcher.",
  `Inspect the repository at ${root} and its current Claude Code harness.`,
  `A sanitized event log may exist at ${path.join(dataDir, "events.jsonl")}.`,
  "Identify at most three evidence-backed opportunities tied to repository outcomes.",
  "Each must change the harness only: CLAUDE.md, AGENTS.md, .claude/ (skills, agents,",
  "commands, hooks, settings, permissions), .mcp.json, or .harness/. A defect in",
  "application code, tests, or CI is evidence; the intervention is the instruction,",
  "hook, skill, or permission that would have let the agent catch or avoid it.",
  "Write plainly: short sentences, plain words, no em dashes. The title names the",
  "change. Evidence is a command and its output, a file and line, or a count.",
  "",
  "Return ONLY a JSON object of the form:",
  '{ "findings": [ { "title": "", "objective": "", "hypothesis": "",',
  '  "evidence": [ { "source": "", "observation": "" } ],',
  '  "intervention": "", "evaluation": "", "risks": [], "reasons_to_reject": [] } ] }',
  "",
  "Each finding is an untrusted proposal with no approval. Prefer rejecting a weak",
  "idea over reporting it. You hold no write tools; do not attempt to edit anything."
].join(" ");

/**
 * One background review: a read-only agent's findings, written as a report.
 *
 * `dataDir` is this project's plugin data directory. The report goes to
 * `dreams/`, outside the repository, because a background job may draft a
 * proposal but never edit the repository. The agent's full output goes to
 * `logs/`, and the report names that log, so a failed dream says why and where
 * to look instead of "agent exited 1".
 *
 * State is cleared in every outcome. A worker that died between marking itself
 * running and finishing used to suppress the next dream for a day.
 */
export async function runDream({ root, dataDir, command = "claude", timeoutMs = 20 * 60_000, signal, onProgress }) {
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const dreamsDir = path.join(dataDir, "dreams");
  const logFile = path.join(dataDir, "logs", `dream-${stamp}.log`);
  const outputFile = path.join(dreamsDir, `${stamp}.json`);
  ensureDir(dreamsDir);

  let result;
  try {
    // The agent is denied edit tools by flag, so a dream cannot mutate the
    // harness even if the repository text tries to talk it into doing so.
    result = await runAgent({ command, prompt: PROMPT(root, dataDir), cwd: root, timeoutMs, signal, logFile, onProgress });
  } catch (error) {
    result = { ok: false, error: `The background review crashed: ${error.message}` };
  }

  const status = result.ok ? "completed" : result.cancelled ? "cancelled" : "failed";
  const report = {
    schema_version: 1,
    produced_at: new Date().toISOString(),
    project_root: root,
    status,
    error: result.ok ? null : result.error,
    findings: result.ok ? (Array.isArray(result.payload?.findings) ? result.payload.findings : []) : [],
    raw: result.ok ? undefined : result.raw,
    cost_usd: result.envelope?.cost_usd ?? null,
    log: logFile
  };
  writeJsonAtomic(outputFile, report);

  const stateFile = path.join(dataDir, "state.json");
  const state = readJson(stateFile, {});
  state.dream_running = false;
  state.last_dream_finished_at = new Date().toISOString();
  state.last_dream_status = status;
  state.last_dream_output = outputFile;
  state.updated_at = state.last_dream_finished_at;
  writeJsonAtomic(stateFile, state);

  return { ok: Boolean(result.ok), status, file: path.basename(outputFile), report, error: report.error, log: logFile };
}
