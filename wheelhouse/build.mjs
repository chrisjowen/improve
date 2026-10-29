/**
 * Builds improve's Wheelhouse plugin: bundles src/server.mjs into
 * server/index.js and src/ui/index.mjs into ui/index.js, each one ESM file
 * with its dependencies inlined, since Wheelhouse imports them as they are,
 * with no install or build step. The built files are committed.
 *
 * The UI bundle carries improve's own review UI: its pages and components
 * (ui/src/routes, ui/src/lib), compiled with Svelte. For those it points
 * SvelteKit's `$app/state` and `$app/navigation` at src/ui/app/router.svelte.js,
 * improve's `$lib/client/api.js` at src/ui/app/api.js and `d3` at the few
 * parts of it they use (src/ui/app/d3.js), turns their links to
 * improve's own pages (`href="/…"`) into links to the place on Wheelhouse's
 * Improvements page (`href="#/…"`), and drops their `<svelte:head>`, so they
 * leave Wheelhouse's title alone. A change to those pages changes the bundle,
 * so `npm run check` fails until it is rebuilt.
 *
 *   npm run build    write them
 *   npm run check    fail when they differ from what the sources build
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import sveltePlugin from "esbuild-svelte";

const here = import.meta.dirname;
// Svelte names files relative to the working directory; build from here so the output is the same from anywhere.
process.chdir(here);
const UI = path.resolve(here, "..", "ui", "src");
const APP = path.join(here, "src", "ui", "app");
const BANNER = "// Built from wheelhouse/src by wheelhouse/build.mjs; do not edit. Run `npm run build` in wheelhouse/.";

/** @type {import("esbuild").Plugin} */
const improvePages = {
  name: "improve-pages",
  setup(b) {
    b.onResolve({ filter: /^\$app\/(state|navigation)$/ }, () => ({ path: path.join(APP, "router.svelte.js") }));
    b.onResolve({ filter: /^\$routes\// }, (a) => ({ path: path.join(UI, "routes", a.path.slice("$routes/".length)) }));
    b.onResolve({ filter: /^\$lib\// }, (a) => {
      const file = path.join(UI, "lib", a.path.slice("$lib/".length));
      return { path: file === path.join(UI, "lib", "client", "api.js") ? path.join(APP, "api.js") : file };
    });
    // improve's client modules import their api by a relative path too.
    b.onResolve({ filter: /(^|\/)api\.js$/ }, (a) =>
      path.resolve(a.resolveDir, a.path) === path.join(UI, "lib", "client", "api.js") ? { path: path.join(APP, "api.js") } : undefined
    );
    b.onResolve({ filter: /^d3$/ }, () => ({ path: path.join(APP, "d3.js") }));
    // One Svelte runtime, and one d3, for improve's pages and this plugin's own: this folder's.
    b.onResolve({ filter: /^(svelte|d3-[a-z]+)(\/|$)/ }, async (a) => {
      if (a.resolveDir === here || a.pluginData === "improve-pages") return undefined;
      const r = await b.resolve(a.path, { resolveDir: here, kind: a.kind, pluginData: "improve-pages" });
      return r.errors.length ? { errors: r.errors } : { path: r.path };
    });
  }
};

/** Links and the page title of improve's own pages, for their place in Wheelhouse. */
const forWheelhouse = {
  /** @param {{ content: string, filename?: string }} o */
  markup({ content, filename }) {
    if (!filename || !path.resolve(filename).startsWith(UI)) return;
    return {
      code: content.replace(/<svelte:head>[\s\S]*?<\/svelte:head>/g, "").replace(/\bhref="\//g, 'href="#/')
    };
  }
};

const targets = [
  // yaml's Node build is CommonJS and requires Node's own modules, so the ESM bundle gets a require.
  {
    entry: "src/server.mjs",
    out: "server/index.js",
    platform: "node",
    target: "node20",
    banner: 'import { createRequire as __improveRequire } from "node:module";\nconst require = __improveRequire(import.meta.url);',
    plugins: []
  },
  {
    entry: "src/ui/index.mjs",
    out: "ui/index.js",
    platform: "browser",
    target: "es2022",
    banner: "",
    plugins: [
      improvePages,
      sveltePlugin({
        preprocess: [forWheelhouse],
        // Styles go into the shadow root the component mounts in, and are named by their content, not their path.
        compilerOptions: { css: "injected", cssHash: ({ hash, css }) => `svelte-${hash(css)}` }
      })
    ]
  }
];

const check = process.argv.includes("--check");
let stale = 0;
for (const t of targets) {
  const result = await build({
    absWorkingDir: here,
    entryPoints: [path.join(here, t.entry)],
    bundle: true,
    format: "esm",
    platform: t.platform,
    target: t.target,
    conditions: t.platform === "browser" ? ["svelte", "browser"] : [],
    mainFields: t.platform === "browser" ? ["svelte", "browser", "module", "main"] : undefined,
    loader: { ".css": "text" },
    legalComments: "eof",
    banner: { js: [BANNER, t.banner].filter(Boolean).join("\n") },
    plugins: t.plugins,
    write: false,
    logLevel: "warning"
  });
  const text = result.outputFiles[0].text;
  const out = path.join(here, t.out);
  if (check) {
    let current = null;
    try {
      current = readFileSync(out, "utf8");
    } catch {
      // missing counts as stale
    }
    if (current !== text) {
      console.error(`${t.out} is out of date; run npm run build in wheelhouse/.`);
      stale++;
    }
  } else {
    writeFileSync(out, text);
    console.log(`${t.out}  ${(text.length / 1024).toFixed(1)} KiB`);
  }
}
if (stale) process.exit(1);
