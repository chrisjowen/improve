import { guardAsync } from "$lib/server/respond.js";
import { applySkill } from "$lib/server/skills.js";

export const POST = async ({ params, request }) => {
  const body = await request.json().catch(() => ({}));
  return guardAsync(() => applySkill(params.file, { rationale: body.rationale }));
};
