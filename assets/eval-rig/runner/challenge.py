#!/usr/bin/env python3
"""Mutation-test a suite against faults it declares it must detect.

A suite that cannot fail is not evidence. Each `challenge.must_fail` case is a
plausible wrong input; the suite is run against it and is expected to fail. A
case that *passes* is a surviving mutant, which means the suite cannot detect a
fault it was written to detect.

This tests sensitivity to declared faults. It does not prove the suite is
complete, and it is not a sandbox: mutations run in a disposable copy of the
context, and filesystem mutations in a disposable copy of the tree.
"""
from __future__ import annotations

import argparse
import copy
import json
import shutil
import sys
import tempfile
from pathlib import Path

import yaml

from eval_runner import load_yaml, run

MAX_CASES = 16


def merge(base: dict, overlay: dict) -> dict:
    """Overlay wins; nested dicts merge so a case can replace one field."""
    result = copy.deepcopy(base)
    for key, value in overlay.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = merge(result[key], value)
        else:
            result[key] = copy.deepcopy(value)
    return result


def apply_mutations(root: Path, mutate: dict) -> Path:
    """Copy the tree and mutate the copy. The live tree is never touched."""
    scratch = Path(tempfile.mkdtemp(prefix="improve-challenge-"))
    target = scratch / root.name
    shutil.copytree(root, target, symlinks=True, ignore=shutil.ignore_patterns(".git", "node_modules"))
    for relative in mutate.get("delete", []) or []:
        candidate = (target / relative).resolve()
        if target.resolve() not in candidate.parents and candidate != target.resolve():
            raise ValueError(f"mutation path escapes the copy: {relative}")
        if candidate.is_dir():
            shutil.rmtree(candidate, ignore_errors=True)
        elif candidate.exists():
            candidate.unlink()
    for relative, contents in (mutate.get("write") or {}).items():
        candidate = (target / relative).resolve()
        if target.resolve() not in candidate.parents:
            raise ValueError(f"mutation path escapes the copy: {relative}")
        candidate.parent.mkdir(parents=True, exist_ok=True)
        candidate.write_text(contents, encoding="utf-8")
    return target


def challenge(suite_path: Path, context_path: Path) -> dict:
    suite = load_yaml(suite_path)
    cases = ((suite.get("challenge") or {}).get("must_fail") or [])
    if not cases:
        return {
            "protocol_version": 1,
            "suite": suite.get("id"),
            "ok": False,
            "error": "the suite declares no challenge.must_fail cases, so its sensitivity is unknown",
            "cases": [],
        }
    if len(cases) > MAX_CASES:
        raise ValueError(f"at most {MAX_CASES} challenge cases, got {len(cases)}")

    base_context = json.loads(context_path.read_text(encoding="utf-8"))
    outcomes = []

    for case in cases:
        mutated = merge(base_context, case.get("context") or {})
        scratch_root = None
        if case.get("mutate"):
            scratch_root = apply_mutations(Path(base_context["project_root"]), case["mutate"])
            mutated["project_root"] = str(scratch_root)

        temp = Path(tempfile.mkstemp(prefix="improve-ctx-", suffix=".json")[1])
        temp.write_text(json.dumps(mutated), encoding="utf-8")
        try:
            report = run(suite_path, temp)
            passed = bool(report.get("success"))
            # A step that errored or timed out did not grade anything. Without
            # this, a missing interpreter makes every suite look sensitive: the
            # evaluator crashes, the suite "fails", and the fault reads as
            # detected. Infrastructure failure is unavailable as evidence.
            broken = [
                {"id": step.get("id"), "status": step.get("status"), "error": step.get("error")}
                for step in report.get("steps", [])
                if step.get("status") not in ("completed", "skipped")
            ]
            if broken:
                outcomes.append({
                    "id": case["id"],
                    "description": case.get("description"),
                    "survived": False,
                    "detected": False,
                    "error": f"{len(broken)} step(s) did not grade: {broken}",
                    "score": report.get("score"),
                })
            else:
                outcomes.append({
                    "id": case["id"],
                    "description": case.get("description"),
                    # A surviving mutant is a suite failure, so invert the reading.
                    "survived": passed,
                    "detected": not passed,
                    "score": report.get("score"),
                })
        except Exception as error:  # a runner error is not a detection
            outcomes.append({
                "id": case["id"],
                "description": case.get("description"),
                "survived": False,
                "detected": False,
                "error": f"{type(error).__name__}: {error}",
            })
        finally:
            temp.unlink(missing_ok=True)
            if scratch_root is not None:
                shutil.rmtree(scratch_root.parent, ignore_errors=True)

    survivors = [o for o in outcomes if o["survived"]]
    errored = [o for o in outcomes if o.get("error")]
    return {
        "protocol_version": 1,
        "suite": suite.get("id"),
        "objective": (suite.get("objective") or {}).get("id"),
        # Infrastructure errors are unavailable as evidence either way.
        "ok": not survivors and not errored,
        "cases": outcomes,
        "survivors": [o["id"] for o in survivors],
        "errors": [o["id"] for o in errored],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("suite", type=Path)
    parser.add_argument("--context", required=True, type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = challenge(args.suite, args.context)
    rendered = json.dumps(report, indent=2, sort_keys=True) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        sys.stdout.write(rendered)
    raise SystemExit(0 if report["ok"] else 1)


if __name__ == "__main__":
    main()
