/**
 * Deterministic checks on a proposal: does it change the harness, and is it
 * written so a reviewer can read it.
 *
 * Pure functions, no dependencies, no top-level I/O, so the UI can import this
 * file and `proposal-check-cli.mjs` can run it on a YAML file.
 */

/**
 * Files that shape how a coding agent behaves in a repository. Anything else is
 * the repository itself. A defect in application code is evidence for a
 * harness change, never the change: the harness fix is whatever would have let
 * the agent catch or avoid it.
 */
const HARNESS_PATTERNS = [
  /(^|\/)(CLAUDE|CLAUDE\.local|AGENTS|GEMINI)\.md$/,
  /(^|\/)\.claude(\/|$)/,
  /^\.harness(\/|$)/,
  /^\.mcp\.json$/,
  /^\.cursor(\/|$)/,
  /^\.cursorrules$/,
  /^\.codex(\/|$)/,
  /^\.github\/copilot-instructions\.md$/
];

export function isHarnessPath(candidate) {
  if (typeof candidate !== "string" || !candidate.trim()) return false;
  const normalized = candidate.trim().replaceAll("\\", "/").replace(/^\.\//, "");
  return HARNESS_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * `harness` when every file is a harness file, `codebase` when none is,
 * `mixed` otherwise, and `unknown` when the proposal lists no files, which is
 * itself a defect because the reviewer cannot tell what will change.
 */
export function classifyScope(files) {
  const list = Array.isArray(files) ? files.filter((f) => typeof f === "string" && f.trim()) : [];
  if (list.length === 0) return { scope: "unknown", outside: [] };
  const outside = list.filter((file) => !isHarnessPath(file));
  if (outside.length === 0) return { scope: "harness", outside };
  return { scope: outside.length === list.length ? "codebase" : "mixed", outside };
}

/**
 * Writing rules adapted from the `unslop` skill in cursor/plugins
 * (pstack/skills/unslop). The number in each id is that skill's stable rule
 * number, so a finding can be looked up there. Only rules a regex can check
 * without false positives on ordinary engineering prose are here; the rest are
 * in references/writing.md for the author to apply.
 */
const words = (list) => new RegExp(`\\b(${list.join("|")})\\b`, "gi");

const PROSE_RULES = [
  {
    id: "unslop-13-em-dash",
    pattern: /—|\s--\s/g,
    fix: "End the sentence, or use a comma."
  },
  {
    id: "unslop-7-ai-vocabulary",
    pattern: words([
      "additionally", "crucial", "delve", "enduring", "enhance[sd]?", "fostering", "garner",
      "interplay", "intricate", "pivotal", "showcase[sd]?", "tapestry", "testament",
      "underscores?", "vibrant", "seamless(ly)?", "robust"
    ]),
    fix: "Use the plain word, or cut it."
  },
  {
    id: "unslop-8-fancy-is",
    pattern: /\b(serves as|stands as|boasts)\b/gi,
    fix: "Say \"is\" or \"has\"."
  },
  {
    id: "unslop-9-not-just",
    pattern: /\bnot (just|only|merely) [^.]{1,80}?\bbut\b/gi,
    fix: "State the point directly."
  },
  {
    id: "unslop-23-filler",
    pattern: /\b(in order to|due to the fact that|it is important to note that|it is worth noting that)\b/gi,
    fix: "\"To\", \"because\", or delete."
  },
  {
    id: "unslop-26-metaphor-noun",
    pattern: words([
      "substrate", "wedge", "locus", "vantage", "nexus", "primitives?", "bedrock",
      "scaffolding", "modality", "paradigm", "gold-plating", "ratchet", "endgame",
      "north star", "flywheel"
    ]),
    fix: "Name the concrete thing."
  },
  {
    id: "unslop-31-plain-word",
    pattern: words(["utili[sz]e[sd]?", "leverag(e|es|ed|ing)", "facilitat(e|es|ed|ing)", "numerous", "in the event that"]),
    fix: "\"use\", \"help\", \"many\", \"if\"."
  },
  {
    id: "unslop-33-arrow",
    pattern: /\s(->|→)\s/g,
    fix: "Write the sentence out with a verb."
  },
  {
    id: "unslop-5-vague-attribution",
    pattern: /\b(experts (say|believe)|studies show|industry reports suggest|some (critics|people) argue)\b/gi,
    fix: "Name the source or delete."
  }
];

// Rule 28. A reader who has to backtrack to parse a sentence has stopped
// reviewing and started decoding; 30 words is where that usually starts.
const LONG_SENTENCE_WORDS = 30;

/** Every rule match in `text`, in order of appearance. */
export function lintProse(text, { field } = {}) {
  if (typeof text !== "string" || !text) return [];
  const findings = [];
  for (const rule of PROSE_RULES) {
    for (const match of text.matchAll(rule.pattern)) {
      findings.push({ rule: rule.id, match: match[0].trim() || match[0], fix: rule.fix, field, index: match.index });
    }
  }
  for (const match of text.matchAll(/[^.!?\n]+(?:[.!?]+|$)/g)) {
    const count = match[0].trim().split(/\s+/).filter(Boolean).length;
    if (count > LONG_SENTENCE_WORDS) {
      findings.push({
        rule: "unslop-28-long-sentence",
        match: `${match[0].trim().split(/\s+/).slice(0, 8).join(" ")}... (${count} words)`,
        fix: "Split it. One idea per sentence.",
        field,
        index: match.index
      });
    }
  }
  return findings.sort((a, b) => a.index - b.index);
}

/**
 * `scope.files` from proposal YAML text, without a YAML parser.
 *
 * The plugin's scripts carry no dependencies. This reads only the block-list
 * form proposal-format.md prescribes; an inline `files: [a, b]` list is read
 * too, and anything else yields an empty list, which reports as `unknown`
 * rather than as harness.
 */
export function readScopeFiles(text) {
  if (typeof text !== "string") return [];
  const lines = text.split("\n");
  const scopeAt = lines.findIndex((line) => /^scope:\s*$/.test(line));
  if (scopeAt === -1) return [];
  const files = [];
  let inFiles = false;
  let filesIndent = 0;
  for (const line of lines.slice(scopeAt + 1)) {
    if (/^\S/.test(line)) break;
    const inline = line.match(/^(\s+)files:\s*\[(.*)\]\s*$/);
    if (inline) {
      return inline[2].split(",").map((f) => f.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    }
    const header = line.match(/^(\s+)files:\s*$/);
    if (header) { inFiles = true; filesIndent = header[1].length; continue; }
    if (!inFiles) continue;
    const item = line.match(/^(\s+)-\s+(.+?)\s*$/);
    if (item && item[1].length >= filesIndent) {
      files.push(item[2].replace(/^["']|["']$/g, ""));
    } else if (line.trim() && !(line.match(/^(\s*)/)[1].length > filesIndent)) {
      inFiles = false;
    }
  }
  return files;
}

/** The prose fields a reviewer reads, flattened to [field, text] pairs. */
function proseFields(proposal) {
  const pairs = [];
  const add = (field, value) => {
    if (typeof value === "string") pairs.push([field, value]);
    else if (Array.isArray(value)) value.forEach((item, i) => add(`${field}[${i}]`, item));
  };
  add("title", proposal.title);
  add("hypothesis", proposal.hypothesis);
  add("intervention.summary", proposal.intervention?.summary);
  add("intervention.alternatives", proposal.intervention?.alternatives);
  (Array.isArray(proposal.evidence) ? proposal.evidence : []).forEach((item, i) => {
    add(`evidence[${i}].observation`, item?.observation);
  });
  add("risks", proposal.risks);
  add("rollout", proposal.rollout);
  add("rollback", proposal.rollback);
  return pairs;
}

/**
 * Both checks on a parsed proposal object.
 *
 * A finding here does not block anything: these are for the reviewer, and the
 * reviewer is the one who rejects.
 */
export function checkProposal(proposal) {
  const value = proposal && typeof proposal === "object" ? proposal : {};
  const { scope, outside } = classifyScope(value.scope?.files);
  const findings = [];

  if (scope === "unknown") {
    findings.push({ rule: "scope-unknown", detail: "scope.files is empty, so nobody can tell what this changes." });
  } else if (scope !== "harness") {
    findings.push({
      rule: "scope-codebase",
      detail: `${scope === "mixed" ? "Also changes" : "Changes"} application files, not only the agent's setup: ${outside.join(", ")}. `
        + "Rewrite it as the instruction, hook, skill or permission that would have let the agent catch this."
    });
  }

  const prose = proseFields(value).flatMap(([field, text]) => lintProse(text, { field }));
  return { scope, outside, findings, prose };
}
