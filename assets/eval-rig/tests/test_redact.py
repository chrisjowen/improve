"""The egress rule set must fire in both languages, identically."""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

RIG = Path(__file__).resolve().parents[1]
PLUGIN = RIG.parents[1]
sys.path.insert(0, str(RIG / "runner"))

from redact import has_secret, load_rules, redact  # noqa: E402

# One sample per rule. A rule with no sample here is a rule nobody checks.
SAMPLES = {
    "aws_access_key_id": "key AKIAIOSFODNN7EXAMPLE here",
    "aws_secret_access_key": 'aws_secret_access_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"',
    "private_key_block": "-----BEGIN RSA PRIVATE KEY-----\nMIIE\n",
    "github_token": "ghp_1234567890abcdefghijklmnopqrstuvwx",
    "slack_token": "xoxb-123456789012-abcdefghijkl",
    "bearer_token": "Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456",
    "anthropic_key": "sk-ant-api03-abcdefghijklmnopqrstuvwxyz",
    "openai_key": "sk-abcdefghijklmnopqrstuvwxyz0123456789AB",
    "google_api_key": "AIzaSyA1234567890abcdefghijklmnopqrstuv",
    "jwt": "eyJhbGciOiJIUzI1NiIs.eyJzdWIiOiIxMjM0NTY3.SflKxwRJSMeKKF2QT4",
    "generic_assignment": 'password: "hunter2hunter2"',
    "url_with_credentials": "postgres://admin:s3cretpw@db.internal:5432/app",
    "email_address": "someone@example.com",
    "home_directory": "/Users/someone/repo/src/a.js",
}


class RedactionTests(unittest.TestCase):
    def test_every_rule_has_a_sample(self):
        names = {name for _, name, _ in load_rules()}
        self.assertEqual(names, set(SAMPLES), "every rule needs a sample, and vice versa")

    def test_each_rule_fires_and_names_itself(self):
        for name, sample in SAMPLES.items():
            with self.subTest(rule=name):
                text, redactions = redact(sample)
                self.assertTrue(redactions, f"{name} did not fire")
                fired = {entry["rule"] for entry in redactions}
                self.assertIn(name, fired, f"{name} did not report itself")
                # The replacement must name the rule so redaction is auditable.
                self.assertIn(f":{name}]", text)
                self.assertTrue(has_secret(sample))

    def test_clean_text_is_untouched(self):
        clean = "Run the suite with pytest -q and read src/a.js for context."
        text, redactions = redact(clean)
        self.assertEqual(text, clean)
        self.assertEqual(redactions, [])
        self.assertFalse(has_secret(clean))

    def test_every_occurrence_is_replaced(self):
        text, redactions = redact("AKIAIOSFODNN7EXAMPLE and AKIAIOSFODNN7EXAMPLF")
        self.assertNotIn("AKIA", text)
        count = next(e["count"] for e in redactions if e["rule"] == "aws_access_key_id")
        self.assertEqual(count, 2)

    def test_empty_and_non_string_input(self):
        self.assertEqual(redact("")[0], "")
        self.assertEqual(redact(None)[0], "")
        self.assertFalse(has_secret(None))

    def test_javascript_agrees_with_python(self):
        """One rule file, two consumers. Drift would leak in one language only."""
        with tempfile.TemporaryDirectory() as directory:
            script = Path(directory) / "probe.mjs"
            script.write_text(
                "import { redact } from %r;\n"
                "const samples = JSON.parse(process.argv[2]);\n"
                "const out = {};\n"
                "for (const [name, sample] of Object.entries(samples)) {\n"
                "  const r = redact(sample);\n"
                "  out[name] = { text: r.text, rules: r.redactions.map((x) => x.rule).sort() };\n"
                "}\n"
                "process.stdout.write(JSON.stringify(out));\n"
                % str(PLUGIN / "scripts" / "redact.mjs"),
                encoding="utf-8",
            )
            result = subprocess.run(
                [_node(), str(script), json.dumps(SAMPLES)],
                capture_output=True, text=True,
            )
        self.assertEqual(result.returncode, 0, result.stderr)
        js = json.loads(result.stdout)
        for name, sample in SAMPLES.items():
            with self.subTest(rule=name):
                py_text, py_redactions = redact(sample)
                self.assertEqual(js[name]["text"], py_text, f"{name}: redacted text differs")
                self.assertEqual(
                    js[name]["rules"],
                    sorted(e["rule"] for e in py_redactions),
                    f"{name}: which rules fired differs",
                )


def _node() -> str:
    import shutil
    node = shutil.which("node")
    if not node:
        raise unittest.SkipTest("node is not on PATH")
    return node


if __name__ == "__main__":
    unittest.main(verbosity=1)
