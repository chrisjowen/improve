import { spawn } from "node:child_process";

/**
 * Tools a background agent must never hold.
 *
 * The previous dream worker restricted itself with prose in the prompt, which
 * is a request to a language model rather than a boundary. A background job
 * that can edit the repository is the exact anti-pattern the harness model
 * warns about, so denial is passed as flags the CLI enforces.
 */
export const DENIED_TOOLS = ["Edit", "Write", "NotebookEdit", "MultiEdit"];

/**
 * Run a read-only Claude Code agent and return its parsed JSON result.
 *
 * The caller writes any file the agent's output implies. The agent itself
 * never gets write tools, so a draft cannot become an applied change without
 * passing back through here.
 */
export function runAgent({ command = "claude", prompt, cwd, timeoutMs = 600_000, extraArgs = [] }) {
  const args = [
    "-p", prompt,
    "--output-format", "json",
    "--disallowed-tools", ...DENIED_TOOLS,
    ...extraArgs
  ];

  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(command, args, {
        cwd,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, IMPROVE_AGENT_CHILD: "1" },
        windowsHide: true
      });
    } catch (error) {
      resolve({ ok: false, error: `spawn failed: ${error.message}` });
      return;
    }

    let stdout = "";
    let stderr = "";
    let settled = false;
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      resolve({ ok: false, error: `agent timed out after ${timeoutMs}ms`, stderr: stderr.slice(-2000) });
    }, timeoutMs);

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ok: false, error: `agent unavailable: ${error.message}` });
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (code !== 0) {
        resolve({ ok: false, error: `agent exited ${code}`, stderr: stderr.slice(-2000) });
        return;
      }
      resolve(parseAgentOutput(stdout, stderr));
    });
  });
}

/**
 * `--output-format json` wraps the reply in an envelope whose `result` is the
 * assistant's text. That text is expected to contain the JSON we asked for,
 * possibly inside a fenced block.
 */
export function parseAgentOutput(stdout, stderr = "") {
  let envelope;
  try {
    envelope = JSON.parse(stdout);
  } catch {
    return { ok: false, error: "agent output was not JSON", raw: stdout.slice(0, 2000), stderr: stderr.slice(-2000) };
  }
  const text = typeof envelope.result === "string" ? envelope.result : JSON.stringify(envelope);
  const payload = extractJson(text);
  if (payload === undefined) {
    return { ok: false, error: "agent returned no JSON object", raw: text.slice(0, 2000) };
  }
  return { ok: true, payload, envelope: { cost_usd: envelope.total_cost_usd, duration_ms: envelope.duration_ms } };
}

export function extractJson(text) {
  if (typeof text !== "string") return undefined;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [];
  if (fenced) candidates.push(fenced[1]);
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) candidates.push(text.slice(first, last + 1));
  candidates.push(text);
  for (const candidate of candidates) {
    try {
      const value = JSON.parse(candidate.trim());
      if (value && typeof value === "object") return value;
    } catch {
      // try the next shape
    }
  }
  return undefined;
}
