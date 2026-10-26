#!/usr/bin/env node
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { projectId, resolvePluginDataDir } from "./lib.mjs";

/**
 * Start, stop, and inspect the review UI.
 *
 *   node scripts/ui.mjs [start] [repo] [--port N] [--host H]
 *   node scripts/ui.mjs stop|status [repo]
 *   node scripts/ui.mjs build|dev|check
 *
 * `start` runs the production server in the background and returns once it
 * answers, printing its URL and log. An agent's shell call can therefore start
 * it: a foreground dev server died with the call that started it, or blocked
 * the call until the harness killed both.
 *
 * The plugin ships without node_modules, so a fresh install cannot run the UI
 * until dependencies are fetched. Rather than failing with a module-resolution
 * stack trace, print the commands an agent or a human can act on.
 */
const pluginRoot = path.resolve(process.env.CLAUDE_PLUGIN_ROOT || path.resolve(import.meta.dirname, ".."));
const uiDir = path.join(pluginRoot, "ui");
const MODES = new Set(["start", "stop", "status", "build", "dev", "check", "help"]);

export function parseArgs(argv, env = process.env, cwd = process.cwd()) {
  const options = { mode: "start", project: undefined, port: undefined, host: undefined };
  const rest = [...argv];
  if (rest[0] && MODES.has(rest[0])) options.mode = rest.shift();
  if (rest[0] === "--help" || rest[0] === "-h") options.mode = "help";
  while (rest.length) {
    const arg = rest.shift();
    if (arg === "--port") options.port = Number(rest.shift());
    else if (arg === "--host") options.host = rest.shift();
    else if (arg === "--project") options.project = rest.shift();
    else if (arg === "--help" || arg === "-h") options.mode = "help";
    else if (!arg.startsWith("-") && options.project === undefined) options.project = arg;
    else throw new Error(`unknown argument: ${arg}`);
  }
  options.project = path.resolve(options.project || env.IMPROVE_PROJECT_DIR || env.CLAUDE_PROJECT_DIR || cwd);
  options.port = Number.isInteger(options.port) && options.port > 0 ? options.port : Number(env.PORT) || 5173;
  // Local only by default. The server has no authentication, so binding any
  // other host is an explicit choice; see ui/README.md before making it.
  options.host = options.host || env.HOST || "127.0.0.1";
  return options;
}

function stateDir(project) {
  return path.join(os.tmpdir(), "improve-ui", projectId(project));
}

function readState(project) {
  try {
    return JSON.parse(fs.readFileSync(path.join(stateDir(project), "server.json"), "utf8"));
  } catch {
    return undefined;
  }
}

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function has(relative) {
  return fs.existsSync(path.join(uiDir, relative));
}

function instructions(reason, project) {
  return [
    `The improve UI is not ready to start: ${reason}`,
    "",
    "To set it up, install its dependencies once:",
    "",
    `  cd ${uiDir}`,
    "  npm install        # or: bun install",
    "",
    "Then start it in the background:",
    "",
    `  node ${path.join(pluginRoot, "scripts", "ui.mjs")} start ${project}`,
    ""
  ].join("\n");
}

function npm(script, { stdio = "inherit" } = {}) {
  for (const manager of ["npm", "bun"]) {
    const run = spawnSync(manager, ["run", script], { cwd: uiDir, stdio, windowsHide: true });
    if (run.error?.code === "ENOENT") continue;
    return run;
  }
  return { status: 127, error: new Error("neither npm nor bun is on PATH") };
}

/** Newest modification time under the sources the build bundles. */
function newestSource() {
  let newest = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else newest = Math.max(newest, fs.statSync(full).mtimeMs);
    }
  };
  // The server imports scripts/ directly, so the bundle goes stale with it,
  // and scripts/redact.mjs bundles the eval rig's redaction rules.
  for (const dir of [path.join(uiDir, "src"), path.join(pluginRoot, "scripts")]) walk(dir);
  newest = Math.max(newest, fs.statSync(path.join(pluginRoot, "assets", "eval-rig", "redaction-rules.json")).mtimeMs);
  for (const file of ["package.json", "svelte.config.js", "vite.config.js"]) {
    try {
      newest = Math.max(newest, fs.statSync(path.join(uiDir, file)).mtimeMs);
    } catch {
      // optional
    }
  }
  return newest;
}

