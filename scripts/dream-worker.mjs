#!/usr/bin/env node
import { loadConfig } from "./lib.mjs";
import { runDream } from "./dream.mjs";

// Started detached by session-end, so nothing reads its output: everything a
// person needs is in the report and the log it names.
const [root, dataDir, command] = process.argv.slice(2);
if (!root || !dataDir || !command) process.exit(2);

const minutes = Number(loadConfig(root).background_dreaming.timeout_minutes);
const result = await runDream({
  root,
  dataDir,
  command,
  timeoutMs: Number.isFinite(minutes) && minutes > 0 ? minutes * 60_000 : undefined
});
process.exitCode = result.ok ? 0 : 1;
