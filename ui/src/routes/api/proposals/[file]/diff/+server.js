import { guardAsync } from "$lib/server/respond.js";
import { skillDiff } from "$lib/server/skills.js";

export const GET = ({ params }) => guardAsync(() => skillDiff(params.file));
