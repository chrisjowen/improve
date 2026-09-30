import { guard } from "$lib/server/respond.js";
import { coverage } from "$lib/server/results.js";

export const GET = () => guard(() => coverage());
