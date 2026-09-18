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
