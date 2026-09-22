# Objectives-first harness — working notes

Status: **design discussion in progress, nothing implemented.**
Last session: 2026-09-18. Repo at commit `1f1143a` (initial port, 43 files, unmodified).

Not a spec. These are notes to resume a brainstorming conversation. No approval has
been given for any change, and no code has been written.

---

## 1. Where the repo is

The `improve` plugin was ported verbatim from `improve-source-listing.md` (43 files,
extracted, verified, committed as `1f1143a`). The source listing and an earlier
unrelated "lore/ADLC" spike were both deleted; git history was reset. The old `.git`
(containing commit `e48e28e "Memory spike"`) was backed up to a session scratchpad
that no longer exists — treat it as gone.

Verification at port time, all passing:

- `claude plugin validate . --strict`
- `node tests/hooks.test.mjs`
- `python3 assets/eval-rig/tests/test_runner.py` (4 tests)

---

## 2. What the plugin actually is today

Roughly **90% prose, 10% code**.

| Layer | Substance |
|---|---|
| Governance — 10 invariants, 8 modes, approval gates, proposal schema | Prose in `SKILL.md` (206 lines) + 6 files in `references/`. Model-executed, honour system. |
| Evidence capture | `hooks/hooks.json` → `events.jsonl` + `state.json`. Tool metadata only. |
| Evaluation | `assets/eval-rig/` — a starter to be copied into a target repo. Wired to nothing by default. |
| Source of truth | `.harness/` in the target repo, file-first, Git-governed. Created only after `init` is approved. |

The deterministic code does four small things: count events, count sessions, decide
"review due", print a status JSON. Plus a detached `claude -p` dream worker.

### What genuinely works and should be kept

- **`objective → suite → score` is an enforced chain.** `suite.schema.json` makes
  `objective` a *required* suite field (`id`, `description`, `success_criteria[]`,
  optional `baseline`). `eval_runner.py:90` rejects a suite whose objective lacks
  success criteria; `:145` injects the objective into every evaluator context;
  `:216` echoes it into the report.
- **The nudge channel already exists.** `session-start.mjs` emits
  `hookSpecificOutput.additionalContext` to raise a review with the user, gated by
  `dueReasons()` in `scripts/lib.mjs`. This is exactly the delivery mechanism the
  new design needs — it's fed by the wrong signal, not missing.
- **One portable evaluator boundary**, `evaluate(context) -> result`, with Python
  and JS bridges and a registry mapping stable names to implementations.

---

## 3. Chris's thesis (the design direction)

Objectives are the **primary entity** the whole system revolves around — not an
attribute of an evaluation.

An objective is a *competence area*: "how good is this harness at deploying", "at
building a particular feature", "at finding the reference implementation for
something".

Requirements as stated:

1. Objectives get captured **periodically** — either in an explicit session where
   the objective is declared, or passively during the normal coding loop.
2. Objectives are **stored** with stable identity.
3. **Corresponding tests/evals exist** for each objective, and something checks that
   they do.
4. The system **reports**: how good the harness is at X, which objectives the
   improver *thinks* it needs to satisfy, suggestions for further objectives,
   whether an objective has been **encountered**, and how well it did.
5. **Evals are not gates.** They never block progress. They are a signal for human
   and agent alike.
6. Success feeds forward: a deployment that went cleanly should become a
   **skill suggestion** — codify the steps that worked.

### The governing metaphor

> "I see this like a signal that a new joiner would have to say how comfortable are
> they with the project after periods of time."

This is a **competence/confidence report over time**, not a test suite. Consequences
that follow from taking the metaphor seriously:

- **"Not yet encountered" is a first-class state.** A new joiner who has never
  deployed isn't scoring badly — they have no reading at all. The current schema
  can't express this (`baseline: {suite_score: null}` is the nearest thing).
- Reading the **trend** matters more than any single score.
- The system should **propose candidate objectives** it thinks matter, for a human
  to confirm. There is currently no mechanism for this at all.

---

## 4. Agreed so far

- An objective carries **both** measurement regimes, and the interesting signal is
  when they disagree.
  - **Observed** ("how good at deploying") — n=1 per occurrence, no replay.
  - **Replayable** ("find the reference implementation") — fixed task, run offline
    repeatedly, real baseline-vs-candidate comparison.
- **Reuse the same eval code for both.** The `evaluate(context) -> result` boundary
  is regime-agnostic.
- Observed suites must be **marked as explicitly-run-only** — never batch-run in the
  background, never auto-run to generate suggestions.
