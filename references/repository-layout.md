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
    "tool_failure_rate": 0.05,
    "min_tool_calls": 300,
    "correction_rate": 2,
    "min_sessions": 5,
    "repeated_correction_sessions": 3,
    "every_days": 90
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

A review is due when a rate crosses its threshold, counted since the last
review. A total that only grows is never a trigger on its own, because every
repository with any activity would stay due for good:

- `tool_failure_rate`: the share of tool calls that failed, once there have
  been `min_tool_calls` calls;
- `correction_rate`: candidate corrections per session a person ran, once there
  have been `min_sessions` such sessions;
- `repeated_correction_sessions`: one correction, grouped by shared words, came
  up in this many separate sessions.

Sessions that a program launched (`claude -p`, a Firstmate worker)
count as work but not as a person's sessions, and they are never told a review
is due. `every_days` is a long-stop that fires only once a review has happened.
`node scripts/review-cli.mjs reviewed` records a review and starts the counts
again.

`capture.corrections` controls the `UserPromptSubmit` hook that records
candidate corrections. It is the only path that keeps prompt text, and every
excerpt passes the shared redaction rules before it is written. It skips
prompts a program wrote: every prompt in a session a program launched,
background-task notifications, and known launch and collector templates.

A Firstmate home adds an `adapters.firstmate` block, off by default; see
[firstmate.md](firstmate.md). The adapter keeps its routing ledger and review
state under `.harness/firstmate/`.

Keep background dreaming disabled until the human reviews its command, runtime permissions, cost, data exposure, output location, and stopping conditions.
