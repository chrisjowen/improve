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

## Objectives

An objective is a competence area: how good this harness is at some kind of
work. It is the thing a score attaches to, and it lives in
`.harness/objectives.yaml` with a stable id so two suites measuring the same
competence are recognisably about one objective. A suite names it:

```yaml
objective: verified-change
```

An objective embedded in a suite still works, so a repository that has not
adopted a registry keeps functioning; such an objective is reported as
unregistered rather than rejected.

Each objective declares a regime:

- **observed** — graded from what actually happened. There is no
  counterfactual and one reading per run, so a trend can be shown but no
  harness change can be credited with causing it.
- **replayable** — a fixed task that can be re-run against a changed harness,
  which is where baseline-versus-candidate comparison is possible.

### What a score is a score of

A score attaches to **a run**, and each run records the context it covered: a
session transcript, a revision range, or both. That keeps the unit honest
without forcing the objective to choose one shape. A deployment spanning three
sessions is one run over a revision range; five deployments in one session are
five runs over the same transcript with different ranges.

Two states are distinct from a low score and must stay so:

- **not covered** — no suite measures this objective, so it cannot be improved
  deliberately. `status.mjs` reports these as a set difference.
- **not yet encountered** — a suite exists but has never run. There is no
  reading, which is not the same as a reading of zero.

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
