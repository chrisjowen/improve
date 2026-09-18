import type { EvaluationContext, EvaluationResult } from "../sdk/types.d.ts";

export function evaluate(context: EvaluationContext): EvaluationResult {
  const complete = !context.transcript.truncated;
  return {
    success: complete,
    score: complete ? 1 : 0,
    notes: [complete ? "Transcript is complete." : "Transcript was truncated."],
    metadata: { example: true },
  };
}
