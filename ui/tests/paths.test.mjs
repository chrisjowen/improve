import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { contain, safeId } from "../src/lib/server/paths.js";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "improve-paths-"));

// The server has no auth, so containment is the only boundary on file routes.
assert.equal(contain(root, "a.yaml"), path.join(root, "a.yaml"));
assert.equal(contain(root, "nested/a.yaml"), path.join(root, "nested/a.yaml"));

for (const escape of ["../outside.yaml", "nested/../../outside.yaml", "/etc/passwd", "../../../../etc/passwd"]) {
  assert.throws(() => contain(root, escape), /escapes/, `must refuse ${escape}`);
}

// Ids become filenames, so they may not contain separators or traversal.
assert.equal(safeId("IMP-20260922-thing.yaml"), "IMP-20260922-thing.yaml");
const nul = String.fromCharCode(0);
for (const bad of ["../x", "a/b", ".", "..", "", "a b", "a;rm -rf /", `a${nul}b`]) {
  assert.throws(() => safeId(bad), /unsafe id/, `must refuse ${JSON.stringify(bad)}`);
}

fs.rmSync(root, { recursive: true, force: true });
console.log("path containment tests passed");
