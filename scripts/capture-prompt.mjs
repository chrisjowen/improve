#!/usr/bin/env node
import path from "node:path";
import {
  appendJsonl,
  loadConfig,
  parseJson,
  projectDataDir,
  projectRoot,
  readJson,
  readStdin,
  writeJsonAtomic
} from "./lib.mjs";
import { detect, fingerprint } from "./detect.mjs";
import { redact } from "./redact.mjs";

/**
 * UserPromptSubmit hook: record a correction when one is stated.
 *
 * This is the first path that keeps prompt text, so the excerpt passes the
 * egress rules before it is written. The hook stays cheap: a handful of regexes
 * and an append, with no model call.
 */
const input = parseJson(await readStdin());
const root = projectRoot(input);

try {
  const config = loadConfig(root);
  if (!config.capture.enabled || config.capture.corrections === false) process.exit(0);

  const prompt = typeof input.prompt === "string" ? input.prompt
    : typeof input.message === "string" ? input.message
    : undefined;
  const found = detect(prompt);
  if (!found.matched) process.exit(0);

  const { text: excerpt, redactions } = redact(found.excerpt);
  const key = fingerprint(excerpt);
  const dir = projectDataDir(root);

  appendJsonl(path.join(dir, "corrections.jsonl"), {
    schema_version: 1,
    occurred_at: new Date().toISOString(),
    session_id: typeof input.session_id === "string" ? input.session_id : undefined,
    category: found.category,
    confidence: found.confidence,
    fingerprint: key,
    excerpt,
    // Recorded so missing text is not mistaken for text that was clean.
    redactions: redactions.length ? redactions : undefined,
    patterns: found.patterns
  });

  // A repeat count is what makes "the same correction repeats" a real trigger.
  const stateFile = path.join(dir, "state.json");
  const state = readJson(stateFile, {});
  state.corrections_since_review = (state.corrections_since_review || 0) + 1;
  state.correction_fingerprints = state.correction_fingerprints || {};
  state.correction_fingerprints[key] = (state.correction_fingerprints[key] || 0) + 1;
  state.updated_at = new Date().toISOString();
  writeJsonAtomic(stateFile, state);
} catch (error) {
  process.stderr.write(`improve prompt capture skipped: ${error.message}\n`);
}
