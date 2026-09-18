from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import time
import uuid
from pathlib import Path
from typing import Any


def summarize(value: Any) -> dict[str, Any]:
    encoded = json.dumps(value, sort_keys=True, default=str).encode()
    return {"redacted": True, "bytes": len(encoded), "sha256": hashlib.sha256(encoded).hexdigest()}


def normalize_transcript(path: Path, include_content: bool) -> dict[str, Any]:
    messages: list[dict[str, Any]] = []
    tool_calls: list[dict[str, Any]] = []
    agent_calls: list[dict[str, Any]] = []
    events: list[dict[str, Any]] = []
    redactions: list[dict[str, Any]] = []
    malformed = 0

    for index, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            malformed += 1
            continue
        if not isinstance(event, dict):
            malformed += 1
            continue
        event_id = event.get("uuid") or event.get("id") or f"event-{index}"
        event_type = str(event.get("type", "unknown"))
        events.append(event if include_content else {
            "id": event_id,
            "type": event_type,
            "parent_id": event.get("parentUuid") or event.get("parent_id"),
            "timestamp": event.get("timestamp"),
            "keys": sorted(event.keys()),
        })
        message = event.get("message")
        if isinstance(message, dict):
            content = message.get("content", [])
            record = {
                "id": event_id,
                "parent_id": event.get("parentUuid") or event.get("parent_id"),
                "timestamp": event.get("timestamp"),
                "role": message.get("role") or event_type,
                "content": content if include_content else summarize(content),
            }
            messages.append(record)
            blocks = content if isinstance(content, list) else []
            for block in blocks:
                if not isinstance(block, dict):
                    continue
                if block.get("type") == "tool_use":
                    value = block.get("input")
                    tool_calls.append({
                        "id": block.get("id"), "message_id": event_id,
                        "name": block.get("name"),
                        "input": value if include_content else summarize(value),
                    })
                elif block.get("type") == "tool_result":
                    value = block.get("content")
                    tool_calls.append({
                        "tool_use_id": block.get("tool_use_id"), "message_id": event_id,
                        "is_error": bool(block.get("is_error", False)),
                        "result": value if include_content else summarize(value),
                    })
        if "agent" in event_type.lower() or event.get("agentId") or event.get("agent_id"):
            agent_calls.append(event if include_content else {
                "id": event.get("agentId") or event.get("agent_id") or event_id,
                "type": event_type,
                "parent_id": event.get("parentUuid") or event.get("parent_id"),
            })

    if not include_content:
        redactions.append({"scope": "messages, tool inputs/results, raw events", "reason": "content capture not enabled"})
    return {
        "source": {"format": "claude-code-jsonl", "path": str(path), "malformed_lines": malformed},
        "messages": messages,
        "tool_calls": tool_calls,
        "agent_calls": agent_calls,
        "events": events,
        "redactions": redactions,
        "truncated": False,
    }


def git_changes(root: Path, base: str | None, head: str | None, include_patch: bool) -> dict[str, Any]:
    if base:
        range_spec = f"{base}..{head or 'HEAD'}"
        command = ["git", "diff", "--name-status", "--find-renames", range_spec]
        patch_command = ["git", "diff", range_spec]
    else:
        command = ["git", "status", "--porcelain=v1"]
        patch_command = ["git", "diff", "--binary", "HEAD"]
    completed = subprocess.run(command, cwd=root, text=True, capture_output=True, check=True)
    files = []
    for line in completed.stdout.splitlines():
        parts = line.split("\t")
        if len(parts) >= 2:
            files.append({"status": parts[0].strip(), "path": parts[-1]})
        elif len(line) > 3:
            files.append({"status": line[:2].strip(), "path": line[3:]})
    changes: dict[str, Any] = {
        "base_revision": base,
        "head_revision": head,
        "files": files,
    }
    if include_patch:
        changes["patch"] = subprocess.run(
            patch_command, cwd=root, text=True, capture_output=True, check=True
        ).stdout
    return changes


def build_context(args: argparse.Namespace) -> dict[str, Any]:
    root = args.project_root.resolve()
    return {
        "schema_version": 1,
        "project_root": str(root),
        "task": {"id": args.task_id, "prompts": args.prompt},
        "changes": git_changes(root, args.base, args.head, args.include_patch),
        "transcript": normalize_transcript(args.transcript_jsonl.resolve(), args.include_content),
        "run": {
            "id": args.run_id or str(uuid.uuid4()),
            "attempt": args.attempt,
            "captured_at_unix_ms": int(time.time() * 1000),
        },
        "artifacts": [],
        "metadata": {},
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-root", required=True, type=Path)
    parser.add_argument("--transcript-jsonl", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--task-id", required=True)
    parser.add_argument("--prompt", action="append", default=[])
    parser.add_argument("--run-id")
    parser.add_argument("--attempt", type=int, default=1)
    parser.add_argument("--base")
    parser.add_argument("--head")
    parser.add_argument("--include-content", action="store_true")
    parser.add_argument("--include-patch", action="store_true")
    args = parser.parse_args()
    context = build_context(args)
    args.output.write_text(json.dumps(context, indent=2, sort_keys=True) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
