import { json } from "@sveltejs/kit";
import { guard } from "$lib/server/respond.js";
import { listRuns } from "$lib/server/results.js";
import { startJob } from "$lib/server/jobs.js";
import { runEvaluation } from "$lib/server/evaluate.js";

export const GET = () => guard(() => ({ runs: listRuns() }));

export const POST = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  if (typeof body.suite !== "string") {
    return json({ ok: false, error: "suite is required" }, { status: 400 });
  }
  const { job, error, status } = startJob("evaluate", { suite: body.suite }, () => runEvaluation({
    suiteFile: body.suite,
    transcript: body.transcript,
    base: body.base,
    head: body.head,
    includeContent: Boolean(body.include_content),
    includePatch: Boolean(body.include_patch)
  }));
  if (error) return json({ ok: false, error }, { status });
  return json({ ok: true, job });
};
