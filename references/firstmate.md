# Firstmate adapter

Firstmate is an orchestration harness: a supervisor session, worker sessions,
an always-loaded `AGENTS.md` contract, skills, `bin/` scripts, and a private
home of `data/`, `state/` and `config/` records. This adapter lets `/improve`
study a Firstmate home and propose changes to Firstmate's own harness. Every
invariant in `SKILL.md` still holds. The adapter adds evidence and routing. It
never applies anything.

Code: `adapters/firstmate/`. Entry point:

```bash
node "${CLAUDE_PLUGIN_ROOT}/adapters/firstmate/cli.mjs" <command> --project "${CLAUDE_PROJECT_DIR}"
```

## When it is on

Both conditions must hold:

1. A Firstmate home is detected. Detection checks, in order,
   `adapters.firstmate.home` in `.harness/improve.json`, then `FM_HOME`, then
   the project root when its `AGENTS.md` opens with `# Firstmate`.
2. `.harness/improve.json` opts in:

```json
{
  "adapters": {
    "firstmate": {
      "enabled": true,
      "home": null,
      "repo": "firstmate",
      "route_reviews": true,
      "periodic_review": { "enabled": false, "every_tasks": 20, "every_days": 7 }
    }
  }
}
```

`detect` reports both. While either is false, every other command exits 3 and
reads nothing. Creating or changing this file needs approval like any other
`.harness/` change.

## Evidence

`import` reads the home and prints sanitized observations. It writes nothing
under the home. `--save` also stores the result in the plugin data directory,
where `status` summarizes it.

| Signal | Read from |
| --- | --- |
| Each task's status history | `state/<task>.status` while the task runs, and the `task.status` records in `state/fleet-ledger.jsonl` once teardown has retired that log |
| Ask-user findings and the answers that settled them | `data/<task>/*findings*`, paired with the `needs-decision [key=nm-...]` gate line that names the file and the `resolved` line that closed it |
| Decisions and blockers, open or closed, with wait times and how each closed (answered by firstmate, resolved by the worker, captain-held, raised again, or ended by `done`) | the status history, folded the way `bin/fm-classify-lib.sh` folds it |
| Failed launches, recoveries, teardown refusals | status lines whose text names them; a `failed` line before the worker first reported; relaunch progress notes in `data/<task>/brief.md` |
| Stale and stuck workers | delivered stale wakes (`reason=actionable-stale` in `state/.watch-cycle-exits.log`), `stale` rows still in `state/.wake-queue`, stale panes absorbed in `state/.watch-triage.log`, and the watcher's `.stale-*` and `.wedge-escalations-*` markers |
| Process-event sources that failed to launch | `state/.seen-procevent-*` markers |
| Review rounds and durations | no-mistakes gate keys and `done` lines per task, with times from `state/fleet-ledger.jsonl` when that ledger is on |
| Captain preferences and corrections | bullets in `data/captain.md` and `data/captain-shared.md` |
| Curated learnings | bullets in `data/learnings.md` |

`repeated` groups the same ask-user finding or the same question across tasks.
A repeat is evidence for a proposal. One occurrence is an anecdote.

Sanitizing: each excerpt passes the shared redaction rules, the home's absolute
path becomes `<home>`, excerpts stop at 160 characters, and paths are relative
to the home. No status log, brief, report, or preference file is copied whole.

Firstmate prints teardown refusals to the terminal, and tasks that finished
before the fleet ledger was turned on (`config/fleet-ledger`) have no status
history left. `history.tasks_without_history` counts those tasks. The import
sees only what is still on disk. Treat zero as "not seen", not "never
happened".

## Surfaces

`inventory` measures what an assessment looks at: `AGENTS.md` lines, bytes and
estimated tokens against `config/startup-memory-budget`, skill sizes and
description lengths, the script count, and the private home files.
`AGENTS.md` is loaded into every Firstmate session. Weigh any proposal that
grows it against that budget, and prefer moving text into a skill that loads
only when needed.

Each file a proposal changes has a surface and a visibility:

| Files | Surface | Visibility | Delivery after approval |
| --- | --- | --- | --- |
| `AGENTS.md`, `CLAUDE.md` | contract | shared-tracked | upstream PR |
| `.agents/skills/`, `.claude/` | skill, claude-config | shared-tracked | upstream PR |
| `skills/` | public-skill | shared-tracked | upstream PR |
| `bin/fm-brief*.sh` | brief-scaffold | shared-tracked | upstream PR |
| `bin/` | script | shared-tracked | upstream PR |
| `docs/*.md` | docs | shared-tracked | upstream PR |
| `data/captain.md`, `data/learnings.md`, other `data/` | captain-preferences, learnings, home-data | captain-private | `/improve apply`, locally |
| `config/brief-include.md`, other `config/` | brief-include, home-config | captain-private | `/improve apply`, locally |
| `.harness/` | improve-record | captain-private | `/improve apply`, locally |
| `CLAUDE.local.md` | contract | captain-private | `/improve apply`, locally |
| `.claude/settings.local.json` | claude-config | captain-private | `/improve apply`, locally |
| `state/` | runtime-state | refused | never: Firstmate's scripts own it |
| any other file the default check counts as harness: `.mcp.json`, nested `CLAUDE.md` or `AGENTS.md`, other agents' config | agent-config | shared-tracked | upstream PR |

