# Similar projects — what the code actually does, and what to take

Research date: 2026-09-30. **All four projects were cloned and read.** Where the
README and the source disagree, the source is recorded here and the discrepancy
is noted, because two of the four most-cited mechanisms turned out not to exist.

| Project | Lang | Files | Verdict |
| --- | --- | --- | --- |
| [Self-Improvement-Plugin (SIPS)](https://github.com/RasputinKaiser/Self-Improvement-Plugin) | Python | 421 | Near-twin. Real evaluator mutation testing. |
| [autoharness](https://github.com/tigerless-labs/autoharness) | Python | 79 | Best engineered. Real deterministic safety gate. |
| [claude-reflect](https://github.com/BayramAnnakov/claude-reflect) | Python | 44 | Capture is code; clustering is a prompt. |
| [Engram](https://toejough.github.io/engram) | Go | 2534 | Largest. Its headline feature is unimplemented. |

---

## Two claims that did not survive reading the source

**Engram's effectiveness triage does not exist.** The blog post describes an
Evaluate phase tracking whether memories were "followed, contradicted, or
ignored", feeding a four-quadrant triage (Working / Leech / Hidden gem / Noise).

`grep -rn 'effectiveness' --include='*.go'` returns **nothing**. The phrase
appears only in `docs/research/` and `dev/eval/LEDGER.md`. The shipped Go code
has typed notes (`fact`, `feedback`, `runbook`) with structured fields, but no
follow-rate tracking and no effectiveness computation anywhere.

I ranked this mechanism as a thing to steal on the strength of the post. It is
an aspiration, not an implementation. **Nobody in this space has solved
"did the applied change help."**

**claude-reflect's intent clustering is a prompt, not an algorithm.**
`commands/reflect-skills.md` is 362 lines of instructions; the deterministic
Python beside it is 43 lines (`extract_session_learnings.py`). The strength
rating and "Evidence: 15 similar requests" are *model output*, and the file
literally contains the template `Evidence: [N] similar requests found`. Nothing
counts N.

So its clustering is not reusable code. It is a well-written prompt, and its
reported numbers carry no more authority than any other model claim.

What *is* real in claude-reflect: `capture_learning.py` on `UserPromptSubmit`,
with regex pattern detection and a queue. That part works and is the half we
lack.

---

## SIPS — evaluator mutation testing, and it is real

The loop is `observe → diagnose → propose → build → evaluate → ready_for_review`,
split as "active task agent writes candidate; SIPS owns evidence, frozen
evaluation, durable state, review." Same separation as our invariant 10, reached
independently.

**`evaluator_challenge`** is the find of this research. From `commands/improve.md`:

> "For evaluator sensitivity, freeze evaluator_challenge checks with a known-good
> control and plausible wrong variants before authorship. **A surviving variant is
> an evaluator failure**; infrastructure errors are unavailable."

`docs/sips-08.md` gives the bounds: 16 mutants, 16 control files, 32 checks;
arms run in disposable copies under one shared timeout; mutants may change only
control files; recursive challenges unsupported.

This is mutation testing applied to graders. A mutant that survives means the
grader cannot detect a fault it was supposed to detect.

**We have proof we need it.** `assets/eval-rig/suites/example.yaml` scores 1.0 on
`pallets/click` with an empty transcript — a repository no agent has touched. A
declared wrong-variant ("a repo with no agent involvement must not pass") would
have failed that suite at authoring time instead of during a dogfood run.

Their own caveat is worth copying too: "This tests oracle sensitivity to declared
faults; it does not prove that the evaluator is complete."

Also real:

- `eval_grader_parity.py` — golden vectors asserting a Python grader and a Swift
  grader agree. "If this test fails, the two implementations have drifted and the
  weekly sweep's eval results are unreliable." We have two language bridges and
  no parity test.
- `eval/results.jsonl` as the results store — the same shape as the
  `index.jsonl` committed today, arrived at independently.
- `link_outcome` carries `expected_revision`, `idempotency_key` and
  `source_candidate` as an exact digest. Optimistic concurrency plus idempotency
  on the decision record. Our `recordDecision` has neither.
- Digest-pinned activation: "Activation rollback require explicit reviewed
  candidate digest", and "Passing tests never activate change automatically."

Honest in its own README: "broad self-improvement effectiveness remains
unmeasured."

---

## autoharness — the best-engineered of the four

79 Python files, zero third-party dependencies, real tests
(`test_archive_collision.py`, `test_atomic.py`). Its architecture is worth
studying even where we do not copy it.

**`skills_guard.py` — a deterministic safety scan over generated skill bodies.**
Six regex families: exfiltration, injection, destructive, persistence, network,
obfuscation. Its docstring states the threat model precisely:

> "skills deferred-execution, persistent, propagatable, inputs carry traces
> (indirect injection) … injection first-class threat — SKILL.md body itself
> vehicle injecting into host context. Purely deterministic, cannot bypassed
> injection."

Patterns include `ignore\s+(all\s+)?previous\s+instructions`,
`curl\s+.*\|\s*(sh|bash)`, `rm\s+-rf?\s+(/|~|\$home|\*)`, `crontab`,
`/dev/tcp/`, `base64\s+(-d|--decode)`, and `(\\x[0-9a-fA-F]{2}){4,}`.

**This is a hole in the code committed today** — see the section below.

**`promoter.py` — validate-before-ANY-write, modeled on Kubernetes admission
control.** The model proposes an intent; the promoter is the sole writer. It
shapes final text in memory, runs six linter classes in memory, and only on pass
writes atomically. Details worth stealing:

- every landing parent is resolved and escape-checked **before any write**, so
  "a pre-planted symlink rejects with zero writes"
- `SKILL.md` is written **last**, as the commit point, "so a reader never sees it
  point at an unlanded subfile"
- evidence slices are content-addressed, and "the model never names or writes it"
- "Reject = zero writes, no stamp, no ledger"
- durable intent queue: at-least-once delivery plus atomic land ≈ exactly-once,
  with an orphan `.tmp` sweep on startup

**`validate.py` — six deterministic linter classes, no LLM call.** Beyond the
safety scan: a `_PLACEHOLDER` regex rejecting `TODO|FIXME|TBD|PLACEHOLDER|
REPLACE_ME|FILL_IN`, an `_ABS_PATH` regex rejecting `/Users/…` and `C:\…` (both
a leak and a portability bug), a description-as-trigger check requiring the word
"when" plus a quoted phrase, and a global-skill check that a global skill must
not name a repository.

**`sidecar.py` — provenance and three counters.** `created_by: agent` is the
marker; `is_agent_created()` gates every modification. Counters are `use`, `view`
and `patch`, deliberately separate: `use` means the model invoked it and is the
only survival signal, `view` is "evidence of recall value, but not adherence".

**`lifecycle.py` — an opportunity-relative clock.** Maturity is counted in layer
requests, not wall-clock days, so "an idle laptop ages nobody out." Our cadence
is `every_days` plus `every_sessions`, both of which fire on a repository nobody
is working in — which is D1 in spirit even after the letter was fixed.

**`redaction_rules.toml`** — one named regex per secret class (AWS key ID, PEM
private key blocks, `gh[posru]_`, `xox[abprs]-`, bearer tokens), with the policy
stated: "Over-redaction is the safe side… add new rules here alone, do not
scatter them across the code."

Its validation stance is the opposite of ours, deliberately: "No oracle on active
path, no tokens spent on dedicated eval." Validation is adherence in use.

Caution: its acknowledgements cite `arXiv 2606.09498`, an identifier implying
June 2026 that matches no real preprint. Do not treat that citation as grounded.

---

## Where this project stands, after reading the code

Genuinely ahead, and now more confidently than before:

- **Objective-linked scoring with a trend over time.** Verified absent in all
  four. Engram has no effectiveness code at all; autoharness rejects oracles by
  design; SIPS tracks outcome correlation, not a scored competence metric.
- **Deterministic-first grading**, with model graders confined to what
  determinism cannot establish.
- **Rollback as a first-class mode.**
- **A review surface.** None of the four ships a UI.

Genuinely behind, with the source to copy from:

| Gap | Reference implementation |
| --- | --- |
| Evaluator mutation testing | SIPS `commands/improve.md`, `docs/sips-08.md` |
| Deterministic safety scan of generated skills | autoharness `lib/skills_guard.py` |
| Provenance marker before overwrite | autoharness `lib/sidecar.py` |
| Validate-before-write, symlink pre-check | autoharness `hook/promoter.py` |
| Placeholder and absolute-path linting | autoharness `lib/validate.py` |
| Cross-language grader parity test | SIPS `scripts/eval_grader_parity.py` |
| Opportunity-relative review cadence | autoharness `lib/lifecycle.py` |
| Skill usage counters, use versus view | autoharness `lib/sidecar.py` |
| Named secret-redaction rule set | autoharness `lib/redaction_rules.toml` |
| Idempotency key on decisions | SIPS `link_outcome` |
| Correction capture on UserPromptSubmit | claude-reflect `scripts/capture_learning.py` |

Unsolved by everyone, including us: **whether an applied change improved
anything.** Engram claimed it and did not build it. That remains the open
problem in this space, and our per-objective trend is the closest anyone has
come to the data needed to answer it.

---

## A security hole in today's commit

`applySkill` in `ui/src/lib/server/skills.js` writes an **agent-generated**
`SKILL.md` into `.claude/skills/` with no content scan and no provenance check.

The threat is the one autoharness names explicitly. The drafting agent reads
repository text, which invariant 8 already classifies as untrusted. If that text
contains an injection, the agent can emit it inside the drafted skill body, and
an applied skill is a *persistent instruction loaded into every future session*.
A one-time injection becomes permanent.

Mitigations currently in place: the diff is shown before applying, `exists: true`
is surfaced as "overwrites existing", and the agent holds no write tools. So a
human sees the body and the overwrite. But relying on a reviewer to spot an
injection in generated Markdown is exactly the "prose instead of a boundary"
mistake the dream worker was just fixed for.

What is missing, in order:

1. A deterministic scan of the drafted body before it can be applied, in the
   shape of `skills_guard.py`.
2. A provenance marker written on apply, and a refusal to overwrite any file
   lacking one without explicit confirmation.
3. Archive rather than replace, to `.claude/skills/.archive/<name>/<timestamp>/`.
4. Placeholder and absolute-path linting, so a draft cannot ship `TODO` or
   `/Users/chrisowen/…`.

Not applied yet — filed as issues.

## Sources

All four cloned at 2026-09-30 and read.

- [RasputinKaiser/Self-Improvement-Plugin](https://github.com/RasputinKaiser/Self-Improvement-Plugin)
- [tigerless-labs/autoharness](https://github.com/tigerless-labs/autoharness)
- [BayramAnnakov/claude-reflect](https://github.com/BayramAnnakov/claude-reflect)
- [toejough/engram](https://github.com/toejough/engram)
- Not read in depth: [Chachamaru127/claude-code-harness](https://github.com/Chachamaru127/claude-code-harness) (autonomous loop, no evaluation), [coleam00/claude-memory-compiler](https://github.com/coleam00/claude-memory-compiler), [d2a8k3u/claude-code-memory](https://github.com/d2a8k3u/claude-code-memory), [severity1/claude-code-auto-memory](https://github.com/severity1/claude-code-auto-memory) — memory only
