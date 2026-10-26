import fs from "node:fs";
import path from "node:path";
import { contain, projectDataDir, projectRoot, readTextSafe, safeId } from "./paths.js";
import { loadConfig } from "../../../../scripts/lib.mjs";
import { runDream } from "../../../../scripts/dream.mjs";
import { writeProposal } from "./proposals.js";
import { redact } from "../../../../scripts/redact.mjs";
import { checkProposal } from "../../../../scripts/proposal-check.mjs";

/**
 * Findings produced by the background dream worker.
 *
 * These live in the plugin's data directory, not the repository, because a
 * background job may draft a proposal but must never edit the repository.
 * Importing one into `.harness/proposals/` is therefore a human act, performed
 * here rather than by the worker.
 */
function dreamsDir() {
  const dataDir = projectDataDir();
  return dataDir ? path.join(dataDir, "dreams") : undefined;
}

/**
 * Run one background review now, at a person's request.
 *
 * The same read-only agent the SessionEnd hook starts when dreaming is
 * enabled; asking for one from the page is the explicit request that
 * `/improve dream` is. Its findings stay untrusted until imported.
 *
 * @param {{ signal?: AbortSignal, logFile?: string, progress?: (update: { message?: string }) => void }} [options]
 */
export async function startDream({ signal, logFile, progress } = {}) {
  const dataDir = projectDataDir();
  if (!dataDir) {
    return {
      ok: false,
      error: "There is nowhere to keep the findings: no plugin data directory was found.",
      hint: "Start the UI from a machine where the improve plugin is installed, or set CLAUDE_PLUGIN_DATA."
    };
  }
  const config = loadConfig(projectRoot());
  const minutes = Number(config.background_dreaming.timeout_minutes);
  const outcome = await runDream({
    root: projectRoot(),
    dataDir,
    command: process.env.IMPROVE_AGENT_COMMAND || config.background_dreaming.command || "claude",
    timeoutMs: Number.isFinite(minutes) && minutes > 0 ? minutes * 60_000 : undefined,
    signal,
    onProgress: (/** @type {{ message?: string }} */ update) => progress?.({ message: update.message })
  });
  // The dream writes its own log beside its report; point the job's log at it.
  if (logFile && outcome.log) {
    try {
      fs.copyFileSync(outcome.log, logFile);
    } catch {
      // the report still names the original log
    }
  }
  return {
    ok: outcome.ok,
    error: outcome.error,
    cancelled: outcome.status === "cancelled",
    timedOut: outcome.timedOut,
    file: outcome.file,
    findings: outcome.report.findings.length
  };
}

export function listDreams() {
  const dir = dreamsDir();
  if (!dir) return [];
  let entries;
  try {
    entries = fs.readdirSync(dir).filter((name) => name.endsWith(".json")).sort().reverse();
  } catch {
    return [];
  }
  /** @type {any[]} */
  const reports = [];
  for (const name of entries) {
    const text = readTextSafe(path.join(dir, name));
    if (text === undefined) continue;
    let document;
    try {
      document = JSON.parse(text);
    } catch (error) {
      reports.push({ file: name, status: "unreadable", error: String(/** @type {Error} */ (error).message).slice(0, 200), findings: [] });
      continue;
    }
    reports.push({
      file: name,
      produced_at: document.produced_at ?? null,
      status: document.status ?? "unknown",
      error: document.error ?? null,
      cost_usd: document.cost_usd ?? null,
      log: typeof document.log === "string" ? path.basename(document.log) : null,
      findings: (Array.isArray(document.findings) ? document.findings : []).map((/** @type {any} */ finding, /** @type {number} */ index) => ({
        index,
        title: finding.title ?? `finding ${index + 1}`,
        objective: finding.objective ?? null,
        hypothesis: finding.hypothesis ?? null,
        evidence: Array.isArray(finding.evidence) ? finding.evidence : [],
        intervention: finding.intervention ?? null,
        evaluation: finding.evaluation ?? null,
        risks: Array.isArray(finding.risks) ? finding.risks : [],
        // The operating model requires a reviewer to look for reasons to reject,
        // so this is surfaced rather than hidden.
        reasons_to_reject: Array.isArray(finding.reasons_to_reject) ? finding.reasons_to_reject : [],
        // A finding lists no files, so only the writing check applies.
        prose: checkProposal({
          title: finding.title,
          hypothesis: finding.hypothesis,
          intervention: { summary: finding.intervention },
          evidence: finding.evidence,
          risks: finding.risks
        }).prose
      }))
    });
  }
  return reports;
}

