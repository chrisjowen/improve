#!/usr/bin/env node
import path from "node:path";
import { spawn } from "node:child_process";
import {
  appendJsonl,
  daysSince,
  eventRecord,
  loadConfig,
  parseJson,
  projectDataDir,
  projectRoot,
  readJson,
  readStdin,
  writeJsonAtomic
} from "./lib.mjs";

const input = parseJson(await readStdin());
const root = projectRoot(input);

try {
  const config = loadConfig(root);
  const dir = projectDataDir(root);
  if (config.capture.enabled) {
    appendJsonl(path.join(dir, "events.jsonl"), eventRecord("SessionEnd", input, root));
  }

  if (!config.background_dreaming.enabled || process.env.IMPROVE_DREAM_CHILD === "1") {
    process.exit(0);
  }

  const stateFile = path.join(dir, "state.json");
  const state = readJson(stateFile, {});
  const recentlyRunning = state.dream_running && daysSince(state.last_dream_started_at) < 1;
  if (recentlyRunning || daysSince(state.last_dream_started_at) < config.background_dreaming.every_days) {
    process.exit(0);
  }

  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(import.meta.dirname, "..");
  const child = spawn(process.execPath, [
    path.join(pluginRoot, "scripts", "dream-worker.mjs"),
    root,
    dir,
    config.background_dreaming.command
  ], {
    cwd: root,
    detached: true,
    stdio: "ignore",
    env: { ...process.env, IMPROVE_DREAM_CHILD: "1" },
    windowsHide: true
  });
  child.unref();

  state.dream_running = true;
  state.last_dream_started_at = new Date().toISOString();
  state.updated_at = state.last_dream_started_at;
  writeJsonAtomic(stateFile, state);
} catch (error) {
  process.stderr.write(`improve session-end skipped: ${error.message}\n`);
}
