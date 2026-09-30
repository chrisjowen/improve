#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  dueReasons,
  loadConfig,
  projectDataDir,
  projectRoot,
  readJson
} from "./lib.mjs";

const root = projectRoot({ cwd: process.argv[2] });

function readVersion(file) {
  try {
    return fs.readFileSync(file, "utf8").trim() || undefined;
  } catch {
    return undefined;
  }
}

// The rig is copied into each repository rather than shared, so a copy silently
// ages as the plugin moves on. Report both versions and let the human decide.
function evalRig() {
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT
    ? path.resolve(process.env.CLAUDE_PLUGIN_ROOT)
    : path.resolve(import.meta.dirname, "..");
  const available = readVersion(path.join(pluginRoot, "assets", "eval-rig", "VERSION"));
  const installed = readVersion(path.join(root, ".harness", "evals", "VERSION"));
  return {
    installed: installed ?? null,
    available: available ?? null,
    drifted: Boolean(installed && available && installed !== available)
  };
}

try {
  const config = loadConfig(root);
  const dir = projectDataDir(root);
  const state = readJson(path.join(dir, "state.json"), {});
  let eventCount = 0;
  const byEvent = {};
  const eventsFile = path.join(dir, "events.jsonl");
  if (fs.existsSync(eventsFile)) {
    for (const line of fs.readFileSync(eventsFile, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        eventCount += 1;
        byEvent[event.event] = (byEvent[event.event] || 0) + 1;
      } catch {
        byEvent.Malformed = (byEvent.Malformed || 0) + 1;
      }
    }
  }
  process.stdout.write(`${JSON.stringify({
    schema_version: 1,
    project: root,
    harness_initialized: fs.existsSync(path.join(root, ".harness")),
    eval_rig: evalRig(),
    review_due_reasons: dueReasons(config, state),
    state,
    observations: {
      count: eventCount,
      by_event: byEvent
    },
    background_dreaming_enabled: config.background_dreaming.enabled,
    data_location: dir
  }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`Unable to read improve status: ${error.message}\n`);
  process.exitCode = 1;
}
