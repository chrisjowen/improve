# improve UI

A local review surface for the harness: the proposals `/improve` has produced,
the objectives those proposals target, and the evaluations that score them.

## Install and run

The plugin ships without `node_modules`, so install once before first use:

```bash
cd ui
npm install          # or: bun install
```

Then, from the plugin root:

```bash
node scripts/ui.mjs start /path/to/repo     # build if needed, start in the background
node scripts/ui.mjs status /path/to/repo    # URL, pid and log
node scripts/ui.mjs stop /path/to/repo
```

`start` returns once the server answers and prints its URL and log file. It
binds `127.0.0.1:5173` by default, so only this machine can reach it; pass
`--port` to change the port. Binding another host (`--host` or `HOST`) is an
explicit choice; read [No authentication](#no-authentication) first. The repository
defaults to `IMPROVE_PROJECT_DIR`, then `CLAUDE_PROJECT_DIR`, then the current
directory. The build is redone when the UI or `scripts/` sources change.

For work on the UI itself, `node scripts/ui.mjs dev /path/to/repo` runs the Vite
dev server in the foreground.

| Variable | Purpose |
| --- | --- |
| `IMPROVE_PROJECT_DIR` | Repository to read and write. Falls back to `CLAUDE_PROJECT_DIR`. |
| `CLAUDE_PLUGIN_DATA` | Where the hooks keep observations. Found on disk under `~/.claude/plugins/data/` when unset. |
| `CLAUDE_PLUGIN_ROOT` | Plugin location, used to compare eval-rig versions. |
| `IMPROVE_AGENT_COMMAND` | Command for the drafting and background-review agent. Defaults to `claude`. |
| `IMPROVE_PYTHON` | Python interpreter for the eval rig. Defaults to `python3`. |

## Runs

Evaluations, skill drafts and background reviews run as jobs. Each job has a
record and a log in the project's plugin data directory (`jobs/`), so it
survives leaving the page and a server restart; a job cut off by a restart is
shown as interrupted. The Runs page shows live progress, the log, and a Cancel
button. Cancel and timeouts stop the whole process tree. One evaluation and one
agent job can run at the same time; a second of the same kind is refused with
the name of the one in the way.

## What it reads and writes

| Path | Access |
| --- | --- |
| `.harness/proposals/*.yaml` | read, and status updated on apply or reject |
| `.harness/decisions/*.yaml` | appended when you apply or reject |
| `.harness/evals/suites/*.yaml` | read |
| `.harness/evals/results/index.jsonl` | appended, one line per run |
| `.harness/evals/results/<run>.json` | written, the full report |
| `.claude/skills/<name>/SKILL.md` | written only when you approve a draft |
| plugin data `projects/<id>/jobs/` | run records and logs |

Nothing appears until `/improve` has run in the repository. An empty UI means
the harness has no proposals yet, not that the UI is broken.

## Design constraints

**Evaluations run only when asked.** An observed objective cannot be replayed,
so nothing is scored in the background and no suite runs on a schedule.

**The drafting agent holds no write tools.** A skill is drafted by a background
`claude -p` invocation started with `--disallowed-tools Edit Write NotebookEdit`,
and the draft is returned as data. Only an explicit Apply writes to
`.claude/skills/`, which keeps the plugin's rule that a background job may draft
but never mutate the harness.

**A score is a trend, not a cause.** An observed objective has no
counterfactual, so the charts show movement over runs and never attribute it to
a particular harness change.

## No authentication

There is none, by choice, for a single user on their own machine. Instead:

- The server is local only by default: it binds `127.0.0.1`.
- The API is same-origin only. It sends no CORS headers, so another site's page
  cannot read its answers.
- Cross-origin writes are refused. Any `/api/*` request other than `GET` or
  `HEAD` gets 403 unless its `Origin` header (or, without one, its `Referer`)
  is this server's own origin. That covers starting evaluations, drafts and
  background reviews, approving, rejecting and applying, importing and
  dismissing findings, and cancelling jobs.

Binding another host with `--host` or `HOST` exposes an unauthenticated server
to everyone who can reach it. They can read the repository's proposals and
session-transcript previews, run evaluations, and start paid agent runs. A
suite's `core.command` evaluator executes the `argv` it declares, so they can
also execute code in the repository. Do not bind another host on a shared or
untrusted network.

Path containment is enforced on every filesystem route regardless, so a request
cannot read or write outside `.harness/` and `.claude/skills/`.

## Tests

```bash
node --test tests/
```

Covers path containment, the agent output contract, the data layer including
trend arithmetic, the draft-diff-apply round trip against a stub agent, jobs
(errors, cancel, restart), and the launcher against a real production build.
