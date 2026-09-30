import { guard } from "$lib/server/respond.js";
import { readStatus } from "$lib/server/status.js";

export const GET = () => guard(() => readStatus());
