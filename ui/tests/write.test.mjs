import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { assertRealPathInside, digestOf, sweepOrphans, writeAtomic } from "../src/lib/server/write.js";

const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "improve-write-")));
const outside = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "improve-outside-")));

// A path that does not exist yet still resolves through its existing ancestors.
assert.equal(
  assertRealPathInside(root, path.join(root, "a", "b", "SKILL.md")),
  path.join(root, "a", "b", "SKILL.md")
);

// A lexical containment check passes a symlinked directory; resolving does not.
fs.mkdirSync(path.join(root, ".claude", "skills"), { recursive: true });
fs.symlinkSync(outside, path.join(root, ".claude", "skills", "escaped"));
assert.throws(
  () => assertRealPathInside(root, path.join(root, ".claude", "skills", "escaped", "SKILL.md")),
  /escapes/,
  "a symlinked parent pointing outside the repository must be refused"
);

// A symlinked leaf pointing outside is caught by the escape check.
const decoy = path.join(outside, "target.md");
fs.writeFileSync(decoy, "original\n");
fs.symlinkSync(decoy, path.join(root, "linked.md"));
assert.throws(
  () => assertRealPathInside(root, path.join(root, "linked.md")),
  /escapes|symlink/,
  "a symlinked leaf pointing outside must be refused"
);
assert.equal(fs.readFileSync(decoy, "utf8"), "original\n", "the link target must be untouched");

// A symlink pointing *inside* the repository passes the escape check, so it
// needs the symlink check of its own: writing through it would edit a file the
// caller did not name.
const innocent = path.join(root, "real.md");
fs.writeFileSync(innocent, "real\n");
fs.symlinkSync(innocent, path.join(root, "alias.md"));
assert.throws(
  () => assertRealPathInside(root, path.join(root, "alias.md")),
  /symlink/,
  "a symlink inside the repository must still be refused"
);
assert.equal(fs.readFileSync(innocent, "utf8"), "real\n", "the link target must be untouched");

// Atomic write leaves no partial file and no temporary behind.
const target = path.join(root, "out.md");
writeAtomic(target, "hello\n");
assert.equal(fs.readFileSync(target, "utf8"), "hello\n");
assert.deepEqual(fs.readdirSync(root).filter((f) => f.endsWith(".tmp")), []);

writeAtomic(target, "replaced\n");
assert.equal(fs.readFileSync(target, "utf8"), "replaced\n");

// An interrupted write leaves a .tmp that the sweep removes.
fs.writeFileSync(path.join(root, "orphan.123.tmp"), "junk");
assert.equal(sweepOrphans(root), 1);
assert.deepEqual(fs.readdirSync(root).filter((f) => f.endsWith(".tmp")), []);
assert.equal(sweepOrphans(path.join(root, "nonexistent")), 0, "sweeping a missing directory is not an error");

// The digest is what pins an approval to exact bytes.
assert.equal(digestOf("a"), digestOf("a"));
assert.notEqual(digestOf("a"), digestOf("a "));
assert.equal(digestOf(undefined), digestOf(""));

fs.rmSync(root, { recursive: true, force: true });
fs.rmSync(outside, { recursive: true, force: true });
console.log("write path tests passed");
