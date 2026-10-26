# Using improve with Firstmate

[Firstmate](https://github.com/kunchenguid/firstmate) runs a supervisor Claude Code session
and worker sessions from one home directory. Its harness is its `AGENTS.md`
contract, its skills under `.agents/skills/`, its `bin/` scripts, the brief
scaffold that launches each worker, and the home's private records in `data/`
and `config/`. The Firstmate adapter lets `/improve` study that home and
propose evaluated changes to that harness.

The adapter keeps improve's rules. It reads evidence, drafts proposals, and
files them for a decision. It does not change Firstmate on its own.

## What it adds

- **Evidence import.** Firstmate already records what went wrong: the
  ask-user findings workers escalate, the decisions and blockers in each
  task's status log, stale-worker wakes, failed launches and recoveries,
  teardown refusals, the captain's preferences in `data/captain.md`, and the
  learnings in `data/learnings.md`. The importer reads those files, groups
  repeats across tasks, and counts review rounds and durations per task. It
  removes secrets, tokens, emails and the home's own path, and keeps only short
  excerpts. It writes nothing into the home.
- **Firstmate-aware proposals.** A proposal names the Firstmate surface it
  changes. It also says whether the change is captain-private (`data/`,
  `config/`), which can be applied locally after approval, or shared-tracked
  (`AGENTS.md`, skills, `bin/`, docs), which goes upstream as a pull request
  and is never edited in place.
- **Review routing.** `/improve review` files each proposal as a captain-held
  Firstmate task with `bin/fm-captain-hold.sh`, so it shows as a decision in
  Wheelhouse. The captain answers there the same way as any other call.
- **Optional periodic review.** After a set number of tasks or days, the
  session-start reminder says a review is due. Off by default.

## Turn it on

In the Firstmate home, with improve installed:

1. Run `/improve init` if the home has no `.harness/` yet. The adapter keeps
   its state in `.harness/`, which is local to the home. If the home is also
   your Firstmate checkout, add `.harness/` to `.git/info/exclude` so it stays
   out of upstream commits.
2. Add the adapter block to `.harness/improve.json`:

   ```json
   {
     "adapters": {
       "firstmate": { "enabled": true }
     }
   }
   ```

3. Check it:

   ```bash
   node <plugin>/adapters/firstmate/cli.mjs detect --project <home>
   ```

   It prints `"detected": true` and `"enabled": true`. A secondmate home is
   found through `FM_HOME`, or set `adapters.firstmate.home`.

## A review, end to end

```text
/improve status          # includes the Firstmate import counts
/improve assess          # reads the import and the AGENTS.md / skill sizes
/improve propose ...     # one proposal per change, scoped to one side
/improve review          # dry run of the filing commands, then files them
```

The review shows the exact `fm-captain-hold.sh hold` commands before it runs
them. After the captain answers in Wheelhouse, `/improve apply <proposal>`
reads the recorded answer. It applies a captain-private change only when the
answer approves that proposal, and still runs the normal checks. For a
shared-tracked change it prepares the patch for a Firstmate pull request
instead of editing the file.

## Periodic review

```json
{
  "adapters": {
    "firstmate": {
      "enabled": true,
      "periodic_review": { "enabled": true, "every_tasks": 20, "every_days": 7 }
    }
  }
}
```

With this on, the session-start reminder fires after 20 new task briefs or 7
days since the last review, whichever comes first. The day limit starts after
the first review. Firstmate can also check on its own schedule:

```bash
node <plugin>/adapters/firstmate/cli.mjs due --project <home>    # exit 0 when due
```

## Commands

| Command | What it does | Writes |
| --- | --- | --- |
| `detect` | Is there a home, and is the adapter on | nothing |
| `import [--save]` | Sanitized observations from the home | with `--save`, the plugin data directory |
| `inventory` | `AGENTS.md`, skill, script and private file sizes | nothing |
| `route [--apply]` | File proposals as captain-held tasks; dry run by default | with `--apply`, the home's backlog through its own scripts, and `.harness/firstmate/routed.json` |
| `decisions [--apply]` | Read the captain's recorded answers; dry run by default | nothing |
| `due` | Is a periodic review due | nothing |
| `reviewed` | Record that a review ran | `.harness/firstmate/review-state.json` |

[references/firstmate.md](../references/firstmate.md) has the detailed rules
the skill follows.

## Limits

- The import sees what is still on disk. Firstmate drops handled wakes from its
  queue and prints teardown refusals to the terminal, so older events may be
  missing.
- Findings snapshots have no fixed syntax. The importer reads JSON, `key: value`
  blocks, and plain paragraphs.
- Review rounds count no-mistakes gates a worker escalated. Rounds that passed
  without an ask-user gate are not counted.
