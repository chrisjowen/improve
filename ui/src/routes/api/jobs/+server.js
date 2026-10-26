import { guard } from "$lib/server/respond.js";
import { listJobs } from "$lib/server/jobs.js";

export const GET = ({ url }) => guard(() => ({
  jobs: listJobs({ kind: url.searchParams.get("kind") ?? undefined })
}));
