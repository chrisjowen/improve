import path from "node:path";
import { collectStatus } from "../../../../scripts/status-report.mjs";
import { pluginDataDir, pluginRoot, projectId, projectRoot } from "./paths.js";

/**
 * Where the hooks wrote observations for the served repository, or undefined
 * when CLAUDE_PLUGIN_DATA is not set. Undefined makes every observed field
 * `null`, so the page can say "not available" instead of showing a zero.
 */
export function projectDataDir(root = projectRoot()) {
  const base = pluginDataDir();
  return base ? path.join(base, "projects", projectId(root)) : undefined;
}

export function readStatus() {
  const root = projectRoot();
  return collectStatus(root, { dataDir: projectDataDir(root), pluginRoot: pluginRoot() });
}
