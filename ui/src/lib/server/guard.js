/**
 * Deterministic checks over a drafted skill body, run before it can be applied.
 *
 * A skill is deferred execution: its body is loaded into a future session's
 * context as an instruction. The drafting agent reads repository text, which the
 * harness already treats as untrusted, so an injection in that text can reach
 * this body and become a permanent instruction. Regex is a heuristic and stops
 * explicit strings only, but it cannot itself be talked out of firing, which a
 * model-based check on a possibly-injected body can.
 *
 * ponytail: pattern matching, not semantic analysis. For stronger detection add
 * a sandboxed review pass; these families catch the stated attack shapes.
 */

import { redact } from "../../../../scripts/redact.mjs";

export const SAFETY_FAMILIES = {
  exfiltration: [
    /curl\s+[^\n]*\|\s*(sh|bash|zsh)/i,
    /wget\s+[^\n]*\|\s*(sh|bash|zsh)/i,
    /(exfiltrate|leak|send|post|upload)\b[\s\S]{0,30}(https?:|secret|token|api[_-]?key|password|credential|\benv\b)/i
  ],
  injection: [
    /ignore\s+(all\s+|any\s+)?previous\s+instructions/i,
    /disregard\s+(all\s+)?(previous|prior|above)/i,
    /(override|bypass|reveal|leak)\b[\s\S]{0,20}system\s+(prompt|instructions?)/i,
    /always\s+(exfiltrate|send|leak|forward)/i,
    /regardless\s+of\s+(what|any)\s+(the\s+)?(user|human)\s+(says|asks)/i
  ],
  destructive: [
    /\brm\s+-[rf]{1,2}\s+(\/|~|\$HOME|\*)/i,
    /\bdrop\s+table\b/i,
    /\bmkfs\b/i,
    /\bdd\s+if=[^\n]*of=\/dev\//i,
    /:\s*\(\s*\)\s*\{\s*:\s*\|\s*:?\s*&\s*\}/,
    /\bgit\s+push\s+--force\b[\s\S]{0,20}(main|master)/i
  ],
  persistence: [
    /\bcrontab\b/i,
    /\.(bashrc|zshrc|bash_profile|profile)\b/i,
    /systemctl\s+enable/i,
    /\blaunchctl\b/i,
    /\/etc\/(cron|rc\.local|systemd)/i
  ],
  network: [
    /\/dev\/tcp\//i,
    /reverse\s+shell/i,
    /\bnc\s+-l/i,
    /\bncat\b[^\n]*-e/i,
    /socket\.socket\(/i
  ],
  obfuscation: [
    /base64\s+(-d|--decode)/i,
    /\beval\s*\(\s*(atob|Buffer\.from|decode)/i,
    /(\\x[0-9a-fA-F]{2}){4,}/,
    /\bfromhex\b/i
  ]
};

const COMPILED = Object.entries(SAFETY_FAMILIES);

/** Returns `{family: [source, ...]}`. An empty object means clean. */
export function scanSafety(text) {
  const findings = {};
  if (typeof text !== "string") return findings;
  for (const [family, patterns] of COMPILED) {
    const hits = patterns.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
    if (hits.length) findings[family] = hits;
  }
  return findings;
}

const PLACEHOLDER = /\b(TODO|FIXME|XXX):|<(?:TODO|FIXME|XXX|TBD|PLACEHOLDER|REPLACE[_ ]?ME|INSERT[_ ]?HERE|FILL[_ ]?IN)>/i;
// An absolute home path both leaks the author's machine and breaks for everyone else.
const ABSOLUTE_PATH = /(?:\/home\/|\/Users\/|\/root\/)[^\s`)\]]+|[A-Za-z]:\\[^\s`)\]]+/;
const FRONTMATTER = /^---\n([\s\S]*?)\n---/;
// A description that fires names WHEN it applies, or quotes a phrase the user types.
const TRIGGER_CUE = /\bwhen\b/i;
const QUOTED = /"[^"]+"|'[^']+'|`[^`]+`/;

export function parseFrontmatter(body) {
  if (typeof body !== "string") return null;
  const match = FRONTMATTER.exec(body);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return fields;
}

/**
 * Quality checks. These make the skill-authoring rules in SKILL.md checkable
 * rather than aspirational.
 */
export function lintSkill(body, { name, description, requireGuardrails = false } = {}) {
  const findings = [];
  if (typeof body !== "string" || body.trim() === "") {
    findings.push(["structure", "body is empty"]);
    return findings;
  }

  const frontmatter = parseFrontmatter(body);
  if (!frontmatter) {
    findings.push(["structure", "missing YAML frontmatter delimited by ---"]);
  } else {
    if (!frontmatter.name) findings.push(["structure", "frontmatter has no name"]);
    else if (name && frontmatter.name !== name) {
      findings.push(["structure", `frontmatter name "${frontmatter.name}" does not match "${name}"`]);
    }
    if (!frontmatter.description) findings.push(["structure", "frontmatter has no description"]);
  }

  const declared = description ?? frontmatter?.description ?? "";
  if (declared && !(TRIGGER_CUE.test(declared) || QUOTED.test(declared))) {
    findings.push(["trigger", 'description states no trigger: say when it applies, or quote a phrase the user would type']);
  }

  const placeholder = PLACEHOLDER.exec(body);
  if (placeholder) findings.push(["complete", `unresolved placeholder: ${placeholder[0]}`]);

  const absolute = ABSOLUTE_PATH.exec(body);
  if (absolute) findings.push(["portable", `absolute machine path: ${absolute[0]}`]);

  if (requireGuardrails && !/##+\s*Guardrails/i.test(body)) {
    findings.push(["guardrails", "proposal carries evidence but the skill declares no Guardrails section"]);
  }

  // A drafted skill is committed and shared, so a credential in it is published.
  // The agent read the repository to write this, so it can carry one out.
  for (const entry of redact(body).redactions) {
    findings.push(["secret", `${entry.rule} appears in the body (${entry.count})`]);
  }

  return findings;
}

/**
 * Every check, in one pass over the in-memory body. Nothing here touches disk,
 * so a rejected draft cannot leave a trace.
 */
export function validateDraft({ body, name, description, requireGuardrails = false }) {
  const findings = [];
  for (const [family, patterns] of Object.entries(scanSafety(body))) {
    for (const pattern of patterns) findings.push([`safety:${family}`, pattern]);
  }
  findings.push(...lintSkill(body, { name, description, requireGuardrails }));
  return { ok: findings.length === 0, findings };
}
