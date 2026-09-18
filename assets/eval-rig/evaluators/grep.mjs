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
  const evidence = [];

  for (const path of paths) {
    const target = resolve(root, path);
    if (!inside(root, target)) throw new Error(`path escapes project root: ${path}`);
    let content;
    try {
      content = await readFile(target, "utf8");
    } catch (error) {
      evidence.push({ kind: "file", path, message: `Unreadable: ${error.code ?? error.message}` });
      continue;
    }
    const matched = matcher ? matcher.test(content) : content.includes(cfg.pattern);
    if (matched !== shouldMatch) {
      evidence.push({
        kind: "match",
        path,
        message: shouldMatch ? "Required pattern not found" : "Forbidden pattern found",
      });
    }
  }

  const score = paths.length === 0 ? 1 : (paths.length - evidence.length) / paths.length;
  return {
    success: evidence.length === 0,
    score: Math.max(0, score),
    notes: evidence.length ? [`${evidence.length} file checks failed.`] : ["All pattern checks passed."],
    evidence,
    metadata: { checked: paths.length, should_match: shouldMatch },
  };
}