function buildIsCurrent() {
  try {
    return fs.statSync(path.join(uiDir, "build", "index.js")).mtimeMs >= newestSource();
  } catch {
    return false;
  }
}

function portFree(port, host) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", () => resolve(false));
    probe.once("listening", () => probe.close(() => resolve(true)));
    probe.listen(port, host);
  });
}

/** The recorded server, only if it still answers as that pid for that project. */
async function recorded(project) {
  const state = readState(project);
  if (!state || !alive(state.pid)) return { state };
  const answered = await health(state.host, state.port);
  return { state, ours: answered?.pid === state.pid && answered?.project === project };
}

/** Where the launcher asks a server bound to `host` whether it is up. */
export function healthUrl(host, port) {
  return `${url(host, port)}/api/health`;
}

async function health(host, port) {
  try {
    const response = await fetch(healthUrl(host, port), { signal: AbortSignal.timeout(1500) });
    return response.ok ? await response.json() : undefined;
  } catch {
    return undefined;
  }
}

function url(host, port) {
  if (host === "0.0.0.0" || host === "::") return `http://localhost:${port}`;
  return `http://${host.includes(":") ? `[${host}]` : host}:${port}`;
}

async function start(options) {
  const { project, port, host } = options;
  if (!has("package.json")) return fail(instructions("ui/package.json is missing", project));
  if (!has("node_modules")) return fail(instructions("dependencies are not installed", project));

  const { state: previous, ours } = await recorded(project);
  if (ours) {
    process.stdout.write(`The improve UI is already running for ${project}\n  ${url(previous.host, previous.port)}\n  log: ${previous.log}\n`);
    return 0;
  }

  if (!(await portFree(port, host))) {
    const answered = await health(host, port);
    return fail(answered
      ? `Port ${port} is already serving the improve UI for ${answered.project}. Stop it with "node scripts/ui.mjs stop ${answered.project}", or pass --port.\n`
      : `Port ${port} is in use by another program. Pass --port with a free port.\n`);
  }

  if (!buildIsCurrent()) {
    process.stdout.write("Building the UI (first start, or the sources changed)…\n");
    const built = npm("build", { stdio: ["ignore", "ignore", "inherit"] });
    if (built.status !== 0) return fail(`The UI build failed${built.error ? `: ${built.error.message}` : ""}. Run "npm run build" in ${uiDir} to see why.\n`);
  }

  const dir = stateDir(project);
  fs.mkdirSync(dir, { recursive: true });
  const log = path.join(dir, "server.log");
  const out = fs.openSync(log, "a");
  const data = resolvePluginDataDir(project);
  const child = spawn(process.execPath, [path.join(uiDir, "build", "index.js")], {
    cwd: uiDir,
    detached: true,
    stdio: ["ignore", out, out],
    env: {
      ...process.env,
      HOST: host,
      PORT: String(port),
      IMPROVE_PROJECT_DIR: project,
      CLAUDE_PLUGIN_ROOT: pluginRoot,
      ...(data ? { CLAUDE_PLUGIN_DATA: data.dir } : {})
    },
    windowsHide: true
  });
  child.unref();
  fs.closeSync(out);
  fs.writeFileSync(path.join(dir, "server.json"), JSON.stringify({
    pid: child.pid, port, host, project, log, started_at: new Date().toISOString()
  }, null, 2));

  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const answered = await health(host, port);
    if (answered?.project === project) {
      process.stdout.write([
        `The improve UI is running for ${project}`,
        `  ${url(host, port)}`,
        `  log: ${log}`,
        data ? `  observations: ${data.dir} (${data.source === "env" ? "from CLAUDE_PLUGIN_DATA" : "found on disk"})` : "  observations: none found; hook data will show as not available",
        `Stop it with: node ${path.join(pluginRoot, "scripts", "ui.mjs")} stop ${project}`,
        ""
      ].join("\n"));
      return 0;
    }
    if (!alive(child.pid)) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const tail = fs.readFileSync(log, "utf8").trim().split("\n").slice(-8).join("\n");
  return fail(`The UI server did not come up. The end of ${log}:\n${tail}\n`);
}

