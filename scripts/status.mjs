#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  dueReasons,
  loadConfig,
  projectDataDir,
  projectRoot,
  readJson,
  topRepeatedCorrection
} from "./lib.mjs";

const root = projectRoot({ cwd: process.argv[2] });

function readVersion(file) {
  try {
    return fs.readFileSync(file, "utf8").trim() || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Transcript availability.
 *
 * Observed evaluation reads session JSONL, and Claude Code prunes local session
 * history, so the evidence base silently disappears. Report the range rather
 * than recommending a retention value: longer retention means more prompt text
 * on disk, which is a real cost given how the rest of the design treats content.
 */
function transcripts() {
  const dir = path.join(os.homedir(), ".claude", "projects", `-${root.replaceAll("/", "-").replace(/^-/, "")}`);
  const candidates = [dir, path.join(os.homedir(), ".claude", "projects", root.replaceAll("/", "-"))];
  for (const candidate of candidates) {
    let entries;
    try {
      entries = fs.readdirSync(candidate).filter((name) => name.endsWith(".jsonl"));
    } catch {
      continue;
    }
    if (entries.length === 0) continue;
    const stats = entries.map((name) => {
      const file = path.join(candidate, name);
      return { name, mtime: fs.statSync(file).mtimeMs };
    }).sort((a, b) => a.mtime - b.mtime);
    const days = (value) => Math.floor((Date.now() - value) / 86_400_000);
    return {
      directory: candidate,
      count: stats.length,
      oldest: new Date(stats[0].mtime).toISOString(),
      oldest_age_days: days(stats[0].mtime),
      newest: new Date(stats.at(-1).mtime).toISOString()
    };
  }
  return { directory: null, count: 0, note: "no session transcripts found; observed evaluation has no substrate" };
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

function countLines(file) {
  try {
    return fs.readFileSync(file, "utf8").split("\n").filter((line) => line.trim()).length;
  } catch {
    return 0;
  }
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
    transcripts: transcripts(),
    review_due_reasons: dueReasons(config, state),
    repeated_correction: topRepeatedCorrection(state) ?? null,
    state,
    observations: {
      count: eventCount,
      by_event: byEvent,
      corrections: countLines(path.join(dir, "corrections.jsonl"))
    },
    background_dreaming_enabled: config.background_dreaming.enabled,
    data_location: dir
  }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`Unable to read improve status: ${error.message}\n`);
  process.exitCode = 1;
}
