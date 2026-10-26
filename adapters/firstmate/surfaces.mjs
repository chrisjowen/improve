import { isHarnessPath } from "../../scripts/proposal-check.mjs";

/**
 * Which Firstmate surface a proposal changes, and who may change it.
 *
 * Firstmate's harness is wider than Claude Code's defaults: its `bin/` scripts
 * are the tools its agents run, and its private home files steer every
 * session. A proposal's file decides two things the reviewer needs:
 *
 * - `captain-private`: the home's own gitignored records (`data/`, `config/`)
 *   and this plugin's `.harness/` record. After the captain approves, the
 *   existing `/improve apply` flow may edit them locally.
 * - `shared-tracked`: material committed to the Firstmate repository and used
 *   by every home. Never edited in place; an approved change goes upstream as
 *   a pull request.
 *
 * Pure functions, no I/O.
 */

const SURFACES = [
  // Runtime records are written by Firstmate's scripts, never by a proposal.
  { surface: "runtime-state", visibility: "runtime", pattern: /^state\// },
  // Claude Code's own local files, gitignored like the home's records.
  { surface: "contract", visibility: "captain-private", pattern: /(^|\/)CLAUDE\.local\.md$/ },
  { surface: "claude-config", visibility: "captain-private", pattern: /(^|\/)\.claude\/settings\.local\.json$/ },
  // Shared, tracked Firstmate material.
  { surface: "contract", visibility: "shared-tracked", pattern: /^(AGENTS|CLAUDE)\.md$/ },
  { surface: "brief-scaffold", visibility: "shared-tracked", pattern: /^bin\/fm-brief(-[a-z-]+)?(\.sh|-lib\.sh)$/ },
  { surface: "skill", visibility: "shared-tracked", pattern: /^\.(agents|claude)\/skills\// },
  { surface: "claude-config", visibility: "shared-tracked", pattern: /^\.claude\// },
  { surface: "public-skill", visibility: "shared-tracked", pattern: /^skills\// },
  { surface: "script", visibility: "shared-tracked", pattern: /^bin\// },
  { surface: "docs", visibility: "shared-tracked", pattern: /^docs\/.+\.md$/ },
  // Captain-private home records.
  { surface: "brief-include", visibility: "captain-private", pattern: /^config\/brief-include\.md$/ },
  { surface: "captain-preferences", visibility: "captain-private", pattern: /^data\/captain(-shared)?\.md$/ },
  { surface: "learnings", visibility: "captain-private", pattern: /^data\/learnings\.md$/ },
  { surface: "home-data", visibility: "captain-private", pattern: /^data\// },
  { surface: "home-config", visibility: "captain-private", pattern: /^config\// },
  { surface: "improve-record", visibility: "captain-private", pattern: /^\.harness(\/|$)/ }
];

function normalize(candidate) {
  if (typeof candidate !== "string") return "";
  return candidate.trim().replaceAll("\\", "/").replace(/^\.\//, "");
}

/**
 * `{file, surface, visibility}`. `surface` is null for a file that is not part
 * of Firstmate's harness (tests, CI, application code), which, as everywhere
 * in this plugin, is evidence and never a proposal target.
 */
export function classifySurface(candidate) {
  const file = normalize(candidate);
  for (const entry of SURFACES) {
    if (entry.pattern.test(file)) return { file, surface: entry.surface, visibility: entry.visibility };
  }
  // Every other file the default harness test accepts (`.mcp.json`, nested
  // `CLAUDE.md`, other agents' config) is still harness here, and tracked.
  if (isHarnessPath(file)) return { file, surface: "agent-config", visibility: "shared-tracked" };
  return { file, surface: null, visibility: null };
}

/** True for a file a Firstmate proposal may change. */
export function isFirstmateHarnessPath(candidate) {
  const { surface, visibility } = classifySurface(candidate);
  return surface !== null && visibility !== "runtime";
}

/**
 * How an approved proposal is delivered.
 *
 * `local-apply` when every file is captain-private, `upstream-pr` when every
 * file is shared-tracked, `split` when it mixes the two (one decision cannot
 * cover both, because they have different owners and paths), and `refuse` when
 * it lists no files or touches runtime state or a non-harness file.
 */
export function deliveryFor(files) {
  const list = (Array.isArray(files) ? files : []).map(classifySurface).filter((entry) => entry.file);
  if (list.length === 0) return { delivery: "refuse", visibility: null, surfaces: [], files: list, reason: "lists no files" };
  const runtime = list.filter((entry) => entry.visibility === "runtime");
  if (runtime.length) {
    return {
      delivery: "refuse",
      visibility: null,
      surfaces: [],
      files: list,
      reason: `changes runtime records Firstmate's scripts own: ${runtime.map((e) => e.file).join(", ")}`
    };
  }
  const outside = list.filter((entry) => entry.surface === null);
  if (outside.length) {
    return {
      delivery: "refuse",
      visibility: null,
      surfaces: [],
      files: list,
      reason: `changes files outside Firstmate's harness: ${outside.map((e) => e.file).join(", ")}`
    };
  }
  const surfaces = [...new Set(list.map((entry) => entry.surface))];
  const visibilities = new Set(list.map((entry) => entry.visibility));
  if (visibilities.size > 1) {
    return {
      delivery: "split",
      visibility: "mixed",
      surfaces,
      files: list,
      reason: "mixes captain-private and shared-tracked files; split it into one proposal per side"
    };
  }
  const visibility = [...visibilities][0];
  return {
    delivery: visibility === "captain-private" ? "local-apply" : "upstream-pr",
    visibility,
    surfaces,
    files: list,
    reason: null
  };
}

/** Findings for the reviewer about a Firstmate proposal's scope. */
export function checkFirstmateScope(files) {
  const derived = deliveryFor(files);
  const findings = [];
  if (derived.delivery === "refuse") {
    findings.push({ rule: "firstmate-scope", detail: `This proposal ${derived.reason}.` });
  } else if (derived.delivery === "split") {
    findings.push({ rule: "firstmate-split", detail: `This proposal ${derived.reason}.` });
  }
  return { ...derived, findings };
}
