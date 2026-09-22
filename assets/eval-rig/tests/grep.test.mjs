import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { evaluate } from "../evaluators/grep.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "improve-grep-"));
fs.mkdirSync(path.join(root, "a-directory"));
fs.writeFileSync(path.join(root, "clean.txt"), "nothing to see here\n");
fs.writeFileSync(path.join(root, "conflicted.txt"), "<<<<<<< HEAD\nmine\n");

function context(paths) {
  return {
    project_root: root,
    changes: { files: paths.map((p) => ({ path: p })) },
    step: {
      metadata: {
        paths_from: "changed_files",
        pattern: "^(<<<<<<<|=======|>>>>>>>)",
        regex: true,
        should_match: false
      }
    }
  };
}

// An unreadable path is a tooling problem, not a forbidden-pattern match.
const withDirectory = await evaluate(context(["clean.txt", "a-directory"]));
assert.equal(withDirectory.success, true, "a directory must not fail a content check");
assert.equal(withDirectory.score, 1);
assert.equal(withDirectory.metadata.unreadable, 1);
assert.equal(withDirectory.evidence.filter((e) => e.kind === "error").length, 1);
assert.match(withDirectory.notes.join(" "), /unreadable/);

// A real violation still fails, and is reported as a match rather than an error.
const withViolation = await evaluate(context(["clean.txt", "conflicted.txt"]));
assert.equal(withViolation.success, false);
assert.equal(withViolation.score, 0.5);
assert.equal(withViolation.evidence.filter((e) => e.kind === "match").length, 1);

// Unreadable paths leave the score of the readable ones intact.
const mixed = await evaluate(context(["clean.txt", "conflicted.txt", "a-directory"]));
assert.equal(mixed.score, 0.5, "unreadable paths must not dilute the score");
assert.equal(mixed.metadata.checked, 2);

fs.rmSync(root, { recursive: true, force: true });
console.log("grep evaluator tests passed");
