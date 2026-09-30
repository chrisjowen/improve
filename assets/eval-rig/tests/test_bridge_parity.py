"""The Python and JavaScript bridges must grade one contract identically.

The rig runs evaluators through two bridges against one boundary,
`evaluate(context) -> result`. If they drift, a score depends on which language
its evaluator happens to be written in and every comparison across suites
becomes unreliable.

Each behaviour below exists in both parity.mjs and parity.py under the same
name. The assertion is not on any particular value but on the two bridges
agreeing.
"""
from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

RIG = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RIG / "runner"))

from eval_runner import run  # noqa: E402

# Behaviours a well-behaved evaluator produces.
VALID = ["plain", "zero", "partial", "empty_notes", "with_metrics", "deferred"]
# Behaviours the runner must reject rather than turn into a zero score. A
# malformed result that became 0.0 would be indistinguishable from a real
# judgement of zero.
REJECTED = ["throws", "score_too_high", "score_not_finite", "missing_score", "not_an_object"]

REGISTRY = """
version: 1
evaluators:
  - name: parity.javascript
    language: javascript
    module: fixtures/parity-evaluators/parity.mjs
    export: evaluate
    version: 1.0.0
    description: JS parity fixture.
    trust: deterministic
  - name: parity.python
    language: python
    module: fixtures/parity-evaluators/parity.py
    export: evaluate
    version: 1.0.0
    description: Python parity fixture.
    trust: deterministic
"""

SUITE = """
version: 1
id: parity-{behaviour}
objective:
  id: bridge-parity
  description: Both bridges grade the same contract.
  success_criteria: [The two bridges agree.]
registries: ['{registry}']
steps:
  - id: javascript
    evaluator: parity.javascript
    threshold: 0.0
    required: false
    require_success: false
    metadata: {{ behaviour: {behaviour} }}
  - id: python
    evaluator: parity.python
    threshold: 0.0
    required: false
    require_success: false
    metadata: {{ behaviour: {behaviour} }}
aggregation: {{ threshold: 0.0, require_all_required: false }}
"""


class BridgeParityTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name).resolve()
        # The runner refuses evaluators outside the project root, so the rig is
        # copied in as a real repository would hold it.
        self.rig = self.root / "evals"
        shutil.copytree(RIG, self.rig, ignore=shutil.ignore_patterns("__pycache__"))
        (self.rig / "registry.yaml").write_text(REGISTRY, encoding="utf-8")
        context = {
            "schema_version": 1,
            "project_root": str(self.root),
            "task": {"id": "t", "prompts": []},
            "changes": {"files": []},
            "transcript": {"messages": [], "tool_calls": [], "agent_calls": [], "events": []},
            "run": {"id": "r", "attempt": 1},
            "artifacts": [],
            "metadata": {},
        }
        self.context = self.root / "context.json"
        self.context.write_text(json.dumps(context), encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def _both(self, behaviour: str):
        suite = self.rig / f"suite-{behaviour}.yaml"
        suite.write_text(
            SUITE.format(behaviour=behaviour, registry=str(self.rig / "registry.yaml")),
            encoding="utf-8",
        )
        report = run(suite, self.context)
        steps = {step["id"]: step for step in report["steps"]}
        return steps["javascript"], steps["python"]

    def test_valid_results_agree(self):
        for behaviour in VALID:
            with self.subTest(behaviour=behaviour):
                js, py = self._both(behaviour)
                self.assertEqual(js["status"], py["status"], "status must match")
                self.assertEqual(js["status"], "completed")
                self.assertEqual(js["result"]["score"], py["result"]["score"], "score must match")
                self.assertEqual(js["result"]["success"], py["result"]["success"], "success must match")
                self.assertEqual(js["result"]["notes"], py["result"]["notes"], "notes must match")
                self.assertEqual(js["passed"], py["passed"], "pass decision must match")

    def test_malformed_results_are_rejected_by_both(self):
        for behaviour in REJECTED:
            with self.subTest(behaviour=behaviour):
                js, py = self._both(behaviour)
                self.assertEqual(js["status"], py["status"], f"{behaviour}: status must match")
                self.assertEqual(js["status"], "error",
                                 f"{behaviour}: a malformed result must be a runner error")
                # A rejection must not look like a judgement of zero.
                self.assertNotIn("result", js, "an errored step carries no result")
                self.assertNotIn("result", py, "an errored step carries no result")
                self.assertFalse(js["passed"])
                self.assertFalse(py["passed"])

    def test_metrics_survive_both_bridges(self):
        js, py = self._both("with_metrics")
        self.assertEqual(js["result"]["metrics"], {"count": 3})
        self.assertEqual(py["result"]["metrics"], {"count": 3})

    def test_an_awaited_result_matches_a_direct_one(self):
        """JS returns a promise and Python a plain dict; both must normalise alike."""
        js, py = self._both("deferred")
        self.assertEqual(js["result"], py["result"])


if __name__ == "__main__":
    unittest.main(verbosity=1)
