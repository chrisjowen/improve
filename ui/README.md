# improve UI

A local review surface for the harness: the proposals `/improve` has produced,
the objectives those proposals target, and the evaluations that score them.

## Install and run

The plugin ships without `node_modules`, so install once before first use:

```bash
cd ui
npm install          # or: bun install
npm run dev          # serves on 0.0.0.0:5173
```

`npm run dev` and `npm run preview` bind `0.0.0.0` so the UI is reachable when
the workspace is remote. For a production build:

```bash
npm run build
node build/index.js          # honours PORT and HOST
```

From the plugin root, `node scripts/ui.mjs` does the same and prints these
instructions if dependencies are missing.

## Pointing it at a repository

By default the UI serves the repository the plugin sits inside. Override it:

```bash
IMPROVE_PROJECT_DIR=/path/to/repo npm run dev
```

| Variable | Purpose |
| --- | --- |
| `IMPROVE_PROJECT_DIR` | Repository to read and write. Falls back to `CLAUDE_PROJECT_DIR`. |
| `CLAUDE_PLUGIN_ROOT` | Plugin location, used to compare eval-rig versions. |
| `IMPROVE_AGENT_COMMAND` | Command for the drafting agent. Defaults to `claude`. |
| `IMPROVE_PYTHON` | Python interpreter for the eval rig. Defaults to `python3`. |
| `IMPROVE_CORS_ORIGIN` | Allowed origin for `/api/*`. Defaults to `*`. |
| `PORT`, `HOST` | Production server address. |

## What it reads and writes

| Path | Access |
| --- | --- |
| `.harness/proposals/*.yaml` | read, and status updated on apply or reject |
| `.harness/decisions/*.yaml` | appended when you apply or reject |
| `.harness/evals/suites/*.yaml` | read |
| `.harness/evals/results/index.jsonl` | appended, one line per run |
| `.harness/evals/results/<run>.json` | written, the full report |
| `.claude/skills/<name>/SKILL.md` | written only when you apply a draft |

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

There is none, by choice, for a single user on a trusted workspace. The API can
run evaluations, and a suite's `core.command` evaluator executes the `argv` it
declares. Anyone who can reach the port can therefore execute code in the
repository. Do not expose the port on a shared or untrusted network.

Path containment is enforced on every filesystem route regardless, so a request
cannot read or write outside `.harness/` and `.claude/skills/`.

## Tests

```bash
node --test tests/
```

Covers path containment, the agent output contract, the data layer including
trend arithmetic, and the draft-diff-apply round trip against a stub agent.
