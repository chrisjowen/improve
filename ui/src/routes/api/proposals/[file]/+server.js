import { json } from "@sveltejs/kit";
import { guard } from "$lib/server/respond.js";
import { readProposal } from "$lib/server/proposals.js";

export const GET = ({ params }) => guard(() => {
  const proposal = readProposal(params.file);
  if (!proposal) throw new Error(`no such proposal: ${params.file}`);
  return { proposal };
});
