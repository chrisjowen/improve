import fs from "node:fs";
import path from "node:path";
import { readBlock } from "./proposal-check.mjs";

/**
 * Whether an approved proposal's change has landed.
 *
 * Approval records a decision and changes no file, so "approved" is not
 * "done": six proposals in one home were approved and none was applied. Read
 * without a YAML parser, because hooks import this and the plugin's scripts
 * carry no dependencies.
 */

/**
 * A top-level scalar from proposal YAML text.
 * @param {string} text
 * @param {string} key
 */
function topScalar(text, key) {
  const line = text.split("\n").find((l) => l.startsWith(`${key}:`));
  if (!line) return undefined;
  const value = line.slice(key.length + 1).replace(/\s+#.*$/, "").trim().replace(/^["']|["']$/g, "");
  return value === "" || value === "null" || value === "~" ? undefined : value;
}

/**
 * A scalar directly inside the top-level block `parent`.
 * @param {string} text
 * @param {string} parent
 * @param {string} key
 */
function blockScalar(text, parent, key) {
  const lines = readBlock(text, parent);
  for (const [index, line] of lines.entries()) {
    const match = new RegExp(`^( {1,4})${key}:\\s*(.*?)\\s*$`).exec(line);
    if (!match) continue;
    // A long plain scalar wraps onto more-indented lines.
    const parts = [match[2]];
    for (const next of lines.slice(index + 1)) {
      if (!next.startsWith(`${match[1]} `) || /^\s*[\w.-]+:(\s|$)/.test(next)) break;
      parts.push(next.trim());
    }
    const value = parts.join(" ").trim().replace(/^["']|["']$/g, "");
    return value === "" || value === "null" || value === "~" ? undefined : value;
  }
  return undefined;
}

/**
 * Where an approved proposal's change stands: `applied` when an outcome
 * records it, `prepared` when it waits on a branch for a pull request,
 * `not-applied` otherwise. Undefined for a proposal that is not approved.
 *
 * @param {string} text proposal YAML
 * @returns {{ state: "applied" | "prepared" | "not-applied", lastApply: { status: string | null, error: string | null, at: string | null } } | undefined}
 */
export function landing(text) {
  if (typeof text !== "string" || topScalar(text, "status") !== "approved") return undefined;
  const lastApply = {
    status: blockScalar(text, "last_apply", "status") ?? null,
    error: blockScalar(text, "last_apply", "error") ?? null,
    at: blockScalar(text, "last_apply", "at") ?? null
  };
  if (blockScalar(text, "outcome", "applied_at")) return { state: "applied", lastApply };
  if (readBlock(text, "upstream_change").some((line) => line.trim())) return { state: "prepared", lastApply };
  return { state: "not-applied", lastApply };
}

/**
 * The approved proposals in `root/.harness/proposals/` whose change has not
 * landed, oldest first.
 *
 * @param {string} root
 */
export function approvedNotApplied(root) {
  const dir = path.join(root, ".harness", "proposals");
  let names;
  try {
    names = fs.readdirSync(dir).filter((name) => /\.ya?ml$/i.test(name)).sort();
  } catch {
    return [];
  }
  const pending = [];
  for (const name of names) {
    let text;
    try {
      text = fs.readFileSync(path.join(dir, name), "utf8");
    } catch {
      continue;
    }
    const where = landing(text);
    if (where?.state !== "not-applied") continue;
    pending.push({
      file: name,
      id: topScalar(text, "id") ?? name.replace(/\.ya?ml$/i, ""),
      title: topScalar(text, "title") ?? name,
      last_apply: where.lastApply
    });
  }
  return pending;
}
