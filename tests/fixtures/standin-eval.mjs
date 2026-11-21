#!/usr/bin/env node
// A stand-in for `claude plugin eval`: writes the JSON result the real command
// writes, with scores chosen by the test. It records its arguments and what
// the plugin and cases held, so a test can check what replay asked for.
//
//   STANDIN_SCORES  {"<case>": {"with": [1, 1, 1], "without": [0, 0, 0]}}, or
//                   {"*": ...} for every case
//   STANDIN_LOG     a JSONL file each call appends to
//   STANDIN_PARTIAL "1" to report a run the cost ceiling stopped (exit 2)
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const pluginDir = args[2];
const out = args[args.indexOf("--json") + 1];
const evals = path.join(pluginDir, "evals");
const cases = fs.existsSync(evals) ? fs.readdirSync(evals).sort() : [];
const scores = JSON.parse(process.env.STANDIN_SCORES || "{}");

if (process.env.STANDIN_LOG) {
  fs.appendFileSync(process.env.STANDIN_LOG, `${JSON.stringify({
    args,
    cases,
    lesson: fs.existsSync(path.join(pluginDir, "improve-replay", "lesson.md")) ? fs.readFileSync(path.join(pluginDir, "improve-replay", "lesson.md"), "utf8") : null,
    hooks: fs.existsSync(path.join(pluginDir, "hooks", "hooks.json")) ? JSON.parse(fs.readFileSync(path.join(pluginDir, "hooks", "hooks.json"), "utf8")) : null,
    plugin: JSON.parse(fs.readFileSync(path.join(pluginDir, ".claude-plugin", "plugin.json"), "utf8")),
    files: listFiles(pluginDir),
    caseYaml: Object.fromEntries(cases.map((c) => [c, fs.readFileSync(path.join(evals, c, "case.yaml"), "utf8")])),
    env: { IMPROVE_AGENT_CHILD: process.env.IMPROVE_AGENT_CHILD ?? null }
  })}\n`);
}

function listFiles(dir, prefix = "") {
  return fs.readdirSync(path.join(dir, prefix), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(dir, path.join(prefix, e.name)) : [path.join(prefix, e.name)]);
}

const run = (score) => ({ score, passed: score === 1, turns: 1, costUsd: 0.01, error: null, graders: [] });
const result = {
  schemaVersion: 1,
  costUsd: 0.01 * cases.length * 6,
  partial: process.env.STANDIN_PARTIAL === "1",
  suite: { ablation: "with-without" },
  cases: cases.map((name) => {
    const chosen = scores[name] ?? scores["*"] ?? { with: [1, 1, 1], without: [0, 0, 0] };
    return { name, arms: { with: chosen.with.map(run), without: chosen.without.map(run) } };
  })
};
fs.writeFileSync(out, JSON.stringify(result));
process.exit(process.env.STANDIN_PARTIAL === "1" ? 2 : 0);
