import { json } from "@sveltejs/kit";
import { guardAsync } from "$lib/server/respond.js";
import { declareCommands } from "$lib/server/apply-run.js";
import { hasLaunchToken } from "$lib/server/launch.js";

/**
 * Add the commands the last apply run stopped for to the proposal's
 * evaluation.commands, and send it back for approval. They widen what a later
 * run may do, so the request carries this launch's token, as Apply does. The
 * body echoes the proposal digest and the exact commands the person saw.
 */
export const POST = async ({ params, request }) => {
  if (!hasLaunchToken(request)) {
    return json({ ok: false, error: "This request does not carry this launch's token. Reload the page and try again." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  return guardAsync(() => declareCommands(params.file, { digest: body.digest, commands: body.commands }));
};