async function stop({ project }) {
  const { state, ours } = await recorded(project);
  if (!ours) {
    process.stdout.write(state
      ? `The improve UI is not running for ${project}. Removed its stale record (pid ${state.pid}); no process was signalled.\n`
      : `The improve UI is not running for ${project}.\n`);
    fs.rmSync(path.join(stateDir(project), "server.json"), { force: true });
    return 0;
  }
  process.kill(state.pid, "SIGTERM");
  for (let i = 0; i < 40 && alive(state.pid); i += 1) await new Promise((resolve) => setTimeout(resolve, 100));
  if (alive(state.pid)) process.kill(state.pid, "SIGKILL");
  fs.rmSync(path.join(stateDir(project), "server.json"), { force: true });
  process.stdout.write(`Stopped the improve UI for ${project}.\n`);
  return 0;
}

async function status({ project }) {
  const { state, ours } = await recorded(project);
  if (ours) {
    process.stdout.write(`running  ${url(state.host, state.port)}  pid ${state.pid}\n  log: ${state.log}\n`);
  } else {
    process.stdout.write(`not running for ${project}\n`);
  }
  return 0;
}

function foreground(script, project) {
  if (!has("node_modules")) return fail(instructions("dependencies are not installed", project));
  const data = resolvePluginDataDir(project);
  const child = spawn("npm", ["run", script], {
    cwd: uiDir,
    stdio: "inherit",
    env: { ...process.env, IMPROVE_PROJECT_DIR: project, ...(data ? { CLAUDE_PLUGIN_DATA: data.dir } : {}) },
    windowsHide: true
  });
  return new Promise((resolve) => {
    child.on("error", (error) => resolve(fail(`Could not run npm: ${error.message}\n`, 127)));
    child.on("close", (code) => resolve(code ?? 0));
  });
}

function fail(message, code = 2) {
  process.stderr.write(message.endsWith("\n") ? message : `${message}\n`);
  return code;
}

const HELP = `Usage:
  node scripts/ui.mjs [start] [repo] [--port N] [--host H]   start in the background
  node scripts/ui.mjs stop [repo]                           stop it
  node scripts/ui.mjs status [repo]                         is it running, and where
  node scripts/ui.mjs build                                 build the production server
  node scripts/ui.mjs dev [repo]                            foreground dev server, for UI work
  node scripts/ui.mjs check                                 type-check the UI

repo defaults to IMPROVE_PROJECT_DIR, then CLAUDE_PROJECT_DIR, then the current directory.

The UI listens on 127.0.0.1 only. To serve it through a proxy or on another
host, pass --host and set ORIGIN to the public URL the browser uses (add extra
host names to IMPROVE_ALLOWED_HOSTS). That exposes an unauthenticated server
that can run evaluations and paid agent runs; see ui/README.md first.
`;

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    return fail(`${error.message}\n\n${HELP}`);
  }
  switch (options.mode) {
    case "help": process.stdout.write(HELP); return 0;
    case "stop": return stop(options);
    case "status": return status(options);
    case "build": {
      if (!has("node_modules")) return fail(instructions("dependencies are not installed", options.project));
      return npm("build").status ?? 1;
    }
    case "dev": return foreground("dev", options.project);
    case "check": return foreground("check", options.project);
    default: return start(options);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  process.exitCode = await main();
}
