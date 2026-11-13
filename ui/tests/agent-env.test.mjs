import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { agentEnv, checkLogin, credentialSettings, parseAgentOutput, runAgent } from "../../scripts/spawn-agent.mjs";

const user = () => ({ username: "captain" });

// A launcher that passes only PATH, HOME and LANG leaves USER out, and on
// macOS Claude Code then cannot find its Keychain login.
const stripped = agentEnv({ PATH: "/bin", HOME: "/home/x", LANG: "C.UTF-8" }, user);
assert.equal(stripped.USER, "captain");
assert.equal(stripped.LOGNAME, "captain");
assert.equal(stripped.PATH, "/bin");

const empty = agentEnv({ USER: "", LOGNAME: "" }, user);
assert.equal(empty.USER, "captain");
assert.equal(empty.LOGNAME, "captain");

// Values that are set are never replaced.
const set = agentEnv({ USER: "alice", LOGNAME: "bob" }, () => { throw new Error("must not be asked"); });
assert.equal(set.USER, "alice");
assert.equal(set.LOGNAME, "bob");
assert.equal(agentEnv({ USER: "alice" }, user).USER, "alice");
assert.equal(agentEnv({ USER: "alice" }, user).LOGNAME, "captain");

// Without HOME the CLI cannot find ~/.claude, so it is "Not logged in" too.
assert.equal(agentEnv({ USER: "a", LOGNAME: "a" }, () => ({ username: "a", homedir: "/Users/a" })).HOME, "/Users/a");
assert.equal(agentEnv({ HOME: "/h" }, () => ({ username: "a", homedir: "/Users/a" })).HOME, "/h", "a HOME that is set is kept");

// No account entry: the environment is left as it was.
assert.equal(agentEnv({}, () => { throw new Error("no passwd entry"); }).USER, undefined);

// The real child: a stub CLI reports the environment it was given.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "improve-agent-env-"));
const stub = path.join(dir, "claude");
fs.writeFileSync(stub, `#!/usr/bin/env node
process.stdout.write(JSON.stringify({ type: "result", subtype: "success", result: JSON.stringify({ USER: process.env.USER ?? null, LOGNAME: process.env.LOGNAME ?? null, KEEP: process.env.IMPROVE_TEST_KEEP ?? null }) }) + "\\n");
`);
fs.chmodSync(stub, 0o755);

const saved = { USER: process.env.USER, LOGNAME: process.env.LOGNAME };
try {
  delete process.env.USER;
  delete process.env.LOGNAME;
  process.env.IMPROVE_TEST_KEEP = "kept";
  const missing = await runAgent({ command: stub, prompt: "hi", cwd: dir });
  assert.equal(missing.ok, true, missing.error);
  assert.equal(missing.payload.USER, os.userInfo().username);
  assert.equal(missing.payload.LOGNAME, os.userInfo().username);
  assert.equal(missing.payload.KEEP, "kept");

  process.env.USER = "alice";
  process.env.LOGNAME = "bob";
  const present = await runAgent({ command: stub, prompt: "hi", cwd: dir });
  assert.equal(present.payload.USER, "alice");
  assert.equal(present.payload.LOGNAME, "bob");
} finally {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  delete process.env.IMPROVE_TEST_KEEP;
  fs.rmSync(dir, { recursive: true, force: true });
}

// --- a login set up in user settings survives --setting-sources "" ---------
// Apply loads no user settings, so their allow rules cannot widen the run.
// Only the keys that decide how the CLI signs in are carried over.
{
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "improve-credentials-"));
  fs.mkdirSync(path.join(home, ".claude"));
  assert.equal(credentialSettings({ env: {}, home }), undefined, "no settings, nothing to carry");
  fs.writeFileSync(path.join(home, ".claude", "settings.json"), JSON.stringify({
    apiKeyHelper: "~/bin/key.sh",
    permissions: { allow: ["Bash(rm:*)"] },
    hooks: { Stop: [] },
    env: { CLAUDE_CODE_USE_BEDROCK: "1", AWS_REGION: "us-east-1", ANTHROPIC_BASE_URL: "https://gw.example", EDITOR: "vim", PLAYWRIGHT_MCP_HEADLESS: "1" }
  }));
  assert.deepEqual(credentialSettings({ env: {}, home }), {
    apiKeyHelper: "~/bin/key.sh",
    env: { CLAUDE_CODE_USE_BEDROCK: "1", AWS_REGION: "us-east-1", ANTHROPIC_BASE_URL: "https://gw.example" }
  });
  fs.writeFileSync(path.join(home, ".claude", "settings.json"), JSON.stringify({ permissions: { allow: ["Bash"] }, env: { EDITOR: "vim" } }));
  assert.equal(credentialSettings({ env: {}, home }), undefined, "permissions and other env are never carried");

  // runAgent passes them with --settings only when it drops user settings.
  fs.writeFileSync(path.join(home, ".claude", "settings.json"), JSON.stringify({ apiKeyHelper: "~/bin/key.sh" }));
  const argsStub = path.join(home, "claude");
  fs.writeFileSync(argsStub, `#!/usr/bin/env node
process.stdout.write(JSON.stringify({ type: "result", subtype: "success", result: JSON.stringify({ args: process.argv.slice(2) }) }) + "\\n");
`, { mode: 0o755 });
  const savedHome = process.env.HOME;
  try {
    process.env.HOME = home;
    const without = await runAgent({ command: argsStub, prompt: "hi", cwd: home, settingSources: [] });
    const args = without.payload.args;
    assert.equal(args[args.indexOf("--setting-sources") + 1], "");
    assert.deepEqual(JSON.parse(args[args.indexOf("--settings") + 1]), { apiKeyHelper: "~/bin/key.sh" });
    const withUser = await runAgent({ command: argsStub, prompt: "hi", cwd: home });
    assert.equal(withUser.payload.args.includes("--settings"), false, "a run that loads user settings needs no copy");
  } finally {
    process.env.HOME = savedHome;
    fs.rmSync(home, { recursive: true, force: true });
  }
}

// --- whether the CLI is signed in, asked before a run --------------------------
{
  const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), "improve-login-"));
  const status = (body) => {
    const file = path.join(dir2, `auth-${Math.random().toString(36).slice(2)}`);
    fs.writeFileSync(file, `#!/bin/sh\n${body}\n`, { mode: 0o755 });
    return file;
  };
  assert.deepEqual(await checkLogin(status(`echo '{"loggedIn": true, "authMethod": "claude.ai"}'`)), { loggedIn: true, method: "claude.ai" });
  assert.deepEqual(await checkLogin(status(`echo '{"loggedIn": false, "authMethod": "none"}'`)), { loggedIn: false, method: "none" });
  // A CLI that cannot say goes ahead; the run reports its own failure.
  assert.deepEqual(await checkLogin(status("echo 'error: unknown command auth'; exit 1")), { loggedIn: null, method: null });
  assert.deepEqual(await checkLogin(path.join(dir2, "missing")), { loggedIn: null, method: null });
  fs.rmSync(dir2, { recursive: true, force: true });
}

// A login failure says what to check, not only the CLI's words.
const loggedOut = parseAgentOutput(JSON.stringify({ type: "result", subtype: "success", is_error: true, result: "Not logged in · Please run /login" }));
assert.equal(loggedOut.ok, false);
assert.match(loggedOut.error, /Not logged in/);
assert.match(loggedOut.error, /Claude Code is logged in/);
assert.match(loggedOut.error, /environment the UI was started from/);

console.log("agent env tests passed");
