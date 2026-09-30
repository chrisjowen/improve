"""The challenge runner must call a suite that cannot fail a failure."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

RIG = Path(__file__).resolve().parents[1]
RUNNER = RIG / "runner"
sys.path.insert(0, str(RUNNER))

from challenge import apply_mutations, challenge, merge  # noqa: E402

GOOD_TRANSCRIPT = {
    "messages": [{"id": "m1", "role": "assistant"}],
    "tool_calls": [
        {"id": "t1", "name": "Read", "input": {"file_path": "src/a.js"}},
        {"id": "t2", "name": "Write", "input": {"file_path": "src/a.js"}},
        {"id": "t3", "name": "Bash", "input": {"command": "npm test"}},
    ],
    "agent_calls": [],
    "events": [],
}


def write_context(root: Path, transcript=None) -> Path:
    context = {
        "schema_version": 1,
        "project_root": str(root),
        "task": {"id": "t", "prompts": []},
        "changes": {"files": [{"path": "src/a.js", "status": "M"},
                              {"path": "tests/a.test.js", "status": "M"}]},
        "transcript": transcript if transcript is not None else GOOD_TRANSCRIPT,
        "run": {"id": "r", "attempt": 1},
        "artifacts": [],
        "metadata": {},
    }
    path = root / "context.json"
    path.write_text(json.dumps(context), encoding="utf-8")
    return path


INSENSITIVE_SUITE = """
version: 1
id: insensitive
objective:
  id: obj
  description: Checks only that a file exists.
  success_criteria: [A README exists.]
registries: ['{registry}']
steps:
  - id: readme
    evaluator: core.file-exists
    threshold: 1.0
    required: true
    metadata: {{ paths: [README.md] }}
challenge:
  must_fail:
    - id: no-agent-involvement
      description: An empty transcript must not pass.
      context:
        transcript: {{ messages: [], tool_calls: [], agent_calls: [], events: [] }}
aggregation: {{ threshold: 1.0 }}
"""

SENSITIVE_SUITE = """
version: 1
id: sensitive
objective:
  id: obj
  description: Grades the agent's work from the transcript.
  success_criteria: [The agent verified its work.]
registries: ['{registry}']
steps:
  - id: evidence
    evaluator: core.transcript-evidence
    threshold: 1.0
    required: true
    metadata: {{ require_read_before_edit: true, require_verification: true }}
challenge:
  must_fail:
    - id: no-agent-involvement
      description: An empty transcript must not pass.
      context:
        transcript: {{ messages: [], tool_calls: [], agent_calls: [], events: [] }}
aggregation: {{ threshold: 1.0 }}
"""

NO_CHALLENGE_SUITE = """
version: 1
id: unchallenged
objective:
  id: obj
  description: Declares no challenge.
  success_criteria: [Something.]
registries: ['{registry}']
steps:
  - id: readme
    evaluator: core.file-exists
    threshold: 1.0
    metadata: {{ paths: [README.md] }}
