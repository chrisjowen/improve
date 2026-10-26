#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { classifyScope, lintProse, readScopeFiles } from "./proposal-check.mjs";
import { detectFirstmate } from "../adapters/firstmate/home.mjs";
import {
  checkFirstmateScope,
  isFirstmateHarnessPath,
  readFirstmateBlock
} from "../adapters/firstmate/surfaces.mjs";

/**
 * Check proposal files before a human sees them.
 *
 *   node proposal-check-cli.mjs .harness/proposals/IMP-*.yaml
 *
 * Prints one JSON report per file. Exits 1 when any proposal changes files
 * outside the harness or lists no files; writing findings alone exit 0,
 * because they are for the author to fix, not a reason to refuse.
 *
 * In a project where the Firstmate adapter is enabled, Firstmate's surfaces
 * define the harness instead, and each report gains a `firstmate` block naming
 * the surfaces, whether they are captain-private or shared-tracked, and how an
 * approved change is delivered. A proposal that mixes the two also exits 1.
 */
const files = process.argv.slice(2);
if (files.length === 0) {
  process.stderr.write("usage: proposal-check-cli.mjs <proposal.yaml>...\n");
  process.exit(2);
}

const root = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
const firstmate = detectFirstmate(root);
const scopeOptions = firstmate.detected && firstmate.enabled ? { isHarness: isFirstmateHarnessPath } : {};

let failed = false;
for (const file of files) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ file, error: error.message })}\n`);
    failed = true;
    continue;
  }
  const scopeFiles = readScopeFiles(text);
  const { scope, outside } = classifyScope(scopeFiles, scopeOptions);
  if (scope !== "harness") failed = true;
  // Folded YAML scalars wrap one sentence over several indented lines. Join
  // continuation lines so a sentence is measured whole; `match` quotes the
  // text, which is enough to find it in the file.
  const joined = text.replace(/\n[ \t]+(?![ \t]|-\s|[\w.-]+:)/g, " ");
  const prose = lintProse(joined).map(({ rule, match, fix }) => ({ rule, match, fix }));
  const report = { file, scope, outside, prose };
  if (scopeOptions.isHarness) {
    const { delivery, visibility, surfaces, findings } = checkFirstmateScope(scopeFiles, readFirstmateBlock(text));
    report.firstmate = { delivery, visibility, surfaces, findings };
    if (delivery === "refuse" || delivery === "split") failed = true;
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
process.exitCode = failed ? 1 : 0;
