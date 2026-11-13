#!/usr/bin/env node
import path from "node:path";
import {
  appendJsonl,
  automatedLaunch,
  dueReasons,
  eventRecord,
  isImproveChild,
  loadConfig,
  parseJson,
  projectDataDir,
  projectRoot,
  readStdin,
  repositoryKey,
  updateJson
} from "./lib.mjs";
import { approvedNotApplied } from "./landing.mjs";
import { detectFirstmate } from "../adapters/firstmate/home.mjs";
import { periodicDueReasons, syncReviewState } from "../adapters/firstmate/schedule.mjs";

// An agent this plugin started is not the human's session; see isImproveChild.
if (isImproveChild()) process.exit(0);

const input = parseJson(await readStdin());
const root = projectRoot(input);

try {
  const config = loadConfig(root);
  const dir = projectDataDir(root);
  // A program's session (`-p`, a Firstmate worker) still does work in the
  // repository, but nobody there can be offered a review.
  const automated = automatedLaunch();
  const state = updateJson(path.join(dir, "state.json"), (state) => {
    state.sessions_since_review = (state.sessions_since_review || 0) + 1;
    if (!automated) state.human_sessions_since_review = (state.human_sessions_since_review || 0) + 1;
    state.last_session_started_at = new Date().toISOString();
    state.project_root = repositoryKey(root).checkout ?? root;
    state.updated_at = state.last_session_started_at;
    return state;
  });
  if (config.capture.enabled) {
    appendJsonl(path.join(dir, "events.jsonl"), { ...eventRecord("SessionStart", input, root), automated: automated ?? undefined });
  }

  // A Firstmate home that opted in to periodic review adds its own cadence:
  // tasks dispatched and days since the last review. Off by default.
  const firstmate = detectFirstmate(root);
  syncReviewState(root, firstmate);
  if (automated) process.exit(0);

  const context = [];
  const reasons = [...dueReasons(config, state), ...periodicDueReasons(root, firstmate)];
  if (reasons.length > 0) {
    context.push(`A coding-harness review is due (${reasons.join("; ")}). Do not interrupt unrelated work. When relevant, briefly offer the human /improve review; never modify the harness without explicit approval.`);
  }
  // Approval changes no file. When nothing applied an approved proposal, this
  // session, which holds the person's own login, is where it can land.
  const pending = approvedNotApplied(root);
  if (pending.length > 0) {
    const shown = pending.slice(0, 3).map((p) => p.id).join(", ");
    const more = pending.length > 3 ? ` and ${pending.length - 3} more` : "";
    context.push(`${pending.length} approved harness ${pending.length === 1 ? "proposal is" : "proposals are"} not applied yet: ${shown}${more}. When the human has a moment, offer to apply one in this session with /improve apply <id>; do not apply without their go-ahead.`);
  }
  if (context.length > 0) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: context.join("\n")
      }
    }));
  }
} catch (error) {
  process.stderr.write(`improve session-start skipped: ${error.message}\n`);
}
