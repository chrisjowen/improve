import fs from "node:fs";
import path from "node:path";

/**
 * Apply the shared egress rule set to text before it is persisted.
 *
 * Redaction is recorded, not silent: the replacement names the rule that fired
 * and the caller receives the list. Missing evidence must never be mistaken for
 * clean evidence, which is the same reason the rig records truncation.
 */
const RULES_FILE = path.resolve(
  import.meta.dirname, "..", "assets", "eval-rig", "redaction-rules.json"
);

let cached;

export function loadRules(file = RULES_FILE) {
  if (cached && cached.file === file) return cached.rules;
  const document = JSON.parse(fs.readFileSync(file, "utf8"));
  const rules = (document.rules ?? []).map((rule) => ({
    category: rule.category,
    name: rule.name,
    // Global, so every occurrence is replaced rather than only the first.
    pattern: new RegExp(rule.pattern, `${rule.flags ?? ""}g`)
  }));
  cached = { file, rules };
  return rules;
}

/**
 * Returns `{text, redactions}`. An empty `redactions` means nothing matched.
 *
 * Every rule is matched against the original text in one pass and the
 * substitutions are applied together. Replacing rule by rule would let a later
 * rule match an earlier rule's marker — `generic_assignment` matches
 * `[REDACTED:secret:github_token]` — and cascade into corrupted output.
 * On overlap the earlier rule in the file wins.
 */
export function redact(text, { rules = loadRules() } = {}) {
  if (typeof text !== "string" || text === "") return { text: text ?? "", redactions: [] };

  const spans = [];
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    for (const match of text.matchAll(rule.pattern)) {
      if (match[0].length === 0) continue;
      spans.push({ start: match.index, end: match.index + match[0].length, rule });
    }
  }
  spans.sort((a, b) => a.start - b.start || b.end - a.end);

  const counts = new Map();
  const pieces = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start < cursor) continue;
    pieces.push(text.slice(cursor, span.start));
    pieces.push(`[REDACTED:${span.rule.category}:${span.rule.name}]`);
    counts.set(span.rule.name, (counts.get(span.rule.name) ?? 0) + 1);
    cursor = span.end;
  }
  pieces.push(text.slice(cursor));

  return {
    text: pieces.join(""),
    redactions: [...counts].map(([name, count]) => ({
      rule: name,
      category: rules.find((rule) => rule.name === name)?.category,
      count
    }))
  };
}

/** True when any rule matches, without building the redacted copy. */
export function hasSecret(text, { rules = loadRules() } = {}) {
  if (typeof text !== "string") return false;
  return rules.some((rule) => {
    rule.pattern.lastIndex = 0;
    return rule.pattern.test(text);
  });
}
