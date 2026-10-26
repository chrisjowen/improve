# Review UI — as built

Status: **implemented**. This records what was built and why, after the fact.
The 2026-10 runner and layout revision is summarised under "Revision" at the end.

The UI is a local review surface for three things the harness already produces or
can produce: proposals, objective scores, and evaluation runs.

## Why it exists

`/improve` generates proposals through model reasoning during a session and
writes them as YAML per `references/proposal-format.md`. Reading a directory of
YAML files in a terminal is a poor way to compare several proposals, and there
was no way at all to see an objective's score move over time. The UI addresses
both without adding a new source of truth.

## Shape

One SvelteKit app in `ui/`, whose `+server.js` routes are the API. There is no
second process: the page and its data come from the same origin, and `/api/*`
answers that origin only.

```
ui/src/lib/server/    paths, proposals, results, evaluate, skills, jobs
ui/src/routes/        six pages and the API
ui/src/lib/components Pill, Notice, Diff, JobCard, LogView, Trend, StepBars, ScoreChart
scripts/run-process.mjs  process runner: timeout, cancel, process-group kill, log
scripts/spawn-agent.mjs  shared read-only agent runner, streamed
scripts/dream.mjs        one background review, used by the hook worker and the UI
scripts/ui.mjs           start/stop/status launcher; explains missing dependencies
```

Stack: SvelteKit 2 with Svelte 5 runes, `@sveltejs/adapter-node`, D3 for charts,
`yaml` for proposals. shadcn's design tokens are hand-rolled in `app.css` rather
than pulled in with Tailwind and the generator; the component set is small
enough that the dependency would cost more than it saves.

## Data layer

Files only, no database. Every path is the one the layout reference already
specifies, except the results index, which is new.

| Path | Access |
| --- | --- |
| `.harness/proposals/*.yaml` | read; status updated on apply or reject |
| `.harness/decisions/*.yaml` | appended on apply or reject |
| `.harness/evals/suites/*.yaml` | read |
| `.harness/evals/results/index.jsonl` | appended, one line per run |
| `.harness/evals/results/<run>.json` | written, the full report |
| `.claude/skills/<name>/SKILL.md` | written only on explicit apply |

### The results index

`eval_runner.py` writes one report per run, and `results/` is disposable, so
there was nowhere to read a score history from. One JSONL line per run —
`run_id, suite_id, objective_id, rig_version, score, success, occurred_at,
report_path` — makes a trend expressible without parsing every report. It
matches the shape `events.jsonl` already uses.

### Objectives stay derived

An objective is read from the `objective` block of each suite, not from a
registry. A registry is the larger objectives-first change described in
`2026-09-18-objectives-first-design-notes.md`; the UI should not front-run it.

`encountered` is a first-class state: an objective with no runs reads as "not yet
encountered" rather than as a zero. `trend` is the difference between the last
two readings, or `null` when there is only one.

## Skill drafting

Drafting runs a background `claude -p` through `scripts/spawn-agent.mjs`:

```
--disallowed-tools Edit Write NotebookEdit MultiEdit
--output-format json
```

The agent returns `{name, description, body}`, which is stored on the proposal.
Nothing reaches `.claude/skills/` until the human applies the reviewed diff.
Invariant 5 (approval before changing an active instruction) and invariant 10
(a background job may draft but not edit) both hold, and they hold because of a
flag rather than because of a sentence in a prompt.

This also fixed the existing dream worker, which restricted itself with prose
only and now shares the same module and returns structured findings instead of
freeform Markdown.

## Deliberate constraints

**Evaluations run only when asked.** No schedule, no batch runs. An observed
objective cannot be replayed, so a background score would be meaningless.

**One job at a time per lane**, per repository: one evaluation and one agent job
(draft or background review). A second job in a busy lane gets 409 naming the
job in the way. A single lane let a ten-minute draft block every evaluation.

**No authentication**, for a single user on their own machine. The server is
local only by default (it binds `127.0.0.1`), the API is same-origin only (no
CORS headers), and cross-origin writes are refused: any `/api/*` request other
than `GET` or `HEAD` gets 403 unless its `Origin`, or else its `Referer`,
matches the server's own origin. Binding another host is an explicit choice
(`--host` or `HOST`), and it exposes an unauthenticated server that can run
evaluations and paid agent runs; a suite's `core.command` evaluator executes
declared `argv`, so it also grants code execution. `ui/README.md` states this
plainly. Path containment is enforced regardless, so a request cannot reach
outside `.harness/` and `.claude/skills/`.

**Dependencies are not bundled.** `node_modules` is gitignored, so a fresh
install cannot run the UI. `scripts/ui.mjs` detects this and prints the install
commands instead of failing with a module-resolution error, and `SKILL.md` tells
the agent to do the same.

## Verified end to end

Against a scratch git repository with the rig copied into `.harness/evals` and
one seeded proposal, using a stub agent:

- `GET /api/status` reports the project, `harness_initialized`, and rig drift
- a real evaluation ran through `POST /api/runs`, scoring 1.0 across five steps
- two runs produced a two-point history; `trend` computed from the index
- a second concurrent job was refused with 409
- `draft-skill` produced a draft and **wrote nothing** to the repository
- `diff` showed it as a new file; `apply` wrote the skill, recorded an approved
  decision with its rationale, and moved the proposal to `validated`
- `GET /api/proposals/..%2F..%2Fetc%2Fpasswd` returned 400 `unsafe id`
- the server bound `*:5199`, and CORS preflight returned the expected headers

Tests: `ui/tests/` covers path containment, the agent output contract, the data
layer including trend arithmetic, and the draft-diff-apply round trip.

## Not built

No multi-repo view, no objective
editing, no auth, no proposal creation from the UI. Creating a proposal needs a
`/improve` session or a background agent, which is where proposals come from by
design.

## Revision (2026-10)

Exercising every path against a demo repository found the runner unreliable in
ways the first build's tests did not cover. Fixed, each with a regression test:

- an agent's failure reason (auth, budget, turns) is read from the CLI's result
  envelope instead of being reported as "agent exited 1";
- agents the plugin starts no longer fire its own hooks, which had counted their
  prompts as corrections and their runs as sessions;
- the launcher builds on first use and starts the server in the background, and
  the status CLI and UI find the plugin data directory without the hook-only
  environment variable;
- evaluation errors (missing revision, Python, PyYAML) are stated plainly with
  the next step; a structure-only run no longer claims no verification ran;
- jobs have progress, cancel, a log, and records that survive a restart, and
  timeouts stop the whole process tree;
- the production build no longer fails every skill diff on a data file read
  relative to a bundled module.

The layout moved to a left sidebar with Overview, Proposals (list and detail,
approve or reject with a reason), Background findings, Evaluations, Objectives,
and Runs. Approving a proposal without a skill draft records the decision only;
`/improve apply` applies it.

