import { guardAsync } from "$lib/server/respond.js";
import { editDiff, writeFiledEdit } from "$lib/server/harness-edit.js";

/** A filed edit's files against what is on disk now, and what it runs. */
export const GET = ({ params }) => guardAsync(() => editDiff(params.file));

/** Approve a filed edit and write it, exactly as reviewed. */
export const POST = async ({ params, request }) => {
  const body = await request.json().catch(() => ({}));
  return guardAsync(() => writeFiledEdit(params.file, { digest: body.digest, rationale: body.rationale, idempotencyKey: body.idempotency_key }));
};
