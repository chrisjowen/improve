# Proposal format

```yaml
id: IMP-YYYYMMDD-short-name
title: Short outcome-oriented title
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
  files: []
  systems: []
  permissions_changed: false
intervention:
  summary: smallest coherent change
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
