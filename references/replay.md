# Replay A/B

A proposal says a harness change will help. Replay checks that before anyone
approves it. Real sessions where a person had to correct the agent are run
again, once with the change and once without, and the change is accepted only
when it beats the harness without it by more than the noise.

It runs on `claude plugin eval` (Claude Code 2.1.269 or later). Every run has a
cost ceiling.

## The suite

`.harness/evals/replay/` holds the repository's regression suite. It is built
from what happened in this repository, so it grows as people correct the agent:

```text
.harness/evals/replay/
  suite.json                  every case: its split, where it came from, its checks
  cases/<name>/case.yaml      a claude plugin eval case
  cases/<name>/history.jsonl  the conversation it resumes, redacted
  sealed.json                 which proposals scored the sealed test split
  regression.json             the last regression check
  results/<proposal>/         every eval result, as claude plugin eval wrote it
```

Build or extend it after confirming corrections:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/review-cli.mjs" cluster "${CLAUDE_PROJECT_DIR}"
node "${CLAUDE_PLUGIN_ROOT}/scripts/replay-cli.mjs" export "${CLAUDE_PROJECT_DIR}"
```

`export` makes one case per correction group in `clusters.json`:

- It finds the session where a member of the group was typed, newest first,
  and the person's prompt that started the turn they corrected. That prompt
  becomes the case's prompt.
- The conversation before that prompt becomes `history.jsonl`, which the
  case resumes with `context.history_file`. The prompt runs again as the next
  real turn. At most the last four turns a person started are kept. Thinking
  blocks are dropped, long tool results are cut, and every string passes the
  shared redaction rules. `suite.json` counts what was redacted.
- Graders come from the correction. A named command becomes a `tool_used` or
  `tool_order` check, a file to create becomes `file_exists`, and a thing to
  use becomes a `regex` on the reply. Only when nothing fits does the case
  get an `llm` grader carrying the group's standing rule.

A tool failure that came back in two or more sessions also becomes a case.
The turn that made the failing call is replayed, and the case passes when
the agent does not make that call again. These cases are deterministic.

Each new case joins the validation split or, for about a third of cases, the
sealed test split, by a hash of its name. A case already in the suite keeps its
files and its split, so the suite only grows. `--refresh` rebuilds the files.

Review the cases and the redacted histories before committing them, like any
other file that holds session text.

### What the eval can and cannot see

- The `trace` a grader reads holds the context a SessionStart hook adds, which
  is where a CLAUDE.md lesson rides. A lesson that names a command would pass
  a `trace` check just by being loaded, so no derived grader reads `trace`.
  Tool calls are checked with `tool_used` and `tool_order`, which match
  `input_match` against the tool input as JSON, and the reply with
  `last_message`.
- `claude plugin eval` withholds Bash, Write, Edit, WebFetch and WebSearch
  unless the operator grants them. Unless `replay.allow_tools` grants one, a
  grader that needs it is left out at export, and a case that needs it is
  skipped with that reason. On a machine where the Bash sandbox cannot run (for
  example a Docker credential store holding a symbolic link), leave Bash out.
- An `llm` grader is a model's judgement and is noisy. The first real case
  improve ran scored WITH 0.00 and WITHOUT 0.67 although both arms gave the
  same answer; the judge's votes split. Prefer cases with deterministic
  graders, and let the gate's standard error absorb the rest.

## The candidate

A proposal that can be replayed carries the change, as it would land, beside
its YAML file:

```text
.harness/proposals/IMP-20261121-bun.yaml
.harness/proposals/IMP-20261121-bun.candidate/
  lesson.md          the CLAUDE.md or AGENTS.md text the proposal adds
  skills/ agents/ commands/ hooks/   plugin-shaped, as they would land
  candidate.json     optional: {"workspace": false, "cases": [], "targets": []}
```

Replay packages it as a temporary plugin. Skills, agents, commands and hooks
are copied as they are. Eval runs load no CLAUDE.md, so `lesson.md` becomes a
SessionStart hook that adds the lesson as context, which is how a CLAUDE.md
line reaches the model in a real session.

`candidate.json`:

- `workspace`: true for a change that needs a real checkout, such as a hook
  that runs a linter on edited files. Each run then starts in a fresh checkout
  of the repository at HEAD: a shared local clone, so nothing is added to the
  repository's worktree list.
- `cases`: case names or `*` globs to replay; all cases when empty.
- `targets`: the cases for the corrections this change is meant to stop. The
  measured outcome follows these. `cases` stands in when it is empty.

A symbolic link in the candidate is refused.

## Scoring a proposal

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/replay-cli.mjs" score <proposal> "${CLAUDE_PROJECT_DIR}"
```

