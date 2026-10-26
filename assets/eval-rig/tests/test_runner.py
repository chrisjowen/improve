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
    def _run_example(self, context: dict) -> dict:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "context.json"
            path.write_text(json.dumps(context))
            return run(ROOT / "suites/example.yaml", path)

    def _good_context(self) -> dict:
        context = json.loads((ROOT / "fixtures/context.json").read_text())
        context["project_root"] = str(ROOT)
        context["changes"]["files"] = [
            {"path": "README.md", "status": "modified"},
            {"path": "tests/test_runner.py", "status": "modified"},
        ]
        return context

    def test_example_suite(self) -> None:
        report = self._run_example(self._good_context())
        self.assertTrue(report["success"], report)
        self.assertEqual(report["score"], 1.0)

    def test_example_suite_fails_without_agent_involvement(self) -> None:
        """The suite must be incapable of passing on a repository nobody worked in.

        The previous version of this suite scored 1.0 on an untouched
        repository, which made its passing score meaningless.
        """
        context = self._good_context()
        context["transcript"] = {
            "messages": [], "tool_calls": [], "agent_calls": [], "events": []
        }
        report = self._run_example(context)
        self.assertFalse(report["success"], "an empty transcript must not pass")

    def test_example_suite_fails_without_verification(self) -> None:
        context = self._good_context()
        context["transcript"]["tool_calls"] = [
            call for call in context["transcript"]["tool_calls"] if call["name"] != "Bash"
        ]
        report = self._run_example(context)
        self.assertFalse(report["success"], "unverified work must not pass")

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

    def test_structure_only_capture_does_not_claim_no_verification_ran(self) -> None:
        """A digest is not evidence of absence.

        Without content capture every tool input is a digest, so a session that
        ran `npm test` used to fail with "no verification command ... was run".
        The check still fails, for lack of evidence, but the note says why.
        """
        context = self._good_context()
        for call in context["transcript"]["tool_calls"]:
            if call.get("name") == "Bash":
                call["input"] = {"redacted": True, "bytes": 20, "sha256": "0" * 64}
        report = self._run_example(context)
        step = next(s for s in report["steps"] if s["id"] == "grounded-and-verified")
        messages = [item["message"] for item in step["result"]["evidence"]]
        self.assertFalse(step["passed"])
        self.assertTrue(any("digests only" in m for m in messages), messages)
        self.assertFalse(any("no verification command" in m for m in messages), messages)
        self.assertTrue(any("not captured" in note for note in step["result"]["notes"]))

    def test_progress_lines_only_when_asked(self) -> None:
        import contextlib
        import io
        import os
        quiet, loud = io.StringIO(), io.StringIO()
        with contextlib.redirect_stderr(quiet):
            self._run_example(self._good_context())
        os.environ["IMPROVE_EVAL_PROGRESS"] = "1"
        try:
            with contextlib.redirect_stderr(loud):
                self._run_example(self._good_context())
        finally:
            del os.environ["IMPROVE_EVAL_PROGRESS"]
        self.assertEqual(quiet.getvalue(), "")
        events = [json.loads(line)["improve_progress"] for line in loud.getvalue().splitlines()]
        self.assertEqual([e["state"] for e in events], ["running", "completed", "running", "completed"])
        self.assertEqual(events[0]["total"], 2)

    def test_bad_revision_fails_with_gits_message(self) -> None:
        import subprocess
        from runner.build_context import git_changes
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            subprocess.run(["git", "init", "-q"], cwd=root, check=True)
            with self.assertRaises(SystemExit) as raised:
                git_changes(root, "nope~3", None, False)
        message = str(raised.exception.code)
        self.assertIn("git diff failed", message)
        self.assertIn("nope~3", message)


class ObjectiveRegistryTest(unittest.TestCase):
    """A suite may name its objective by id so two suites can share one."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name).resolve()
        self.harness = self.root / ".harness"
        self.suites = self.harness / "evals" / "suites"
        self.suites.mkdir(parents=True)
        import shutil
        shutil.copytree(ROOT, self.harness / "evals", dirs_exist_ok=True,
                        ignore=shutil.ignore_patterns("__pycache__", "tests"))
        (self.harness / "objectives.yaml").write_text(
            "version: 1\n"
            "objectives:\n"
            "  - id: verified-change\n"
            "    description: Work is grounded and verified.\n"
            "    regime: observed\n"
            "    success_criteria:\n"
            "      - The agent verified its work.\n",
            encoding="utf-8",
        )
        (self.root / "README.md").write_text("# r\n", encoding="utf-8")
        context = {
            "schema_version": 1,
            "project_root": str(self.root),
            "task": {"id": "t", "prompts": []},
            "changes": {"files": [{"path": "README.md", "status": "M"}]},
            "transcript": {"messages": [], "tool_calls": [], "agent_calls": [], "events": []},
            "run": {"id": "r", "attempt": 1},
            "artifacts": [],
            "metadata": {},
        }
        self.context = self.root / "context.json"
        self.context.write_text(json.dumps(context), encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def _suite(self, body: str) -> Path:
        path = self.harness / "evals" / "suites" / "s.yaml"
        path.write_text(body, encoding="utf-8")
        return path

    def test_objective_resolved_from_the_registry(self):
        suite = self._suite(
            "version: 1\n"
            "id: by-reference\n"
            "objective: verified-change\n"
            "registries: ['../registry.yaml']\n"
            "steps:\n"
            "  - id: readme\n"
            "    evaluator: core.file-exists\n"
            "    metadata: { paths: [README.md] }\n"
            "aggregation: { threshold: 1.0 }\n"
        )
        report = run(suite, self.context)
        self.assertEqual(report["objective"]["id"], "verified-change")
        self.assertEqual(report["objective"]["regime"], "observed")
        self.assertTrue(report["success"])

    def test_unknown_objective_id_is_rejected(self):
        suite = self._suite(
            "version: 1\n"
            "id: bad-reference\n"
            "objective: does-not-exist\n"
            "registries: ['../registry.yaml']\n"
            "steps:\n"
            "  - id: readme\n"
            "    evaluator: core.file-exists\n"
            "    metadata: { paths: [README.md] }\n"
            "aggregation: { threshold: 1.0 }\n"
        )
        with self.assertRaisesRegex(ValueError, "Unknown objective id"):
            run(suite, self.context)

    def test_embedded_objective_still_works(self):
        """A repository that has not adopted a registry keeps functioning."""
        suite = self._suite(
            "version: 1\n"
            "id: embedded\n"
            "objective:\n"
            "  id: inline-objective\n"
            "  description: Declared in the suite.\n"
            "  success_criteria: [Something.]\n"
            "registries: ['../registry.yaml']\n"
            "steps:\n"
            "  - id: readme\n"
            "    evaluator: core.file-exists\n"
            "    metadata: { paths: [README.md] }\n"
            "aggregation: { threshold: 1.0 }\n"
        )
        report = run(suite, self.context)
        self.assertEqual(report["objective"]["id"], "inline-objective")


if __name__ == "__main__":
    unittest.main()
