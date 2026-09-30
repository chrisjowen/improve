import fs from "node:fs";
import path from "node:path";
import { contain, ensureDir, projectRoot, readTextSafe } from "./paths.js";
import { runAgent } from "../../../../scripts/spawn-agent.mjs";
import { readProposal, recordDecision, updateStatus, claimKey, releaseKey, lookupKey } from "./proposals.js";
import { validateDraft } from "./guard.js";
import { assertRealPathInside, digestOf, sweepOrphans, writeAtomic } from "./write.js";
import { archiveSkill, isPluginAuthored, readSidecar, skillsRoot, stampApplied } from "./provenance.js";

/** Where a drafted skill would land. Kebab-case, one directory per skill. */
export function skillPath(name) {
  if (typeof name !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`skill name must be kebab-case: ${name}`);
  }
  return contain(skillsRoot(), name, "SKILL.md");
}

const DRAFT_INSTRUCTIONS = `You are drafting a Claude Code skill from an improvement proposal.

Return ONLY a JSON object with these keys:
  "name": kebab-case skill name
  "description": one sentence stating exactly WHEN the skill applies, including exclusions
  "body": the full SKILL.md contents as Markdown, including YAML frontmatter with name and description

Requirements, each of which is checked mechanically before the draft can be used:
  - the description must say when to use it, or quote a phrase the user would type
  - no TODO, FIXME, TBD or other placeholder text
  - no absolute paths such as /Users/... or /home/... ; use repository-relative paths
  - encode non-obvious procedure specific to this repository, not generic advice
  - state prerequisites, tools, outputs, failure handling, and verification
  - if the proposal carries evidence, add a "## Guardrails" section whose entries each
    come from a specific piece of that evidence rather than from general good practice

You have read-only access and hold no write tools. Inspect the repository to
ground the procedure in what is actually here.`;

/**
 * Ask a background agent to draft a skill for a proposal.
 *
 * The agent holds no write tools, so the draft returns as data and is stored on
 * the proposal. Nothing reaches .claude/skills until a human applies it, which
 * keeps a background job able to draft but never to change the harness.
 */
export async function draftSkill(file, { command } = {}) {
  const proposal = readProposal(file);
  if (!proposal) return { ok: false, error: `no such proposal: ${file}` };

  const prompt = [
    DRAFT_INSTRUCTIONS,
    "",
    "Proposal:",
    JSON.stringify({
      id: proposal.id,
      title: proposal.title,
      objective: proposal.objective,
      hypothesis: proposal.hypothesis,
      evidence: proposal.evidence,
      intervention: proposal.intervention,
      evaluation: proposal.evaluation
    }, null, 2)
  ].join("\n");

  const result = await runAgent({
    command: command || process.env.IMPROVE_AGENT_COMMAND || "claude",
    prompt,
    cwd: projectRoot()
  });
  if (!result.ok) return result;

  const { name, description, body } = result.payload ?? {};
  if (typeof name !== "string" || typeof body !== "string") {
    return { ok: false, error: "agent draft missing name or body", payload: result.payload };
  }
  try {
    skillPath(name);
  } catch (error) {
    return { ok: false, error: error.message };
  }

  // Validate at draft time so the finding is visible while reviewing, not only
  // when Apply is refused.
  const verdict = validateDraft({
    body,
    name,
    description,
    requireGuardrails: (proposal.evidence ?? []).length > 0
  });

  updateStatus(file, proposal.status, {
    skill_draft: {
      name,
      description: description ?? null,
      body,
      digest: digestOf(body),
      drafted_at: new Date().toISOString(),
      cost_usd: result.envelope?.cost_usd ?? null,
      findings: verdict.findings
    }
  });
  return { ok: true, draft: { name, description, body, digest: digestOf(body) }, findings: verdict.findings };
}

/** Current file contents versus the draft, with the digest that pins an approval. */
export function skillDiff(file) {
  const proposal = readProposal(file);
  if (!proposal) return { ok: false, error: `no such proposal: ${file}` };
  const draft = proposal.skill_draft;
  if (!draft) return { ok: false, error: "no draft on this proposal" };

  const target = skillPath(draft.name);
  const existing = readTextSafe(target);
  const verdict = validateDraft({
    body: draft.body,
    name: draft.name,
    description: draft.description,
    requireGuardrails: (proposal.evidence ?? []).length > 0
  });

  return {
    ok: true,
    name: draft.name,
    target: path.relative(projectRoot(), target),
    exists: existing !== undefined,
    current: existing ?? "",
    proposed: draft.body,
    // Pins the approval to these exact bytes.
    digest: digestOf(draft.body),
    findings: verdict.findings,
    blocked: !verdict.ok,
    plugin_authored: existing === undefined ? null : isPluginAuthored(draft.name),
    sidecar: readSidecar(draft.name) ?? null
  };
}

