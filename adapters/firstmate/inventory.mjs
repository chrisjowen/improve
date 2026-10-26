import fs from "node:fs";
import path from "node:path";

/**
 * The Firstmate surfaces an assessment looks at, measured. Read-only.
 *
 * `AGENTS.md` is loaded into every Firstmate session, so its size is a cost
 * paid on every turn of every supervisor and worker. Firstmate records its own
 * budget for always-loaded memory in `config/startup-memory-budget` (estimated
 * tokens); the inventory reports both so an assessment can compare them
 * instead of guessing. Tokens are estimated as bytes / 4, the same rough rule
 * Firstmate's budget uses, and labelled as an estimate.
 */

function size(file) {
  try {
    const text = fs.readFileSync(file, "utf8");
    return {
      lines: text.split("\n").length,
      bytes: Buffer.byteLength(text),
      estimated_tokens: Math.round(Buffer.byteLength(text) / 4)
    };
  } catch {
    return null;
  }
}

function listDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function readBudget(home) {
  try {
    const value = Number(fs.readFileSync(path.join(home, "config", "startup-memory-budget"), "utf8").trim().replace(/,/g, ""));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function skills(dir, prefix) {
  return listDir(dir)
    .filter((entry) => (entry.isDirectory() || entry.isSymbolicLink()) && !entry.name.startsWith("."))
    .map((entry) => {
      const file = path.join(dir, entry.name, "SKILL.md");
      const measured = size(file);
      if (!measured) return undefined;
      let description = "";
      try {
        const head = fs.readFileSync(file, "utf8").slice(0, 4000);
        // Frontmatter descriptions are loaded into context for trigger matching.
        const match = head.match(/^description:\s*(?:>-?\s*\n((?:\s+.+\n)+)|(.+))/m);
        description = (match?.[1] ?? match?.[2] ?? "").replace(/\s+/g, " ").trim();
      } catch {
        description = "";
      }
      return {
        skill: entry.name,
        file: `${prefix}/${entry.name}/SKILL.md`,
        ...measured,
        description_words: description ? description.split(" ").length : 0
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.bytes - a.bytes);
}

/** `codeRoot` holds the tracked material; `home` the private records. */
export function inventory({ home, codeRoot }) {
  const code = codeRoot ?? home;
  const contract = size(path.join(code, "AGENTS.md"));
  const budget = readBudget(home);
  const scripts = listDir(path.join(code, "bin")).filter((entry) => entry.isFile());
  const internal = skills(path.join(code, ".agents", "skills"), ".agents/skills");
  const privateFiles = ["data/captain.md", "data/captain-shared.md", "data/learnings.md", "config/brief-include.md"]
    .map((file) => ({ file, ...(size(path.join(home, file)) ?? { missing: true }) }));

  return {
    schema_version: 1,
    contract: contract
      ? {
          file: "AGENTS.md",
          visibility: "shared-tracked",
          ...contract,
          startup_memory_budget_tokens: budget,
          share_of_budget: budget ? Number((contract.estimated_tokens / budget).toFixed(2)) : null
        }
      : null,
    skills: {
      visibility: "shared-tracked",
      count: internal.length,
      total_bytes: internal.reduce((sum, skill) => sum + skill.bytes, 0),
      largest: internal.slice(0, 5)
    },
    scripts: {
      visibility: "shared-tracked",
      count: scripts.length,
      brief_scaffold: scripts.some((entry) => entry.name === "fm-brief.sh") ? "bin/fm-brief.sh" : null
    },
    private_files: privateFiles.map((entry) => ({ ...entry, visibility: "captain-private" }))
  };
}
