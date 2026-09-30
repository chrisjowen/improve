# Repository source-of-truth layout

Propose this only after adapting it to the repository. Omit unused sections.

```text
.harness/
  charter.md                 # objectives, constraints, autonomy, outcomes
  objectives.yaml            # competence areas with stable ids, referenced by suites
  improve.json               # cadence and passive-capture configuration
  inventory.yaml             # current harness components and owners
  roadmap.md                 # ranked evidence-backed opportunities
  decisions/                 # approved/rejected harness decisions
  proposals/                 # pending and completed proposals
  evals/
    suites/                  # objective-linked YAML suite definitions
    registry.yaml            # stable evaluator names to implementations
    evaluators/              # JS, TS, or Python evaluate(context) functions
    sdk/                     # shared input/output types and validation
    runner/                  # orchestration and language bridges
    tasks/                   # representative cases and fixtures
    results/                 # normally generated or separately retained
  memory/
    observations/            # append-only or ignored raw observations
    candidates/              # unapproved extracted learnings
    knowledge/               # reviewed facts, decisions, procedures
    schemas/                 # assertion and entity definitions
  generated/                 # disposable indexes and compiled projections

.claude/
  CLAUDE.md                  # small always-relevant bootstrap, if needed
  rules/                     # scoped instructions
  skills/                    # repository-specific evaluated skills
  agents/                    # repository-specific specialists
  settings.json              # project hook/policy configuration
```

The `.harness/` tree is the governed source. Generated SQLite, DuckDB, search, vector, or graph indexes must be rebuildable. Repository-specific Claude files may be authored directly at first; introduce compilation only when multiple harness targets or drift make it worthwhile.

Recommended initial `improve.json`:

```json
{
  "schema_version": 1,
  "review": {
    "every_days": 90,
    "every_sessions": 20,
    "tool_failure_threshold": 3,
    "every_tool_calls": 400,
    "correction_threshold": 5,
    "repeated_correction_threshold": 2
  },
  "capture": {
    "enabled": true,
    "corrections": true
  },
  "background_dreaming": {
    "enabled": false,
    "every_days": 30,
    "command": "claude"
  }
}
```

Review cadence is measured in opportunities rather than calendar time wherever
possible: `every_tool_calls`, `correction_threshold` and
`repeated_correction_threshold` advance only when work happens, so a repository
nobody is touching never reports itself overdue. `every_days` remains as a
long-stop and fires only once a review has actually happened.

`capture.corrections` controls the `UserPromptSubmit` hook that records stated
corrections. It is the only path that keeps prompt text, and every excerpt
passes the shared redaction rules before it is written.

Keep background dreaming disabled until the human reviews its command, runtime permissions, cost, data exposure, output location, and stopping conditions.
