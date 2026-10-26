# Proposal format

```yaml
id: IMP-YYYYMMDD-short-name
title: The harness change, e.g. "Run mix credo after the agent edits an Elixir file"
layer: instructions | skills | hooks | permissions | tools | context | memory | evaluation | delegation
status: draft | proposed | approved | applying | validated | rejected | rolled-back
owner: person-or-team
created_at: ISO-8601
review_by: ISO-8601
objective: repository outcome improved
hypothesis: falsifiable statement
confidence: low | medium | high
evidence:
  - source: file, trace, issue, review, or metric
    observation: concise finding
scope:
  files: []      # harness files only: CLAUDE.md, AGENTS.md, .claude/, .mcp.json, .harness/
  systems: []
  permissions_changed: false
intervention:
  summary: what the agent does today, the file you change, and what it does after
  alternatives:
    - do nothing
    - smaller or different intervention
evaluation:
  baseline: current measurement or method
  candidate: measurement after change
  pass_conditions: []
  regression_conditions: []
risks: []
cost:
  implementation: estimate
  runtime: estimate
rollout: staged application plan
rollback: exact reversal and trigger
approval:
  approved_by: null
  approved_at: null
outcome:
  measurements: []
  conclusion: null
```

Accompany the metadata with a human-readable explanation and an exact or previewable diff. Do not mark a proposal approved from model inference, prior generic authorization, or an unattended job.

`scope.files` lists harness files only. If the change you want is to application code, tests, CI, or dependencies, you have found evidence, not a proposal. See "What the harness is" in `SKILL.md`.

Write every prose field by [writing.md](writing.md), and run `scripts/proposal-check-cli.mjs` on the file before showing it.
