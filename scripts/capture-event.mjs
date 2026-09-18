#!/usr/bin/env node
import path from "node:path";
import {
  appendJsonl,
  eventRecord,
  loadConfig,
  parseJson,
  projectDataDir,
  projectRoot,
  readJson,
  readStdin,
  writeJsonAtomic
} from "./lib.mjs";

const eventName = process.argv[2] || "Unknown";
const input = parseJson(await readStdin());
const root = projectRoot(input);
const config = loadConfig(root);

if (!config.capture.enabled) process.exit(0);

try {
  const dir = projectDataDir(root);
  appendJsonl(path.join(dir, "events.jsonl"), eventRecord(eventName, input, root));

  if (eventName === "PostToolUseFailure") {
    const stateFile = path.join(dir, "state.json");
    const state = readJson(stateFile, {});
    state.tool_failures_since_review = (state.tool_failures_since_review || 0) + 1;
    state.updated_at = new Date().toISOString();
    writeJsonAtomic(stateFile, state);
  }
} catch (error) {
  process.stderr.write(`improve capture skipped: ${error.message}\n`);
}
