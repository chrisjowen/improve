import { guardAsync } from "$lib/server/respond.js";
import { importDream } from "$lib/server/dreams.js";

export const POST = async ({ params, request }) => {
  const body = await request.json().catch(() => ({}));
  return guardAsync(() => importDream(params.file, body.index, { objectiveId: body.objective }));
};
