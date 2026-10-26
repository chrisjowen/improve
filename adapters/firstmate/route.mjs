import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { readJson, writeJsonAtomic } from "../../scripts/lib.mjs";
import { readScopeFiles } from "../../scripts/proposal-check.mjs";
import { redact } from "../../scripts/redact.mjs";
import { deliveryFor } from "./surfaces.mjs";

/**
 * File each proposal as a Firstmate captain-held task, and read the captain's
 * answers back.
 *
 * Firstmate already has the one place a captain call lives: an ordinary
 * backlog task held for the captain through `bin/fm-captain-hold.sh hold`,
 * which Wheelhouse shows as a decision. Routing uses that path and nothing
 * else. It never closes, answers, or releases a task; the captain answers
 * through Firstmate's own channels, which record the captain's words in the task.
 * Reading those words back does not apply anything either: `/improve apply`
 * still revalidates and asks, as invariant 5 requires.
 *
 * Every command is an argv array run without a shell. `dryRun` prints the
 * commands and runs none, writes no ledger, and touches nothing.
 */

const DELIVERY_TEXT = {
  "local-apply": "If approved, /improve apply edits the captain-private file(s) locally.",
  "upstream-pr": "If approved, the change goes upstream as a Firstmate pull request; nothing is edited in place."
};