- The **n=1 limitation is accepted**. For observed objectives there is no
  counterfactual, so the report must say "trending down, worth a look", never
  "change X caused improvement Y".

### Correction made during the session

I initially said the eval-rig was built for replayable evaluation. **That is wrong
and the inversion matters.** `runner/build_context.py` takes `--transcript-jsonl`
(a real Claude Code session transcript) and `--base/--head` (a real git diff). There
is no fixture loader, no task staging, no agent invoker, no trial repetition
anywhere in the rig.

| Regime | Infrastructure state |
|---|---|
| Observed | **Already served.** `build_context.py` natively produces "here's what happened in this session, here's the diff, grade it." |
| Replayable | **Missing everything** — fixtures, staging, an agent runner, repeated trials. |

So observed objectives are nearly free; replayable is the expensive half.

### A useful coincidence

`build_context.py --include-content` is off by default; without it, messages and
tool IO are replaced by `{redacted, bytes, sha256}` summaries. Meaningfully grading
"how well did that deploy go" needs real content. So **explicit-run-only and
content-inclusion are the same trust boundary** — the user asking for the eval is
the same act that authorises reading the transcript. One gate, not two.

---

## 5. Gaps between the thesis and the implementation

| Requirement | State | Evidence |
|---|---|---|
| Objectives captured | **Absent** — no sensor of any kind | `hooks.json` has no `UserPromptSubmit`; `eventRecord` in `lib.mjs` has no intent/task/outcome field |
| Objectives stored with identity | **Absent** — no registry | Objectives are embedded *inline* per suite, so two deployment suites can't be recognised as the same objective. `templates/charter.md` is nine empty markdown headings with no ids. |
| Coverage check | **Absent** — cheapest win available | A set difference between objective ids and suite-referenced ids. `status.mjs` never looks at `.harness/evals/`. |
| Score history / trend | **Absent** — the blocking gap | `eval_runner.py` `main()` prints one report to stdout or `--output`; `results/` is gitignored. No per-objective time series means the sentence "scoring 0.6, down from 0.9" is inexpressible. |
| Surface + offer to improve | **Pipe exists, water doesn't** | `dueReasons()` reads only: days since review, sessions since review, tool failures since review. All time/activity counters. No objective, no score. |
| Propose new objectives | **Absent** | No mechanism. |
| "Encountered yet?" state | **Absent** | Not representable in the schema. |
| Success → skill suggestion | **Absent** | `SKILL.md` describes skill authoring standards but nothing mines successful runs. |

### Structural conclusion

Objectives move out of suites into a registry with stable ids; suites reference them
by id; scores become a per-objective time series; `dueReasons()` grows score-based
triggers. Roughly **60% new machinery**, but it reuses the enforced schema chain and
the nudge channel rather than replacing them. An inversion, not a rewrite.

---

## 6. Other findings worth keeping

### Enforcement gap

The plugin's single most load-bearing rule — invariant 5, "obtain explicit human
approval before changing anything" — is a sentence in a markdown file. Its own
`harness-model.md` says "prefer deterministic checks over model judgment", and it
doesn't apply that to itself. A `PreToolUse` hook could make it deterministic.

### Stated triggers exceed captured evidence

