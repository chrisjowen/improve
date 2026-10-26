import { guard } from "$lib/server/respond.js";
import { listDecisions } from "$lib/server/proposals.js";

export const GET = ({ url }) => guard(() => ({
  decisions: listDecisions({ file: url.searchParams.get("proposal") ?? undefined })
}));
