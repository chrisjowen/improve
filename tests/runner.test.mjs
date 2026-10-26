// Regression tests for the runner failures reproduced against a demo repository.
// Each block names the failure it pins; see the PR description for the repros.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { runProcess, lastMeaningfulLine } from "../scripts/run-process.mjs";
import { runAgent, parseAgentOutput } from "../scripts/spawn-agent.mjs";
import { isImproveChild, projectId, resolvePluginDataDir } from "../scripts/lib.mjs";
import { runDream } from "../scripts/dream.mjs";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const temp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "improve-runner-")));

function script(name, body) {
  const file = path.join(temp, name);
  fs.writeFileSync(file, `#!/bin/sh\n${body}\n`, { mode: 0o755 });
  return file;
}

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitFor(check, ms = 3000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (check()) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return check();
}

// --- an agent's failure reason reaches the person --------------------------
// The CLI exits 1 and puts the reason in the stdout envelope; stderr holds an
// unrelated notice. This used to surface as "agent exited 1".
{
  const envelope = JSON.stringify({
    type: "result", subtype: "success", is_error: true, api_error_status: 401,
    result: "Invalid API key · Fix external API key"
  });
  const agent = script("agent-401", `echo '${envelope}'\necho 'connectors are disabled' >&2\nexit 1`);
  const result = await runAgent({ command: agent, prompt: "x", cwd: temp });
  assert.equal(result.ok, false);
  assert.match(result.error, /could not sign in/);
  assert.match(result.error, /Invalid API key/);
  assert.match(result.error, /ANTHROPIC_API_KEY/);
}

// is_error with exit 0 is a failure, and says why.
{
  const parsed = parseAgentOutput(JSON.stringify({ type: "result", subtype: "error_max_turns", is_error: true }));
  assert.equal(parsed.ok, false);
  assert.match(parsed.error, /ran out of turns/);
}

// No envelope at all: the stderr line that explains it, not a generic code.
{
  const agent = script("agent-crash", "echo 'Error: unknown option --bogus' >&2\nexit 2");
  const result = await runAgent({ command: agent, prompt: "x", cwd: temp });
  assert.match(result.error, /exited with code 2: Error: unknown option --bogus/);
}

// A missing command is named, with what to do about it.
{
  const result = await runAgent({ command: path.join(temp, "no-such-claude"), prompt: "x", cwd: temp });
  assert.match(result.error, /was not found/);
  assert.match(result.error, /IMPROVE_AGENT_COMMAND/);
}

// --- streamed progress, and a log a person can read ------------------------
{
  const lines = [
    { type: "system", subtype: "init" },
    { type: "assistant", message: { content: [{ type: "tool_use", name: "Grep", input: { pattern: "discount" } }] } },
    { type: "assistant", message: { content: [{ type: "text", text: "done" }] } },
    { type: "result", subtype: "success", is_error: false, result: '{"findings":[]}', total_cost_usd: 0.01, num_turns: 2 }
  ].map((line) => `echo '${JSON.stringify(line)}'`).join("\n");
  const agent = script("agent-stream", `${lines}\nenv | grep '^IMPROVE_' > "${temp}/child-env"`);
  const seen = [];
  const logFile = path.join(temp, "logs", "agent.log");
  const result = await runAgent({ command: agent, prompt: "x", cwd: temp, logFile, onProgress: (p) => seen.push(p) });
  assert.equal(result.ok, true, result.error);
  assert.deepEqual(result.payload, { findings: [] });
  assert.equal(result.envelope.cost_usd, 0.01);
  assert.ok(seen.some((p) => p.last_tool === "Grep" && /Using Grep on discount/.test(p.message)), "tool use is reported as progress");
  assert.equal(result.progress.tools, 1);
  const log = fs.readFileSync(logFile, "utf8");
  assert.match(log, /agent used Grep on discount/);
  assert.match(log, /agent finished after 2 turns, cost \$0\.01/);
  assert.doesNotMatch(log, /"type":"assistant"/, "the log is readable, not the raw stream");
  assert.match(log, /exited 0/);

  // The child is marked so this plugin's hooks skip it.
  const env = fs.readFileSync(path.join(temp, "child-env"), "utf8");
  assert.match(env, /IMPROVE_AGENT_CHILD=1/);
}

// --- timeouts and cancel end the whole process tree ------------------------
// The evaluator runs python -> bridge -> sh -> sleep. Killing only the direct
// child left the rest running after the job was reported finished.
{
  const pidFile = path.join(temp, "grandchild-timeout");
  const tree = script("tree-timeout", `sleep 30 &\necho $! > "${pidFile}"\nwait`);
  const result = await runProcess(tree, [], { timeoutMs: 300, graceMs: 200 });
  assert.equal(result.timedOut, true);
  const grandchild = Number(fs.readFileSync(pidFile, "utf8"));
  assert.ok(await waitFor(() => !alive(grandchild)), "a timeout must stop descendants too");
}
{
  const pidFile = path.join(temp, "grandchild-cancel");
  const tree = script("tree-cancel", `sleep 30 &\necho $! > "${pidFile}"\nwait`);
  const controller = new AbortController();
  const pending = runProcess(tree, [], { signal: controller.signal, graceMs: 200 });
  await waitFor(() => fs.existsSync(pidFile) && fs.readFileSync(pidFile, "utf8").trim());
  controller.abort();
  const result = await pending;
  assert.equal(result.cancelled, true);
  const grandchild = Number(fs.readFileSync(pidFile, "utf8"));
  assert.ok(await waitFor(() => !alive(grandchild)), "a cancel must stop descendants too");
}
{
  const agent = script("agent-slow", "sleep 30");
  const result = await runAgent({ command: agent, prompt: "x", cwd: temp, timeoutMs: 300 });
  assert.equal(result.timedOut, true);
  assert.match(result.error, /did not finish within 300ms/);
}

