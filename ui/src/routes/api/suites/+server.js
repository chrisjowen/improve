import { guard } from "$lib/server/respond.js";
import { listSuites } from "$lib/server/results.js";

export const GET = () => guard(() => ({ suites: listSuites() }));
