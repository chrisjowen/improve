import { guard, guardAsync } from "$lib/server/respond.js";
import { listObjectives } from "$lib/server/results.js";
import { saveObjective } from "$lib/server/harness-edit.js";

export const GET = () => guard(() => ({ objectives: listObjectives() }));

/** Preview an objective's edit, or write it when the body names the digest of the reviewed change. */
export const POST = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  return guardAsync(() => saveObjective({ id: body.id, create: Boolean(body.create), fields: body.fields, digest: body.digest }));
};
