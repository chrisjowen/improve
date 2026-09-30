#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

/**
 * Start the UI, or explain exactly how to make it startable.
 *
 * The plugin ships without node_modules, so a fresh install cannot run the UI
 * until dependencies are fetched. Rather than failing with a module-resolution
 * stack trace, print the commands an agent or a human can act on.
 */
const pluginRoot = path.resolve(process.env.CLAUDE_PLUGIN_ROOT || path.resolve(import.meta.dirname, ".."));
const uiDir = path.join(pluginRoot, "ui");
const projectDir = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.argv[3] || process.cwd());
const mode = process.argv[2] === "build" ? "build" : process.argv[2] === "check" ? "check" : "dev";

function has(relative) {
  return fs.existsSync(path.join(uiDir, relative));
}

function instructions(reason) {
  return [
    `The improve UI is not ready to start: ${reason}`,
    "",
    "To set it up, run these from the plugin root:",
    "",
    `  cd ${uiDir}`,
    "  npm install        # or: bun install",
    "  npm run dev        # serves on 0.0.0.0:5173",
    "",
    "The dev server binds 0.0.0.0 so it is reachable when the workspace is remote.",
    "Point it at a repository with IMPROVE_PROJECT_DIR if it is not the plugin's own:",
    "",
    `  IMPROVE_PROJECT_DIR=${projectDir} npm run dev`,
    ""
  ].join("\n");
}

if (!has("package.json")) {
  process.stderr.write(instructions("ui/package.json is missing"));
  process.exit(2);
}
if (!has("node_modules")) {
  process.stderr.write(instructions("dependencies are not installed"));
  process.exit(2);
}
if (mode !== "dev" && mode !== "check" && !has("build")) {
  process.stderr.write(instructions("no production build exists; run npm run build first"));
  process.exit(2);
}

const script = mode === "build" ? "build" : mode === "check" ? "check" : "dev";
const child = spawn("npm", ["run", script], {
  cwd: uiDir,
  stdio: "inherit",
  env: { ...process.env, IMPROVE_PROJECT_DIR: projectDir },
  windowsHide: true
});
child.on("error", (error) => {
  process.stderr.write(`Could not run npm: ${error.message}\n`);
  process.exit(127);
});
child.on("close", (code) => process.exit(code ?? 0));