Tests, CI, and project code are not harness here either. A defect in them is
evidence.

A shared-tracked file is never edited in place, even after approval. The
change goes to the Firstmate repository as a pull request, through Firstmate's
own ship workflow. One proposal changes one side only. A proposal that mixes
captain-private and shared-tracked files fails the check; split it.

A proposal does not state its visibility or delivery.
`scripts/proposal-check-cli.mjs` derives both from `scope.files` when the
adapter is on and prints them under `firstmate`. It exits 1 for a split
proposal or one that touches `state/`.

## Review routing

Inside a Firstmate home, `/improve review` files each `proposed` proposal as a
captain-held Firstmate task. Wheelhouse then shows it as a decision. Routing
uses only the home's own scripts:

1. `bin/fm-tasks-axi.sh show improve-<id>` checks whether the task exists.
2. `bin/fm-captain-hold.sh hold improve-<id> --title ... --reason ... --repo <repo>`
   creates and holds it. The reason names the proposal file, the surfaces, the
   visibility, and how an approved change is delivered.

```bash
node "${CLAUDE_PLUGIN_ROOT}/adapters/firstmate/cli.mjs" route --project "${CLAUDE_PROJECT_DIR}"          # dry run
node "${CLAUDE_PLUGIN_ROOT}/adapters/firstmate/cli.mjs" route --apply --project "${CLAUDE_PROJECT_DIR}"  # file them
```

The dry run prints each command and runs none. Show it to the human, then run
`--apply` only after they agree to file. `.harness/firstmate/routed.json`
records what was filed, so an unchanged proposal is not filed twice. Drafts,
decided proposals, and proposals that fail the scope check are skipped and the
reason is printed.

Routing never answers, closes, or releases a task. The captain answers through
Firstmate, which records the captain's words in the task.

## Reading the answer and applying

```bash
node "${CLAUDE_PLUGIN_ROOT}/adapters/firstmate/cli.mjs" decisions --apply --project "${CLAUDE_PROJECT_DIR}"
```

This runs `bin/fm-tasks-axi.sh show <task> --full` for each filed proposal and
returns the task state and the text after the latest `Captain decision:`.
Answers recorded before the proposal was last filed belong to an older
version and are not returned. It changes no proposal. Then:

- When `proposal_changed_since_filing` is true, the proposal was edited after
  the captain last saw it. Route it again; do not apply it on the old answer.
- The captain's words approve only when they explicitly approve that proposal
  id. Anything else is a rejection, a deferral, or a question; record it as
  such and do not apply.
- On explicit approval, set `approval.approved_by` to the captain and name the
  Firstmate task id. Then run `/improve apply <proposal>` as usual.
- `local-apply`: apply edits the captain-private file through the normal
  revalidate, evaluate, and record steps.
- `upstream-pr`: do not edit the file. Report that the approved change needs a
  Firstmate pull request, and give the patch so Firstmate can dispatch it. The
  review UI refuses to apply a skill in a Firstmate home for the same reason.

## Periodic review

Off by default. With `periodic_review.enabled`, a review is due after
`every_tasks` new task briefs (`data/<task>/brief.md`) since the last review,
or `every_days` after the last review. Before the first review, both count
from when the SessionStart hook or `due` first saw it enabled, recorded as
`enabled_at` in `.harness/firstmate/review-state.json`. When they see it
turned off, they clear `enabled_at`, so turning it on again starts afresh. The SessionStart reminder includes these reasons, and:

```bash
node "${CLAUDE_PLUGIN_ROOT}/adapters/firstmate/cli.mjs" due --project <home>       # exit 0 when due
node "${CLAUDE_PLUGIN_ROOT}/adapters/firstmate/cli.mjs" reviewed --project <home>  # after a review
```

Firstmate can run `due` on its own schedule and dispatch `/improve review` when
it exits 0. Wiring that into Firstmate is a change to Firstmate's harness, so
it is itself a proposal.

## Never

- Never point tests or demos at a real Firstmate home. `tests/fixtures/firstmate-home`
  is synthetic.
- Never write under `state/`, and never edit shared-tracked Firstmate files in
  place.
- Never treat imported observations as rules, or a captain-held task as
  approval until the captain's recorded words say so.
