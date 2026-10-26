#!/usr/bin/env node
import path from "node:path";
import { projectId, projectRoot, resolvePluginDataDir } from "./lib.mjs";
import { collectStatus } from "./status-report.mjs";

const root = projectRoot({ cwd: process.argv[2] || undefined });

try {
  // CLAUDE_PLUGIN_DATA reaches hooks only, so a skill running this script
  // usually lacks it. Without any data directory the observed fields stay
  // null rather than zero: not looking is different from finding nothing.
  const data = resolvePluginDataDir(root);
  const status = collectStatus(root, {
    dataDir: data ? path.join(data.dir, "projects", projectId(root)) : undefined
  });
  status.data_source = data?.source ?? null;
  process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`Unable to read improve status: ${error.message}\n`);
  process.exitCode = 1;
}
