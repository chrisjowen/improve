#!/usr/bin/env node
// A stand-in for `claude -p` in an apply run. It reads the confirmed files
// from the prompt, edits them in its working directory, and prints the
// stream-json events and result envelope the CLI would.
//
// IMPROVE_STANDIN picks the outcome: pass (default), fail-eval, stray, refuse,
// or slow. A proposal can pick its own with "[stand-in: <mode>]" in its text,
// so one demo shows several outcomes. IMPROVE_STANDIN_DELAY_MS spaces the
// events out so progress shows.
// IMPROVE_STANDIN_ARGS_FILE records the arguments it was given.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const prompt = args[args.indexOf("-p") + 1] ?? "";
const mode = /\[stand-in: ([a-z-]+)\]/.exec(prompt)?.[1] || process.env.IMPROVE_STANDIN || "pass";
const delay = Number(process.env.IMPROVE_STANDIN_DELAY_MS) || 0;
if (process.env.IMPROVE_STANDIN_ARGS_FILE) fs.writeFileSync(process.env.IMPROVE_STANDIN_ARGS_FILE, JSON.stringify(args));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const emit = (event) => process.stdout.write(`${JSON.stringify(event)}\n`);
const tool = (name, input) => emit({ type: "assistant", message: { content: [{ type: "tool_use", name, input }] } });

const listed = prompt.split("\n");
const start = listed.findIndex((line) => line.includes("exactly these files may change"));
const files = [];
for (const line of listed.slice(start + 1)) {
  const match = /^ {2}- (.+)$/.exec(line);
  if (!match) break;
  files.push(match[1]);
}

emit({ type: "system", subtype: "init" });
await sleep(delay);
tool("Read", { file_path: ".harness/proposals" });
await sleep(delay);

if (mode === "slow") await sleep(60_000);

let answer;
if (mode === "refuse") {
  answer = { applied: false, reason: "the file already contains this rule" };
} else {
  for (const file of files) {
    tool("Edit", { file_path: file });
    fs.mkdirSync(path.dirname(file) || ".", { recursive: true });
    fs.appendFileSync(file, "- Run the formatter before you commit.\n");
    await sleep(delay);
  }
  if (mode === "stray") fs.writeFileSync("stray.txt", "not confirmed\n");
  tool("Bash", { command: "node .harness/evals/check.mjs" });
  await sleep(delay);
  const passed = mode !== "fail-eval";
  answer = {
    applied: true,
    evaluation: {
      passed,
      summary: passed ? "The formatter rule is present and the check passes." : "The check still finds unformatted commits.",
      checks: [{ name: "rule present", passed: true, detail: "found in every confirmed file" }, { name: "formatter check", passed, detail: passed ? "0 findings" : "2 findings" }]
    }
  };
}
emit({ type: "assistant", message: { content: [{ type: "text", text: "Done." }] } });
emit({ type: "result", subtype: "success", is_error: false, num_turns: 4, total_cost_usd: 0.01, result: "```json\n" + JSON.stringify(answer) + "\n```" });
