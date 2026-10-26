// The launcher end to end: build, start in the background, answer, stop.
// The production build is what a person runs, and it once failed every skill
// diff with ENOENT because a data file was read relative to a bundled module.
import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "../../scripts/ui.mjs";

const plugin = path.resolve(import.meta.dirname, "..", "..");
const launcher = path.join(plugin, "scripts", "ui.mjs");

// --- arguments ------------------------------------------------------------
{
  const cwd = "/work/here";
  assert.equal(parseArgs([], {}, cwd).mode, "start");
  assert.equal(parseArgs([], {}, cwd).project, cwd);
  // A bare repository path is the project; it used to be read as the mode.
  assert.equal(parseArgs(["/repo"], {}, cwd).project, "/repo");
  assert.equal(parseArgs(["start", "/repo", "--port", "4500"], {}, cwd).port, 4500);
  assert.equal(parseArgs(["stop", "/repo"], {}, cwd).mode, "stop");
  assert.equal(parseArgs([], { IMPROVE_PROJECT_DIR: "/env" }, cwd).project, "/env");
  assert.equal(parseArgs([], {}, cwd).host, "0.0.0.0");
  assert.throws(() => parseArgs(["--bogus"], {}, cwd), /unknown argument/);
}

// --- a real start ---------------------------------------------------------
function freePort() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

const repo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "improve-launch-")));
fs.mkdirSync(path.join(repo, ".harness", "proposals"), { recursive: true });
fs.writeFileSync(path.join(repo, ".harness", "proposals", "p.yaml"), [
  "id: IMP-1",
  "title: Codify the release check",
  "status: proposed",
  "skill_draft:",
  "  name: release-check",
  "  description: Use when cutting a release",
  "  body: |",
  "    ---",
  "    name: release-check",
  "    description: Use when cutting a release",
  "    ---",
  "    Run npm test.",
  ""
].join("\n"));

const port = await freePort();
const env = { ...process.env, CLAUDE_PLUGIN_DATA: path.join(repo, ".data") };
const run = (...args) => spawnSync(process.execPath, [launcher, ...args], { encoding: "utf8", env, timeout: 240_000 });

const started = run("start", repo, "--port", String(port), "--host", "127.0.0.1");
try {
  assert.equal(started.status, 0, started.stderr + started.stdout);
  assert.match(started.stdout, new RegExp(`http://127\\.0\\.0\\.1:${port}`));
  assert.match(started.stdout, /log: /);

  const health = await (await fetch(`http://127.0.0.1:${port}/api/health`)).json();
  assert.equal(health.project, repo);

  const diff = await fetch(`http://127.0.0.1:${port}/api/proposals/p.yaml/diff`);
  const body = await diff.json();
  assert.equal(diff.status, 200, JSON.stringify(body));
  assert.equal(body.target, ".claude/skills/release-check/SKILL.md");

  // Starting again finds the running server instead of failing on the port.
  const again = run("start", repo, "--port", String(port), "--host", "127.0.0.1");
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /already running/);
  assert.match(run("status", repo).stdout, /^running/);
} finally {
  const stopped = run("stop", repo);
  assert.equal(stopped.status, 0, stopped.stderr);
}
assert.match(run("status", repo).stdout, /not running/);

console.log("launcher tests passed");
