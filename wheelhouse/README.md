# improve's Wheelhouse plugin

This folder makes the improve repository a
[Wheelhouse](https://github.com/chrisjowen/wheelhouse) plugin. Wheelhouse shows
what improve's Firstmate adapter knows about a Firstmate home: the review
schedule, the proposals and where each stands, and what improve read.

```sh
wheelhouse plugin install chrisjowen/improve
```

Wheelhouse fetches the repository at a commit, shows what the plugin adds and
asks before it keeps it. Restart Wheelhouse to load it. Installing needs no
build: the built files are committed.

A Wheelhouse that still has Improve built in refuses an installed plugin with
the same name, `improve`. That Wheelhouse already shows the same pages.

## What it shows

It is on only while the Firstmate home has `.harness/improve.json`, and it
shows nothing unless that file turns the Firstmate adapter on
(`adapters.firstmate.enabled`).

| Slot | Element | What it is |
| --- | --- | --- |
| `nav.page` | `<improve-improvements>` | **Improvements**, a menu item in the header: improve's review UI, every view and action of it, as tabs, plus a **Firstmate** tab |
| `home.card` | `<improve-health>` | **Harness**, a tab on the home page's rail, counting the proposals that wait for you |
| `header.indicator` | `<improve-indicator>` | "Review due", "3 to decide", or both, on wide screens |
| `task.section` | `<improve-proposal>` | **Improvement**, on the task improve filed a proposal as: the proposal's card, opened, and a link to decide it on the Improvements page |

Each element draws in its own shadow root with Wheelhouse's CSS variables, so
it follows Wheelhouse's light and dark themes.

### The Improvements page

The page is improve's own review UI (`ui/`), inside Wheelhouse. Its tabs are
the UI's sidebar: **Overview**, **Proposals**, **Background findings**,
**Evaluations**, **Objectives** and **Runs**, which are improve's own Svelte
pages compiled into the UI bundle, so they show and do exactly what the UI
does. The seventh, **Firstmate**, is what Wheelhouse read about this home: the
review schedule, what waits for you, what improve read, every proposal as a
card grouped by where it stands, the patterns that repeat, and the harness's
size. The view is in the address after `#`
(`/plugins/improve/improvements#/proposals?p=IMP-1.yaml`), so links, Back and
Forward work, and a card's title opens it on the Proposals tab.

improve's pages talk to the UI's server, the plugin's `ui` service. While it
does not answer, those tabs say so and offer **Launch**, which asks Wheelhouse
to start it on 127.0.0.1 for this home (Wheelhouse also opens it in a new tab,
as it does for every launch); where Wheelhouse cannot start it, they show the
command that does, ready to copy. The Firstmate tab needs no server, and the
page opens on it until the server answers.

The page and the server are on different origins. The server lets a page on
this computer drive it only with its launch token
([ui/README.md](../ui/README.md#no-authentication)): the plugin hands the
server a token when Wheelhouse launches it, and reads the token of a server
started any other way from the server's `/api/embed`. A server that serves
another repository, or is too old to say its token, is shown, not driven.

### Parity with improve's review UI

| improve's review UI | In Wheelhouse |
| --- | --- |
| Overview: what waits, background findings to triage, recent runs, harness health (review due and why, the most repeated correction, counts since the last review, evidence for evaluations), objectives with their trend | Overview tab, improve's own page |
| Proposals: Waiting, Approved, Decided and All with counts; the detail (status, scope, confidence, provenance, the check's findings, what changes, why, files and whose they are, evidence, how it will be judged, reasons to reject, risks, rollback, the writing check, decisions) | Proposals tab, improve's own page |
| Approve; reject with a reason; draft a skill, draft again, approve and write the reviewed diff, overwrite a hand-written file; Apply or prepare the upstream branch after confirming the files, commands and outputs; the apply run's evaluation, diff and log | The same buttons on the Proposals tab |
| Background findings: run a review, review a finding as a proposal, dismiss a report, read its log | Background findings tab |
| Evaluations: run a suite (session or another transcript, a commit range, with content), the score chart, the history, a report by step | Evaluations tab |
| Objectives, and the skills applied from the UI with their use | Objectives tab |
| Runs: every job, its log, Cancel | Runs tab, and Cancel on every running job's card |
| The sidebar's counts (waiting, findings, running) | The tabs' counts |
| The repository's path, eval-rig drift, a server error | A line under the tabs, with a link to open the same view in the UI's own tab |
| The light and dark theme switch | Follows Wheelhouse's theme |

## How it reads improve

Its server entry never writes; changes are made by improve's review UI, on
your click on the Improvements page. It runs improve's adapter CLI in the home (`detect`, `import`
without `--save`, `inventory`, and dry runs of `route` and `decisions`) and
improve's proposal check, and reads the proposals under `.harness/proposals/`
and improve's records in `.harness/firstmate/`. It never passes `--apply` or
`--save`. It runs `due` only once periodic review has started counting,
because before that `due` records the start of the count.

It finds the adapter in this order:

1. the `adapter` setting: improve's checkout, or its `adapters/firstmate/cli.mjs`
2. improve's installed copy, as Claude Code's `installed_plugins.json` records it
3. the improve clone in the home, `projects/improve`
4. the copy of improve Wheelhouse installed this plugin from

Settings go in Wheelhouse's `plugins.json`, all optional:

```json
{
  "plugins": {
    "improve": {
      "settings": {
        "adapter": "/abs/path/to/improve",
        "uiUrl": "http://127.0.0.1:5173"
      }
    }
  }
}
```

`uiUrl` is where improve's review UI runs, and where Wheelhouse starts it. A
card's arrow opens a proposal there as `/proposals?p=<file>` when the UI
answers there.

## Layout

```
.wheelhouse-plugin/plugin.json   the manifest: id, version, contract, entries, enable rule, slots, services
wheelhouse/server/index.js       the server entry Wheelhouse imports (built)
wheelhouse/ui/index.js           the custom elements (built)
wheelhouse/src/                  the sources
wheelhouse/src/ui/app/           the Improvements page's frame around improve's own pages
wheelhouse/build.mjs             bundles the sources with esbuild
wheelhouse/tests/                the elements' tests
```

The sources are plain ESM and Svelte. `src/server.mjs` has the providers, the
review UI service and the contributions. `src/view.mjs` and `src/words.mjs`
turn improve's output into the plain-JSON view the elements draw. `src/ui/`
has the elements; `src/ui/app/` mounts improve's pages (`ui/src/routes`,
`ui/src/lib`) in the Improvements page, with a router, an API client and a
theme in place of SvelteKit's, improve's own client and its stylesheet's
tokens. `build.mjs` says how it swaps them in.

## Build and test

```sh
cd wheelhouse
npm install
npm run build    # write server/index.js and ui/index.js
npm run check    # fail when they differ from what the sources build
npm test         # the elements, in a DOM, and improve's pages against a stand-in UI server
```

Commit the built files with the sources. The UI bundle carries improve's
pages, so a change under `ui/src/` needs `npm run build` here too; `npm run
check` fails until it is done. The server entry's tests run with
the plugin's other tests, from the repository root:

```sh
node tests/wheelhouse-plugin.test.mjs
```

Bump `version` in `.wheelhouse-plugin/plugin.json` with the plugin's version
in `.claude-plugin/plugin.json`; a test checks that they agree.