/**
 * Write the drafted skill.
 *
 * The single place that mutates the repository. Order matters: shape and check
 * everything in memory, resolve the real path, then write. A rejection leaves
 * the filesystem untouched, including creating no directories.
 */
export function applySkill(file, { rationale, digest, idempotencyKey, allowUnmarkedOverwrite = false } = {}) {
  const proposal = readProposal(file);
  if (!proposal) return { ok: false, error: `no such proposal: ${file}` };
  const draft = proposal.skill_draft;
  if (!draft) return { ok: false, error: "no draft on this proposal" };

  // Replaying the same request must not write twice.
  if (idempotencyKey) {
    const previous = lookupKey(idempotencyKey);
    if (previous) return { ok: true, replayed: true, ...previous };
  }

  const actual = digestOf(draft.body);
  if (!digest) {
    return { ok: false, status: 400, error: "digest is required: fetch the diff and apply the body you reviewed" };
  }
  if (digest !== actual) {
    return {
      ok: false,
      status: 409,
      error: "the draft changed since it was reviewed",
      reviewed: digest,
      current: actual
    };
  }

  const verdict = validateDraft({
    body: draft.body,
    name: draft.name,
    description: draft.description,
    requireGuardrails: (proposal.evidence ?? []).length > 0
  });
  if (!verdict.ok) {
    return { ok: false, status: 422, error: "draft failed validation", findings: verdict.findings };
  }

  const target = skillPath(draft.name);
  const alreadyThere = fs.existsSync(target);

  // Never destroy a skill the plugin did not author.
  if (alreadyThere && !isPluginAuthored(draft.name) && !allowUnmarkedOverwrite) {
    return {
      ok: false,
      status: 409,
      error: `${path.relative(projectRoot(), target)} has no improve provenance, so it is assumed to be hand-written. Confirm explicitly to overwrite it.`,
      requires: "allow_unmarked_overwrite"
    };
  }

  let resolved;
  try {
    // Resolve through symlinks before anything is created.
    resolved = assertRealPathInside(projectRoot(), target);
  } catch (error) {
    return { ok: false, status: 400, error: error.message };
  }

  const archived = alreadyThere ? archiveSkill(draft.name) : undefined;

  ensureDir(path.dirname(resolved));
  sweepOrphans(path.dirname(resolved));
  writeAtomic(resolved, draft.body.endsWith("\n") ? draft.body : `${draft.body}\n`);

  const relative = path.relative(projectRoot(), resolved);
  stampApplied(draft.name, {
    proposal: proposal.id,
    digest: actual,
    draftedAt: draft.drafted_at
  });

  const decision = recordDecision(proposal, {
    decision: "approved",
    rationale: rationale ?? null,
    applied_files: [relative],
    digest: actual,
    idempotency_key: idempotencyKey ?? null,
    archived: archived ?? null
  });
  updateStatus(file, "validated", {
    approval: { approved_by: "ui", approved_at: new Date().toISOString(), digest: actual }
  });

  const outcome = { written: relative, decision, digest: actual, archived: archived ?? null };
  if (idempotencyKey) claimKey(idempotencyKey, outcome);
  return { ok: true, ...outcome };
}

export function rejectProposal(file, { rationale, idempotencyKey } = {}) {
  const proposal = readProposal(file);
  if (!proposal) return { ok: false, error: `no such proposal: ${file}` };
  if (idempotencyKey) {
    const previous = lookupKey(idempotencyKey);
    if (previous) return { ok: true, replayed: true, ...previous };
  }
  const decision = recordDecision(proposal, {
    decision: "rejected",
    rationale: rationale ?? null,
    idempotency_key: idempotencyKey ?? null
  });
  updateStatus(file, "rejected");
  const outcome = { decision };
  if (idempotencyKey) claimKey(idempotencyKey, outcome);
  return { ok: true, ...outcome };
}
