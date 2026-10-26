import { guard } from "$lib/server/respond.js";
import { readChanges } from "$lib/server/jobs.js";

export const GET = ({ params }) => guard(() => {
  const changes = readChanges(params.id);
  if (!changes) throw new Error(`no such job: ${params.id}`);
  return changes;
});
