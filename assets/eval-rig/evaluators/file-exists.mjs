import { access } from "node:fs/promises";
import { resolve, relative, isAbsolute } from "node:path";

function inside(root, candidate) {
  const rel = relative(root, candidate);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

/** @param {import('../sdk/types.d.ts').EvaluationContext} context */
export async function evaluate(context) {
  const paths = context.step.metadata.paths;
  if (!Array.isArray(paths) || paths.some((value) => typeof value !== "string")) {
    throw new Error("step.metadata.paths must be an array of strings");
  }

  const root = resolve(context.project_root);
  const missing = [];
  for (const path of paths) {
    const target = resolve(root, path);
    if (!inside(root, target)) throw new Error(`path escapes project root: ${path}`);
    try {
      await access(target);
    } catch {
      missing.push(path);
    }
  }

  const score = paths.length === 0 ? 1 : (paths.length - missing.length) / paths.length;
  return {
    success: missing.length === 0,
    score,
    notes: missing.length ? [`Missing: ${missing.join(", ")}`] : ["All configured paths exist."],
    metadata: { checked: paths.length, missing },
    evidence: missing.map((path) => ({ kind: "file", path, message: "File is missing" })),
  };
}