`SKILL.md` lists review triggers like "the same correction repeats" and "review
defects repeat". `eventRecord` stores `occurred_at, event, session_id, agent_id,
tool_name, file, error_type` (120-char slice), `permission_mode`. You cannot detect
a repeated *correction* from tool-name counts. Roughly 8 of the 10 listed triggers
are not derivable from what is captured. Either capture gets richer, or the triggers
get honest.

### Observations aren't governed

`.harness/` is in-repo and committed, but `events.jsonl` lives in
`CLAUDE_PLUGIN_DATA` keyed by a hash of the project path — per-machine, invisible to
teammates, never rotated or compacted. The evidence base for a *team* harness sits
on one person's laptop.

### RESOLVED 2026-09-22 — the hook config is correct, my suspicion was wrong

I flagged `InstructionsLoaded`, `PostToolUseFailure`, `PermissionDenied`,
`TaskCompleted` and `ConfigChange` as probably-not-real events, and the
`command` + `args[]` form as probably-invalid. **All five events are real and the
config form is correct**, verified against `code.claude.com/docs/en/hooks` and the
plugins reference on 2026-09-22.

- All five appear in the official event table. The real event list is far larger
  than I assumed (`Setup`, `UserPromptExpansion`, `PermissionRequest`,
  `PostToolBatch`, `MessageDisplay`, `SubagentStart`, `TaskCreated`, `StopFailure`,
  `TeammateIdle`, `CwdChanged`, `DirectoryAdded`, `FileChanged`,
  `WorktreeCreate/Remove`, `PostCompact`, `Pre/PostModelSwitch`, `Elicitation`… ).
- `command` + `args[]` is documented **exec form** — no shell, each element passed
  as one argument, and it is the *recommended* form whenever the command references
  a path placeholder like `${CLAUDE_PLUGIN_ROOT}`. Shell form is the single-string
  variant. The plugin uses exec form correctly.
- `async: true` is supported on command hooks. `timeout` and `statusMessage` are
  supported.

**So the capture layer does fire.** The capture gap is one of *content* — what
`eventRecord` chooses to store — not of plumbing. That is a much better position
than feared, and it means enriching capture is a change to one function rather than
a rewrite.

Two genuine issues surfaced by the same docs check:

- **`SessionEnd` hooks share a 1.5-second budget.** `session-end.mjs` declares
  `timeout: 5` *and* spawns a detached dream worker. The declared timeout exceeds
  the documented budget, so the spawn may be cut off before it detaches. Needs
  testing under a real session end.
- **Matcher support is not universal.** `TaskCompleted`, `Stop`, `UserPromptSubmit`,
  `PostToolBatch` and others accept no matcher, and per the docs a matcher on an
  unsupported event is *silently ignored*. Our config only uses a matcher on
  `PostToolUse`, which is fine — but any future matcher needs checking.

---

## 7. `claude-reflect` comparison

Source: https://github.com/BayramAnnakov/claude-reflect — v2.6.0, MIT, ~1.6k stars,
160 tests, Python 3.6+. Analysis below is from the repo landing page only; internals
were not read, so claims about behaviour are the README's description, not verified.

**What it is:** captures corrections and discovers workflow patterns, turning them
into CLAUDE.md memory and reusable skills.

**Architecture:** two stages with automation only on the first half. Hooks capture
automatically and append to a queue; `/reflect` processes the queue with mandatory
human review. The queue is the seam — nothing reaches CLAUDE.md without a human pass.

### Ideas worth taking

1. **It captures semantic content, which is exactly our gap.** Regex over prompts
   detects corrections (`"no, use X"`, `"actually..."`, `"that's wrong"`), positive
   feedback, and explicit `"remember:"` markers. Proof that the correction signal is
   obtainable — the thing `eventRecord` currently cannot see.
2. **Cheap hot path, expensive batch.** Regex in-session; an AI semantic filter
   deferred to `/reflect` time (catches e.g. a Spanish correction that English regex
   misses). This satisfies our own "no expensive LLM hooks on hot lifecycle paths"
   anti-pattern while still getting semantic quality. Strong pattern, adopt it.
3. **Evidence counts drive suggestions.** "15 similar requests" → a ranked skill
   candidate with a strength rating. **This is the machinery the "suggest objectives"
   feature needs** — cluster observed work by intent, count occurrences, rank. It's
   a proven implementation of the hardest unbuilt part of Chris's requirement 4.
4. **Skill improvement routing.** A correction made *during* a `/deploy` invocation
   routes back into `deploy.md` rather than CLAUDE.md, so skills sharpen over time.
   We have no equivalent, and it's the right granularity.
5. **Operational ergonomics:** `--dry-run`, `--targets` (preview the write set),
   `--review`, `--dedupe` (collapse semantically similar entries).
6. **Confidence decay** on unreviewed queue items.

### Where our approach is stronger

1. **Measurement exists at all.** reflect's confidence score (0.60–0.95) rates
   *whether a learning is real* — it is **not** a measure of harness competence. It
   cannot answer "how good is this harness at deploying". No objectives, no
   baselines, no suites, no trend. That is precisely Chris's core ask, and reflect
   does not attempt it.
2. **Evaluation.** Generated skills are never evaluated. We require every suite to
   name an objective with success criteria, enforced in both schema and runner.
3. **Governance separation** — observation / hypothesis / proposal / canonical /
   policy as distinct states, with a proposal schema carrying owner, review date,
   rollback trigger and approval state. reflect is queue → approve → append.
4. **Rollback.** We have a mode for it; reflect has no notion.
5. **Privacy posture.** We redact by default (sha256 summaries unless
   `--include-content`). reflect queues prompt text. Ours is more defensible for
   team or regulated repos.
6. **Team-governed.** `.harness/` is committed and shared; reflect writes to
   `~/.claude` and CLAUDE.md, which is closer to a personal tool.

### Shared weakness

**Neither measures whether an applied change helped.** reflect never checks that a
learning improved anything; we specify it and don't implement it. Closing that loop
is the actual differentiator on offer.

### Operational gotcha that directly affects us

Claude Code **prunes local session history after 30 days**; reflect recommends
`{"cleanupPeriodDays": 99999}` in settings. Our `build_context.py` depends on
transcript JSONL, so observed evaluation silently loses its substrate after 30 days
unless this is set. Worth surfacing during `init`.

### Net read

**Complementary, not competing.** reflect is an excellent capture-and-extraction
layer with no measurement. We are a measurement-and-governance framework with no
capture. The objectives-first design needs both halves — and reflect demonstrates
that the capture half is tractable.

---

## 7b. Dogfood run — 2026-09-22

The rig was run end-to-end for the first time, against two repos. It works. Five
defects and one design problem surfaced, all reproducible.

**Status: D1, D2 and D3 were fixed and verified on 2026-09-22** (see "Fixes
applied" at the end of this section). D4 and D5 remain open — both are design
decisions rather than defects.

### What was run

1. **This repo**, using this design session's own Claude Code transcript
   (`~/.claude/projects/…/e09902b9….jsonl`, 327 lines → 165 messages, 89 tool calls)
   as the observed substrate. Result: **0.8, suite failed.**
2. **`pallets/click`** (cloned at `3cbaa76`), evaluated over a real commit range
   `HEAD~1..HEAD` (11 changed files) with an *empty* transcript.
   Result: **1.0, all five steps passed.**

`status.mjs` also ran clean against this repo.

### D1 — cold start fires a false "review due"

`status.mjs` on a fresh repo reports `review_due_reasons:
["14 days since the last harness review"]` against an empty state, because
`daysSince(undefined)` returns `Infinity` (`lib.mjs`). Every brand-new project is
immediately told a review is overdue, which trains the user to ignore the nudge —
and the nudge channel is exactly what the objectives design wants to reuse.
Fix: treat absent `last_reviewed_at` as "never reviewed, not overdue", or seed it at
`init`.

### D2 — untracked directories enter the changed-file set

`git_changes()` in `build_context.py` runs `git status --porcelain=v1` with no
`--untracked-files=all` when `--base` is absent. Git collapses untracked trees, so
the context recorded a single changed "file" of `docs/` — a directory.

### D3 — a tooling error is scored as a quality violation (the important one)

`core.grep` tried to read `docs/`, got `EISDIR`, and returned
`score: 0, success: false, notes: ["1 file checks failed."]` with evidence
`{"kind":"file","message":"Unreadable: EISDIR"}`.

That is an infrastructure failure being reported as a *merge-marker violation*. The
suite fails, and the headline note tells you the repo has merge markers when it does
not. D2 + D3 together mean **any untracked directory fails the shipped example suite
with a misleading reason.** Unreadable must be a distinct outcome from failed.

### D4 — the rig cannot run from outside the project root

Running the runner from its home in the plugin against another repo aborts:

```
ValueError: Evaluator escapes project root:
  /Users/…/improve/assets/eval-rig/evaluators/file-exists.mjs
