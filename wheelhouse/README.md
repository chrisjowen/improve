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
| `nav.page` | `<improve-improvements>` | **Improvements**, a menu item in the header: the review, what waits for you, what improve read, every proposal as a card grouped by where it stands, the patterns that repeat, and the harness's size |
| `home.card` | `<improve-health>` | **Harness**, a tab on the home page's rail, counting the proposals that wait for you |
| `header.indicator` | `<improve-indicator>` | "Review due", "3 to decide", or both, on wide screens |
| `task.section` | `<improve-proposal>` | **Improvement**, on the task improve filed a proposal as: the proposal's card, opened |

Each element draws in its own shadow root with Wheelhouse's CSS variables, so
it follows Wheelhouse's light and dark themes.

A card's title opens the proposal in improve's review UI while that UI runs.
The Improvements page and the Improvement section show whether the UI runs,
and, when it does not, the command that starts it on 127.0.0.1 for this home.
Wheelhouse gives an installed plugin's elements no way to start a service, so
they show the command instead of a **Launch** button. The plugin still
declares the review UI as its `ui` service.

## How it reads improve

It never writes. It runs improve's adapter CLI in the home (`detect`, `import`
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

`uiUrl` is where improve's review UI runs. Wheelhouse links a proposal to it as
`/proposals?p=<file>` when the UI answers there.

## Layout

```
.wheelhouse-plugin/plugin.json   the manifest: id, version, contract, entries, enable rule, slots, services
wheelhouse/server/index.js       the server entry Wheelhouse imports (built)
wheelhouse/ui/index.js           the custom elements (built)
wheelhouse/src/                  the sources
wheelhouse/build.mjs             bundles the sources with esbuild
wheelhouse/tests/                the elements' tests
```

The sources are plain ESM. `src/server.mjs` has the providers, the review UI
service and the contributions. `src/view.mjs` and `src/words.mjs` turn
improve's output into the plain-JSON view the elements draw. `src/ui/` has the
elements.

## Build and test

```sh
cd wheelhouse
npm install
npm run build    # write server/index.js and ui/index.js
npm run check    # fail when they differ from what the sources build
npm test         # the elements, in a DOM
```

Commit the built files with the sources. The server entry's tests run with
the plugin's other tests, from the repository root:

```sh
node tests/wheelhouse-plugin.test.mjs
```

Bump `version` in `.wheelhouse-plugin/plugin.json` with the plugin's version
in `.claude-plugin/plugin.json`; a test checks that they agree.
