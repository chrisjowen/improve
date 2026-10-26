import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { resolvePluginDataDir } from "../../../../scripts/lib.mjs";

/**
 * Repository the UI operates on. IMPROVE_PROJECT_DIR lets the server run from
 * anywhere; otherwise assume the plugin sits inside the repository it serves.
 */
export function projectRoot() {
  const configured = process.env.IMPROVE_PROJECT_DIR || process.env.CLAUDE_PROJECT_DIR;
  return path.resolve(configured || path.resolve(import.meta.dirname, "../../../.."));
}

export function pluginRoot() {
  return path.resolve(process.env.CLAUDE_PLUGIN_ROOT || path.resolve(import.meta.dirname, "../../../.."));
}

export function harnessDir() {
  return path.join(projectRoot(), ".harness");
}

/**
 * Resolve `candidate` inside `root`, refusing anything that escapes it.
 *
 * Every filesystem route funnels through here. The server has no auth by
 * design, so path containment is the only thing standing between a crafted
 * request and the rest of the disk.
 */
export function contain(root, ...candidate) {
  const base = path.resolve(root);
  const target = path.resolve(base, ...candidate);
  const relative = path.relative(base, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`path escapes ${base}: ${path.join(...candidate)}`);
  }
  return target;
}

/** A single path segment, used for ids that become filenames. */
export function safeId(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9._-]+$/.test(value) || value === "." || value === "..") {
    throw new Error(`unsafe id: ${value}`);
  }
  return value;
}

export function readDirSafe(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

export function readTextSafe(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return undefined;
  }
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Where the plugin keeps observations, or undefined.
 *
 * Mirrors scripts/lib.mjs so the UI reads the location the hooks write.
 * CLAUDE_PLUGIN_DATA reaches hook processes only, so a UI started from a skill
 * or a terminal usually lacks it; the directory is then found on disk. Without
 * either, the honest answer is that there is no observation store to read.
 */
export function pluginDataDir() {
  return resolvePluginDataDir(projectRoot())?.dir;
}

/** This project's directory inside the plugin data store, or undefined. */
export function projectDataDir() {
  const base = pluginDataDir();
  return base ? path.join(base, "projects", projectId(projectRoot())) : undefined;
}

export function projectId(root) {
  return crypto.createHash("sha256").update(root).digest("hex").slice(0, 20);
}
