import { guard } from "$lib/server/respond.js";
import { evalRig, readEvaluators } from "$lib/server/harness-edit.js";

/** The checks a new eval can use: the rig's registry, read as data, and whether the rig enforces declared commands. */
export const GET = () => guard(() => ({ evaluators: readEvaluators(), rig: evalRig() }));
