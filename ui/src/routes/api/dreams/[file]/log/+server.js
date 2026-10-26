import { guard } from "$lib/server/respond.js";
import { readDreamLog } from "$lib/server/dreams.js";

export const GET = ({ params }) => guard(() => readDreamLog(params.file));
