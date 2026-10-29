import { embed } from "$lib/server/launch.js";

/** This launch's token, for a program on this computer; see lib/server/launch.js. */
export const GET = ({ request }) => embed(request);
