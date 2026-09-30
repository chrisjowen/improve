"""Apply the shared egress rule set to text before it is persisted.

The same JSON rule file the JavaScript side consumes, so a secret class is
defined once. Redaction is recorded rather than silent: the replacement names
the rule that fired and the caller receives the tally.
"""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

RULES_FILE = Path(__file__).resolve().parents[1] / "redaction-rules.json"


@lru_cache(maxsize=4)
def load_rules(file: Path = RULES_FILE):
    document = json.loads(Path(file).read_text(encoding="utf-8"))
    rules = []
    for rule in document.get("rules", []):
        flags = re.IGNORECASE if "i" in (rule.get("flags") or "") else 0
        rules.append((rule["category"], rule["name"], re.compile(rule["pattern"], flags)))
    return tuple(rules)


def redact(text, rules=None):
    """Returns (text, redactions). An empty list means nothing matched.

    Every rule is matched against the original text in one pass and the
    substitutions applied together. Replacing rule by rule would let a later
    rule match an earlier rule's marker -- generic_assignment matches
    "[REDACTED:secret:github_token]" -- and cascade into corrupted output. On
    overlap the earlier rule in the file wins.
    """
    if not isinstance(text, str) or not text:
        return text or "", []
    rules = rules if rules is not None else load_rules()

    spans = []
    for index, (category, name, pattern) in enumerate(rules):
        for match in pattern.finditer(text):
            if match.start() == match.end():
                continue
            spans.append((match.start(), -match.end(), index, category, name))
    spans.sort()

    counts = {}
    pieces = []
    cursor = 0
    for start, negative_end, _index, category, name in spans:
        end = -negative_end
        if start < cursor:
            continue
        pieces.append(text[cursor:start])
        pieces.append(f"[REDACTED:{category}:{name}]")
        entry = counts.setdefault(name, {"rule": name, "category": category, "count": 0})
        entry["count"] += 1
        cursor = end
    pieces.append(text[cursor:])

    return "".join(pieces), list(counts.values())


def has_secret(text, rules=None) -> bool:
    if not isinstance(text, str):
        return False
    rules = rules if rules is not None else load_rules()
    return any(pattern.search(text) for _, _, pattern in rules)
