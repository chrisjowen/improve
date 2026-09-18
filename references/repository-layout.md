# Repository source-of-truth layout

Propose this only after adapting it to the repository. Omit unused sections.

```text
.harness/
  charter.md                 # objectives, constraints, autonomy, outcomes
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
    "every_days": 14,
    "every_sessions": 20,
    "tool_failure_threshold": 3
  },
  "capture": {
    "enabled": true
  },
  "background_dreaming": {
    "enabled": false,
    "every_days": 30,
    "command": "claude"
  }
}
```

Keep background dreaming disabled until the human reviews its command, runtime permissions, cost, data exposure, output location, and stopping conditions.
