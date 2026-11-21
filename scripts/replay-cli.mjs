#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { loadConfig, observationDir, projectRoot, readJson, resolvePluginDataDir } from "./lib.mjs";
import { exportSuite } from "./replay-cases.mjs";
import { claimRegressionLock, measureAll, measureOutcome, regress, regressionDue, replayConfig, replayStatus, resolveProposal, scoreProposal } from "./replay.mjs";

const USAGE = `usage: replay-cli.mjs <command> [arguments] [repository]

  export [repo]            build the replay suite in .harness/evals/replay/ from
                           the confirmed correction groups (review-cli cluster)
                           and tool failures that recurred
      --refresh            rebuild cases that already exist (their split stays)
      --min-failure-sessions <n>
                           a tool failure needs this many sessions (default 2)
  score <proposal> [repo]  replay A/B: the proposal's candidate against the
                           validation split, WITH and WITHOUT, the acceptance
                           gate, then the sealed test split once if it passes;
                           writes the proposal's replay block
  regress [repo]           re-run the validation split for every kept change;
                           drafts a rollback proposal for one that now loses
  outcome <proposal>|--all [repo]
                           fill a kept change's outcome block from sessions
                           since it landed
  status [repo]            the suite, the last regression check, and whether
                           one is due

Every eval run is capped by replay.max_cost_usd (regression checks by
replay.regression.max_cost_usd) from .harness/improve.json.
`;

/** @param {string[]} argv */
export function parseArgs(argv) {
  const options = { command: argv[0], positional: /** @type {string[]} */ ([]), refresh: false, all: false, minFailureSessions: 2 };
  const rest = argv.slice(1);
  while (rest.length) {
    const arg = /** @type {string} */ (rest.shift());
    if (arg === "--refresh") options.refresh = true;
    else if (arg === "--all") options.all = true;
    else if (arg === "--min-failure-sessions") options.minFailureSessions = Number(rest.shift());
    else if (arg.startsWith("--")) throw new Error(`unknown argument: ${arg}`);
    else options.positional.push(arg);
  }
  return options;
}

/** @param {string} root */
function dataDirFor(root) {
  const data = resolvePluginDataDir(root);
  return data ? observationDir(data.dir, root) : undefined;
}

/** @param {string} file */
function readJsonl(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return [];
  }
  return text.split("\n").filter((line) => line.trim()).flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
}

/** @param {unknown} value */
const print = (value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${/** @type {Error} */ (error).message}\n${USAGE}`);
    return 2;
  }
  const needsProposal = options.command === "score" || (options.command === "outcome" && !options.all);
  const [first, second] = options.positional;
  const ref = needsProposal ? first : undefined;
  const root = projectRoot({ cwd: needsProposal ? second : first });
  const dataDir = dataDirFor(root);

  switch (options.command) {
    case "export": {
      if (!dataDir) {
        process.stderr.write("No observations were found for this repository: the plugin's hooks have recorded nothing here yet.\n");
        return 1;
      }
      const clusters = readJson(path.join(dataDir, "clusters.json"), null);
      if (!clusters) {
        process.stderr.write("No confirmed correction groups yet: run review-cli.mjs cluster first.\n");
        return 1;
      }
      const report = exportSuite({
        root,
        clusters: Array.isArray(clusters.clusters) ? clusters.clusters : [],
        events: readJsonl(path.join(dataDir, "events.jsonl")),
        minFailureSessions: options.minFailureSessions,
        refresh: options.refresh,
        grants: loadConfig(root).replay.allow_tools
      });
      print(report);
      return 0;
    }
    case "score": {
      const file = ref && resolveProposal(root, ref);
      if (!file) {
        process.stderr.write(`No proposal ${ref ?? ""} in ${path.join(root, ".harness", "proposals")}.\n${USAGE}`);
        return 2;
      }
      const result = await scoreProposal({ root, file, dataDir, onLine: (line) => process.stderr.write(`${line}\n`) });
      print(result);
      return result.gate.verdict === "pass" ? 0 : 1;
    }
    case "regress": {
      if (dataDir) {
        const minutes = Number(replayConfig(root).regression.min_interval_minutes) || 0;
        if (!claimRegressionLock(dataDir, Date.now(), minutes)) {
          process.stderr.write("A regression check is already running or ran recently.\n");
          return 1;
        }
      }
      const result = await regress({ root, dataDir, trigger: "manual", onLine: (line) => process.stderr.write(`${line}\n`) });
      print(result);
      return 0;
    }
    case "outcome": {
      if (!dataDir) {
        process.stderr.write("No observations were found for this repository, so there is nothing to measure an outcome from.\n");
        return 1;
      }
      if (options.all) {
        print(measureAll({ root, dataDir }));
        return 0;
      }
      const file = ref && resolveProposal(root, ref);
      if (!file) {
        process.stderr.write(`No proposal ${ref ?? ""} in ${path.join(root, ".harness", "proposals")}.\n${USAGE}`);
        return 2;
      }
      print(measureOutcome({ root, dataDir, file }));
      return 0;
    }
    case "status": {
      print({ ...replayStatus(root), regression_due: regressionDue(root, dataDir) });
      return 0;
    }
    default:
      process.stderr.write(USAGE);
      return 2;
  }
}

// Run as a command, not when a test imports it.
if (process.argv[1]?.endsWith("replay-cli.mjs")) {
  process.exitCode = await main();
}
