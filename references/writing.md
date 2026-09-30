# Writing proposals

A proposal is read by one person deciding yes or no. Write so they can decide
in two minutes without asking what a sentence means.

The general rules are adapted from the `unslop` skill in
[cursor/plugins](https://github.com/cursor/plugins/blob/main/pstack/skills/unslop/SKILL.md).
Rule numbers match that skill, and `scripts/proposal-check.mjs` reports
findings under the same numbers.

## What a proposal must say

**The title names the harness change.** Say what file changes and what the
agent will do differently. Don't name the outcome you hope for.

- Bad: "Restore a passing credo gate so CI signal means something"
- Good: "Run `mix credo` after the agent edits an Elixir file"

**`intervention.summary` is a before and after.** Write two or three sentences
that a new team member could act on. Name the file, the trigger, and the
command. For example: "Today the agent edits `.ex` files and never runs credo,
so findings surface in CI. Add a PostToolUse hook in `.claude/settings.json`
that runs `mix credo --strict` on the edited file. The agent then sees the
finding while it can still fix it."

**Evidence is a fact someone can check.** Give a command and its result, a
file and line, or a count. "credo exits 2 at 59ae8b4" is evidence. "the gate
stops being read" is a guess, so it belongs in the hypothesis.

**The hypothesis is one sentence that can turn out false.** "If the hook runs,
credo findings in agent-written PRs drop from 2 to 0 over the next 10 PRs."

**Don't invent vocabulary.** Words like "governed harness source",
"decidable", and "raw / derived / curated boundary" mean something to the
author and nothing to the reader. Use the repository's own words, or describe
the thing plainly.

## Rules the checker enforces

- **13 Em dashes.** Don't use them. End the sentence, or use a comma.
- **7 AI vocabulary.** crucial, enhance, pivotal, robust, seamless, showcase,
  underscore, additionally, delve. Use the plain word.
- **8 Fancy "is".** "serves as", "stands as", "boasts". Say "is" or "has".
- **9 "Not just X, but Y".** State Y.
- **23 Filler.** "in order to" becomes "to". "due to the fact that" becomes
  "because". Delete "it is important to note that".
- **26 Metaphor nouns.** substrate, wedge, primitive, bedrock, scaffolding,
  paradigm, flywheel, north star, ratchet. Name the concrete thing.
- **28 Long sentences.** More than 30 words gets split. One idea per sentence.
- **31 Plain words.** utilize and leverage become "use", facilitate becomes
  "help", numerous becomes "many".
- **33 Arrows and shorthand.** "rejects bad date -> exit 2" becomes "rejects a
  bad date and exits with code 2".
- **5 Vague attribution.** Name the source or delete it.

## Rules only you can check

- **27 Say what it does.** Replace any sentence about a feeling ("the gate
  means something again") with a mechanism or a number ("the api job reaches
  `mix test`"). If a sentence could appear unchanged in another repository's
  proposal, cut it.
- **29 Active voice.** "the hook runs credo", not "credo is run".
- **30 No adverbs propping up verbs.** Give the number instead.
- **32 No mannered prose.** No aphorisms, personified code, or figurative
  verbs. "A permanently red gate stops being read" becomes "CI has failed on
  every run since 2026-09-08, so a new failure looks the same as an old one."
- **10 No forced threes.** List as many items as there are.
- **17 Sentence case headings.**
- **3 No trailing "-ing" clauses** ("..., ensuring quality"). Delete them or
  make them a sentence with evidence.

## Check before showing

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/proposal-check-cli.mjs" .harness/proposals/<id>.yaml
```

Exit code 1 means the proposal changes files outside the harness, or lists no
files. Fix the scope before showing it. Writing findings don't fail the check,
but fix each one before you show the proposal.
