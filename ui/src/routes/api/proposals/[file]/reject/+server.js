import { guardAsync } from "$lib/server/respond.js";
import { rejectProposal } from "$lib/server/skills.js";

export const POST = async ({ params, request }) => {
  const body = await request.json().catch(() => ({}));
  return guardAsync(() => rejectProposal(params.file, { rationale: body.rationale }));
};
