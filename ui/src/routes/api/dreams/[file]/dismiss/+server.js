import { guardAsync } from "$lib/server/respond.js";
import { dismissDream } from "$lib/server/dreams.js";

export const POST = ({ params }) => guardAsync(() => dismissDream(params.file));
