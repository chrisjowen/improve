from __future__ import annotations

from typing import Any, Awaitable, Callable, NotRequired, TypedDict

Json = None | bool | int | float | str | list["Json"] | dict[str, "Json"]


class EvaluationEvidence(TypedDict):
    kind: str
    message: str
    path: NotRequired[str]
    line: NotRequired[int]
    data: NotRequired[Json]


class EvaluationResult(TypedDict):
    success: bool
    score: float
    notes: list[str]
    metadata: NotRequired[dict[str, Json]]
    evidence: NotRequired[list[EvaluationEvidence]]
    metrics: NotRequired[dict[str, float]]


class EvaluationContext(TypedDict):
    schema_version: int
    project_root: str
    objective: dict[str, Any]
    task: dict[str, Any]
    changes: dict[str, Any]
    transcript: dict[str, Any]
    run: dict[str, Any]
    artifacts: list[Any]
    step: dict[str, Any]
    metadata: dict[str, Json]


Evaluate = Callable[
    [EvaluationContext], EvaluationResult | Awaitable[EvaluationResult]
]
