# Improve

`/improve` is a governed Claude Code harness-improvement plugin. It can bootstrap a repository's harness, assess weaknesses, propose evaluated skills/hooks/memory/tools, review accumulated observations, and apply explicitly approved improvements.

It does not silently self-modify. Default hooks capture sanitized operational metadata in Claude's persistent plugin-data directory and surface a review-due reminder. Optional background dreaming is disabled until a repository explicitly enables it; dream jobs are read-only proposal generators.

The plugin also includes an objective-linked evaluation starter in
`assets/eval-rig/`. It defines the same `evaluate(context) -> result` contract
for JavaScript, TypeScript, and Python, a YAML registry and suite format,
thresholded aggregation, and deterministic starter evaluators.

## Try locally

```bash
claude --plugin-dir ./improve
```

Then invoke:

```text
/improve init
/improve status
/improve assess testing
/improve propose reduce review rework
/improve review
/improve dream retrieval and context
```

The fully qualified skill name is `/improve:improve`. Claude Code also accepts bare `/improve` when no other command uses that name.

Validate with:

```bash
claude plugin validate ./improve --strict
for test in ./improve/tests/*.test.mjs; do node "$test"; done
```

## Using improve with Firstmate

In a [Firstmate](https://github.com/kunchenguid/firstmate) home, an opt-in
adapter in `adapters/firstmate/` lets `/improve` study Firstmate's own harness:
its `AGENTS.md` contract, skills, `bin/` scripts, brief scaffold, and private
home records. It imports sanitized evidence from the home (ask-user findings
and their answers, blockers, stale-worker wakes, failed launches, captain
preferences, learnings, review rounds). Each proposal says whether it changes
captain-private files, which can be applied locally after approval, or shared
Firstmate files, which go upstream as a pull request. `/improve review` files
each proposal as a captain-held Firstmate task so it shows as a decision in
Wheelhouse.

The adapter is off until `.harness/improve.json` sets
`adapters.firstmate.enabled`. See
[docs/using-improve-with-firstmate.md](docs/using-improve-with-firstmate.md).

Do not enable `.harness/improve.json` `background_dreaming.enabled` until its cost, data access, permissions, and output-review process have been approved for the repository.
