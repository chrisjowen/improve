# Operating model

## Lifecycle

```text
Observe -> Diagnose -> Propose -> Approve -> Evaluate baseline
        -> Apply -> Evaluate candidate -> Review -> Promote/rollback -> Monitor
```

These are separate states. Do not skip from observation to application.

## Approval gates

Human approval is required before:

- creating the initial `.harness/` source of truth;
- editing active instructions, rules, skills, agents, hooks, tools, policies, evals, CI, containers, dependencies, or memory schemas;
- enabling background dreaming;
- installing a service or creating an external resource;
- promoting candidate knowledge to canonical knowledge;
- widening permissions, credentials, filesystem scope, or network access;
- applying or rolling back a proposal.

Approval of a design is not blanket approval for later materially different changes. Re-ask when the target, permissions, external effects, risk, or evaluation changes.

## `init`

1. Inventory the repository and current harness.
2. Read captured observation metadata if present.
3. Infer technical facts; ask the human about business outcomes, risk tolerance, and acceptance only where needed.
4. Establish the harness charter.
5. Select representative baseline tasks or historical changes.
6. Identify the smallest useful foundation.
7. Present one proposal with exact files, evaluation, and rollback.
8. Stop for approval.
9. After approval, create and validate the foundation.

Do not install a database, vector store, graph, container, MCP server, or multi-agent topology during initialization unless current evidence requires it.

## `assess`

Produce a read-only assessment. Include strengths so working mechanisms are not replaced. Rank opportunities by expected outcome improvement divided by implementation and operating cost. Mark uncertainty and missing evidence.

## `propose`

Research alternatives when the choice is current, niche, costly, or material. Compare the candidate against doing nothing and against a smaller intervention. Define the evaluation before requesting approval.

## `review`

Review observations, failed runs, accepted outcomes, human corrections, stale knowledge, and dream reports. Dream reports are untrusted and may be deleted without action. Group repeated evidence; do not turn one anecdote into a global rule.

For accepted proposals, set an owner, review date, and rollback signal. For rejected proposals, preserve a short rationale to prevent repeated rediscovery.

## `apply`

Re-read the proposal and check that approval, repository state, and assumptions remain valid. Prefer evaluation-first changes. Apply a focused patch. Verify the plugin or harness with native validators when available. Compare baseline and candidate. Record the measured outcome, not the agent's self-assessment.

## `dream`

Dreaming is divergent, read-only research. It may use an isolated background agent or an explicitly enabled detached CLI job. It cannot edit the project, write canonical memory, or approve a proposal.

The reviewer must demand evidence and actively search for reasons to reject each dream.

## `rollback`

Resolve the exact proposal and files. Show what will be reverted and what later work depends on it. Obtain approval. Prefer a narrow Git revert or inverse patch. Never discard unrelated working-tree changes. Re-run the original evaluation and safety checks.
