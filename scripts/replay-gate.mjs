/**
 * Scores from a `claude plugin eval --ablation with-without --json` run, and
 * the acceptance gate a proposal passes on them.
 *
 * Pure functions, no I/O, so the CLI, the hooks and the UI share them.
 *
 * A run's score is the weighted share of its graders that passed (0..1). A
 * case's WITH and WITHOUT are the means of its runs in each arm, and its delta
 * is WITH minus WITHOUT. The standard error of a case's delta comes from the
 * spread of its runs; the suite's delta is the mean of its cases' deltas, with
 * the standard error of that mean over a fixed set of cases.
 */

/** @typedef {{ mean: number | null, sd: number, n: number, errors: number }} Arm */
/** @typedef {{ name: string, with: Arm, without: Arm, delta: number | null, se: number }} CaseScore */

/** @param {number[]} values */
function mean(values) {
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
}

/** Sample standard deviation; 0 for fewer than two values. */
function sd(values) {
  if (values.length < 2) return 0;
  const m = /** @type {number} */ (mean(values));
  return Math.sqrt(values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1));
}

/** @param {any[]} runs */
function arm(runs) {
  const list = Array.isArray(runs) ? runs : [];
  // A run that errored, timed out or went over budget scored nothing: it is
  // counted, as 0, never dropped.
  const scores = list.map((run) => (typeof run?.score === "number" && Number.isFinite(run.score) ? run.score : 0));
  return { mean: mean(scores), sd: sd(scores), n: scores.length, errors: list.filter((run) => run?.error).length };
}

/** @param {number} value */
const round = (value) => Math.round(value * 1e4) / 1e4;

/**
 * Per-case scores from the eval's JSON result.
 *
 * @param {any} result the object `claude plugin eval --json` writes
 * @returns {CaseScore[]}
 */
export function caseScores(result) {
  const cases = Array.isArray(result?.cases) ? result.cases : [];
  return cases.map((c) => {
    const withArm = arm(c?.arms?.with);
    const withoutArm = arm(c?.arms?.without);
    const delta = withArm.mean !== null && withoutArm.mean !== null ? withArm.mean - withoutArm.mean : null;
    const se = Math.sqrt(
      (withArm.n ? withArm.sd ** 2 / withArm.n : 0) + (withoutArm.n ? withoutArm.sd ** 2 / withoutArm.n : 0)
    );
    return { name: String(c?.name ?? ""), with: withArm, without: withoutArm, delta: delta === null ? null : round(delta), se: round(se) };
  });
}

/**
 * WITH, WITHOUT and delta over a set of cases, with the delta's standard
 * error. Cases without both arms are left out and counted in `missing`.
 *
 * @param {CaseScore[]} scores
 */
export function compare(scores) {
  const both = scores.filter((c) => c.delta !== null);
  const n = both.length;
  if (n === 0) return { with: null, without: null, delta: null, se: null, cases: 0, missing: scores.length };
  const se = Math.sqrt(both.reduce((sum, c) => sum + c.se ** 2, 0)) / n;
  return {
    with: round(/** @type {number} */ (mean(both.map((c) => /** @type {number} */ (c.with.mean))))),
    without: round(/** @type {number} */ (mean(both.map((c) => /** @type {number} */ (c.without.mean))))),
    delta: round(/** @type {number} */ (mean(both.map((c) => /** @type {number} */ (c.delta))))),
    se: round(se),
    cases: n,
    missing: scores.length - n
  };
}

/**
 * The acceptance gate on the validation split.
 *
 * Pass only when the run finished, every case has both arms, the mean delta is
 * more than `k` standard errors above zero, and no case regressed: no case's
 * WITH is below its WITHOUT by more than `tolerance`. A strict default, so a
 * change that helps one case and quietly breaks another does not pass on the
 * average.
 *
 * @param {CaseScore[]} scores validation cases
 * @param {{ k?: number, tolerance?: number, partial?: boolean }} [options]
 */
export function gate(scores, { k = 2, tolerance = 0, partial = false } = {}) {
  const summary = compare(scores);
  const regressions = scores.filter((c) => c.delta !== null && c.delta < -tolerance).map((c) => c.name);
  const reasons = [];
  let verdict = "pass";
  if (partial) {
    verdict = "incomplete";
    reasons.push("The run stopped at its cost ceiling before every case ran.");
  } else if (summary.cases === 0) {
    verdict = "incomplete";
    reasons.push("No validation case has both a WITH and a WITHOUT score.");
  } else if (summary.missing > 0) {
    verdict = "incomplete";
    reasons.push(`${summary.missing} validation ${summary.missing === 1 ? "case has" : "cases have"} no score in one arm.`);
  }
  const threshold = summary.se === null ? null : round(k * summary.se);
  if (verdict === "pass") {
    if (/** @type {number} */ (summary.delta) <= /** @type {number} */ (threshold)) {
      verdict = "fail";
      reasons.push(`The delta ${signed(summary.delta)} is not above ${k} standard errors (${threshold}).`);
    }
    if (regressions.length) {
      verdict = "fail";
      reasons.push(`${regressions.length === 1 ? "A validation case regressed" : `${regressions.length} validation cases regressed`}: ${regressions.join(", ")}.`);
    }
  }
  if (verdict === "pass") reasons.push(`The delta ${signed(summary.delta)} is above ${k} standard errors (${threshold}) and no validation case regressed.`);
  return { verdict, k, tolerance, threshold, regressions, reasons, ...summary };
}

/** @param {number | null} value */
export function signed(value) {
  if (value === null || value === undefined) return "n/a";
  const fixed = value.toFixed(2);
  return value > 0 ? `+${fixed}` : fixed;
}

/**
 * Whether a change that was kept is now losing: its delta is below zero, or a
 * case regressed. An incomplete run says nothing either way.
 *
 * @param {ReturnType<typeof gate>} result
 */
export function losing(result) {
  if (result.verdict === "incomplete" || result.delta === null) return false;
  return result.delta < 0 || result.regressions.length > 0;
}
