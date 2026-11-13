#!/usr/bin/env node
import path from "node:path";
import {
  appendJsonl,
  automatedLaunch,
  isImproveChild,
  loadConfig,
  parseJson,
  projectDataDir,
  projectRoot,
  readStdin,
  recordCandidate,
  updateJson
} from "./lib.mjs";
import { detect, fingerprint, machinePrompt } from "./detect.mjs";
import { redact } from "./redact.mjs";

/**
 * UserPromptSubmit hook: record a candidate correction when a person states one.
 *
 * This is the first path that keeps prompt text, so the excerpt passes the
 * egress rules before it is written. The hook stays cheap: a handful of regexes
 * and an append, with no model call. What it records is a candidate, one cheap
 * signal; `/improve review` has a model confirm and group candidates
 * (scripts/review-cli.mjs cluster).
 *
 * A prompt a program wrote is not a correction: a session launched with `-p`,
 * a Firstmate worker, a background-task notification, or a
 * known launch or collector template. Those are counted as skipped, never
 * recorded.
 */
// An agent this plugin started is not the human's session; see isImproveChild.
if (isImproveChild()) process.exit(0);

const input = parseJson(await readStdin());
const root = projectRoot(input);

try {
  const config = loadConfig(root);
  if (!config.capture.enabled || config.capture.corrections === false) process.exit(0);

  const prompt = typeof input.prompt === "string" ? input.prompt
    : typeof input.message === "string" ? input.message
    : undefined;
  const dir = projectDataDir(root);
  const stateFile = path.join(dir, "state.json");

  const skipped = automatedLaunch() ?? machinePrompt(prompt);
  if (skipped) {
    updateJson(stateFile, (state) => {
      state.machine_prompts_skipped = { ...state.machine_prompts_skipped };
      state.machine_prompts_skipped[skipped] = (state.machine_prompts_skipped[skipped] || 0) + 1;
      state.updated_at = new Date().toISOString();
      return state;
    });
    process.exit(0);
  }

  const found = detect(prompt);
  if (!found.matched) process.exit(0);

  const { text: excerpt, redactions } = redact(found.excerpt);
  const key = fingerprint(excerpt);
  const sessionId = typeof input.session_id === "string" ? input.session_id : undefined;

  appendJsonl(path.join(dir, "corrections.jsonl"), {
    schema_version: 2,
    occurred_at: new Date().toISOString(),
    session_id: sessionId,
    // A candidate until a model confirms it at review time.
    status: "candidate",
    category: found.category,
    confidence: found.confidence,
    fingerprint: key,
    excerpt,
    // Recorded so missing text is not mistaken for text that was clean.
    redactions: redactions.length ? redactions : undefined,
    patterns: found.patterns
  });

  updateJson(stateFile, (state) => {
    recordCandidate(state, key, sessionId);
    state.updated_at = new Date().toISOString();
    return state;
  });
} catch (error) {
  process.stderr.write(`improve prompt capture skipped: ${error.message}\n`);
}
