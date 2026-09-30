"""Python half of the bridge parity fixtures.

Each behaviour matches the identically named export in parity.mjs. The runner
must normalise and reject both halves the same way, or a score would depend on
which language its evaluator happened to be written in.
"""
from __future__ import annotations

import math


def _plain():
    return {"success": True, "score": 1, "notes": ["plain"]}


BEHAVIOURS = {
    "plain": _plain,
    "zero": lambda: {"success": False, "score": 0, "notes": ["zero"]},
    "partial": lambda: {"success": False, "score": 0.5, "notes": ["partial"]},
    "empty_notes": lambda: {"success": True, "score": 1, "notes": []},
    "with_metrics": lambda: {"success": True, "score": 1, "notes": ["metrics"], "metrics": {"count": 3}},
    "deferred": _plain,
    "throws": lambda: (_ for _ in ()).throw(RuntimeError("evaluator raised")),
    "score_too_high": lambda: {"success": True, "score": 2, "notes": ["out of range"]},
    "score_not_finite": lambda: {"success": True, "score": math.inf, "notes": ["infinite"]},
    "missing_score": lambda: {"success": True, "notes": ["no score"]},
    "not_an_object": lambda: "this is not a result",
}


def evaluate(context):
    behaviour = (context.get("step") or {}).get("metadata", {}).get("behaviour")
    fn = BEHAVIOURS.get(behaviour)
    if fn is None:
        raise ValueError(f"unknown behaviour: {behaviour}")
    return fn()
