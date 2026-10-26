import { json } from "@sveltejs/kit";
import { startJob } from "$lib/server/jobs.js";
import { readProposal } from "$lib/server/proposals.js";
import { draftSkill } from "$lib/server/skills.js";

export const POST = ({ params }) => {
  let proposal;
  try {
    proposal = readProposal(params.file);
  } catch (error) {
    return json({ ok: false, error: error.message }, { status: 400 });
  }
  if (!proposal) return json({ ok: false, error: `no such proposal: ${params.file}` }, { status: 404 });
  const started = startJob(
    "draft-skill",
    { title: `Draft a skill for "${proposal.title}"`, detail: { proposal: params.file } },
    // The draft itself is stored on the proposal; the job keeps a summary.
    (context) => draftSkill(params.file, context).then((result) => (result.ok
      ? { ok: true, skill: result.draft.name, findings: result.findings.length }
      : result))
  );
  if (started.error) return json({ ok: false, error: started.error, running: started.running }, { status: started.status });
  return json({ ok: true, job: started.job });
};
