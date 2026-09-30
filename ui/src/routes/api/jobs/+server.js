import { guard } from "$lib/server/respond.js";
import { listJobs } from "$lib/server/jobs.js";

export const GET = () => guard(() => ({ jobs: listJobs() }));
