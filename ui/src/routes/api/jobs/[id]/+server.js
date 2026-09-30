import { guard } from "$lib/server/respond.js";
import { getJob } from "$lib/server/jobs.js";

export const GET = ({ params }) => guard(() => {
  const job = getJob(params.id);
  if (!job) throw new Error(`no such job: ${params.id}`);
  return { job };
});
