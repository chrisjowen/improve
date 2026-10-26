import { guard } from "$lib/server/respond.js";
import { listTranscripts } from "$lib/server/status.js";

export const GET = () => guard(() => ({ transcripts: listTranscripts() }));
