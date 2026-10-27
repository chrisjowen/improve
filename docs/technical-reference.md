# How improve works: technical reference

`/improve` is a governed Claude Code harness-improvement plugin. It can bootstrap
a repository's harness, assess weaknesses, propose evaluated
skills/hooks/memory/tools, review accumulated observations, and apply explicitly
approved improvements.

It does not silently self-modify. Default hooks capture sanitized operational
metadata in Claude's persistent plugin-data directory and surface a review-due
reminder. Optional background dreaming is disabled until a repository explicitly
enables it; dream jobs are read-only proposal generators.

The skill's own rules are in [SKILL.md](../SKILL.md). This page collects the
technical detail that used to live in the README.

## Commands

```text
/improve init
/improve status
/improve assess testing
/improve propose reduce review rework
/improve review
/improve apply <proposal>
/improve rollback <proposal>
/improve dream retrieval and context
```

The fully qualified skill name is `/improve:improve`. Claude Code also accepts
bare `/improve` when no other command uses that name.

## Plugin layout

| Path | What it holds |
| --- | --- |
| `.claude-plugin/` | Plugin manifest (`plugin.json`) and the single-plugin marketplace (`marketplace.json`) |
| `SKILL.md` | The `/improve` skill: modes, invariants and approval gates |
| `references/` | Detailed rules the skill reads on demand: operating model, harness model, proposal format, writing rules, repository layout, evaluation and memory, eval rig, Firstmate |
| `hooks/hooks.json` | The passive capture hooks |
| `scripts/` | Hook scripts, the status report, the proposal check, dreaming and the UI launcher |
| `agents/` | `harness-researcher`, a read-only investigator used by assess, propose, review and dream |
| `templates/` | Starting `charter.md`, `objectives.yaml` and `improve.json` for `init` |
| `assets/eval-rig/` | The evaluation starter copied into a repository on approval |
| `adapters/firstmate/` | The opt-in Firstmate adapter |
| `ui/` | The local review UI (SvelteKit) |
| `.wheelhouse-plugin/` | The Wheelhouse plugin manifest (`plugin.json`) |
| `wheelhouse/` | The Wheelhouse plugin: its sources, its build, and the built server entry and UI bundle Wheelhouse loads |
| `tests/` | Plugin tests |

The layout `init` proposes inside a repository (`.harness/` and `.claude/`) is
described in [references/repository-layout.md](../references/repository-layout.md).

## Hooks and what they capture

`hooks/hooks.json` registers these hooks:

| Event | Script | What it does |
| --- | --- | --- |
| `SessionStart` | `session-start.mjs` | Counts sessions and adds a review-due reminder when a trigger fires |
| `InstructionsLoaded`, `PostToolUse` (Write, Edit, Bash, PowerShell, NotebookEdit, WebFetch, WebSearch, MCP tools), `PostToolUseFailure`, `PermissionDenied`, `TaskCompleted`, `PreCompact`, `ConfigChange` | `capture-event.mjs` | Appends one sanitized event record; counts tool calls and failures |
| `PostToolUse` (Skill, Read, Grep, Glob) | `skill-usage.mjs` | Counts when an applied repository skill is invoked or read |
| `UserPromptSubmit` | `capture-prompt.mjs` | Records a correction when a prompt states one, after redaction |
| `SessionEnd` | `session-end.mjs` | Records the session end and, only when background dreaming is enabled and due, starts a read-only dream job |

An event record keeps the event name, time, session and agent ids, tool name,
the repository-relative file path, a short error type and the permission mode.
It does not keep file contents or tool output. Capture and correction capture
can be turned off in `.harness/improve.json` (`capture.enabled`,
`capture.corrections`). Agents the plugin starts itself (skill drafts and dreams)
are not recorded.

A review is due when any threshold in `.harness/improve.json` `review` is
reached: tool calls, sessions, captured corrections, a repeated correction, tool
failures, or days since the last review. The defaults are in
[templates/improve.json](../templates/improve.json).

## Where data lives

