import fs from "node:fs";
import path from "node:path";
import { pluginDataDir, projectId, projectRoot, readTextSafe, safeId } from "./paths.js";
import { writeProposal } from "./proposals.js";
import { redact } from "../../../../scripts/redact.mjs";

/**
 * Findings produced by the background dream worker.
 *
 * These live in the plugin's data directory, not the repository, because a
 * background job may draft a proposal but must never edit the repository.
 * Importing one into `.harness/proposals/` is therefore a human act, performed
 * here rather than by the worker.
 */
function dreamsDir() {
  const dataDir = pluginDataDir();
  if (!dataDir) return undefined;
  return path.join(dataDir, "projects", projectId(projectRoot()), "dreams");
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
  const reports = [];
  for (const name of entries) {
    const text = readTextSafe(path.join(dir, name));
    if (text === undefined) continue;
    let document;
    try {
      document = JSON.parse(text);
    } catch (error) {
      reports.push({ file: name, status: "unreadable", error: String(error.message).slice(0, 200), findings: [] });
      continue;
    }
    reports.push({
      file: name,
      produced_at: document.produced_at ?? null,
      status: document.status ?? "unknown",
      error: document.error ?? null,
      cost_usd: document.cost_usd ?? null,
      findings: (Array.isArray(document.findings) ? document.findings : []).map((finding, index) => ({
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
        reasons_to_reject: Array.isArray(finding.reasons_to_reject) ? finding.reasons_to_reject : []
      }))
    });
  }
  return reports;
}

function slug(value, fallback) {
  const cleaned = String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return cleaned.slice(0, 48) || fallback;
}

/**
 * Copy one finding into the review queue as an unapproved draft.
 *
 * Its provenance is recorded so a dream is never mistaken for an authored
 * proposal, and its text is redacted because the worker read the repository.
 */
export function importDream(file, index, { objectiveId } = {}) {
  const reports = listDreams();
  const report = reports.find((candidate) => candidate.file === file);
  if (!report) return { ok: false, error: `no such dream report: ${file}` };
  const finding = report.findings[Number(index)];
  if (!finding) return { ok: false, error: `no finding ${index} in ${file}` };

  const stamp = new Date().toISOString();
  const id = `IMP-${stamp.slice(0, 10).replaceAll("-", "")}-${slug(finding.title, "dream")}`;
  const scrub = (value) => (typeof value === "string" ? redact(value).text : value);

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
    evidence: finding.evidence.map((item) => ({
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

/** Discard a report without importing it. The operating model permits this. */
export function dismissDream(file) {
  const dir = dreamsDir();
  if (!dir) return { ok: false, error: "no plugin data directory is configured" };
  // Reject a bad name rather than rewriting it with basename: silently
  // reinterpreting a caller's path hides the bug that produced it.
  try {
    safeId(file);
  } catch (error) {
    return { ok: false, error: error.message };
  }
  try {
    fs.rmSync(path.join(dir, file), { force: true });
  } catch (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, dismissed: file };
}
