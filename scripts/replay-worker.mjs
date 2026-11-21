#!/usr/bin/env node
import { measureAll, regress } from "./replay.mjs";
import { updateJson } from "./lib.mjs";
import path from "node:path";

// Started detached by a hook, so nothing reads its output: the regression
// check writes .harness/evals/replay/regression.json, and outcomes are
// written to the proposals.
const [command, root, dataDir, trigger] = process.argv.slice(2);
if (!command || !root || !dataDir) process.exit(2);

try {
  if (command === "regress") await regress({ root, dataDir, trigger: trigger || "config-change" });
  else if (command === "outcome") measureAll({ root, dataDir });
  else process.exitCode = 2;
} catch (error) {
  process.stderr.write(`improve replay worker: ${/** @type {Error} */ (error).message}\n`);
  if (command === "regress") {
    updateJson(path.join(dataDir, "state.json"), (state) => {
      state.replay_regression_running = false;
      state.replay_regression_error = /** @type {Error} */ (error).message;
      return state;
    });
  }
  process.exitCode = 1;
}