aggregation: {{ threshold: 1.0 }}
"""


class ChallengeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        # resolve() mirrors build_context.py; on macOS /var is a symlink to /private/var
        self.root = Path(self.tmp.name).resolve()
        (self.root / "README.md").write_text("# readme\n", encoding="utf-8")
        (self.root / "src").mkdir()
        (self.root / "src" / "a.js").write_text("x\n", encoding="utf-8")
        self.context = write_context(self.root)
        # The runner refuses to load an evaluator from outside the project root,
        # so the rig is copied in exactly as a real repository would hold it.
        self.rig = self.root / ".harness" / "evals"
        self.rig.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(RIG, self.rig, ignore=shutil.ignore_patterns("tests", "__pycache__"))
        self.registry = str(self.rig / "registry.yaml")

    def tearDown(self):
        self.tmp.cleanup()

    def _suite(self, template: str, name: str) -> Path:
        path = self.root / f"{name}.yaml"
        path.write_text(template.format(registry=self.registry), encoding="utf-8")
        return path

    def test_insensitive_suite_has_a_surviving_mutant(self):
        """A suite grading repository state passes on an empty transcript, so it fails."""
        report = challenge(self._suite(INSENSITIVE_SUITE, "insensitive"), self.context)
        self.assertFalse(report["ok"])
        self.assertEqual(report["survivors"], ["no-agent-involvement"])
        self.assertTrue(report["cases"][0]["survived"])
        self.assertEqual(report["cases"][0]["score"], 1.0)

    def test_sensitive_suite_detects_the_fault(self):
        report = challenge(self._suite(SENSITIVE_SUITE, "sensitive"), self.context)
        self.assertTrue(report["ok"], report)
        self.assertEqual(report["survivors"], [])
        self.assertTrue(report["cases"][0]["detected"])

    def test_absent_challenge_is_not_a_pass(self):
        """Declaring no cases leaves sensitivity unknown, which is not success."""
        report = challenge(self._suite(NO_CHALLENGE_SUITE, "unchallenged"), self.context)
        self.assertFalse(report["ok"])
        self.assertIn("no challenge", report["error"])

    def test_shipped_example_suite_passes_its_own_challenge(self):
        report = challenge(self.rig / "suites" / "example.yaml", self.context)
        self.assertTrue(report["ok"], report)
        self.assertEqual(report["survivors"], [])

    def test_merge_overlays_without_mutating_the_base(self):
        base = {"transcript": {"messages": [1], "tool_calls": [2]}, "keep": True}
        merged = merge(base, {"transcript": {"messages": []}})
        self.assertEqual(merged["transcript"]["messages"], [])
        self.assertEqual(merged["transcript"]["tool_calls"], [2], "unlisted keys survive")
        self.assertTrue(merged["keep"])
        self.assertEqual(base["transcript"]["messages"], [1], "the base is untouched")

    def test_mutations_run_in_a_copy(self):
        target = apply_mutations(self.root, {"delete": ["README.md"]})
        self.assertFalse((target / "README.md").exists())
        self.assertTrue((self.root / "README.md").exists(), "the live tree is never mutated")

    def test_mutation_path_cannot_escape(self):
        with self.assertRaises(ValueError):
            apply_mutations(self.root, {"write": {"../escaped.md": "x"}})

    def test_cli_exit_code_reports_survivors(self):
        suite = self._suite(INSENSITIVE_SUITE, "cli")
        result = subprocess.run(
            [sys.executable, str(RUNNER / "challenge.py"), str(suite), "--context", str(self.context)],
            capture_output=True, text=True,
            env={"PYTHONPATH": str(RUNNER), "PATH": os.environ.get("PATH", "/usr/bin:/bin")},
        )
        self.assertEqual(result.returncode, 1, result.stderr)
        self.assertIn("no-agent-involvement", result.stdout)

    def test_a_broken_toolchain_is_not_a_detection(self):
        """A missing interpreter must not make an insensitive suite look sensitive.

        Without this guard the evaluator crashes, the suite fails, and the
        challenge reads the failure as the fault being caught.
        """
        suite = self._suite(INSENSITIVE_SUITE, "broken")
        result = subprocess.run(
            [sys.executable, str(RUNNER / "challenge.py"), str(suite), "--context", str(self.context)],
            capture_output=True, text=True,
            # No node on PATH, so the javascript evaluator cannot run.
            env={"PYTHONPATH": str(RUNNER), "PATH": "/usr/bin:/bin"},
        )
        report = json.loads(result.stdout)
        case = report["cases"][0]
        self.assertFalse(case["detected"], "a crash is not a detection")
        self.assertFalse(case["survived"], "nor is it a survival")
        self.assertIn("did not grade", case["error"])
        self.assertEqual(report["errors"], ["no-agent-involvement"])
        self.assertFalse(report["ok"], "an inconclusive challenge is not a pass")


if __name__ == "__main__":
    unittest.main(verbosity=1)
