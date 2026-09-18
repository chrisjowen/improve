# Evaluation and memory

For the concrete evaluator function, registry, suite, context, result, and
aggregation contracts, read [eval-rig.md](eval-rig.md).

## Evaluation strategy

Start with representative repository work, not generic coding puzzles. Include successful historical tasks, regressions, ambiguous requirements, tool failures, and security-sensitive negative cases.

Grade separately:

- functional correctness;
- acceptance-criteria coverage;
- regression avoidance;
- architecture and policy compliance;
- security;
- quality of tests and evidence;
- unnecessary scope;
- human rework;
- cost and latency.

Use deterministic graders first: build, type check, tests, schemas, policy checks, static analysis, diff constraints, and exact artifact validation. Add rubric or pairwise model graders only for qualities such as explanation quality or maintainability, and periodically calibrate them with human review.

Compare repeated trials for:

- no harness or previous baseline;
- current harness;
- proposed change.

Keep hidden or rotating holdouts. Count aborted, timed-out, and over-budget runs. Never permit the candidate harness to edit its own grader or reference answer during a run.

Tie every suite to a charter objective and one or more observable success
criteria. A score without an objective, baseline, target, and evidence is not a
useful success measure. Keep evaluator-native `success` separate from the
configured threshold: the runner decides whether a step passes.

## Memory strategy

Keep distinct stores for:

- raw observations;
- episodic task outcomes;
- candidate learnings;
- approved facts and decisions;
- procedures and skills;
- preferences with their scope;
- rejected and superseded claims.

Every durable assertion should carry source, evidence, scope, authority, confidence, freshness, validity, status, and ownership.

Use this promotion lifecycle:

```text
observation -> candidate -> corroborated proposal -> approved canonical assertion
            -> monitored outcome -> reinforce, revise, supersede, or invalidate
```

Begin with Git-governed Markdown/YAML/JSONL. Use SQLite or DuckDB as a disposable local projection when structured querying becomes useful. Add full-text, vector, graph, containers, or services only when a demonstrated retrieval, relationship, permission, concurrency, or scale requirement cannot be met more simply.

Memory may inform a proposal. It may not override security policy, authorization, canonical evidence, or required human approval.
