# Changelog

## 0.3.1

- Agent runs (Apply, skill drafting, dreaming) use your Claude login instead of an ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN in the environment, so a stale key set for every app no longer fails them with "Invalid API key". Set IMPROVE_AGENT_USE_API_KEY=1 to keep the key.
- Give agent runs USER and LOGNAME when the UI's launcher left them out, so Claude Code finds its login on macOS.

## 0.3.0

- Apply an approved proposal from the review UI. Apply runs `/improve apply` in the background after you confirm the exact files and the commands its evaluation declares in `evaluation.commands`, and shows progress, the diff, the evaluation and the log. A failed run puts the files back. In a Firstmate home, shared files are prepared on a branch for a pull request instead.

## 0.2.1

- Count a Firstmate home's blockers, decisions, stale and stuck workers, and relaunches properly. The importer reads finished tasks' status lines from the fleet ledger, folds decisions the way Firstmate does, and reads the watcher's logs and markers.
- Label a Firstmate home's `data/captain.md` and other captain-private files as captain-private, not application code.

## 0.2.0

- Add a Firstmate adapter. Proposals can be studied from a Firstmate home and routed to its captain.
- Show why an agent run failed, instead of "agent exited 1".
- Stop the plugin's hooks from counting the plugin's own agents.
- `scripts/ui.mjs start`, `stop` and `status` run the UI server in the background. `start` builds the UI on first use.
- Find plugin data for status and the UI without `CLAUDE_PLUGIN_DATA`.
- State evaluation errors with the next step to take.
- Stop structure-only evaluations from claiming that no verification ran.
- Give jobs progress, cancel and logs. Jobs survive a server restart.
- Fix skill diffs failing in the production build.
- Redesign the review UI around what needs a decision.
- Bind the UI to 127.0.0.1 by default. The API is same-origin only, and the server answers only known host names.
- Update the eval rig to 1.1.0.

## 0.1.0

- Initial release.
