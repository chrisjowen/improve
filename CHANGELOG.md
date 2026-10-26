# Changelog

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
