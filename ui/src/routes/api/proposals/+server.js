import { guard } from "$lib/server/respond.js";
import { listProposals } from "$lib/server/proposals.js";

export const GET = () => guard(() => ({ proposals: listProposals() }));
