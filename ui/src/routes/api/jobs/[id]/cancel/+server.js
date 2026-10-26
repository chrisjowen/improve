import { guardAsync } from "$lib/server/respond.js";
import { cancelJob } from "$lib/server/jobs.js";

export const POST = ({ params }) => guardAsync(() => cancelJob(params.id));
