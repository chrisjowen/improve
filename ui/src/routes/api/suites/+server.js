import { guard, guardAsync } from "$lib/server/respond.js";
import { listSuites } from "$lib/server/results.js";
import { fileSuiteEdit } from "$lib/server/harness-edit.js";

export const GET = () => guard(() => ({ suites: listSuites() }));

/** Preview an eval's edit (or a new eval), or file it as a proposal when the body names the reviewed digest. */
export const POST = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  return guardAsync(() => fileSuiteEdit({ file: body.file ?? null, suite: body.suite, digest: body.digest, reason: body.reason }));
};