/**
 * @param {unknown} value
 * @param {string} fallback
 */
function slug(value, fallback) {
  const cleaned = String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return cleaned.slice(0, 48) || fallback;
}

/**
 * Copy one finding into the review queue as an unapproved draft.
 *
 * Its provenance is recorded so a dream is never mistaken for an authored
 * proposal, and its text is redacted because the worker read the repository.
 *
 * @param {string} file
 * @param {number | string} index
 * @param {{ objectiveId?: string }} [options]
 */
export function importDream(file, index, { objectiveId } = {}) {
  const reports = listDreams();
  const report = reports.find((candidate) => candidate.file === file);
  if (!report) return { ok: false, error: `no such dream report: ${file}` };
  const finding = report.findings[Number(index)];
  if (!finding) return { ok: false, error: `no finding ${index} in ${file}` };

  const stamp = new Date().toISOString();
  const id = `IMP-${stamp.slice(0, 10).replaceAll("-", "")}-${slug(finding.title, "dream")}`;
  const scrub = (/** @type {any} */ value) => (typeof value === "string" ? redact(value).text : value);

  const document = {
    id,
    title: scrub(finding.title),
    // A dream has no approval and is not a proposal until a human promotes it.
    status: "draft",
    owner: null,
    created_at: stamp,
    objective: objectiveId ?? finding.objective ?? null,
    hypothesis: scrub(finding.hypothesis),
    confidence: "low",
    evidence: finding.evidence.map((/** @type {any} */ item) => ({
      source: scrub(item.source ?? "dream"),
      observation: scrub(item.observation ?? JSON.stringify(item))
    })),
    scope: { files: [], systems: [], permissions_changed: false },
    intervention: {
      summary: scrub(finding.intervention),
      alternatives: ["do nothing", "a smaller intervention"]
    },
    evaluation: { baseline: null, candidate: scrub(finding.evaluation), pass_conditions: [], regression_conditions: [] },
    risks: finding.risks.map(scrub),
    reasons_to_reject: finding.reasons_to_reject.map(scrub),
    provenance: {
      kind: "background-dream",
      report: file,
      finding_index: Number(index),
      produced_at: report.produced_at,
      trust: "untrusted: drafted by a background agent, never reviewed"
    },
    approval: { approved_by: null, approved_at: null }
  };

  const name = `${id}.yaml`;
  writeProposal(name, document);
  return { ok: true, proposal: name, id };
}

/**
 * The end of the log a dream report names, for a report that failed.
 * @param {string} file
 */
export function readDreamLog(file) {
  const report = listDreams().find((candidate) => candidate.file === safeId(file));
  if (!report) throw new Error(`no such dream report: ${file}`);
  if (!report.log) return { text: "", missing: true };
  const logs = path.join(/** @type {string} */ (projectDataDir()), "logs");
  const text = readTextSafe(contain(logs, safeId(report.log)));
  if (text === undefined) return { text: "", missing: true };
  return { text: text.length > 65536 ? text.slice(-65536) : text, truncated: text.length > 65536 };
}

/**
 * Discard a report without importing it. The operating model permits this.
 * @param {string} file
 */
export function dismissDream(file) {
  const dir = dreamsDir();
  if (!dir) return { ok: false, error: "no plugin data directory is configured" };
  // Reject a bad name rather than rewriting it with basename: silently
  // reinterpreting a caller's path hides the bug that produced it.
  try {
    safeId(file);
  } catch (error) {
    return { ok: false, error: /** @type {Error} */ (error).message };
  }
  try {
    fs.rmSync(path.join(dir, file), { force: true });
  } catch (error) {
    return { ok: false, error: /** @type {Error} */ (error).message };
  }
  return { ok: true, dismissed: file };
}
