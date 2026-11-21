import { json } from "@sveltejs/kit";
import { requestReplay } from "$lib/server/replay.js";

export const POST = ({ params }) => {
  const { status = 200, ...body } = requestReplay(params.file);
  return json(body, { status });
};
