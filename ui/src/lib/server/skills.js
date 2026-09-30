import fs from "node:fs";
import path from "node:path";
import { contain, ensureDir, projectRoot, readTextSafe, safeId } from "./paths.js";
import { pluginRoot } from "./paths.js";
import { runAgent } from "../../../../scripts/spawn-agent.mjs";
import { recordDecision, readProposal, updateStatus } from "./proposals.js";

function skillsRoot() {
  return path.join(projectRoot(), ".claude", "skills");
}

/** Where a drafted skill would land. Kebab-case, one directory per skill. */
export function skillPath(name) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    throw new Error(`skill name must be kebab-case: ${name}`);
  }
  return contain(skillsRoot(), name, "SKILL.md");
}

const DRAFT_INSTRUCTIONS = `You are drafting a Claude Code skill from an approved improvement proposal.

Return ONLY a JSON object with these keys:
  "name": kebab-case skill name
  "description": one sentence stating exactly when the skill applies, including exclusions
  "body": the full SKILL.md contents as Markdown, including YAML frontmatter with name and description

The skill must:
  - have a narrow trigger and explicit exclusions
  - encode non-obvious procedure specific to this repository, not generic advice
  - state prerequisites, tools, outputs, failure handling, and verification
  - be something whose effect could be checked by an evaluation

You have read-only access. Do not attempt to write files. Inspect the repository
to ground the procedure in what is actually here.`;

/**
 * Ask a background agent to draft a skill for a proposal.
 *
 * The agent holds no write tools, so the draft comes back as data and is stored
 * on the proposal. Nothing reaches .claude/skills until a human applies it.
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

  updateStatus(file, proposal.status === "draft" ? "draft" : proposal.status, {
    skill_draft: {
      name,
      description: description ?? null,
      body,
      drafted_at: new Date().toISOString(),
      cost_usd: result.envelope?.cost_usd ?? null
    }
  });
  return { ok: true, draft: { name, description, body } };
}

/** Current file contents versus the draft, for review before applying. */
export function skillDiff(file) {
  const proposal = readProposal(file);
  if (!proposal) return { ok: false, error: `no such proposal: ${file}` };
  const draft = proposal.skill_draft;
  if (!draft) return { ok: false, error: "no draft on this proposal" };

  const target = skillPath(draft.name);
  const existing = readTextSafe(target);
  return {
    ok: true,
    name: draft.name,
    target: path.relative(projectRoot(), target),
    exists: existing !== undefined,
    current: existing ?? "",
    proposed: draft.body
  };
}

/**
 * Write the drafted skill and record the decision.
 *
 * This is the only path that mutates the repository, and it runs from an
 * explicit request rather than from the agent that produced the draft.
 */
export function applySkill(file, { rationale } = {}) {
  const proposal = readProposal(file);
  if (!proposal) return { ok: false, error: `no such proposal: ${file}` };
  const draft = proposal.skill_draft;
  if (!draft) return { ok: false, error: "no draft on this proposal" };

  const target = skillPath(draft.name);
  ensureDir(path.dirname(target));
  fs.writeFileSync(target, draft.body.endsWith("\n") ? draft.body : `${draft.body}\n`, "utf8");
  const relative = path.relative(projectRoot(), target);

  const decision = recordDecision(proposal, {
    decision: "approved",
    rationale: rationale ?? null,
    applied_files: [relative]
  });
  updateStatus(file, "validated", {
    approval: { approved_by: "ui", approved_at: new Date().toISOString() }
  });
  return { ok: true, written: relative, decision };
}

export function rejectProposal(file, { rationale } = {}) {
  const proposal = readProposal(file);
  if (!proposal) return { ok: false, error: `no such proposal: ${file}` };
  const decision = recordDecision(proposal, { decision: "rejected", rationale: rationale ?? null });
  updateStatus(file, "rejected");
  return { ok: true, decision };
}
