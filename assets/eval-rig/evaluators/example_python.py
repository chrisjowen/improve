from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sdk.improve_eval import EvaluationContext, EvaluationResult


def evaluate(context: "EvaluationContext") -> "EvaluationResult":
    has_run_id = bool(context.get("run", {}).get("id"))
    return {
        "success": has_run_id,
        "score": 1.0 if has_run_id else 0.0,
        "notes": ["Run identity is present." if has_run_id else "Run identity is missing."],
        "metadata": {"example": True},
    }
