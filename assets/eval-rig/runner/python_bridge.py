from __future__ import annotations

import asyncio
import importlib.util
import inspect
import json
import sys


def main() -> None:
    request = json.load(sys.stdin)
    spec = importlib.util.spec_from_file_location("improve_custom_evaluator", request["module"])
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load evaluator: {request['module']}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    evaluator = getattr(module, request.get("export", "evaluate"))
    result = evaluator(request["context"])
    if inspect.isawaitable(result):
        result = asyncio.run(result)
    json.dump(result, sys.stdout, separators=(",", ":"))


if __name__ == "__main__":
    main()
