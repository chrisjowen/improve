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
  { surface: "improve-record", visibility: "captain-private", pattern: /^\.harness(\/|$)/ },
  // Runtime records are written by Firstmate's scripts, never by a proposal.
  { surface: "runtime-state", visibility: "runtime", pattern: /^state\// }
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

/**
 * The optional `firstmate:` block a Firstmate proposal carries, read from YAML
 * text without a parser: top-level `firstmate:` and its indented scalar keys.
 */
export function readFirstmateBlock(text) {
  if (typeof text !== "string") return {};
  const lines = text.split("\n");
  const at = lines.findIndex((line) => /^firstmate:\s*$/.test(line));
  if (at === -1) return {};
  const block = {};
  for (const line of lines.slice(at + 1)) {
    if (/^\S/.test(line)) break;
    const match = line.match(/^\s+([a-z_]+):\s*(.*?)\s*$/);
    if (match && match[2] && !match[2].startsWith("[")) {
      block[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
  return block;
}

/**
 * Findings for the reviewer about a Firstmate proposal's scope. The derived
 * delivery is authoritative; a stated one that disagrees is reported.
 */
export function checkFirstmateScope(files, stated = {}) {
  const derived = deliveryFor(files);
  const findings = [];
  if (derived.delivery === "refuse") {
    findings.push({ rule: "firstmate-scope", detail: `This proposal ${derived.reason}.` });
  } else if (derived.delivery === "split") {
    findings.push({ rule: "firstmate-split", detail: `This proposal ${derived.reason}.` });
  }
  if (stated.visibility && derived.visibility && stated.visibility !== derived.visibility) {
    findings.push({
      rule: "firstmate-visibility-mismatch",
      detail: `firstmate.visibility says ${stated.visibility}, but scope.files are ${derived.visibility}.`
    });
  }
  if (stated.delivery && !["refuse", "split"].includes(derived.delivery) && stated.delivery !== derived.delivery) {
    findings.push({
      rule: "firstmate-delivery-mismatch",
      detail: `firstmate.delivery says ${stated.delivery}, but scope.files call for ${derived.delivery}.`
    });
  }
  return { ...derived, findings };
}
