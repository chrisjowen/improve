import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { contain, ensureDir, harnessDir, readDirSafe, readTextSafe, safeId } from "./paths.js";

const PROPOSAL_STATUSES = new Set([
  "draft", "proposed", "approved", "applying", "validated", "rejected", "rolled-back"
]);

function proposalsDir() {
  return path.join(harnessDir(), "proposals");
}

function decisionsDir() {
  return path.join(harnessDir(), "decisions");
}

/**
 * Proposals are authored by a /improve session or drafted by a background
 * agent, so treat every field as untrusted and absent by default.
 */
function normalize(id, document, source) {
  const value = document && typeof document === "object" ? document : {};
  const status = PROPOSAL_STATUSES.has(value.status) ? value.status : "draft";
  return {
    id: typeof value.id === "string" ? value.id : id,
    file: id,
    title: typeof value.title === "string" ? value.title : id,
    status,
    owner: value.owner ?? null,
    objective: value.objective ?? null,
    objective_id: typeof value.objective_id === "string" ? value.objective_id : null,
    hypothesis: value.hypothesis ?? null,
    confidence: value.confidence ?? null,
    created_at: value.created_at ?? null,
    review_by: value.review_by ?? null,
    evidence: Array.isArray(value.evidence) ? value.evidence : [],
    scope: value.scope ?? null,
    intervention: value.intervention ?? null,
    evaluation: value.evaluation ?? null,
    risks: Array.isArray(value.risks) ? value.risks : [],
    cost: value.cost ?? null,
    rollout: value.rollout ?? null,
    rollback: value.rollback ?? null,
    approval: value.approval ?? null,
    outcome: value.outcome ?? null,
    skill_draft: value.skill_draft ?? null,
    source
  };
}

export function listProposals() {
  const dir = proposalsDir();
  const items = [];
  for (const entry of readDirSafe(dir)) {
    if (!entry.isFile() || !/\.(ya?ml)$/i.test(entry.name)) continue;
    const text = readTextSafe(path.join(dir, entry.name));
    if (text === undefined) continue;
    let document;
    try {
      document = YAML.parse(text);
    } catch (error) {
      items.push({
        id: entry.name,
        file: entry.name,
        title: entry.name,
        status: "draft",
        malformed: String(error.message).slice(0, 200),
        evidence: [],
        risks: []
      });
      continue;
    }
    items.push(normalize(entry.name, document, path.join(".harness", "proposals", entry.name)));
  }
  return items.sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
}

export function readProposal(file) {
  const target = contain(proposalsDir(), safeId(file));
  const text = readTextSafe(target);
  if (text === undefined) return undefined;
  try {
    return normalize(file, YAML.parse(text), path.join(".harness", "proposals", file));
  } catch {
    return undefined;
  }
}

export function writeProposal(file, document) {
  const target = contain(proposalsDir(), safeId(file));
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, YAML.stringify(document), { encoding: "utf8", mode: 0o600 });
  return target;
}

/**
 * Record an approval or rejection. A rejection keeps its rationale so the same
 * idea is not rediscovered and re-proposed later.
 */
export function recordDecision(proposal, decision) {
  const stamp = new Date().toISOString();
  const name = `${stamp.replaceAll(":", "-")}-${safeId(proposal.file).replace(/\.ya?ml$/i, "")}.yaml`;
  const target = contain(decisionsDir(), name);
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, YAML.stringify({
    proposal: proposal.id,
    proposal_file: proposal.file,
    title: proposal.title,
    decision: decision.decision,
    rationale: decision.rationale ?? null,
    decided_at: stamp,
    decided_by: decision.decided_by ?? "ui",
    applied_files: decision.applied_files ?? [],
    // Binds the approval to the exact bytes that were reviewed.
    digest: decision.digest ?? null,
    idempotency_key: decision.idempotency_key ?? null,
    archived: decision.archived ?? null
  }), { encoding: "utf8", mode: 0o600 });
  return path.join(".harness", "decisions", name);
}

/**
 * Idempotency keys for decisions.
 *
 * A double-clicked Apply must write one file and one decision. The key maps to
 * the outcome of the first attempt, which is returned unchanged on a replay.
 */
function keyFile() {
  return path.join(decisionsDir(), ".keys.json");
}

function readKeys() {
  const text = readTextSafe(keyFile());
  if (text === undefined) return {};
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

export function lookupKey(key) {
  return readKeys()[String(key)];
}

export function claimKey(key, outcome) {
  const keys = readKeys();
  keys[String(key)] = outcome;
  const file = keyFile();
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(keys, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  return outcome;
}

export function releaseKey(key) {
  const keys = readKeys();
  delete keys[String(key)];
  fs.writeFileSync(keyFile(), `${JSON.stringify(keys, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}

export function updateStatus(file, status, extra = {}) {
  const target = contain(proposalsDir(), safeId(file));
  const text = readTextSafe(target);
  if (text === undefined) throw new Error(`no such proposal: ${file}`);
  const document = YAML.parse(text) ?? {};
  document.status = status;
  Object.assign(document, extra);
  fs.writeFileSync(target, YAML.stringify(document), { encoding: "utf8", mode: 0o600 });
  return normalize(file, document, path.join(".harness", "proposals", file));
}
