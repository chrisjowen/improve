#!/usr/bin/env node
import { projectDataDir, projectRoot } from "./lib.mjs";
import { collectStatus } from "./status-report.mjs";

const root = projectRoot({ cwd: process.argv[2] });

try {
  // projectDataDir throws without CLAUDE_PLUGIN_DATA. The CLI keeps that as an
  // error rather than reporting empty observations as if none were captured.
  const status = collectStatus(root, { dataDir: projectDataDir(root) });
  process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`Unable to read improve status: ${error.message}\n`);
  process.exitCode = 1;
}
