#!/usr/bin/env node
import path from "node:path";
import {
  appendJsonl,
  dueReasons,
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

  const reasons = dueReasons(config, state);
  if (reasons.length > 0 && process.env.IMPROVE_DREAM_CHILD !== "1") {
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
