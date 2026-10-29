import { guardAsync } from "$lib/server/respond.js";
import { fileObjectiveDeletion } from "$lib/server/harness-edit.js";

/** Preview deleting an objective and its evals, or file it as a proposal when the body names the reviewed digest. */
export const POST = async ({ params, request }) => {
  const body = await request.json().catch(() => ({}));
  return guardAsync(() => fileObjectiveDeletion({ id: params.id, digest: body.digest, reason: body.reason }));
};
