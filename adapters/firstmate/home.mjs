import fs from "node:fs";
import path from "node:path";
import { readJson } from "../../scripts/lib.mjs";

/**
 * Where a Firstmate home is, and whether this repository opted in to studying it.
 *
 * Firstmate is an orchestration harness: a supervisor session, worker
 * sessions, an always-loaded `AGENTS.md` contract, skills, `bin/` scripts, and
 * a private home of `data/`, `state/` and `config/`. The adapter only runs when
 * such a home is detected AND `.harness/improve.json` enables it, so a
 * repository that merely mentions Firstmate never has its files read.
 *
 * No top-level I/O, so the UI and tests can import it.
 */

export const DEFAULTS = Object.freeze({
  enabled: false,
  // Absolute or project-relative. Unset means FM_HOME, then the project root.
  home: null,
  // `repo` recorded on each captain-held task the review files.
  repo: "firstmate",
  route_reviews: true,
  periodic_review: Object.freeze({
    enabled: false,
    every_tasks: 20,
    every_days: 7
  })
});

/** The first heading or opening lines of AGENTS.md name Firstmate. */
const DECLARES_FIRSTMATE = /^#\s+Firstmate\b|supervisor contract for primary firstmates/im;

export function declaresFirstmate(dir) {
  let text;
  try {
    const fd = fs.openSync(path.join(dir, "AGENTS.md"), "r");
    try {
      const buffer = Buffer.alloc(2048);
      const read = fs.readSync(fd, buffer, 0, buffer.length, 0);
      text = buffer.subarray(0, read).toString("utf8");
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return false;
  }
  return DECLARES_FIRSTMATE.test(text);
}

function isDir(candidate) {
  try {
    return fs.statSync(candidate).isDirectory();
  } catch {
    return false;
  }
}

/** A home holds Firstmate records: at least one of data/, state/, config/. */
function looksLikeHome(dir) {
  return ["data", "state", "config"].some((name) => isDir(path.join(dir, name)));
}

/** The directory whose bin/ carries Firstmate's own scripts, if any. */
function findCodeRoot(...candidates) {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(path.join(candidate, "bin", "fm-captain-hold.sh"))) {
      return candidate;
    }
  }
  return null;
}

export function adapterConfig(root) {
  const repoConfig = readJson(path.join(root, ".harness", "improve.json"), {});
  const configured = repoConfig?.adapters?.firstmate ?? {};
  return {
    ...DEFAULTS,
    ...configured,
    enabled: configured.enabled === true,
    periodic_review: {
      ...DEFAULTS.periodic_review,
      ...(configured.periodic_review ?? {}),
      enabled: configured.periodic_review?.enabled === true
    }
  };
}

/**
 * `{detected, enabled, home, code_root, via, config}`.
 *
 * Detection order: the configured `home`, then `FM_HOME`, then the project
 * root when its AGENTS.md declares Firstmate. FM_HOME counts on its own because
 * Firstmate sets it for secondmate homes, whose AGENTS.md lives in the code
 * root rather than the home. `code_root` is where `bin/fm-captain-hold.sh`
 * lives; review routing needs it and is unavailable without it.
 */
export function detectFirstmate(root, { env = process.env } = {}) {
  const config = adapterConfig(root);
  const absolute = (value) => path.resolve(root, value);
  const candidates = [];
  if (typeof config.home === "string" && config.home.trim()) {
    candidates.push({ dir: absolute(config.home.trim()), via: "config" });
  }
  if (typeof env.FM_HOME === "string" && env.FM_HOME.trim()) {
    candidates.push({ dir: absolute(env.FM_HOME.trim()), via: "FM_HOME" });
  }
  candidates.push({ dir: path.resolve(root), via: "AGENTS.md" });

  for (const { dir, via } of candidates) {
    if (!isDir(dir)) continue;
    const declared = declaresFirstmate(dir);
    if (via === "AGENTS.md" && !declared) continue;
    if (!declared && !looksLikeHome(dir)) continue;
    const codeRoot = findCodeRoot(dir, path.resolve(root));
    return {
      detected: true,
      enabled: config.enabled,
      home: dir,
      code_root: codeRoot,
      via,
      config
    };
  }
  return { detected: false, enabled: false, home: null, code_root: null, via: null, config };
}

/** A path inside the home as the home sees it, never an absolute path. */
export function homeRelative(home, candidate) {
  const relative = path.relative(home, candidate).replaceAll("\\", "/");
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) return "[outside-home]";
  return relative;
}