| Data | Location |
| --- | --- |
| Observations (`events.jsonl`, `corrections.jsonl`, `state.json`) | Claude's plugin data directory, under `projects/<id>/`, where `<id>` is derived from the repository path. `CLAUDE_PLUGIN_DATA` reaches hook processes; elsewhere the directory is found under `~/.claude/plugins/data/`. |
| Charter, objectives, configuration | `.harness/charter.md`, `.harness/objectives.yaml`, `.harness/improve.json` |
| Proposals and decisions | `.harness/proposals/*.yaml`, `.harness/decisions/*.yaml` |
| Evaluation suites and results | `.harness/evals/suites/`, `.harness/evals/results/` |
| UI run records and logs | plugin data `projects/<id>/jobs/` |
| Firstmate import | plugin data `projects/<id>/firstmate/observations.json`; adapter state in `.harness/firstmate/` |

Read the observation summary without changing anything:

```bash
node scripts/status.mjs /path/to/repo
```

## Proposal format

Every proposal is a YAML file in `.harness/proposals/` with an id, objective,
hypothesis, evidence, the exact files it changes, the intervention, an
evaluation plan, risks, rollout, rollback and an approval state. The full schema
is in [references/proposal-format.md](../references/proposal-format.md) and the
writing rules are in [references/writing.md](../references/writing.md).

Check a proposal before showing it:

```bash
node scripts/proposal-check-cli.mjs .harness/proposals/<id>.yaml
```

The check classifies `scope.files`. A proposal that lists a file outside the
harness is flagged `codebase` or `mixed`, and one that lists no files is flagged
`unknown`.

## Evaluation rig

The plugin also includes an objective-linked evaluation starter in
`assets/eval-rig/`. It defines the same `evaluate(context) -> result` contract
for JavaScript, TypeScript, and Python, a YAML registry and suite format,
thresholded aggregation, and deterministic starter evaluators. It is copied into
a repository only after approval. See
[references/eval-rig.md](../references/eval-rig.md) and
[assets/eval-rig/README.md](../assets/eval-rig/README.md).

## Background dreaming

`/improve dream` runs read-only exploration and saves findings as untrusted
proposals. Scheduled background dreaming is controlled by
`.harness/improve.json` `background_dreaming`.

Do not enable `.harness/improve.json` `background_dreaming.enabled` until its
cost, data access, permissions, and output-review process have been approved for
the repository.

## Review UI

A local UI in `ui/` shows proposals, background findings, evaluations,
objectives and runs. Start it from the plugin root:

```bash
node scripts/ui.mjs start /path/to/repo
```

It binds `127.0.0.1` and has no authentication. Setup, environment variables,
what it reads and writes, and its security model are in
[ui/README.md](../ui/README.md).

## Firstmate adapter

In a [Firstmate](https://github.com/kunchenguid/firstmate) home, an opt-in
adapter in `adapters/firstmate/` lets `/improve` study Firstmate's own harness:
its `AGENTS.md` contract, skills, `bin/` scripts, brief scaffold, and private
home records. It imports sanitized evidence from the home (ask-user findings
and their answers, blockers, stale-worker wakes, failed launches, captain
preferences, learnings, review rounds). The proposal check derives whether a
proposal changes captain-private files, which can be applied locally after
approval, or shared Firstmate files, which go upstream as a pull request.
`/improve review` files each proposal as a captain-held Firstmate task so it
shows as a decision in Wheelhouse.

The adapter is off until `.harness/improve.json` sets
`adapters.firstmate.enabled`. Wheelhouse shows what the adapter reads through
the Wheelhouse plugin in `wheelhouse/`; see
[wheelhouse/README.md](../wheelhouse/README.md). See
[using-improve-with-firstmate.md](using-improve-with-firstmate.md) and
[references/firstmate.md](../references/firstmate.md).

## Try locally and validate

Run Claude Code with a local checkout of the plugin:

```bash
claude --plugin-dir ./improve
```

Validate the plugin and run its tests:

```bash
claude plugin validate ./improve --strict
for test in ./improve/tests/*.test.mjs; do node "$test"; done
```

The UI has its own tests:

```bash
cd ui
node --test tests/
```

The Wheelhouse plugin's elements have their own tests, and a check that the
committed bundles match the sources:

```bash
cd wheelhouse
npm install
npm test
npm run check
```

## README screenshots

The screenshots in [docs/screenshots/](screenshots/) were taken from the review
UI running against a synthetic demo repository (`acme-shop`) with sample
observations and proposals and a stand-in drafting agent. They contain no real
project data.
