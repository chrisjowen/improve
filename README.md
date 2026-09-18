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
node ./improve/tests/hooks.test.mjs
```

Do not enable `.harness/improve.json` `background_dreaming.enabled` until its cost, data access, permissions, and output-review process have been approved for the repository.
