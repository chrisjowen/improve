#!/usr/bin/env node
// A stand-in for `claude -p` in an apply run. It reads the confirmed files
// from the prompt, edits them in its working directory, and prints the
// stream-json events and result envelope the CLI would.
//
// IMPROVE_STANDIN picks the outcome: pass (default), fail-eval, stray, refuse,
// needs (stops naming each IMPROVE_STANDIN_NEEDS command, one per
// line, the prompt does not allow, and passes once all are), edit-eval (also writes IMPROVE_STANDIN_TOUCH, which any mode
// that edits writes when it is set; by default
// .harness/evals/suite.yaml), or slow. A proposal can pick its own with "[stand-in: <mode>]" in its text,
// so one demo shows several outcomes. IMPROVE_STANDIN_DELAY_MS spaces the
// events out so progress shows.
// IMPROVE_STANDIN_ARGS_FILE records the arguments it was given, and
// IMPROVE_STANDIN_SEEN_FILE the files under .harness/ it can see, with modes.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const prompt = args[args.indexOf("-p") + 1] ?? "";
const mode = /\[stand-in: ([a-z-]+)\]/.exec(prompt)?.[1] || process.env.IMPROVE_STANDIN || "pass";
const delay = Number(process.env.IMPROVE_STANDIN_DELAY_MS) || 0;
if (process.env.IMPROVE_STANDIN_ARGS_FILE) fs.writeFileSync(process.env.IMPROVE_STANDIN_ARGS_FILE, JSON.stringify(args));
if (process.env.IMPROVE_STANDIN_SEEN_FILE) {
  const seen = fs.existsSync(".harness")
    ? fs.readdirSync(".harness", { recursive: true })
      .map((f) => path.join(".harness", f))
      .filter((f) => fs.statSync(f).isFile())
      .map((f) => ({ path: f.split(path.sep).join("/"), mode: fs.statSync(f).mode & 0o777 }))
      .sort((a, b) => a.path.localeCompare(b.path))
    : [];
  fs.writeFileSync(process.env.IMPROVE_STANDIN_SEEN_FILE, JSON.stringify(seen));
}

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

const allowed = [];
for (const line of listed.slice(listed.findIndex((l) => l.includes("the only commands you may run")) + 1)) {
  const match = /^ {2}- (.+)$/.exec(line);
  if (!match) break;
  allowed.push(match[1]);
}
const missing = mode === "needs"
  ? (process.env.IMPROVE_STANDIN_NEEDS ?? "").split("\n").filter((c) => c && !allowed.includes(c))
  : [];

let answer;
if (missing.length) {
  answer = { applied: false, reason: "the evaluation runs scripts this run does not allow", undeclared_commands: missing };
} else if (mode === "refuse") {
  answer = { applied: false, reason: "the file already contains this rule" };
} else {
  for (const file of files) {
    tool("Edit", { file_path: file });
    fs.mkdirSync(path.dirname(file) || ".", { recursive: true });
    fs.appendFileSync(file, "- Run the formatter before you commit.\n");
    await sleep(delay);
  }
  if (mode === "stray") fs.writeFileSync("stray.txt", "not confirmed\n");
  if (mode === "edit-eval" || process.env.IMPROVE_STANDIN_TOUCH) {
    const touch = process.env.IMPROVE_STANDIN_TOUCH || ".harness/evals/suite.yaml";
    fs.mkdirSync(path.dirname(touch), { recursive: true });
    fs.appendFileSync(touch, "threshold: 0\n");
  }
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
