import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { agentEnv, parseAgentOutput, runAgent } from "../../scripts/spawn-agent.mjs";

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

// A login failure says what to check, not only the CLI's words.
const loggedOut = parseAgentOutput(JSON.stringify({ type: "result", subtype: "success", is_error: true, result: "Not logged in · Please run /login" }));
assert.equal(loggedOut.ok, false);
assert.match(loggedOut.error, /Not logged in/);
assert.match(loggedOut.error, /Claude Code is logged in/);
assert.match(loggedOut.error, /environment the UI was started from/);

console.log("agent env tests passed");