```

`load_registry` requires every evaluator to resolve inside `project_root`. Copying
`assets/eval-rig` into `click/.harness/evals` made it work immediately, so this is
the intended workflow — but it means **no central rig**: every repo holds a copy,
fixes never propagate, and versions drift. A deliberate and defensible security
boundary (a suite can't load arbitrary code from outside the repo) with a real
governance cost that should be named rather than discovered later.

### D5 — `build_context.py` output doesn't satisfy its own schema

It emits `schema_version, project_root, task, changes, transcript, run, artifacts,
metadata` — no `objective`, no `step`, both of which `context.schema.json` marks
required. The runner injects them at `eval_runner.py:145`, so nothing breaks, but the
intermediate artifact cannot be validated standalone. Either relax the schema or
document the two-phase construction.

### The design problem, which matters more than the defects

**The shipped example suite does not measure the harness.** Its steps are "a README
exists" and "no merge markers in changed files" — properties of a *repository*. It
scored **1.0 on `click`, a repo where no agent has ever done anything**, using an
empty transcript.

A harness-competence suite must be unable to score well without agent involvement.
This is the clearest possible argument for the objectives-first inversion: the rig
grades artifacts, and what Chris wants graded is *performance at a task*.

Related: `example_typescript.ts` returned "Transcript is complete" against a
zero-message transcript — a vacuous check that passes on no evidence.

### Positive results

- Both bridges work. Python, JavaScript and TypeScript evaluators all executed, plus
  the subprocess `core.command` evaluator.
- An empty transcript degrades gracefully rather than crashing — useful, because it
  means a repo with no agent history can still be evaluated.
- The observed regime is genuinely real: pointing the builder at a live transcript
  and a commit range produced a populated, gradable context with no extra machinery.
- Redaction defaults hold — with `--include-content` omitted, messages and tool IO
  were replaced by `{redacted, bytes, sha256}` summaries.

### Fixes applied — 2026-09-22

Approved as a batch and applied. Diff: 4 files changed, 38 insertions, 11 deletions,
plus one new test file.

| Defect | Fix |
|---|---|
| D1 | `lib.mjs` — `dueReasons()` now requires `state.last_reviewed_at` to be present before reporting a time-based reason. Never-reviewed is no longer infinitely overdue. |
| D2 | `build_context.py` — `git status` gains `--untracked-files=all`, so untracked trees resolve to individual files. |
| D3 | `grep.mjs` — unreadable paths collect into a separate `errors` list with `kind: "error"`, are excluded from the score denominator, and get their own note. Only genuine pattern violations set `success: false`. |

Verified against the pass conditions stated in the proposals:

- `status.mjs` on a fresh repo → `review_due_reasons: []`
- the example suite with an untracked directory present → **1.0, all five steps pass**
- `changes.files` now lists `docs/2026-09-18-…md` rather than `docs/`

**The existing test asserted the D1 defect** — `assert.match(start.stdout, /review is
due/)` on a cold start. It was inverted to `assert.doesNotMatch`, and a positive case
was added: three captured tool failures must still produce the nudge. A new
`assets/eval-rig/tests/grep.test.mjs` covers the error/violation split directly.

All suites pass: `grep.test.mjs`, `tests/hooks.test.mjs`,
`assets/eval-rig/tests/test_runner.py` (4 tests), `claude plugin validate . --strict`.

Not fixed, deliberately:

- **D4** (no central rig) is a governance trade-off needing a decision, not a patch.
- **D5** (partial context vs schema) is cosmetic while the runner completes the
  context; it should be settled as part of the objectives redesign, which will change
  the context shape anyway.

---

## 8. Open questions

**Unanswered from last session** — what is the **unit** being scored? `build_context.py`
wants a transcript and a revision range, which implies "a session" or "a PR", but a
deployment might span three sessions, or five deploys might land in one.

- *Per session* — automatic boundaries, but often contains zero occurrences, sometimes several.
- *Per occurrence* — you declare "a deploy just happened, score it"; truer to the objective, needs a human to mark the boundary.
- *Per PR / merge* — clean revision range, but only works for objectives that land as code.

**Raised by the latest message, not yet discussed:**

- How does an objective get **proposed** by the system? (reflect's intent-clustering
  is the candidate mechanism.)
- What does the **report** actually look like — the "new joiner comfort" artifact?
  Which command emits it? Is it part of `status`, or its own mode?
- How is **"encountered"** detected and recorded, given explicit-run-only scoring?
  Should passive capture *detect the occurrence* and prompt ("you just deployed —
  record an outcome?") while the scoring itself stays explicit? That keeps the human
  gate but removes the burden of remembering.
- What is the exact shape and name of the **replayable/observed mark**? Note
  `suite.schema.json` has `"additionalProperties": false` at the root, so this is a
  deliberate schema edit. The guard belongs in place *before* any autorunner exists,
  or it becomes a retrofit.

---

## 9. Next steps when resuming

1. ~~Verify the hook event names~~ — **done 2026-09-22, config is correct** (§6).
2. Answer the scored-unit question (§8). Still the live blocker.
3. Decide whether the D1–D5 defects (§7b) are fixed now as a small approved batch,
   or folded into the objectives redesign. D3 is the one worth fixing regardless —
   it produces actively misleading output.
4. Then: questions → 2-3 approaches → sectioned design → written spec. This is an
   architectural change under the brainstorming skill, so no implementation until
   the spec is reviewed and approved.

### Process note

Running `/improve` on itself was raised as a way to dogfood this. Two constraints:
`SKILL.md` sets `disable-model-invocation: true`, so **Chris must type the command** —
the agent cannot trigger it. And the scripts need `CLAUDE_PLUGIN_ROOT` /
`CLAUDE_PLUGIN_DATA`, so it must run with the plugin loaded: `claude --plugin-dir .`
from the repo root.