function topScalar(text, key) {
  const lines = text.split("\n");
  const at = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (at === -1) return undefined;
  const value = lines[at].slice(key.length + 1).trim();
  if (value === ">" || value === ">-" || value === "|" || value === "|-") {
    const parts = [];
    for (const line of lines.slice(at + 1)) {
      if (/^\S/.test(line)) break;
      if (line.trim()) parts.push(line.trim());
    }
    return parts.join(" ");
  }
  return value.replace(/^["']|["']$/g, "");
}

/** Proposal files under `.harness/proposals/`, read without a YAML parser. */
export function readProposals(root) {
  const dir = path.join(root, ".harness", "proposals");
  let entries = [];
  try {
    entries = fs.readdirSync(dir).filter((name) => /\.ya?ml$/i.test(name)).sort();
  } catch {
    return [];
  }
  return entries.map((name) => {
    const text = fs.readFileSync(path.join(dir, name), "utf8");
    return {
      file: name,
      id: topScalar(text, "id") ?? name.replace(/\.ya?ml$/i, ""),
      title: topScalar(text, "title") ?? name,
      status: topScalar(text, "status") ?? "draft",
      files: readScopeFiles(text),
      digest: crypto.createHash("sha256").update(text).digest("hex")
    };
  });
}

/** A privacy-safe Firstmate task id: `[A-Za-z0-9._-]`, one per proposal. */
export function taskIdFor(proposalId) {
  const slug = String(proposalId).toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return `improve-${slug}`.slice(0, 80).replace(/-+$/, "");
}

function oneLine(text, limit) {
  const value = String(text).replace(/\s+/g, " ").trim();
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

function ledgerFile(root) {
  return path.join(root, ".harness", "firstmate", "routed.json");
}

export function readLedger(root) {
  const value = readJson(ledgerFile(root), {});
  return value && typeof value === "object" && value.proposals ? value : { schema_version: 1, proposals: {} };
}

/**
 * What routing would do, without doing it. Only `proposed` proposals are
 * filed: a draft is not ready for the captain, and approved, rejected, or
 * finished proposals already have a decision.
 */
export function planRouting(root, detection) {
  if (!detection?.detected) return { ok: false, error: "no Firstmate home detected", entries: [] };
  if (!detection.enabled) {
    return { ok: false, error: "the Firstmate adapter is not enabled in .harness/improve.json", entries: [] };
  }
  if (!detection.config.route_reviews) return { ok: false, error: "route_reviews is false", entries: [] };
  if (!detection.code_root) {
    return { ok: false, error: "bin/fm-captain-hold.sh not found in the home or project root", entries: [] };
  }
  const tasksAxi = path.join(detection.code_root, "bin", "fm-tasks-axi.sh");
  const captainHold = path.join(detection.code_root, "bin", "fm-captain-hold.sh");
  const env = { FM_HOME: detection.home };
  const ledger = readLedger(root);

  const entries = readProposals(root).map((proposal) => {
    const base = { proposal: proposal.id, file: proposal.file, title: proposal.title, task_id: taskIdFor(proposal.id) };
    if (proposal.status !== "proposed") {
      return { ...base, action: "skip", why: `status is ${proposal.status}, not proposed` };
    }
    const scope = deliveryFor(proposal.files);
    if (scope.delivery === "refuse" || scope.delivery === "split") {
      return { ...base, action: "skip", why: `proposal ${scope.reason}`, delivery: scope.delivery };
    }
    const previous = ledger.proposals[proposal.file];
    if (previous && previous.digest === proposal.digest && previous.task_id === base.task_id) {
      return { ...base, action: "skip", why: `already filed as ${previous.task_id}`, delivery: scope.delivery };
    }
    const reason = [
      `Approve, reject, or defer improve proposal ${proposal.id}: ${oneLine(proposal.title, 160)}`,
      `Changes: ${scope.surfaces.join(", ")} (${scope.visibility}): ${scope.files.map((f) => f.file).join(", ")}`,
      DELIVERY_TEXT[scope.delivery],
      `Proposal: .harness/proposals/${proposal.file}`
    ].join("\n");
    return {
      ...base,
      action: "hold",
      delivery: scope.delivery,
      visibility: scope.visibility,
      surfaces: scope.surfaces,
      digest: proposal.digest,
      commands: [
        { purpose: "check", argv: [tasksAxi, "show", base.task_id, "--full"], env },
        {
          purpose: "hold",
          argv: [
            captainHold, "hold", base.task_id,
            "--title", oneLine(`Improve: ${proposal.title}`, 120),
            "--reason", reason,
            "--repo", detection.config.repo
          ],
          env
        }
      ]
    };
  });
  return { ok: true, entries };
}

/** A command as a reader would paste it into a shell. */
export function displayCommand({ argv, env }) {
  const quote = (value) => (/^[A-Za-z0-9._\/=:-]+$/.test(value) ? value : `'${String(value).replaceAll("'", "'\\''")}'`);
  const prefix = Object.entries(env ?? {}).map(([key, value]) => `${key}=${quote(value)}`);
  return [...prefix, ...argv.map(quote)].join(" ");
}

function runCommand({ argv, env }, runner) {
  const result = runner(argv[0], argv.slice(1), {
    encoding: "utf8",
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 60_000
  });
  return {
    status: typeof result.status === "number" ? result.status : 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? (result.error ? String(result.error.message) : "")
  };
}

/** The `state:` field of a tasks-axi show, or undefined. */
export function showField(output, field) {
  const match = String(output).match(new RegExp(`^\\s*${field}:\\s*(.+?)\\s*$`, "m"));
  if (!match) return undefined;
  const value = match[1];
  if (value.startsWith("\"")) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

/**
 * Every `Captain decision:` answer recorded in a tasks-axi show, newest first:
 * `fm-captain-hold.sh answer` puts each new resolution above the older ones.
 */
function captainDecisions(output) {
  const body = showField(output, "body");
  const text = typeof body === "string" ? body : String(output);
  return [...text.matchAll(/Captain decision:\s*([\s\S]*?)(?:\n\s*\n|$)/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

/**
 * Run the plan, or print it. Returns one result per entry. Live mode records
 * each filed task in `.harness/firstmate/routed.json` so a second review does
 * not re-file an unchanged proposal.
 */
export function executeRouting(root, plan, { dryRun = true, runner = spawnSync, log = () => {} } = {}) {
  const results = [];
  const ledger = readLedger(root);
  for (const entry of plan.entries) {
    if (entry.action !== "hold") {
      log(`skip ${entry.file}: ${entry.why}`);
      results.push({ ...entry, outcome: "skipped" });
      continue;
    }
    if (dryRun) {
      for (const command of entry.commands) log(`would run: ${displayCommand(command)}`);
      results.push({ ...entry, outcome: "dry-run" });
      continue;
    }
    const [check, hold] = entry.commands;
    const shown = runCommand(check, runner);
    if (shown.status === 0 && showField(shown.stdout, "state") === "done") {
      log(`skip ${entry.file}: task ${entry.task_id} is already closed`);
      results.push({ ...entry, outcome: "already-closed" });
      continue;
    }
    // `hold` refuses a --title that differs from an existing task's, and a
    // proposal edited after filing may have a new title. Re-hold by id alone.
    const exists = shown.status === 0;
    const argv = exists
      ? hold.argv.filter((value, index, all) => value !== "--title" && all[index - 1] !== "--title")
      : hold.argv;
    const held = runCommand({ ...hold, argv }, runner);
    if (held.status !== 0) {
      log(`failed ${entry.file}: ${redact(held.stderr.trim()).text.slice(0, 300)}`);
      results.push({ ...entry, outcome: "failed", exit: held.status });
      continue;
    }
    ledger.proposals[entry.file] = {
      proposal: entry.proposal,
      task_id: entry.task_id,
      delivery: entry.delivery,
      digest: entry.digest,
      // Answers already in the task belong to an earlier version of the proposal.
      decisions_before_filing: exists ? captainDecisions(shown.stdout).length : 0,
      routed_at: new Date().toISOString()
    };
    log(`held ${entry.file} as Firstmate task ${entry.task_id}`);
    results.push({ ...entry, outcome: "held" });
  }
  if (!dryRun && results.some((result) => result.outcome === "held")) {
    writeJsonAtomic(ledgerFile(root), ledger);
  }
  return results;
}

/**
 * The captain's recorded words for each filed proposal.
 *
 * `fm-captain-hold.sh answer` writes them under a `Captain decision:` label in
 * the task body. This returns them for the agent to read; it does not decide
 * what they mean. Only explicit approval of that proposal id, read by the
 * agent and confirmed in `/improve apply`, approves anything.
 */
export function readDecisions(root, detection, { dryRun = true, runner = spawnSync, log = () => {} } = {}) {
  if (!detection?.detected || !detection.enabled || !detection.code_root) {
    return { ok: false, error: "the Firstmate adapter is not enabled or has no bin/ scripts", decisions: [] };
  }
  const tasksAxi = path.join(detection.code_root, "bin", "fm-tasks-axi.sh");
  const env = { FM_HOME: detection.home };
  const decisions = [];
  const current = new Map(readProposals(root).map((proposal) => [proposal.file, proposal.digest]));
  for (const [file, record] of Object.entries(readLedger(root).proposals)) {
    const command = { argv: [tasksAxi, "show", record.task_id, "--full"], env };
    if (dryRun) {
      log(`would run: ${displayCommand(command)}`);
      decisions.push({ file, ...record, outcome: "dry-run" });
      continue;
    }
    const shown = runCommand(command, runner);
    if (shown.status !== 0) {
      decisions.push({ file, ...record, outcome: "unreadable", exit: shown.status });
      continue;
    }
    // The oldest `decisions_before_filing` answers belong to an earlier version.
    const answers = captainDecisions(shown.stdout);
    const said = answers.slice(0, answers.length - (record.decisions_before_filing ?? 0))[0] ?? null;
    decisions.push({
      file,
      ...record,
      outcome: "read",
      state: showField(shown.stdout, "state") ?? null,
      held: showField(shown.stdout, "held") ?? null,
      proposal_changed_since_filing: current.get(file) !== record.digest,
      captain_decision: said ? redact(said).text.slice(0, 2000) : null
    });
  }
  return { ok: true, decisions };
}