// The useful line of a traceback is the exception, not the last frame.
assert.equal(
  lastMeaningfulLine("Traceback (most recent call last):\n  File \"x.py\", line 1\nModuleNotFoundError: No module named 'yaml'\n"),
  "ModuleNotFoundError: No module named 'yaml'"
);

// --- the plugin's own agents do not count as the human's work --------------
// Each draft re-captured the corrections embedded in its prompt and counted as
// a session, inflating the review triggers it was meant to act on.
{
  assert.equal(isImproveChild({ IMPROVE_AGENT_CHILD: "1" }), true);
  assert.equal(isImproveChild({ IMPROVE_DREAM_CHILD: "1" }), true);
  assert.equal(isImproveChild({}), false);

  const project = path.join(temp, "child-project");
  const data = path.join(temp, "child-data");
  fs.mkdirSync(project, { recursive: true });
  const hook = (name, args, input) => spawnSync(process.execPath, [path.join(pluginRoot, "scripts", name), ...args], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: project, CLAUDE_PLUGIN_DATA: data, IMPROVE_AGENT_CHILD: "1" }
  });
  const prompt = { prompt: 'Corrections: [{"excerpt":"no, use the existing helper instead of a new one"}]', session_id: "c" };
  for (const [name, args, input] of [
    ["session-start.mjs", [], { session_id: "c" }],
    ["capture-prompt.mjs", [], prompt],
    ["capture-event.mjs", ["PostToolUse"], { session_id: "c", tool_name: "Read" }],
    ["session-end.mjs", [], { session_id: "c" }]
  ]) {
    const ran = hook(name, args, input);
    assert.equal(ran.status, 0, ran.stderr);
  }
  assert.equal(fs.existsSync(data), false, "no observation may be recorded for a plugin agent");
}

// --- the status CLI works where a skill runs it ----------------------------
// CLAUDE_PLUGIN_DATA is exported to hooks only, so `status.mjs` failed with
// "CLAUDE_PLUGIN_DATA is not available" every time a skill ran it.
{
  const home = path.join(temp, "home");
  const project = path.join(temp, "status-project");
  fs.mkdirSync(project, { recursive: true });
  const store = path.join(home, ".claude", "plugins", "data", "improve-improve-marketplace");
  const observed = path.join(store, "projects", projectId(project));
  fs.mkdirSync(observed, { recursive: true });
  fs.writeFileSync(path.join(observed, "events.jsonl"), `${JSON.stringify({ event: "PostToolUse" })}\n`);
  fs.mkdirSync(path.join(home, ".claude", "plugins", "data", "other-plugin"), { recursive: true });

  assert.deepEqual(resolvePluginDataDir(project, { env: {}, home }), { dir: store, source: "discovered" });
  assert.deepEqual(resolvePluginDataDir(project, { env: { CLAUDE_PLUGIN_DATA: "/x" }, home }), { dir: "/x", source: "env" });
  // An unsubstituted ${CLAUDE_PLUGIN_DATA} expands to "", which means unset.
  assert.equal(resolvePluginDataDir(project, { env: { CLAUDE_PLUGIN_DATA: "" }, home }).source, "discovered");

  const env = { ...process.env, HOME: home };
  delete env.CLAUDE_PLUGIN_DATA;
  delete env.CLAUDE_CONFIG_DIR;
  delete env.CLAUDE_PROJECT_DIR;
  const status = spawnSync(process.execPath, [path.join(pluginRoot, "scripts", "status.mjs"), project], { encoding: "utf8", env });
  assert.equal(status.status, 0, status.stderr);
  const summary = JSON.parse(status.stdout);
  assert.equal(summary.data_source, "discovered");
  assert.equal(summary.observations.by_event.PostToolUse, 1);

  // Nothing to find is reported as unknown, not as an error or a zero.
  const bare = spawnSync(process.execPath, [path.join(pluginRoot, "scripts", "status.mjs"), project], {
    encoding: "utf8", env: { ...env, HOME: path.join(temp, "empty-home") }
  });
  assert.equal(bare.status, 0, bare.stderr);
  assert.equal(JSON.parse(bare.stdout).observations, null);
}

// --- a failed dream says why, names its log, and clears its running flag ---
{
  const dataDir = path.join(temp, "dream-data");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, "state.json"), JSON.stringify({ dream_running: true }));
  const envelope = JSON.stringify({ type: "result", subtype: "success", is_error: true, result: "Credit balance is too low" });
  const agent = script("agent-broke", `echo '${envelope}'\nexit 1`);
  const outcome = await runDream({ root: temp, dataDir, command: agent });
  assert.equal(outcome.status, "failed");
  const report = JSON.parse(fs.readFileSync(path.join(dataDir, "dreams", outcome.file), "utf8"));
  assert.match(report.error, /Credit balance is too low/);
  assert.ok(fs.existsSync(report.log), "the report names a log that exists");
  const state = JSON.parse(fs.readFileSync(path.join(dataDir, "state.json"), "utf8"));
  assert.equal(state.dream_running, false);
  assert.equal(state.last_dream_status, "failed");
}

console.log("runner tests passed");
