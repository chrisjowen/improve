import { json } from "@sveltejs/kit";
import { guardAsync } from "$lib/server/respond.js";
import { applyPlan, startApply } from "$lib/server/apply-run.js";
import { hasLaunchToken } from "$lib/server/launch.js";

/** What Apply would change, for the confirm step. */
export const GET = ({ params }) => guardAsync(() => applyPlan(params.file));

/**
 * Start the apply run. The body echoes what the person confirmed: the
 * proposal digest, the files, and for an upstream change the branch.
 */
export const POST = async ({ params, request }) => {
  if (!hasLaunchToken(request)) {
    return json({ ok: false, error: "This request does not carry this launch's token. Reload the page and confirm again." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  return guardAsync(() => startApply(params.file, {
    digest: body.digest,
    files: body.files,
    branch: body.branch
  }));
};
