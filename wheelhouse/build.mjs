/**
 * Builds improve's Wheelhouse plugin: bundles src/server.mjs into
 * server/index.js and src/ui/index.mjs into ui/index.js, each one ESM file
 * with its dependencies inlined, since Wheelhouse imports them as they are,
 * with no install or build step. The built files are committed.
 *
 *   npm run build    write them
 *   npm run check    fail when they differ from what the sources build
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

const here = import.meta.dirname;
const BANNER = "// Built from wheelhouse/src by wheelhouse/build.mjs; do not edit. Run `npm run build` in wheelhouse/.";

const targets = [
  // yaml's Node build is CommonJS and requires Node's own modules, so the ESM bundle gets a require.
  {
    entry: "src/server.mjs",
    out: "server/index.js",
    platform: "node",
    target: "node20",
    banner: 'import { createRequire as __improveRequire } from "node:module";\nconst require = __improveRequire(import.meta.url);'
  },
  { entry: "src/ui/index.mjs", out: "ui/index.js", platform: "browser", target: "es2022", banner: "" }
];

const check = process.argv.includes("--check");
let stale = 0;
for (const t of targets) {
  const result = await build({
    entryPoints: [path.join(here, t.entry)],
    bundle: true,
    format: "esm",
    platform: t.platform,
    target: t.target,
    legalComments: "eof",
    banner: { js: [BANNER, t.banner].filter(Boolean).join("\n") },
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
