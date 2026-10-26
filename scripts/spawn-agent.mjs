import { formatDuration, lastMeaningfulLine, runProcess } from "./run-process.mjs";

/**
 * Tools a background agent must never hold.
 *
 * The previous dream worker restricted itself with prose in the prompt, which
 * is a request to a language model rather than a boundary. A background job
 * that can edit the repository is the exact anti-pattern the harness model
 * warns about, so denial is passed as flags the CLI enforces.
 */
/**
 * @typedef {object} AgentProgress
 * @property {number} turns
 * @property {number} tools
 * @property {string | null} last_tool
 * @property {string} message
 */

/**
 * @typedef {object} RunAgentOptions
 * @property {string} [command]
 * @property {string} prompt
 * @property {string} [cwd]
 * @property {number} [timeoutMs]
 * @property {string[]} [extraArgs]
 * @property {boolean} [allowEdits]
 * @property {AbortSignal} [signal]
 * @property {string} [logFile]
 * @property {(progress: AgentProgress) => void} [onProgress]
 */

/**
 * @typedef {object} AgentMeta
 * @property {number | null} cost_usd
 * @property {number | null} duration_ms
 * @property {number | null} turns
 */

/**
 * The outcome of an agent run. `payload` is the agent's parsed JSON answer.
 *
 * @typedef {object} AgentResult
 * @property {boolean} ok
 * @property {string} [error]
 * @property {any} [payload]
 * @property {string} [raw]
 * @property {string} [stderr]
 * @property {boolean} [cancelled]
 * @property {boolean} [timedOut]
 * @property {AgentMeta} [envelope]
 * @property {AgentProgress} [progress]
 */

export const DENIED_TOOLS = ["Edit", "Write", "NotebookEdit", "MultiEdit"];

/**
 * Run a Claude Code agent and return its parsed JSON result.
 *
 * Read-only by default: the caller writes any file the agent's output implies,
 * so a draft cannot become an applied change without passing back through
 * here. `allowEdits` is for applying a proposal a person approved and
 * confirmed file by file; the caller checks afterwards that only those files
 * changed.
 *
 * Output is streamed so a long run can report what it is doing, and every line
 * goes to `logFile` when one is given. `onProgress` receives
 * `{ turns, tools, last_tool, message }` as the agent works.
 *
 * @param {RunAgentOptions} options
 * @returns {Promise<AgentResult>}
 */
export async function runAgent({
  command = "claude",
  prompt,
  cwd,
  timeoutMs = 600_000,
  extraArgs = [],
  allowEdits = false,
  signal,
  logFile,
  onProgress
}) {
  const args = [
    "-p", prompt,
    "--output-format", "stream-json",
    "--verbose",
    ...extraArgs,
    ...(allowEdits
      ? ["--permission-mode", "acceptEdits"]
      // Variadic, so it goes last: anything after it would be read as a tool name.
      : ["--disallowed-tools", ...DENIED_TOOLS])
  ];

  /** @type {AgentProgress} */
  const progress = { turns: 0, tools: 0, last_tool: null, message: "Starting the agent" };
  /** @param {string} message */
  const report = (message) => {
    progress.message = message;
    onProgress?.({ ...progress });
  };
  report("Starting the agent");

  const result = await runProcess(command, args, {
    cwd,
    // Both markers: every hook in this plugin skips its own children, so a
    // draft or dream does not count as the human's session or corrections.
    env: { ...process.env, IMPROVE_AGENT_CHILD: "1", IMPROVE_DREAM_CHILD: "1" },
    timeoutMs,
    signal,
    logFile,
    formatStdoutLog: describeEvent,
    onStdoutLine: (line) => {
      const event = parseLine(line);
      if (!event) return;
      if (event.type === "system" && event.subtype === "init") report("Agent started; reading the repository");
      if (event.type === "assistant") {
        progress.turns += 1;
        for (const block of event.message?.content ?? []) {
          if (block?.type === "tool_use") {
            progress.tools += 1;
            progress.last_tool = block.name ?? null;
            report(`Using ${block.name}${describeInput(block.input)}`);
          } else if (block?.type === "text") {
            report("Writing its answer");
          }
        }
      }
    }
  });

  if (result.spawnError) {
    return {
      ok: false,
      error: result.spawnError.code === "ENOENT"
        ? `The agent command "${command}" was not found. Install Claude Code or set IMPROVE_AGENT_COMMAND.`
        : `The agent could not start: ${result.spawnError.message}`,
      progress
    };
  }
  if (result.cancelled) return { ok: false, cancelled: true, error: "Cancelled.", progress };
  if (result.timedOut) {
    return {
      ok: false,
      timedOut: true,
      error: `The agent did not finish within ${formatDuration(timeoutMs)} and was stopped.`,
      progress
    };
  }

  const parsed = parseAgentOutput(result.stdout, result.stderr);
  if (result.code !== 0 && parsed.ok) {
    return { ok: false, error: `The agent exited with code ${result.code}.`, progress };
  }
  if (!parsed.ok && result.code !== 0 && !parsed.envelope) {
    // No envelope at all: the CLI died before it could explain itself.
    const why = lastMeaningfulLine(result.stderr);
    return {
      ok: false,
      error: `The agent exited with code ${result.code}${why ? `: ${why}` : "."}`,
      stderr: result.stderr.slice(-2000),
      progress
    };
  }
  return { ...parsed, progress };
}

