import { json } from "@sveltejs/kit";
import { guard } from "$lib/server/respond.js";
import { listDreams, startDream } from "$lib/server/dreams.js";
import { startJob } from "$lib/server/jobs.js";

export const GET = () => guard(() => ({ dreams: listDreams() }));

export const POST = () => {
  const started = startJob("dream", { title: "Background review" }, (context) => startDream(context));
  if (started.error) return json({ ok: false, error: started.error, running: started.running }, { status: started.status });
  return json({ ok: true, job: started.job });
};
