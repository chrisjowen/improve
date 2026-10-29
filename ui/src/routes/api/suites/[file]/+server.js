import { guardAsync } from "$lib/server/respond.js";
import { readSuite } from "$lib/server/harness-edit.js";

export const GET = ({ params }) => guardAsync(() => readSuite(params.file));
