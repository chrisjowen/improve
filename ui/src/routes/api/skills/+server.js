import { guard } from "$lib/server/respond.js";
import { listAppliedSkills } from "$lib/server/provenance.js";

export const GET = () => guard(() => ({ skills: listAppliedSkills() }));
