import fs from "node:fs";
import path from "node:path";
import { contain, ensureDir, projectRoot, readTextSafe } from "./paths.js";
import { digestOf, writeAtomic } from "./write.js";

/**
 * Provenance and usage for applied skills.
 *
 * The record lives beside the skill rather than inside SKILL.md: the body is
 * loaded into a session's context, so metadata in it would be instruction the
 * model has to read past.
 *
 * Provenance exists so the plugin never destroys work it did not author. An
 * unmarked SKILL.md is assumed to be a human's and is refused.
 */
const SIDECAR = ".improve.json";

export function skillsRoot() {
  return path.join(projectRoot(), ".claude", "skills");
}

export function archiveRoot() {
  return path.join(skillsRoot(), ".archive");
}

function sidecarPath(name) {
  return contain(skillsRoot(), name, SIDECAR);
}

export function readSidecar(name) {
  const text = readTextSafe(sidecarPath(name));
  if (text === undefined) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function isPluginAuthored(name) {
  return readSidecar(name)?.created_by === "improve";
}

export function writeSidecar(name, record) {
  const file = sidecarPath(name);
  ensureDir(path.dirname(file));
  writeAtomic(file, `${JSON.stringify(record, null, 2)}\n`);
  return file;
}

export function stampApplied(name, { proposal, digest, draftedAt }) {
  const existing = readSidecar(name);
  const now = new Date().toISOString();
  const record = {
    schema_version: 1,
    created_by: "improve",
    created_at: existing?.created_at ?? now,
    updated_at: now,
    proposal: proposal ?? null,
    digest,
    drafted_at: draftedAt ?? null,
    // Counters are kept apart on purpose: being read is not being followed.
    use: existing?.use ?? 0,
    view: existing?.view ?? 0,
    patch: existing ? (existing.patch ?? 0) + 1 : 0,
    history: [...(existing?.history ?? []), { at: now, digest, proposal: proposal ?? null }].slice(-20)
  };
  writeSidecar(name, record);
  return record;
}

export function bumpCounter(name, counter) {
  if (!["use", "view", "patch"].includes(counter)) {
    throw new Error(`unknown counter: ${counter}`);
  }
  const record = readSidecar(name);
  if (!record) return undefined;
  record[counter] = (record[counter] ?? 0) + 1;
  record.updated_at = new Date().toISOString();
  writeSidecar(name, record);
  return record;
}

/**
 * Copy the current skill directory aside before it is replaced.
 *
 * Nothing is deleted, so a superseded skill can be brought back. The timestamp
 * makes repeated archiving of the same name collision-free.
 */
export function archiveSkill(name) {
  const source = contain(skillsRoot(), name);
  if (!fs.existsSync(source)) return undefined;
  const stamp = new Date().toISOString().replaceAll(":", "-");
  let destination = contain(archiveRoot(), name, stamp);
  let suffix = 1;
  while (fs.existsSync(destination)) {
    destination = contain(archiveRoot(), name, `${stamp}-${suffix}`);
    suffix += 1;
  }
  ensureDir(path.dirname(destination));
  fs.cpSync(source, destination, { recursive: true });
  return path.relative(projectRoot(), destination);
}

export function listArchived(name) {
  const dir = contain(archiveRoot(), name);
  try {
    return fs.readdirSync(dir).sort();
  } catch {
    return [];
  }
}

export { digestOf };
