# Improve evaluation rig starter

This starter implements the `/improve` evaluation protocol. It is intended to
be copied to `.harness/evals/` and adapted to the repository's charter.

Run a suite:

```bash
python3 -m pip install -r requirements.txt
python3 runner/eval_runner.py suites/example.yaml --context fixtures/context.json
```

Build a context from a Claude Code JSONL transcript and the current Git diff:

```bash
python3 runner/build_context.py \
  --project-root ../.. \
  --transcript-jsonl /path/to/transcript.jsonl \
  --task-id change-123 \
  --prompt "Implement the requested change" \
  --output context.json
```

This defaults to structural transcript records plus content digests. Add
`--include-content` only when retaining full messages, tool inputs, and tool
results is approved. Add `--include-patch` to embed the Git patch; otherwise the
context contains only changed-file records.

JavaScript and TypeScript evaluators require a Node version that can load their
modules. On older Node versions, compile TypeScript first and point the registry
at the emitted JavaScript.

Review every registry entry before running it. Registered evaluators are trusted
code with repository read access.

The starter battery includes file existence, grep/regex, argv-form command, and
an adapter-neutral LLM judge. The command evaluator may create normal test/build
artifacts. The LLM judge is inert until a suite explicitly supplies a reviewed
`adapter_argv`; the adapter receives JSON on stdin and must return one
`EvaluationResult` JSON object on stdout.
