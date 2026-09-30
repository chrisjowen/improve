import { guard } from "$lib/server/respond.js";
import { listObjectives } from "$lib/server/results.js";

export const GET = () => guard(() => ({ objectives: listObjectives() }));
