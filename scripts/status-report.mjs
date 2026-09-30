import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  dueReasons,
  loadConfig,
  readJson,
  topRepeatedCorrection
} from "./lib.mjs";

/**
 * The read-only status summary, shared by `status.mjs` and the UI.
 *
 * No top-level I/O, so the UI can import it. `dataDir` is where the hooks wrote
 * observations for this project. When it is not known, every field that comes
 * from it is `null`, never zero: "we could not look" and "we looked and found
 * nothing" must stay distinguishable.
 */
export function collectStatus(root, { dataDir, pluginRoot } = {}) {
  const config = loadConfig(root);
  const observed = dataDir ? observations(dataDir) : undefined;
  const state = dataDir ? readJson(path.join(dataDir, "state.json"), {}) : undefined;
  return {
    schema_version: 1,
    project: root,
    harness_initialized: fs.existsSync(path.join(root, ".harness")),
    eval_rig: evalRig(root, pluginRoot),
    transcripts: transcripts(root),
    coverage: coverage(root),
    review_due_reasons: state ? dueReasons(config, state) : null,
    repeated_correction: state ? topRepeatedCorrection(state) ?? null : null,
    state: state ?? null,
    observations: observed ?? null,
    background_dreaming_enabled: config.background_dreaming.enabled,
    data_location: dataDir ?? null
  };
}

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
function transcripts(root) {
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
function evalRig(root, pluginRoot) {
  const base = pluginRoot
    ? path.resolve(pluginRoot)
    : process.env.CLAUDE_PLUGIN_ROOT
      ? path.resolve(process.env.CLAUDE_PLUGIN_ROOT)
      : path.resolve(import.meta.dirname, "..");
  const available = readVersion(path.join(base, "assets", "eval-rig", "VERSION"));
  const installed = readVersion(path.join(root, ".harness", "evals", "VERSION"));
  return {
    installed: installed ?? null,
    available: available ?? null,
    drifted: Boolean(installed && available && installed !== available)
  };
}

/**
 * Objective coverage: an objective nobody measures cannot be improved
 * deliberately. This is a set difference and was previously computed nowhere.
 */
function coverage(root) {
  const harness = path.join(root, ".harness");
  const declared = new Map();
  const objectivesFile = path.join(harness, "objectives.yaml");
  const text = readVersion(objectivesFile) !== undefined
    ? fs.readFileSync(objectivesFile, "utf8")
    : undefined;
  if (text) {
    // A deliberately small reader: ids only, so status needs no YAML parser.
    for (const line of text.split("\n")) {
      const match = line.match(/^\s*-\s+id:\s*(\S+)/);
      if (match) declared.set(match[1], []);
    }
  }

  const measured = new Set();
  const suitesDir = path.join(harness, "evals", "suites");
  let entries = [];
  try {
    entries = fs.readdirSync(suitesDir).filter((name) => /\.ya?ml$/i.test(name));
  } catch {
    entries = [];
  }
  for (const name of entries) {
    const suite = fs.readFileSync(path.join(suitesDir, name), "utf8");
    // objective: <id>, or an embedded block whose id is on the next line.
    const named = suite.match(/^objective:\s*(\S+)\s*$/m);
    const embedded = suite.match(/^objective:\s*\n\s+id:\s*(\S+)/m);
    const id = named?.[1] ?? embedded?.[1];
    if (!id) continue;
    measured.add(id);
    if (!declared.has(id)) declared.set(id, []);
    declared.get(id).push(name);
  }

  const objectives = [...declared.entries()].map(([id, suites]) => ({ id, suites }));
  return {
    total: objectives.length,
    uncovered: objectives.filter((o) => o.suites.length === 0).map((o) => o.id),
    objectives
  };
}

function countLines(file) {
  try {
    return fs.readFileSync(file, "utf8").split("\n").filter((line) => line.trim()).length;
  } catch {
    return 0;
  }
}

function observations(dir) {
  let count = 0;
  const byEvent = {};
  const eventsFile = path.join(dir, "events.jsonl");
  if (fs.existsSync(eventsFile)) {
    for (const line of fs.readFileSync(eventsFile, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        count += 1;
        byEvent[event.event] = (byEvent[event.event] || 0) + 1;
      } catch {
        byEvent.Malformed = (byEvent.Malformed || 0) + 1;
      }
    }
  }
  return {
    count,
    by_event: byEvent,
    corrections: countLines(path.join(dir, "corrections.jsonl"))
  };
}
