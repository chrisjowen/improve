import { guard } from "$lib/server/respond.js";
import { listDreams } from "$lib/server/dreams.js";

export const GET = () => guard(() => ({ dreams: listDreams() }));
