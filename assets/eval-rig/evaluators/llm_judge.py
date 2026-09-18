from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any


def evaluate(context: dict[str, Any]) -> dict[str, Any]:
    config = context["step"]["metadata"]
    argv = config.get("adapter_argv")
    rubric = config.get("rubric")
    if not isinstance(argv, list) or not argv or not all(isinstance(item, str) for item in argv):
        raise ValueError("step.metadata.adapter_argv must be a non-empty string array")
    if not isinstance(rubric, str) or not rubric.strip():
        raise ValueError("step.metadata.rubric must be a non-empty string")
    request = {
        "protocol_version": 1,
        "rubric": rubric,
        "objective": context["objective"],
        "task": context["task"],
        "changes": context["changes"],
        "transcript": context["transcript"],
        "artifacts": context["artifacts"],
        "metadata": config.get("judge_metadata", {}),
    }
    completed = subprocess.run(
        argv,
        cwd=Path(context["project_root"]),
        input=json.dumps(request),
        text=True,
        capture_output=True,
        timeout=float(config.get("judge_timeout_seconds", 60)),
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr[-2000:] or f"Judge adapter exited {completed.returncode}")
    result = json.loads(completed.stdout)
    if not isinstance(result, dict):
        raise ValueError("Judge adapter must emit one EvaluationResult JSON object")
    result.setdefault("metadata", {})["judge_adapter"] = argv[0]
    return result
