from __future__ import annotations

import subprocess
from pathlib import Path
from typing import Any


def evaluate(context: dict[str, Any]) -> dict[str, Any]:
    config = context["step"]["metadata"]
    argv = config.get("argv")
    if not isinstance(argv, list) or not argv or not all(isinstance(item, str) for item in argv):
        raise ValueError("step.metadata.argv must be a non-empty string array")
    root = Path(context["project_root"]).resolve()
    cwd = (root / config.get("cwd", ".")).resolve()
    if not cwd.is_relative_to(root):
        raise ValueError("command cwd escapes project root")
    timeout = float(config.get("command_timeout_seconds", 25))
    completed = subprocess.run(
        argv,
        cwd=cwd,
        text=True,
        capture_output=True,
        timeout=timeout,
        check=False,
        env=None,
    )
    expected = config.get("expected_exit_codes", [0])
    if not isinstance(expected, list) or not all(isinstance(code, int) for code in expected):
        raise ValueError("expected_exit_codes must be an integer array")
    success = completed.returncode in expected
    limit = int(config.get("capture_characters", 4000))
    return {
        "success": success,
        "score": 1.0 if success else 0.0,
        "notes": [f"Command exited {completed.returncode}; expected {expected}."],
        "evidence": [{
            "kind": "command",
            "message": "Captured command output",
            "data": {
                "argv": argv,
                "exit_code": completed.returncode,
                "stdout": completed.stdout[-limit:],
                "stderr": completed.stderr[-limit:],
                "truncated": len(completed.stdout) > limit or len(completed.stderr) > limit,
            },
        }],
        "metrics": {"exit_code": float(completed.returncode)},
    }
