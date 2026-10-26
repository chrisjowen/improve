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
  const started = startJob(
    "evaluate",
    { title: `Evaluate ${body.suite.replace(/\.ya?ml$/i, "")}`, detail: { suite: body.suite, base: body.base ?? null, head: body.head ?? null, transcript: body.transcript ?? null } },
    (context) => runEvaluation({
      suiteFile: body.suite,
      transcript: body.transcript,
      base: body.base,
      head: body.head,
      includeContent: Boolean(body.include_content),
      includePatch: Boolean(body.include_patch),
      ...context
    })
  );
  if (started.error) return json({ ok: false, error: started.error, running: started.running }, { status: started.status });
  return json({ ok: true, job: started.job });
};
