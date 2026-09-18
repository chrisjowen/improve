# Harness model

Assess each layer only to the depth justified by the repository.

| Layer | Desired property | Typical evidence |
| --- | --- | --- |
| Outcomes | Measures accepted delivery, not activity | accepted PRs, rework, defects, lead time, cost |
| Task contract | Intent, constraints, non-goals, acceptance, proof | issues, specs, examples, review feedback |
| Instructions | Small, specific, non-conflicting, scoped | `CLAUDE.md`, rules, managed settings |
| Context | Task-specific, evidenced, permission-aware | retrieval traces, missed dependencies, token use |
| Knowledge | Governed facts with authority and freshness | ADRs, catalogs, source revisions, provenance |
| Memory | Observations separated from canonical learning | correction history, outcomes, promotion records |
| Skills | Narrow expert workflows with evaluations | triggers, procedures, skill evals, usage outcomes |
| Tools | Typed, narrow, observable, safe side effects | schemas, errors, dry-run, audit, retries |
| Hooks | Fast deterministic enforcement and capture | lifecycle coverage, latency, failures, recursion guards |
| Execution | Inspect, plan, change, verify, review | traces, diffs, test evidence, assumption changes |
| Delegation | Used only when separability or independence helps | merge cost, conflicts, reviewer defect detection |
| Runtime | Least privilege and real isolation | workspace, network, credentials, process boundaries |
| Verification | Cheapest strong deterministic evidence first | compiler, tests, scans, plans, screenshots |
| Evaluation | Representative tasks and outcome graders | baseline trials, holdouts, regressions, variance |
| Observability | Explains context, tools, failures, cost, outcomes | traces, event records, failure taxonomy |
| Reliability | Resumable, bounded, cancellable, reversible | checkpoints, timeouts, budgets, rollback |
| Governance | Versioned, owned, reviewable, portable | Git history, owners, manifests, lockfiles |
| Evolution | Evidence-driven and approval-gated | proposals, decisions, canaries, rollback signals |

## Common anti-patterns

- giant permanent instruction files;
- retrieving everything for every task;
- treating vector search or model memory as truth;
- writing raw prompts, source, secrets, or tool output into telemetry;
- self-promoting memories or rules;
- skills without realistic evaluations;
- model judges as the only proof of correctness;
- multiple agents editing the same files;
- expensive LLM hooks on hot lifecycle paths;
- broad tools with implicit side effects;
- background jobs that can mutate the live harness;
- adding infrastructure before proving a query or scale requirement;
- measuring token production rather than accepted changes.
