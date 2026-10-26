#!/usr/bin/env node
import path from "node:path";
import { appendJsonl, ensureDir, projectDataDir, writeJsonAtomic } from "../../scripts/lib.mjs";
import { detectFirstmate } from "./home.mjs";
import { importEvidence } from "./import.mjs";
import { inventory } from "./inventory.mjs";
import { executeRouting, planRouting, readDecisions } from "./route.mjs";
import { markReviewed, periodicDueReasons } from "./schedule.mjs";

const USAGE = `usage: cli.mjs <command> [--project <dir>] [options]

Commands (all read-only unless noted):
  detect                 whether a Firstmate home is present and the adapter is enabled
  import [--save]        Firstmate home records as sanitized improve observations;
                         --save also writes them to the plugin data directory
  inventory              sizes of AGENTS.md, skills, scripts, and private home files
  route [--apply]        file each proposed proposal as a captain-held Firstmate task;
                         dry-run by default, --apply runs the home's scripts
  decisions [--apply]    read the captain's recorded answers for filed proposals;
                         dry-run by default, --apply runs fm-tasks-axi.sh show
  due                    exit 0 and print reasons when a periodic review is due, else exit 1
  reviewed               record that a review ran (writes .harness/firstmate/review-state.json)

--project defaults to CLAUDE_PROJECT_DIR, then the working directory.
`;

const args = process.argv.slice(2);
const command = args[0];
const flag = (name) => args.includes(name);
const option = (name) => {
  const at = args.indexOf(name);
  return at !== -1 ? args[at + 1] : undefined;
};
const root = path.resolve(option("--project") ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
const print = (value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
const log = (line) => process.stderr.write(`${line}\n`);

function requireEnabled(detection) {
  if (!detection.detected) {
    log("No Firstmate home detected (FM_HOME, adapters.firstmate.home, or an AGENTS.md declaring Firstmate).");
    process.exit(3);
  }
  if (!detection.enabled) {
    log("A Firstmate home is present but the adapter is off. Set adapters.firstmate.enabled to true in .harness/improve.json.");
    process.exit(3);
  }
}

const detection = detectFirstmate(root);

switch (command) {
  case "detect": {
    print({
      detected: detection.detected,
      enabled: detection.enabled,
      via: detection.via,
      home: detection.home,
      code_root: detection.code_root,
      route_reviews: detection.config.route_reviews,
      periodic_review: detection.config.periodic_review
    });
    break;
  }
  case "import": {
    requireEnabled(detection);
    const observations = importEvidence(detection.home);
    if (flag("--save")) {
      const dir = path.join(projectDataDir(root), "firstmate");
      ensureDir(dir);
      writeJsonAtomic(path.join(dir, "observations.json"), observations);
      appendJsonl(path.join(dir, "imports.jsonl"), { imported_at: observations.imported_at, counts: observations.counts });
      log(`saved to ${path.join(dir, "observations.json")}`);
    }
    print(observations);
    break;
  }
  case "inventory": {
    requireEnabled(detection);
    print(inventory({ home: detection.home, codeRoot: detection.code_root }));
    break;
  }
  case "route": {
    requireEnabled(detection);
    const plan = planRouting(root, detection);
    if (!plan.ok) {
      log(plan.error);
      process.exit(3);
    }
    const dryRun = !flag("--apply");
    if (dryRun) log("dry run: printing the commands, running none (pass --apply to run them)");
    const results = executeRouting(root, plan, { dryRun, log });
    print(results.map(({ commands, digest, ...rest }) => rest));
    if (results.some((result) => result.outcome === "failed")) process.exitCode = 1;
    break;
  }
  case "decisions": {
    requireEnabled(detection);
    const dryRun = !flag("--apply");
    const result = readDecisions(root, detection, { dryRun, log });
    if (!result.ok) {
      log(result.error);
      process.exit(3);
    }
    print(result.decisions);
    break;
  }
  case "due": {
    const reasons = periodicDueReasons(root, detection);
    print({ due: reasons.length > 0, reasons });
    process.exitCode = reasons.length > 0 ? 0 : 1;
    break;
  }
  case "reviewed": {
    requireEnabled(detection);
    print(markReviewed(root));
    break;
  }
  default: {
    process.stderr.write(USAGE);
    process.exit(command === "--help" || command === "help" ? 0 : 2);
  }
}
