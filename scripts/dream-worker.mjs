#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { ensureDir, readJson, writeJsonAtomic } from "./lib.mjs";
import { runAgent } from "./spawn-agent.mjs";

const [root, dataDir, command] = process.argv.slice(2);
if (!root || !dataDir || !command) process.exit(2);

const dreamsDir = path.join(dataDir, "dreams");
ensureDir(dreamsDir);
const stamp = new Date().toISOString().replaceAll(":", "-");
const outputFile = path.join(dreamsDir, `${stamp}.json`);

const prompt = [
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

// The agent is denied edit tools by flag, so a dream cannot mutate the harness
// even if the repository text tries to talk it into doing so.
const result = await runAgent({ command, prompt, cwd: root });

fs.writeFileSync(outputFile, `${JSON.stringify({
  schema_version: 1,
  produced_at: new Date().toISOString(),
  project_root: root,
  status: result.ok ? "completed" : "failed",
  error: result.ok ? null : result.error,
  findings: result.ok ? (result.payload?.findings ?? []) : [],
  raw: result.ok ? undefined : result.raw,
  cost_usd: result.envelope?.cost_usd ?? null
}, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });

const stateFile = path.join(dataDir, "state.json");
const state = readJson(stateFile, {});
state.dream_running = false;
state.last_dream_finished_at = new Date().toISOString();
state.last_dream_status = result.ok ? "completed" : "failed";
state.last_dream_output = outputFile;
state.updated_at = state.last_dream_finished_at;
writeJsonAtomic(stateFile, state);

process.exitCode = result.ok ? 0 : 1;
