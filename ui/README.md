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
| `IMPROVE_AGENT_COMMAND` | Command for the drafting, background-review and apply agent. Defaults to `claude`. |
| `IMPROVE_PYTHON` | Python interpreter for the eval rig. Defaults to `python3`. |
| `ORIGIN` | Public URL when served through a proxy or on another host. Its host is accepted, and writes must come from it. |
| `IMPROVE_ALLOWED_HOSTS` | Extra comma-separated host names the API answers to. |

## Runs

Evaluations, skill drafts, background reviews and apply runs run as jobs. Each job has a
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
| a proposal's `scope.files` | written only by an apply run you confirmed |
| branch `improve/<id>` | created by Prepare upstream change, in a Firstmate home |
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

**Apply runs `/improve apply` and checks what it did.** An approved proposal
has an Apply button. It shows exactly which files the run will change and
starts nothing until you confirm. The run is `claude -p "/improve apply <id>"`
with `--permission-mode acceptEdits`: the same recheck, change and evaluation
as in Claude Code. Its `--allowedTools` holds exactly the commands the
proposal's `evaluation.commands` declares, plus improve's own proposal check;
the confirm lists them, and an evaluation that needs any other command fails
the run and names it instead of widening permissions. It runs with
`--setting-sources ""` and `--plugin-dir` set to this plugin, so allow rules
from your user, project and local settings do not apply. Nor does anything
else in them: an `env`, `apiKeyHelper` or provider setup (such as Bedrock,
Vertex or `ANTHROPIC_BASE_URL`) that lives only in `~/.claude/settings.json`
does not reach an apply run. Set those as environment variables in the shell
that starts the UI instead. The request must carry
the proposal's digest, the confirmed files and commands, and a token minted
when the server started, so an edited proposal or a stale tab is refused.
Afterwards the server compares the files itself, by content, including files
that were already uncommitted. If the run fails, its evaluation fails, or it
changes a file you did not confirm, the confirmed files are put back and
anything else it changed is named. That includes this proposal,
`.harness/improve.json` and the `.harness/` files its evaluation reads: the
files it names, and every file under a directory it names, including files
added there. These are checked even when git ignores them, and a named
directory holding more than 500 files refuses the plan. What the evaluation
writes is output, not input, and may change: anything under
`.harness/evals/results/` and the `.harness/` paths listed in its
`evaluation.outputs`, which the confirm step lists. An output that is or
contains an input (this proposal, `improve.json`, `.harness/evals` itself, the
suite, a runner or other path a command reads, or another path the evaluation
names) refuses the plan. In a command, only a long flag's value such as
`--out <path>` can be an output; the script it runs, a path after a short flag
such as `-u`, and a `--suite` value are always inputs. Paths mentioned in
`baseline` or `candidate` are inputs.
In a Firstmate worktree those outputs are not copied, so the evaluation can
write them. The UI's own records (other proposals, decisions) are exempt too. Other changes git cannot see, in ignored files
outside the confirmed list, are not detected; outside a git repository nothing
outside the confirmed files can be checked, and the result says so.

In a Firstmate home, shared-tracked files are never edited in place. The button
reads Prepare upstream change: the run works in a separate git worktree on a new
branch `improve/<id>`, and a passing change is committed there. The worktree
receives read-only copies of the proposal, `.harness/improve.json` and the
`.harness/` files its evaluation names, and nothing else from `.harness/`; they
are never committed. Nothing is pushed; you open the pull request. Captain-private files apply in place.

**A score is a trend, not a cause.** An observed objective has no
counterfactual, so the charts show movement over runs and never attribute it to
a particular harness change.

## No authentication

There is none, by choice, for a single user on their own machine. Instead:

- The server is local only by default: it binds `127.0.0.1`.
- The API is same-origin only. It sends no CORS headers, so another site's page
  cannot read its answers.
- Only known host names are answered. Every page and API request, reads
  included, gets 403 unless its `Host` is `127.0.0.1`, `localhost` or `[::1]`, the
  specific host in `HOST`, the host of `ORIGIN`, or one listed in
  `IMPROVE_ALLOWED_HOSTS` (comma-separated). This stops a DNS-rebinding page
  from posing as this server. Only the static build files (`/_app/`), which
  hold no data, are served before this check.
- Cross-origin writes are refused. Any request other than `GET` or `HEAD`,
  whatever its path, gets 403 unless its `Origin` header (or, without one, its `Referer`)
  is this server's own origin. That covers starting evaluations, drafts and
  background reviews, approving, rejecting and applying, importing and
  dismissing findings, and cancelling jobs.
- Starting an apply run, the one request that gives an agent edit tools, also
  needs the token the server mints at launch and puts in the page it serves.

Serving through a proxy, or on a non-loopback host, is an explicit opt-in. Pass
`--host` and set `ORIGIN` to the public URL the browser uses (for example
`ORIGIN=https://ui.example.dev`), so writes from that page match the server's
own origin. Add any further host names to `IMPROVE_ALLOWED_HOSTS`.

Binding another host with `--host` or `HOST` exposes an unauthenticated server
to everyone who can reach it. They can read the repository's proposals and
session-transcript previews, run evaluations, and start paid agent runs. A
suite's `core.command` evaluator executes the `argv` it declares, so they can
also execute code in the repository. Do not bind another host on a shared or
untrusted network.

Path containment is enforced on every filesystem route regardless, so a request
cannot read or write outside `.harness/` and `.claude/skills/`. An apply run's
agent writes the confirmed files of an approved proposal, which must be harness
files inside the repository.

## Tests

```bash
node --test tests/
```

Covers path containment, the agent output contract, the data layer including
trend arithmetic, the draft-diff-apply round trip against a stub agent, apply runs against a
stand-in agent (guards, restore on failure, Firstmate branches), jobs
(errors, cancel, restart), and the launcher against a real production build.
