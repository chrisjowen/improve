#!/usr/bin/env node
import fs from "node:fs";
import { classifyScope, lintProse, readScopeFiles } from "./proposal-check.mjs";

/**
 * Check proposal files before a human sees them.
 *
 *   node proposal-check-cli.mjs .harness/proposals/IMP-*.yaml
 *
 * Prints one JSON report per file. Exits 1 when any proposal changes files
 * outside the harness or lists no files; writing findings alone exit 0,
 * because they are for the author to fix, not a reason to refuse.
 */
const files = process.argv.slice(2);
if (files.length === 0) {
  process.stderr.write("usage: proposal-check-cli.mjs <proposal.yaml>...\n");
  process.exit(2);
}

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
  const { scope, outside } = classifyScope(readScopeFiles(text));
  if (scope !== "harness") failed = true;
  // Folded YAML scalars wrap one sentence over several indented lines. Join
  // continuation lines so a sentence is measured whole; `match` quotes the
  // text, which is enough to find it in the file.
  const joined = text.replace(/\n[ \t]+(?![ \t]|-\s|[\w.-]+:)/g, " ");
  const prose = lintProse(joined).map(({ rule, match, fix }) => ({ rule, match, fix }));
  process.stdout.write(`${JSON.stringify({ file, scope, outside, prose }, null, 2)}\n`);
}
process.exitCode = failed ? 1 : 0;
