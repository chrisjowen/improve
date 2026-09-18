import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "improve-plugin-"));
const project = path.join(temp, "project");
const data = path.join(temp, "data");
fs.mkdirSync(project, { recursive: true });

function run(script, args, input, extraEnv = {}) {
  return spawnSync(process.execPath, [path.join(pluginRoot, "scripts", script), ...args], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: project,
      CLAUDE_PLUGIN_DATA: data,
      ...extraEnv
    }
  });
}

const start = run("session-start.mjs", [], { session_id: "s1", source: "startup" });
assert.equal(start.status, 0, start.stderr);
assert.match(start.stdout, /review is due/);

const capture = run("capture-event.mjs", ["PostToolUse"], {
  session_id: "s1",
  tool_name: "Write",
  tool_input: {
    file_path: path.join(project, "src", "safe.js"),
    content: "SECRET_SHOULD_NOT_BE_CAPTURED"
  },
  tool_response: "SECRET_RESPONSE_SHOULD_NOT_BE_CAPTURED"
});
assert.equal(capture.status, 0, capture.stderr);

const status = run("status.mjs", [project], {});
assert.equal(status.status, 0, status.stderr);
const summary = JSON.parse(status.stdout);
assert.equal(summary.observations.by_event.PostToolUse, 1);
assert.ok(summary.observations.by_event.SessionStart >= 1);

const events = fs.readFileSync(path.join(summary.data_location, "events.jsonl"), "utf8");
assert.ok(!events.includes("SECRET_SHOULD_NOT_BE_CAPTURED"));
assert.ok(!events.includes("SECRET_RESPONSE_SHOULD_NOT_BE_CAPTURED"));
assert.ok(events.includes("src/safe.js"));

const failure = run("capture-event.mjs", ["PostToolUseFailure"], {
  session_id: "s1",
  tool_name: "Bash",
  error: "Command failed"
});
assert.equal(failure.status, 0, failure.stderr);

const statusAfterFailure = run("status.mjs", [project], {});
const after = JSON.parse(statusAfterFailure.stdout);
assert.equal(after.state.tool_failures_since_review, 1);

console.log("hook tests passed");
