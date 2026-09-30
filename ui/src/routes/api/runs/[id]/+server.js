import { guard } from "$lib/server/respond.js";
import { readReport } from "$lib/server/results.js";

export const GET = ({ params }) => guard(() => {
  const report = readReport(params.id);
  if (!report) throw new Error(`no such run: ${params.id}`);
  return { report };
});
