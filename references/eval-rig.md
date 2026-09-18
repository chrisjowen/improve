# Evaluation rig protocol

## Purpose

Turn repository objectives into repeatable evidence. A suite names an objective,
provides task inputs, runs registered evaluators, applies configured thresholds,
and emits a machine-readable report that can be compared with a baseline.

The protocol is language-neutral:

```text
evaluate(context) -> result
```

JavaScript and TypeScript may return the result or a promise. Python may return
the result or an awaitable. Evaluators receive no positional or keyword
arguments besides the context. Per-step settings are placed in
`context.step.metadata`.

## Evaluation context

The versioned context contains:

- `project_root`: absolute repository root;
- `objective`: objective id, description, and observable success criteria;
- `task`: case id and the user/system prompts being evaluated;
- `changes`: base/head revisions, changed-file records, and an optional patch;
- `transcript`: ordered, normalized messages, tool calls, agent calls, and events;
- `run`: run id, attempt, timing, harness/model identity, budgets, and environment;
- `artifacts`: named paths or structured outputs produced by the run;
- `step`: current step id, evaluator name, and YAML metadata;
- `metadata`: suite- or caller-defined JSON values.

The transcript should retain call ids, parent ids, timestamps, tool names,
arguments, summarized results, errors, durations, token/cost data when
available, and message roles. Redact secrets and sensitive content before the
evaluator process starts. Raw prompts, tool output, or environment variables
must be explicit opt-ins. Record truncation and redaction so missing evidence is
not mistaken for success.

The starter's `runner/build_context.py` converts a Claude Code JSONL transcript
and Git state into this context. It captures structure and content digests by
default. Full message/tool content and full patches require separate explicit
flags, because evaluation evidence can otherwise become an ungoverned secret or
personal-data store.

Paths are repository-relative except `project_root`. Treat the context and
repository as untrusted input. Evaluators should be read-only unless a separate,
explicitly approved evaluation sandbox permits mutation.

## Evaluation result

Every completed evaluator returns:

- `success`: its native boolean conclusion;
- `score`: finite number from `0.0` through `1.0`;
- `notes`: actionable human-readable strings;
- optional `metadata`: arbitrary JSON;
- optional `evidence`: structured file, transcript, command, or artifact refs;
- optional `metrics`: named finite numbers.

The runner validates and normalizes results. Exceptions, malformed output,
timeouts, and process failures become runner errors; they never become a zero
score that looks like a valid evaluator judgment.

## Registry

Use a checked-in YAML manifest rather than language annotations. A manifest is
discoverable without importing untrusted code, works identically across
languages, and provides a stable name independent of a file path.

Each entry declares `name`, `language`, `module`, optional `export`, `version`,
description, owner, and trust classification. Names are unique across all loaded
registries. Relative modules resolve from their registry file. Reject duplicate
names, missing files, unsupported languages, and modules that escape the
repository root.

Custom registries are passed explicitly by path. Loading a registry is code
execution authority, so never auto-discover evaluator files from the repository.

## Suite YAML

A suite declares:

- suite id and version;
- the charter objective, baseline, and success criteria it measures;
- task prompts and optional fixtures;
- registry paths;
- ordered evaluation steps;
- aggregation and budget policy.

Each step supplies an evaluator name, threshold, weight, whether it is required,
whether evaluator-native `success` is required, timeout, and metadata. The
runner injects this metadata into the context.

A step passes when:

```text
score >= threshold AND (require_success is false OR success is true)
```

The suite score is the weighted mean of completed step scores. The suite passes
only when its score reaches `aggregation.threshold`, every required step passes,
and no configured budget is exceeded. Errors and timeouts fail required steps.
Reports must include all step outcomes, including skipped, errored, timed-out,
and over-budget steps.

## Comparability and governance

- Save protocol version, suite digest, registry digest, evaluator versions,
  revision, harness identity, model identity, attempt, and seed in every report.
- Compare distributions over repeated trials, not only one run.
- Track acceptance rate, human rework, regressions, cost, and latency alongside
  evaluator scores.
- Pin or record model graders and periodically calibrate them against human
  labels. Do not let an LLM judge be the sole gate for deterministic claims.
- Keep graders and reference artifacts outside the candidate's writable scope.
- Version changes to objectives, cases, thresholds, weights, prompts, and
  evaluators. A changed suite starts a new comparable series unless explicitly
  backfilled.

## Starter

`assets/eval-rig/` contains schemas, language bindings, a runner, example
registry and suite, deterministic file/grep checks, an argv-form command check,
and an adapter-neutral LLM judge. Copy and adapt it only after approval; do not
install its dependencies, enable model access, or execute custom evaluators
without reviewing them.
