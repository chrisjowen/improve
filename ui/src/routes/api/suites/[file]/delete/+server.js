import { guardAsync } from "$lib/server/respond.js";
import { fileSuiteDeletion } from "$lib/server/harness-edit.js";

/** Preview deleting an eval, or file it as a proposal when the body names the reviewed digest. */
export const POST = async ({ params, request }) => {
  const body = await request.json().catch(() => ({}));
  return guardAsync(() => fileSuiteDeletion({ file: params.file, digest: body.digest, reason: body.reason }));
};
