import { guard } from "$lib/server/respond.js";
import { readEvaluators } from "$lib/server/harness-edit.js";

/** The checks a new eval can use: the rig's registry, read as data. */
export const GET = () => guard(() => ({ evaluators: readEvaluators() }));
