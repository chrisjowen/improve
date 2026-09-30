import fs from "node:fs";
import path from "node:path";
import { guard } from "$lib/server/respond.js";
import { harnessDir, pluginRoot, projectRoot, readTextSafe } from "$lib/server/paths.js";

function version(file) {
  return readTextSafe(file)?.trim() || null;
}

export const GET = () => guard(() => {
  const root = projectRoot();
  const installed = version(path.join(harnessDir(), "evals", "VERSION"));
  const available = version(path.join(pluginRoot(), "assets", "eval-rig", "VERSION"));
  return {
    project: root,
    harness_initialized: fs.existsSync(harnessDir()),
    eval_rig: {
      installed,
      available,
      drifted: Boolean(installed && available && installed !== available)
    }
  };
});