Or **Score with replay** on the proposal in the review UI. Scoring is for a
draft or proposed proposal: the verdict is part of what a person approves.

1. When the regression check is due, it runs first (see below).
2. The validation cases run through
   `claude plugin eval --ablation with-without --runs 3 --json --max-cost-usd`,
   once with the candidate plugin and once without it.
3. The gate decides. A run that stopped at its cost ceiling, or a case with
   no score in one arm, is incomplete and never passes.
4. Only when the gate passes, the sealed test split runs, once per proposal,
   with what is left of the cost ceiling. Scoring again later re-runs
   validation and reports the test score from that first run.
5. The verdict is written to the proposal's `replay` block, and every eval
   result is kept under `results/`.

### The gate

A case's WITH and WITHOUT are the means of its runs. Its delta is WITH minus
WITHOUT, and the standard error of that delta comes from the spread of its
runs. A run that errored or timed out counts as 0.

The gate passes when:

- the mean delta over the validation cases is more than `k` standard errors
  above zero (`replay.k`, default 2), and
- no validation case is lower WITH than WITHOUT by more than
  `replay.tolerance` (default 0). A change that helps one case and breaks
  another does not pass on the average.

The `replay` block holds `validation` (cases, with, without, delta, se),
`gate` (verdict, threshold, regressions, reasons), `test`, `per_case`, the
cost, the result files, and `regression_check` (when a check ran or was
skipped because another was already running or ran recently).

## Regression checks

A change that helped when it was approved can stop helping: the model changes,
Claude Code changes, other harness changes land. For every kept change with a
candidate (validated, or approved with `outcome.applied_at`), the regression
check re-runs the validation split with and without it.

It runs:

- when Claude Code reports a `ConfigChange`. The hook records the change and
  starts the check in the background, at most once per
  `replay.regression.min_interval_minutes`;
- before a later proposal is scored, when anything changed since the last
  check;
- on demand: `replay-cli.mjs regress`.

All three share one lock, so only one check runs at a time. Scoring a
proposal while another check is running or ran recently records why it was
skipped instead of running its own; `replay-cli.mjs regress` does the same,
printing why and exiting non-zero.

A kept change that now loses (its delta is below zero, or a case regressed)
gets a rollback proposal drafted: `IMP-<date>-rollback-<id>.yaml`, status
`proposed`, with `rollback_of` naming the change, the regression numbers as
evidence and the change's own rollback steps. Nothing is reverted. A person
decides, and `/improve rollback` does the rest. While a drafted rollback is
open, no second one is drafted.

The whole check is capped by `replay.regression.max_cost_usd`, shared across
the kept changes.

## The measured outcome

After a change lands, its `outcome` block is filled from what happened next:

- `correction recurrence per N sessions`: how often a correction close to the
  targeted group's came back (the same fingerprint, or one sharing
  `replay.outcome.similarity` of its words), per `per_sessions` sessions a
  person ran, in the `window_days` before the change and since;
- `rule compliance in transcripts`: of the sessions where the targeted cases'
  tool-call checks apply, the share that followed them, read from the
  sessions' transcripts.

The conclusion says whether the correction came back less or more often and
whether sessions followed the rule more or less often. It is measured when
Apply in the review UI lands the change, and again in the background at most
every six hours from session start, until `per_sessions` sessions have run
since the change; then the outcome is `settled` and left alone. Run it by hand
with `replay-cli.mjs outcome <proposal>`. A proposal that names no target is
told it was not measured and why.

## Configuration

`.harness/improve.json`:

```json
{
  "replay": {
    "enabled": true,
    "runs": 3,
    "max_cost_usd": 5,
    "model": null,
    "concurrency": 2,
    "k": 2,
    "tolerance": 0,
    "allow_tools": [],
    "regression": { "on_config_change": true, "min_interval_minutes": 60, "max_cost_usd": 2 },
    "outcome": { "per_sessions": 20, "window_days": 30, "similarity": 0.6 }
  }
}
```

A replay run uses the default model unless `model` names one. One real case of
six runs cost about $1.60 on the default model; size `max_cost_usd` to the
suite.
