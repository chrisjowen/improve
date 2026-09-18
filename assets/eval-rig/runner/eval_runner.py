from __future__ import annotations

import argparse
import hashlib
import json
import math
import subprocess
import sys
import time
from copy import deepcopy
from pathlib import Path
from typing import Any

import yaml


ROOT = Path(__file__).resolve().parent


def load_yaml(path: Path) -> dict[str, Any]:
    value = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"Expected YAML object: {path}")
    return value


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inside(root: Path, path: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def load_registry(path: Path, project_root: Path) -> tuple[dict[str, dict[str, Any]], str]:
    document = load_yaml(path)
    entries: dict[str, dict[str, Any]] = {}
    for raw in document.get("evaluators", []):
        entry = dict(raw)
        name = entry.get("name")
        if not isinstance(name, str) or not name:
            raise ValueError(f"Registry entry lacks a name: {path}")
        if name in entries:
            raise ValueError(f"Duplicate evaluator name in {path}: {name}")
        if entry.get("language") not in {"javascript", "typescript", "python"}:
            raise ValueError(f"Unsupported evaluator language for {name}: {entry.get('language')}")
        module = (path.parent / entry["module"]).resolve()
        if not inside(project_root, module):
            raise ValueError(f"Evaluator escapes project root: {module}")
        if not module.is_file():
            raise ValueError(f"Evaluator does not exist: {module}")
        entry["module"] = str(module)
        entries[name] = entry
    return entries, digest(path)


def validate_result(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise ValueError("Evaluator result must be an object")
    if not isinstance(value.get("success"), bool):
        raise ValueError("result.success must be boolean")
    score = value.get("score")
    if not isinstance(score, (int, float)) or isinstance(score, bool) or not math.isfinite(score):
        raise ValueError("result.score must be finite")
    if score < 0 or score > 1:
        raise ValueError("result.score must be between 0 and 1")
    notes = value.get("notes")
    if not isinstance(notes, list) or any(not isinstance(note, str) for note in notes):
        raise ValueError("result.notes must be an array of strings")
    metrics = value.get("metrics", {})
    if not isinstance(metrics, dict) or any(
        not isinstance(metric, (int, float)) or isinstance(metric, bool) or not math.isfinite(metric)
        for metric in metrics.values()
    ):
        raise ValueError("result.metrics values must be finite numbers")
    try:
        json.dumps(value, allow_nan=False)
    except (TypeError, ValueError) as error:
        raise ValueError(f"Evaluator result must contain only finite JSON values: {error}") from error
    return value


def validate_suite(suite: dict[str, Any]) -> None:
    if suite.get("version") != 1 or not isinstance(suite.get("id"), str):
        raise ValueError("Suite requires version: 1 and a string id")
    objective = suite.get("objective")
    if not isinstance(objective, dict) or not isinstance(objective.get("success_criteria"), list):
        raise ValueError("Suite objective requires success_criteria")
    steps = suite.get("steps")
    if not isinstance(steps, list) or not steps:
        raise ValueError("Suite requires at least one step")
    ids: set[str] = set()
    for step in steps:
        if not isinstance(step, dict) or not isinstance(step.get("id"), str) or not isinstance(step.get("evaluator"), str):
            raise ValueError("Every step requires string id and evaluator fields")
        if step["id"] in ids:
            raise ValueError(f"Duplicate step id: {step['id']}")
        ids.add(step["id"])
        threshold = float(step.get("threshold", 1.0))
        weight = float(step.get("weight", 1.0))
        if not 0 <= threshold <= 1:
            raise ValueError(f"Step threshold must be between 0 and 1: {step['id']}")
        if not math.isfinite(weight) or weight <= 0:
            raise ValueError(f"Step weight must be positive and finite: {step['id']}")
    suite_threshold = float(suite.get("aggregation", {}).get("threshold", 1.0))
    if not 0 <= suite_threshold <= 1:
        raise ValueError("Aggregation threshold must be between 0 and 1")


def invoke(entry: dict[str, Any], context: dict[str, Any], timeout_ms: int) -> dict[str, Any]:
    language = entry.get("language")
    if language in {"javascript", "typescript"}:
        command = ["node", str(ROOT / "js_bridge.mjs")]
    elif language == "python":
        command = [sys.executable, str(ROOT / "python_bridge.py")]
    else:
        raise ValueError(f"Unsupported evaluator language: {language}")
    request = {"module": entry["module"], "export": entry.get("export", "evaluate"), "context": context}
    completed = subprocess.run(
        command,
        input=json.dumps(request),
        text=True,
        capture_output=True,
        timeout=timeout_ms / 1000,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.strip() or f"Evaluator exited {completed.returncode}")
    return validate_result(json.loads(completed.stdout))


def run(suite_path: Path, context_path: Path) -> dict[str, Any]:
    suite_path = suite_path.resolve()
    suite = load_yaml(suite_path)
    validate_suite(suite)
    base = json.loads(context_path.read_text(encoding="utf-8"))
    project_root = Path(base["project_root"])
    if not project_root.is_absolute():
        project_root = (context_path.parent / project_root).resolve()
    base["project_root"] = str(project_root)
    base["objective"] = suite["objective"]
    base.setdefault("task", {})["prompts"] = suite.get("inputs", {}).get("prompts", base.get("task", {}).get("prompts", []))

    registry: dict[str, dict[str, Any]] = {}
    registry_digests: dict[str, str] = {}
    for relative in suite.get("registries", []):
        path = (suite_path.parent / relative).resolve()
        loaded, checksum = load_registry(path, project_root)
        duplicates = registry.keys() & loaded.keys()
        if duplicates:
            raise ValueError(f"Duplicate evaluator names: {sorted(duplicates)}")
        registry.update(loaded)
        registry_digests[str(path)] = checksum

    outcomes = []
    fail_fast = bool(suite.get("aggregation", {}).get("fail_fast", False))
    stopped_at: int | None = None
    for index, step in enumerate(suite.get("steps", [])):
        started = time.monotonic()
        threshold = float(step.get("threshold", 1.0))
        required = bool(step.get("required", True))
        require_success = bool(step.get("require_success", True))
        outcome: dict[str, Any] = {
            "id": step["id"], "evaluator": step["evaluator"], "threshold": threshold,
            "weight": float(step.get("weight", 1.0)), "required": required,
        }
        try:
            entry = registry[step["evaluator"]]
            context = deepcopy(base)
            context["step"] = {
                "id": step["id"], "evaluator": step["evaluator"],
                "metadata": step.get("metadata", {}),
            }
            result = invoke(entry, context, int(step.get("timeout_ms", 30_000)))
            outcome.update(status="completed", result=result)
            outcome["passed"] = result["score"] >= threshold and (not require_success or result["success"])
            outcome["evaluator_version"] = entry.get("version")
        except subprocess.TimeoutExpired:
            outcome.update(status="timeout", passed=False, error="Evaluator timed out")
        except Exception as error:
            outcome.update(status="error", passed=False, error=str(error))
        outcome["duration_ms"] = round((time.monotonic() - started) * 1000, 3)
        outcomes.append(outcome)
        if fail_fast and required and not outcome["passed"]:
            stopped_at = index
            break

    if stopped_at is not None:
        for step in suite["steps"][stopped_at + 1:]:
            outcomes.append({
                "id": step["id"], "evaluator": step["evaluator"], "status": "skipped",
                "passed": False, "required": bool(step.get("required", True)),
                "threshold": float(step.get("threshold", 1.0)),
                "weight": float(step.get("weight", 1.0)),
                "duration_ms": 0.0, "reason": "fail_fast",
            })

    completed = [item for item in outcomes if item["status"] == "completed"]
    total_weight = sum(item["weight"] for item in completed)
    score = sum(item["result"]["score"] * item["weight"] for item in completed) / total_weight if total_weight else 0.0
    aggregation = suite.get("aggregation", {})
    required_passed = all(item["passed"] for item in outcomes if item["required"])
    passed = score >= float(aggregation.get("threshold", 1.0))
    if aggregation.get("require_all_required", True):
        passed = passed and required_passed
    return {
        "protocol_version": 1,
        "suite": {"id": suite["id"], "digest": digest(suite_path)},
        "registries": registry_digests,
        "context_digest": digest(context_path),
        "run": base.get("run", {}),
        "objective": suite["objective"],
        "success": passed,
        "score": score,
        "threshold": float(aggregation.get("threshold", 1.0)),
        "steps": outcomes,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("suite", type=Path)
    parser.add_argument("--context", required=True, type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = run(args.suite, args.context)
    rendered = json.dumps(report, indent=2, sort_keys=True) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        sys.stdout.write(rendered)
    raise SystemExit(0 if report["success"] else 1)


if __name__ == "__main__":
    main()