/**
 * @param {string} line
 * @returns {any}
 */
function parseLine(line) {
  if (!line.trim().startsWith("{")) return undefined;
  try {
    return JSON.parse(line);
  } catch {
    return undefined;
  }
}

/**
 * One stream event as a log line a person can read. The raw stream repeats
 * whole messages as escaped JSON; the log keeps what the agent did and how it
 * ended, which is what someone reading a failed run needs.
 *
 * @param {string} line
 * @returns {string | null}
 */
export function describeEvent(line) {
  const event = parseLine(line);
  if (!event) return line.trim() ? `out ${line}` : null;
  if (event.type === "system") return event.subtype === "init" ? "agent started" : null;
  if (event.type === "assistant") {
    const parts = (event.message?.content ?? []).flatMap((/** @type {any} */ block) => {
      if (block?.type === "tool_use") return [`agent used ${block.name}${describeInput(block.input)}`];
      if (block?.type === "text" && block.text?.trim()) return [`agent wrote: ${block.text.trim().replace(/\s+/g, " ").slice(0, 400)}`];
      return [];
    });
    return parts.length ? parts.join("\n") : null;
  }
  if (event.type === "result") {
    const cost = typeof event.total_cost_usd === "number" ? `, cost $${event.total_cost_usd.toFixed(2)}` : "";
    return event.is_error
      ? `agent failed (${event.subtype}${event.api_error_status ? `, HTTP ${event.api_error_status}` : ""}): ${String(event.result ?? "").slice(0, 400)}`
      : `agent finished after ${event.num_turns ?? "?"} turns${cost}\nanswer: ${String(event.result ?? "").slice(0, 2000)}`;
  }
  return null;
}

/** @param {any} input */
function describeInput(input) {
  const target = input?.file_path ?? input?.path ?? input?.pattern ?? input?.command;
  if (typeof target !== "string" || !target) return "";
  const short = target.length > 60 ? `${target.slice(0, 57)}…` : target;
  return ` on ${short}`;
}

/**
 * The CLI's final `result` envelope, from either output format.
 *
 * `--output-format json` prints one object; `stream-json` prints one object
 * per line and ends with the result. A failed run still prints the envelope,
 * with `is_error` set and the reason in `result`, which is the only place the
 * reason appears: stderr carries unrelated notices.
 *
 * @param {unknown} stdout
 * @returns {any}
 */
export function findEnvelope(stdout) {
  const text = String(stdout ?? "").trim();
  if (!text) return undefined;
  try {
    const whole = JSON.parse(text);
    if (whole && typeof whole === "object" && !Array.isArray(whole)) return whole;
  } catch {
    // not a single object; try line by line
  }
  const lines = text.split("\n");
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const event = parseLine(lines[index]);
    if (event?.type === "result") return event;
  }
  return undefined;
}

/**
 * The envelope's `result` is the assistant's text. That text is expected to
 * contain the JSON we asked for, possibly inside a fenced block.
 *
 * @param {unknown} stdout
 * @param {unknown} [stderr]
 * @returns {AgentResult}
 */
export function parseAgentOutput(stdout, stderr = "") {
  const envelope = findEnvelope(stdout);
  if (!envelope) {
    return { ok: false, error: "The agent printed no result.", raw: String(stdout ?? "").slice(0, 2000), stderr: String(stderr).slice(-2000) };
  }
  const meta = { cost_usd: envelope.total_cost_usd ?? null, duration_ms: envelope.duration_ms ?? null, turns: envelope.num_turns ?? null };

  if (envelope.is_error === true || (typeof envelope.subtype === "string" && envelope.subtype !== "success")) {
    return { ok: false, error: agentFailure(envelope), envelope: meta };
  }

  const text = typeof envelope.result === "string" ? envelope.result : JSON.stringify(envelope);
  const payload = extractJson(text);
  if (payload === undefined) {
    return { ok: false, error: "The agent answered, but not with the JSON it was asked for.", raw: text.slice(0, 2000), envelope: meta };
  }
  return { ok: true, payload, envelope: meta };
}

/**
 * @param {any} envelope
 * @returns {string}
 */
function agentFailure(envelope) {
  const reason = typeof envelope.result === "string" && envelope.result.trim()
    ? envelope.result.trim().slice(0, 300)
    : null;
  if (envelope.api_error_status === 401) {
    return `The agent could not sign in: ${reason ?? "authentication failed"}. If ANTHROPIC_API_KEY is set in the environment that started the UI, it takes precedence over your Claude login.`;
  }
  if (envelope.subtype === "error_max_turns") return "The agent ran out of turns before it answered.";
  if (envelope.subtype === "error_max_budget_usd") return "The agent hit its spending limit before it answered.";
  return `The agent failed: ${reason ?? envelope.subtype ?? "no reason given"}`;
}

/**
 * @param {unknown} text
 * @returns {any}
 */
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
