import { readFile } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";

function inside(root, candidate) {
  const rel = relative(root, candidate);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

/** @param {import('../sdk/types.d.ts').EvaluationContext} context */
export async function evaluate(context) {
  const cfg = context.step.metadata;
  const paths = cfg.paths_from === "changed_files"
    ? context.changes.files.map((file) => file.path)
    : cfg.paths;
  if (!Array.isArray(paths) || paths.some((value) => typeof value !== "string")) {
    throw new Error("metadata.paths or metadata.paths_from=changed_files is required");
  }
  if (typeof cfg.pattern !== "string") throw new Error("metadata.pattern must be a string");
  const shouldMatch = cfg.should_match !== false;
  const matcher = cfg.regex ? new RegExp(cfg.pattern, cfg.flags ?? "m") : null;
  const root = resolve(context.project_root);
  const violations = [];
  const errors = [];

  for (const path of paths) {
    const target = resolve(root, path);
    if (!inside(root, target)) throw new Error(`path escapes project root: ${path}`);
    let content;
    try {
      content = await readFile(target, "utf8");
    } catch (error) {
      // An unreadable path is a tooling problem, not a content violation. Keep it
      // visible but out of the score, so a directory or a deleted file cannot be
      // reported as a failed pattern check.
      errors.push({ kind: "error", path, message: `Unreadable: ${error.code ?? error.message}` });
      continue;
    }
    const matched = matcher ? matcher.test(content) : content.includes(cfg.pattern);
    if (matched !== shouldMatch) {
      violations.push({
        kind: "match",
        path,
        message: shouldMatch ? "Required pattern not found" : "Forbidden pattern found",
      });
    }
  }

  const readable = paths.length - errors.length;
  const score = readable === 0 ? 1 : (readable - violations.length) / readable;
  const notes = [];
  if (violations.length) notes.push(`${violations.length} file checks failed.`);
  else notes.push("All pattern checks passed.");
  if (errors.length) notes.push(`${errors.length} path(s) were unreadable and were not checked.`);

  return {
    success: violations.length === 0,
    score: Math.max(0, score),
    notes,
    evidence: [...violations, ...errors],
    metadata: { checked: readable, unreadable: errors.length, should_match: shouldMatch },
  };
}
