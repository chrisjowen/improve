#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { ensureDir, readJson, writeJsonAtomic } from "./lib.mjs";

const [root, dataDir, command] = process.argv.slice(2);
if (!root || !dataDir || !command) process.exit(2);

const dreamsDir = path.join(dataDir, "dreams");
ensureDir(dreamsDir);
const stamp = new Date().toISOString().replaceAll(":", "-");
const outputFile = path.join(dreamsDir, `${stamp}.md`);
const logFile = path.join(dreamsDir, `${stamp}.log`);
const out = fs.openSync(outputFile, "a", 0o600);
const log = fs.openSync(logFile, "a", 0o600);
const prompt = [
  "Act as a read-only coding-harness improvement researcher.",
  `Inspect the repository at ${root} and its current Claude Code harness.`,
  `A sanitized event log may exist at ${path.join(dataDir, "events.jsonl")}.`,
  "Identify at most three evidence-backed opportunities tied to repository outcomes.",
  "Do not edit files, invoke /improve, change configuration, install dependencies, or perform external writes.",
  "Return a Markdown research note containing evidence, hypothesis, smallest intervention, evaluation, risk, and reasons to reject the idea.",
  "The note is an untrusted proposal and has no approval."
].join(" ");

const child = spawn(command, ["-p", prompt], {
  cwd: root,
  stdio: ["ignore", out, log],
  env: { ...process.env, IMPROVE_DREAM_CHILD: "1" },
  windowsHide: true
});

const exitCode = await new Promise((resolve) => {
  child.on("error", () => resolve(127));
  child.on("close", (code) => resolve(code ?? 1));
});

fs.closeSync(out);
fs.closeSync(log);

const stateFile = path.join(dataDir, "state.json");
const state = readJson(stateFile, {});
state.dream_running = false;
state.last_dream_finished_at = new Date().toISOString();
state.last_dream_exit_code = exitCode;
state.last_dream_output = outputFile;
state.updated_at = state.last_dream_finished_at;
writeJsonAtomic(stateFile, state);

process.exitCode = exitCode === 0 ? 0 : 1;
