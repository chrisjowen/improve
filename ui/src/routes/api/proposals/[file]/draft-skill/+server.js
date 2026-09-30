import { json } from "@sveltejs/kit";
import { startJob } from "$lib/server/jobs.js";
import { draftSkill } from "$lib/server/skills.js";

export const POST = ({ params }) => {
  const { job, error, status } = startJob("draft-skill", { proposal: params.file }, () => draftSkill(params.file));
  if (error) return json({ ok: false, error }, { status });
  return json({ ok: true, job });
};
