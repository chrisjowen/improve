import { guard } from "$lib/server/respond.js";
import { readLog } from "$lib/server/jobs.js";

export const GET = ({ params }) => guard(() => {
  const log = readLog(params.id);
  if (!log) throw new Error(`no such job: ${params.id}`);
  return log;
});
