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
| Ask-user findings and the answers that settled them | `data/<task>/*findings*`, paired with the `needs-decision [key=nm-...]` and `resolved` lines in `state/<task>.status` |
| Decisions and blockers, open or resolved, with wait times | `state/<task>.status` |
| Failed launches, recoveries, teardown refusals | status lines whose text names them |
| Stale-worker wakes | `stale` rows in `state/.wake-queue` |
| Review rounds and durations | no-mistakes gate keys and `done` lines per task, with times from `state/fleet-ledger.jsonl` when that ledger is on |
| Captain preferences and corrections | bullets in `data/captain.md` and `data/captain-shared.md` |
| Curated learnings | bullets in `data/learnings.md` |

`repeated` groups the same ask-user finding or the same question across tasks.
A repeat is evidence for a proposal. One occurrence is an anecdote.

Sanitizing: each excerpt passes the shared redaction rules, the home's absolute
path becomes `<home>`, excerpts stop at 160 characters, and paths are relative
to the home. No status log, brief, report, or preference file is copied whole.

Firstmate keeps its wake queue only until wakes are handled, and prints
teardown refusals to the terminal. The import therefore sees only what is still
on disk. Treat zero as "not seen", not "never happened".

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
| `state/` | runtime-state | refused | never: Firstmate's scripts own it |

Tests, CI, and project code are not harness here either. A defect in them is
evidence.

A shared-tracked file is never edited in place, even after approval. The
change goes to the Firstmate repository as a pull request, through Firstmate's
own ship workflow. One proposal changes one side only. A proposal that mixes
captain-private and shared-tracked files fails the check; split it.

Add this block to a Firstmate proposal, beside `scope`:

```yaml
firstmate:
  visibility: captain-private | shared-tracked
  delivery: local-apply | upstream-pr
```

`scripts/proposal-check-cli.mjs` derives both from `scope.files` when the
adapter is on, prints them under `firstmate`, and reports a stated value that
disagrees. It exits 1 for a split proposal or one that touches `state/`.

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
returns the task state and the text after `Captain decision:`. It changes no
proposal. Then:

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
or `every_days` after the last review. The day limit only counts once a review
has run. The SessionStart reminder includes these reasons, and:

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
