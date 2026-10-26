import { guardAsync } from "$lib/server/respond.js";
import { approveProposal } from "$lib/server/skills.js";

export const POST = async ({ params, request }) => {
  const body = await request.json().catch(() => ({}));
  return guardAsync(() => approveProposal(params.file, {
    rationale: body.rationale,
    idempotencyKey: body.idempotency_key
  }));
};
