from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from runner.eval_runner import run, validate_result
from runner.build_context import normalize_transcript
from evaluators.llm_judge import evaluate as evaluate_judge


class EvalRigTest(unittest.TestCase):
    def test_example_suite(self) -> None:
        context = json.loads((ROOT / "fixtures/context.json").read_text())
        context["project_root"] = str(ROOT)
        context["changes"]["files"] = [{"path": "README.md", "status": "modified"}]
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "context.json"
            path.write_text(json.dumps(context))
            report = run(ROOT / "suites/example.yaml", path)
        self.assertTrue(report["success"])
        self.assertEqual(report["score"], 1.0)

    def test_rejects_invalid_score(self) -> None:
        with self.assertRaisesRegex(ValueError, "between 0 and 1"):
            validate_result({"success": True, "score": 1.2, "notes": []})

    def test_llm_judge_command_protocol(self) -> None:
        adapter = "import json; print(json.dumps({'success': True, 'score': .9, 'notes': ['ok']}))"
        context = {
            "project_root": str(ROOT),
            "objective": {}, "task": {}, "changes": {}, "transcript": {}, "artifacts": [],
            "step": {"metadata": {
                "adapter_argv": [sys.executable, "-c", adapter],
                "rubric": "Return a calibrated score.",
            }},
        }
        result = evaluate_judge(context)
        self.assertTrue(result["success"])
        self.assertEqual(result["score"], 0.9)

    def test_transcript_capture_is_redacted_by_default(self) -> None:
        event = {
            "uuid": "m1",
            "type": "assistant",
            "message": {"role": "assistant", "content": [
                {"type": "tool_use", "id": "t1", "name": "Read", "input": {"file": "secret"}}
            ]},
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "transcript.jsonl"
            path.write_text(json.dumps(event) + "\n")
            transcript = normalize_transcript(path, include_content=False)
        self.assertTrue(transcript["tool_calls"][0]["input"]["redacted"])
        self.assertNotIn("secret", json.dumps(transcript))


if __name__ == "__main__":
    unittest.main()
