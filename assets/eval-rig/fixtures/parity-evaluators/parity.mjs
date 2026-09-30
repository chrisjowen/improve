/**
 * JavaScript half of the bridge parity fixtures. Each behaviour has an
 * identically named counterpart in parity.py; the two must be graded alike.
 */
const BEHAVIOURS = {
  plain: () => ({ success: true, score: 1, notes: ["plain"] }),
  zero: () => ({ success: false, score: 0, notes: ["zero"] }),
  partial: () => ({ success: false, score: 0.5, notes: ["partial"] }),
  empty_notes: () => ({ success: true, score: 1, notes: [] }),
  with_metrics: () => ({ success: true, score: 1, notes: ["metrics"], metrics: { count: 3 } }),
  deferred: async () => ({ success: true, score: 1, notes: ["plain"] }),
  throws: () => { throw new Error("evaluator raised"); },
  score_too_high: () => ({ success: true, score: 2, notes: ["out of range"] }),
  score_not_finite: () => ({ success: true, score: Number.POSITIVE_INFINITY, notes: ["infinite"] }),
  missing_score: () => ({ success: true, notes: ["no score"] }),
  not_an_object: () => "this is not a result"
};

export async function evaluate(context) {
  const behaviour = context.step?.metadata?.behaviour;
  const fn = BEHAVIOURS[behaviour];
  if (!fn) throw new Error(`unknown behaviour: ${behaviour}`);
  return fn();
}
