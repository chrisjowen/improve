import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Filesystem writes for applied skills.
 *
 * Validation happens in memory and only a passing draft reaches disk, modelled
 * on validating admission: check in flight, persist on allow. A rejected apply
 * must leave the tree byte-identical, so nothing here creates a directory until
 * every check has passed.
 */

export function digestOf(text) {
  return crypto.createHash("sha256").update(text ?? "", "utf8").digest("hex");
}

/**
 * Resolve the deepest existing ancestor through symlinks and confirm it is still
 * inside `root`.
 *
 * `path.relative` comparisons are lexical, so a symlink planted at
 * `.claude/skills/x` pointing outside the repository passes a textual
 * containment check. Resolving before any write means such a target is refused
 * with zero writes rather than followed.
 */
export function assertRealPathInside(root, target) {
  const realRoot = fs.realpathSync(root);
  let probe = path.resolve(target);
  const unresolved = [];
  for (;;) {
    if (fs.existsSync(probe)) break;
    const parent = path.dirname(probe);
    if (parent === probe) break;
    unresolved.push(path.basename(probe));
    probe = parent;
  }
  const realProbe = fs.realpathSync(probe);
  const relative = path.relative(realRoot, realProbe);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`resolved path escapes ${realRoot}: ${realProbe}`);
  }
  // A symlinked leaf would be followed by writeFileSync, so refuse it outright.
  const leaf = path.resolve(target);
  if (fs.existsSync(leaf) && fs.lstatSync(leaf).isSymbolicLink()) {
    throw new Error(`refusing to write through a symlink: ${leaf}`);
  }
  return path.join(realProbe, ...unresolved.reverse());
}

/** Write via a temporary file and rename, so a reader never sees a partial body. */
export function writeAtomic(file, contents) {
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(temp, contents, { encoding: "utf8", mode: 0o644 });
    fs.renameSync(temp, file);
  } catch (error) {
    try {
      fs.rmSync(temp, { force: true });
    } catch {
      // the original error is the one worth reporting
    }
    throw error;
  }
}

/** Remove temporary files left by an interrupted write. */
export function sweepOrphans(dir) {
  let swept = 0;
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return 0;
  }
  for (const entry of entries) {
    if (!entry.endsWith(".tmp")) continue;
    try {
      fs.rmSync(path.join(dir, entry), { force: true });
      swept += 1;
    } catch {
      // leave it; a sweep failure must not block a write
    }
  }
  return swept;
}
