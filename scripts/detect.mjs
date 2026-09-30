/**
 * Detect corrections in a user prompt.
 *
 * Roughly eight of the ten review triggers the skill documents cannot fire on
 * tool metadata alone: "the same correction repeats" is not derivable from tool
 * names. This is the cheap deterministic half of the signal, matched on the hot
 * path. Semantic classification belongs at review time, not in a hook, because
 * an expensive model call on a lifecycle path is an anti-pattern the harness
 * model already names.
 */

export const CATEGORIES = {
  // Highest confidence: the human said outright that this should persist.
  directive: {
    weight: 0.95,
    patterns: [
      /^\s*remember\s*[:,]/i,
      /\b(always|never)\s+(use|do|run|call|write|add|commit|deploy|assume)\b/i,
      /\bfrom now on\b/i,
      /\bgoing forward\b/i,
      /\bmake sure (you|to)\b/i
    ]
  },
  correction: {
    weight: 0.8,
    patterns: [
      /^\s*no[,.\s]+(use|not|it|that|the|we|you|i)\b/i,
      /\bdon'?t\s+(use|do|run|add|call|write|create)\b/i,
      /\b(that'?s|this is)\s+(wrong|incorrect|not right|not what)\b/i,
      /\bactually[,\s]/i,
      /\binstead of\b/i,
      /\bshould(n'?t| not)\s+(have|be|use|do)\b/i,
      /\bwhy (did|are) you\b/i,
      /\bi (said|asked|told you)\b/i,
      /\bstop\s+(doing|using|adding)\b/i
    ]
  },
  // Kept because a confirmed approach is as worth recording as a rejected one.
  approval: {
    weight: 0.6,
    patterns: [
      /^\s*(perfect|exactly|nice|great)\b/i,
      /\bthat'?s (right|correct|it)\b/i,
      /\bworks? (now|perfectly)\b/i
    ]
  }
};

// Shapes that look like corrections but carry nothing reusable.
const NOT_REUSABLE = [
  /\?\s*$/,                        // a question
  /^\s*(what|how|why|when|where|who|which|can|could|would|should|is|are|does|do)\b.*\?/i,
  /^\s*(thanks|thank you|ok|okay|sure|yes|no|yep|nope)\s*[.!]?\s*$/i
];

const MAX_EXCERPT = 280;

/**
 * Returns `{matched, category, confidence, patterns, excerpt}`.
 *
 * `matched` false means nothing durable was found, which is the common case and
 * must stay cheap.
 */
export function detect(prompt) {
  if (typeof prompt !== "string" || prompt.trim() === "") {
    return { matched: false };
  }
  const text = prompt.trim();

  let best;
  for (const [category, definition] of Object.entries(CATEGORIES)) {
    const hits = definition.patterns.filter((pattern) => pattern.test(text));
    if (!hits.length) continue;
    if (!best || definition.weight > best.confidence) {
      best = { category, confidence: definition.weight, patterns: hits.map((p) => p.source) };
    }
  }
  if (!best) return { matched: false };

  // A question about the code carries nothing reusable, but a correction phrased
  // as one does: "why did you add a dependency?" is a challenge, not an enquiry.
  // So the filter only applies when the match was the weak approval signal.
  if (best.category === "approval" && NOT_REUSABLE.some((pattern) => pattern.test(text))) {
    return { matched: false, filtered: "not reusable" };
  }

  return {
    matched: true,
    ...best,
    excerpt: text.length > MAX_EXCERPT ? `${text.slice(0, MAX_EXCERPT)}…` : text
  };
}

/**
 * A stable key for "the same correction again".
 *
 * Content words only, so wording differences collapse. Crude on purpose: the
 * alternative is a model call on the hot path.
 */
export function fingerprint(text) {
  if (typeof text !== "string") return "";
  const stop = new Set([
    "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "for", "with",
    "is", "are", "was", "be", "been", "it", "this", "that", "you", "i", "we",
    "should", "would", "could", "do", "does", "did", "not", "no", "dont", "don",
    "use", "using", "used", "actually", "instead", "always", "never", "remember"
  ]);
  return [...new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stop.has(word))
  )].sort().join("-").slice(0, 120);
}
