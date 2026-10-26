import { json } from "@sveltejs/kit";
import { projectRoot } from "$lib/server/paths.js";

/** What the launcher polls to know the server is up, and for which repository. */
export const GET = () => json({ ok: true, project: projectRoot(), pid: process.pid });
