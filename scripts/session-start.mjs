#!/usr/bin/env node
import path from "node:path";
import {
  appendJsonl,
  dueReasons,
  eventRecord,
  isImproveChild,
  loadConfig,
  parseJson,
  projectDataDir,
  projectRoot,
  readJson,
  readStdin,
  writeJsonAtomic
} from "./lib.mjs";
import { detectFirstmate } from "../adapters/firstmate/home.mjs";
import { periodicDueReasons, syncReviewState } from "../adapters/firstmate/schedule.mjs";

// An agent this plugin started is not the human's session; see isImproveChild.
if (isImproveChild()) process.exit(0);

const input = parseJson(await readStdin());
const root = projectRoot(input);

try {
  const config = loadConfig(root);
  const dir = projectDataDir(root);
  const stateFile = path.join(dir, "state.json");
  const state = readJson(stateFile, {});
  state.sessions_since_review = (state.sessions_since_review || 0) + 1;
  state.last_session_started_at = new Date().toISOString();
  state.project_root = root;
  state.updated_at = state.last_session_started_at;
  writeJsonAtomic(stateFile, state);
  if (config.capture.enabled) {
    appendJsonl(path.join(dir, "events.jsonl"), eventRecord("SessionStart", input, root));
  }

  // A Firstmate home that opted in to periodic review adds its own cadence:
  // tasks dispatched and days since the last review. Off by default.
  const firstmate = detectFirstmate(root);
  syncReviewState(root, firstmate);
  const reasons = [...dueReasons(config, state), ...periodicDueReasons(root, firstmate)];
  if (reasons.length > 0) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: `A coding-harness review is due (${reasons.join("; ")}). Do not interrupt unrelated work. When relevant, briefly offer the human /improve review; never modify the harness without explicit approval.`
      }
    }));
  }
} catch (error) {
  process.stderr.write(`improve session-start skipped: ${error.message}\n`);
}
