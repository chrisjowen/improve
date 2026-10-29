import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { proposalHref } from "./urls.mjs";
import { buildHarness, parseChecks, parseLedger, parseRouted, proposalItem, readProposal } from "./view.mjs";

/**
 * improve's Wheelhouse plugin: improve, the captain's harness-improvement
 * plugin for Claude Code, as it studies this Firstmate home. On only while the
 * home has improve's `.harness/improve.json` (the manifest's
 * `enabledWhenHomeFile`), and silent unless its Firstmate adapter is enabled
 * there. It reads improve's state by running improve's own adapter CLI
 * (detect, import without --save, inventory, due, and dry runs of route and
 * decisions) and its proposal check, plus the proposal files under
 * `.harness/proposals/`; it never passes --apply or --save, and runs `due`
 * only when that cannot write (see dueIsReadOnly). Its id, version, contract
 * and enable rule are in `.wheelhouse-plugin/plugin.json`; its panels are the
 * custom elements in `wheelhouse/ui/index.js`.
 *
 * @typedef {import("./types.mjs").HarnessView} HarnessView
 * @typedef {import("./types.mjs").ImproveUi} ImproveUi
 * @typedef {import("./types.mjs").ProposalSection} ProposalSection
 * @typedef {import("./view.mjs").Raw} Raw
 *
 * The parts of Wheelhouse's plugin contract (apiVersion 1) this plugin uses.
 * @typedef {{ ok: boolean; reason: string; stdout: string; stderr: string }} ExecResult
 * @typedef {object} ProviderContext
 * @property {Record<string, unknown>} settings
 * @property {AbortSignal} signal
 * @property {import("./view.mjs").TaskSummary[]} tasks
 * @property {import("./view.mjs").TaskSummary | null} task
 * @property {(file: string, o: { root: "home"; maxBytes: number }) => Promise<string | null>} readFile
 * @property {(dir: string, o: { root: "home" }) => Promise<string[] | null>} listDir
 * @property {(o: { argv: string[]; cwd: "home"; timeoutMs: number; maxBytes: number }) => Promise<ExecResult>} exec
 * @typedef {{ available: true; value: unknown; source: string; observedAt: string | null } | { available: false; reason: string }} Available
 * @typedef {{ available: true; spec: Record<string, unknown>; hint?: string | null } | { available: false; reason: string; hint?: string | null }} ServiceResolution
 */

const CLI = path.join("adapters", "firstmate", "cli.mjs");
const CHECK = path.join("scripts", "proposal-check-cli.mjs");
const MAX_OUT = 8 * 1024 * 1024;
const RUN_MS = 8_000;
const DEFAULT_UI = "http://127.0.0.1:5173";
const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

/**
 * The token Wheelhouse hands improve's review UI when it launches it
 * (IMPROVE_LAUNCH_TOKEN), so the Improvements page can drive the UI it just
 * launched before this provider next reads the UI's token back from it. One
 * per Wheelhouse process; a UI started any other way has its own, which the
 * provider reads from its /api/embed once it runs.
 */
const LAUNCH_TOKEN = randomBytes(24).toString("hex");

/** @param {unknown} v @returns {v is Record<string, any>} */
const isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Whether `.harness/improve.json` turns the Firstmate adapter on.
 * @param {string | null} text
 */
export function adapterEnabled(text) {
  if (!text) return false;
  try {
    const v = JSON.parse(text);
    return isRecord(v) && isRecord(v.adapters) && isRecord(v.adapters.firstmate)
      ? v.adapters.firstmate.enabled === true
      : false;
  } catch {
    return false;
  }
}

/**
 * The improve checkout this plugin was installed from: the directory above
 * this file that holds `.wheelhouse-plugin/plugin.json`, or null.
 * @param {string} [from]
 */
export function pluginRoot(from = fileURLToPath(import.meta.url)) {
  let dir = path.dirname(from);
  for (let i = 0; i < 4; i++) {
    if (existsSync(path.join(dir, ".wheelhouse-plugin", "plugin.json"))) return dir;
    dir = path.dirname(dir);
  }
  return null;
}

/**
 * Where improve's adapter CLI may be, in order: the `adapter` setting (the CLI
 * itself or an improve checkout), improve's installed copy as Claude Code
 * records it, the improve clone in the home (`projects/improve`), for an
 * installed copy that predates the adapter, then the copy of improve this
 * plugin came with. Relative paths are the home's.
 * @param {Record<string, unknown>} settings
 * @param {NodeJS.ProcessEnv} [env]
 * @param {(file: string) => string | null} [read]
 * @param {string | null} [own]
 */
export function adapterCandidates(settings, env = process.env, read = readText, own = pluginRoot()) {
  const out = [];
  const set = settings.adapter;
  if (typeof set === "string" && set.trim()) {
    out.push(set.endsWith(".mjs") ? set : path.join(set, CLI));
  }
  const config = env.CLAUDE_CONFIG_DIR || path.join(env.HOME || homedir(), ".claude");
  const installed = read(path.join(config, "plugins", "installed_plugins.json"));
  if (installed) {
    try {
      const v = JSON.parse(installed);
      const plugins = isRecord(v) && isRecord(v.plugins) ? v.plugins : {};
      for (const [k, installs] of Object.entries(plugins)) {
        if (!k.startsWith("improve@") || !Array.isArray(installs)) continue;
        for (const i of installs) {
          if (isRecord(i) && typeof i.installPath === "string") out.push(path.join(i.installPath, CLI));
        }
      }
    } catch {
      // unreadable: fall through to the home's clone
    }
  }
  out.push(path.join("projects", "improve", CLI));
  if (own) out.push(path.join(own, CLI));
  return out;
}

/** @param {string} file */
function readText(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

/** @param {ProviderContext} ctx */
async function findAdapter(ctx) {
  for (const c of adapterCandidates(ctx.settings)) {
    if (path.isAbsolute(c) ? existsSync(c) : (await ctx.readFile(c, { root: "home", maxBytes: 1 })) !== null)
      return c;
  }
  return null;
}

/** @param {ExecResult} r @returns {unknown} */
const json = (r) => {
  try {
    return JSON.parse(r.stdout);
  } catch {
    return null;
  }
};
/** @param {ExecResult} r */
const why = (r) => (r.ok ? "" : (r.stderr.trim().split("\n")[0] || r.reason).replace(/\.$/, ""));

/**
 * The home's absolute path, as improve's `detect` reports it.
 * @param {ProviderContext} ctx @param {string | null} cli
 */
async function homeOf(ctx, cli) {
  if (!cli) return null;
  const r = await ctx.exec({
    argv: [process.execPath, cli, "detect", "--project", "."],
    cwd: "home",
    timeoutMs: RUN_MS,
    maxBytes: MAX_OUT
  });
  const d = json(r);
  return isRecord(d) && typeof d.home === "string" ? d.home : null;
}

/**
 * improve's checkout root, from its adapter CLI's path.
 * @param {string} cli
 */
const improveRoot = (cli) => path.dirname(path.dirname(path.dirname(cli)));

/**
 * `due` records when periodic review started counting, or forgets it, the first
 * time it runs after periodic review is turned on or off. It writes nothing when
 * periodic review is on and the count has already started, so only then is it run.
 * @param {unknown} detect @param {unknown} reviewState
 */
export function dueIsReadOnly(detect, reviewState) {
  const p = isRecord(detect) && isRecord(detect.periodic_review) ? detect.periodic_review : null;
  const s = isRecord(reviewState) ? reviewState : {};
  return (
    isRecord(detect) &&
    detect.detected === true &&
    detect.enabled === true &&
    p?.enabled === true &&
    (typeof s.last_reviewed_at === "string" || typeof s.enabled_at === "string")
  );
}

/**
 * Whether improve's own UI answers at `url`, whether it opens a proposal by
 * file, and, when it can be driven from another origin, its token and the
 * repository it serves.
 * @param {string} url @param {AbortSignal} signal
 * @returns {Promise<{ running: boolean; deepLinks: boolean; token: string | null; project: string | null }>}
 */
export async function probeUi(url, signal) {
  const none = { running: false, deepLinks: false, token: null, project: null };
  /** @param {string} p */
  const get = (p) =>
    fetch(`${url}${p}`, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(800)]),
      redirect: "manual"
    });
  // Both improve UIs serve /api/status, improve's status report; only the redesigned one has /api/health and
  // /proposals?p=<file>, and only one that lets Wheelhouse's page drive it has /api/embed.
  try {
    const r = await get("/api/status");
    const body = r.ok ? await r.json() : null;
    if (typeof body !== "object" || body === null || !("harness_initialized" in body)) return none;
  } catch {
    return none;
  }
  const [health, embed] = await Promise.all([
    get("/api/health").then((r) => r.ok, () => false),
    get("/api/embed").then(
      async (r) => (r.ok ? /** @type {unknown} */ (await r.json()) : null),
      () => null
    )
  ]);
  const e = isRecord(embed) && typeof embed.token === "string" && typeof embed.project === "string" ? embed : null;
  return { running: true, deepLinks: health, token: e?.token ?? null, project: e?.project ?? null };
}

/**
 * Where improve's UI is, from the `uiUrl` setting; only http(s), without a trailing slash.
 * @param {Record<string, unknown>} settings
 */
export function uiUrl(settings) {
  const v = settings.uiUrl;
  if (typeof v === "string") {
    try {
      const u = new URL(v);
      if (u.protocol === "http:" || u.protocol === "https:") return u.href.replace(/\/+$/, "");
    } catch {
      // not a URL: use the default
    }
  }
  return DEFAULT_UI;
}

/** @param {string} s */
const shq = (s) => (/^[\w./:=@-]+$/.test(s) ? s : `'${s.replaceAll("'", "'\\''")}'`);

/**
 * How to start improve's UI on 127.0.0.1 for this home, as one command line.
 * @param {string} root @param {string} home @param {string} url
 */
export function startCommand(root, home, url) {
  const port = new URL(url).port || "5173";
  return `cd ${shq(path.join(root, "ui"))} && npm install && IMPROVE_PROJECT_DIR=${shq(home)} npx vite dev --host 127.0.0.1 --port ${port}`;
}

/**
 * @param {ProviderContext} ctx @param {string | null} cli @param {string | null} home
 * @returns {Promise<ImproveUi>}
 */
async function ui(ctx, cli, home) {
  const url = uiUrl(ctx.settings);
  const probe = await probeUi(url, ctx.signal);
  const root = cli && home ? improveRoot(path.isAbsolute(cli) ? cli : path.join(home, cli)) : null;
  // Not running: whether the UI Wheelhouse would start opens a proposal by its file.
  const deepLinks = probe.running
    ? probe.deepLinks
    : !!root && existsSync(path.join(root, "ui", "src", "routes", "proposals"));
  return {
    url,
    running: probe.running,
    deepLinks,
    start: probe.running || !root || !home ? null : startCommand(root, home, url),
    token: probe.running ? probe.token : LAUNCH_TOKEN,
    project: probe.project,
    servesHome: probe.running && probe.project && home ? path.resolve(probe.project) === path.resolve(home) : null,
    connects: !probe.running || probe.token !== null
  };
}

/**
 * improve's review UI as a companion service: its own Vite server, run from
 * improve's checkout bound to 127.0.0.1 on the uiUrl port, for this home,
 * with this Wheelhouse's token for the Improvements page to drive it with.
 * improve's `npm run dev` binds every interface, so Wheelhouse runs Vite itself.
 * The UI's dependencies are installed first when they are missing.
 * @param {ProviderContext} ctx @returns {Promise<ServiceResolution>}
 */
async function uiService(ctx) {
  const config = await ctx.readFile(".harness/improve.json", { root: "home", maxBytes: 64 * 1024 });
  if (!adapterEnabled(config)) {
    return { available: false, reason: "improve’s Firstmate adapter is off in this home." };
  }
  const cli = await findAdapter(ctx);
  if (!cli) {
    return {
      available: false,
      reason: "Wheelhouse could not find improve; set plugins.improve.settings.adapter to its checkout."
    };
  }
  const home = await homeOf(ctx, cli);
  if (!home) return { available: false, reason: "improve could not be read in this home." };
  const root = improveRoot(path.isAbsolute(cli) ? cli : path.join(home, cli));
  const dir = path.join(root, "ui");
  const url = uiUrl(ctx.settings);
  const u = new URL(url);
  const hint = startCommand(root, home, url);
  if (!existsSync(path.join(dir, "package.json"))) {
    return { available: false, reason: `This copy of improve (${root}) has no review UI.` };
  }
  if (!LOOPBACK.has(u.hostname)) {
    return {
      available: false,
      reason: `Its address, ${url}, is not on this computer, so Wheelhouse does not start it.`,
      hint
    };
  }
  const vite = path.join(dir, "node_modules", "vite", "bin", "vite.js");
  return {
    available: true,
    hint,
    spec: {
      url,
      health: `${url}/api/status`,
      identity: { url: `${url}/api/status`, path: ["harness_initialized"] },
      argv: [process.execPath, vite, "dev", "--host", "127.0.0.1", "--port", u.port || "5173", "--strictPort"],
      cwd: dir,
      env: { IMPROVE_PROJECT_DIR: home, IMPROVE_LAUNCH_TOKEN: LAUNCH_TOKEN },
      binds: "loopback",
      readyTimeoutMs: 60_000,
      setup: existsSync(vite)
        ? []
        : [
            {
              label: "Installing the UI’s dependencies",
              argv: ["npm", "install", "--no-audit", "--no-fund"],
              timeoutMs: 5 * 60_000
            }
          ]
    }
  };
}

/** @param {ProviderContext} ctx @returns {Promise<Available>} */
async function harness(ctx) {
  const config = await ctx.readFile(".harness/improve.json", { root: "home", maxBytes: 64 * 1024 });
  if (!adapterEnabled(config)) {
    return { available: false, reason: "improve’s Firstmate adapter is off in this home." };
  }
  const cli = await findAdapter(ctx);
  /** @type {string[]} */
  const problems = [];
  /** @param {string[]} args @returns {Promise<ExecResult>} */
  const run = (args) =>
    cli
      ? ctx.exec({
          argv: [process.execPath, cli, ...args, "--project", "."],
          cwd: "home",
          timeoutMs: RUN_MS,
          maxBytes: MAX_OUT
        })
      : Promise.resolve({ ok: false, reason: "no adapter", stdout: "", stderr: "" });
  if (!cli) {
    problems.push(
      "Wheelhouse could not find improve’s Firstmate adapter. Set plugins.improve.settings.adapter to improve’s checkout."
    );
  }

  const [detectR, importR, inventoryR, routeR, decisionsR, names, stateText] = await Promise.all([
    run(["detect"]),
    run(["import"]),
    run(["inventory"]),
    run(["route"]),
    run(["decisions"]),
    ctx.listDir(".harness/proposals", { root: "home" }),
    ctx.readFile(".harness/firstmate/review-state.json", { root: "home", maxBytes: 64 * 1024 })
  ]);
  const detect = json(detectR);
  let reviewState = null;
  try {
    reviewState = stateText ? JSON.parse(stateText) : null;
  } catch {
    reviewState = null;
  }
  if (cli && !isRecord(detect)) problems.push(`improve could not be read: ${why(detectR)}.`);
  else if (isRecord(detect) && detect.detected !== true)
    problems.push("improve does not recognise this home as a Firstmate home.");
  if (cli && !importR.ok) problems.push(`improve could not read the home’s records: ${why(importR)}.`);

  const files = (names ?? []).filter((n) => /\.ya?ml$/i.test(n));
  const home = isRecord(detect) && typeof detect.home === "string" ? detect.home : null;
  const [dueR, checkR, texts, uiState] = await Promise.all([
    dueIsReadOnly(detect, reviewState) ? run(["due"]) : Promise.resolve(null),
    cli && files.length
      ? ctx.exec({
          argv: [process.execPath, path.join(improveRoot(cli), CHECK), ...files.map((f) => `.harness/proposals/${f}`)],
          cwd: "home",
          timeoutMs: RUN_MS,
          maxBytes: MAX_OUT
        })
      : Promise.resolve(null),
    Promise.all(files.map((f) => ctx.readFile(`.harness/proposals/${f}`, { root: "home", maxBytes: 64 * 1024 }))),
    ui(ctx, cli, home)
  ]);

  const routeOut = json(routeR);
  /** @type {Raw} */
  const raw = {
    detect,
    observations: json(importR),
    inventory: json(inventoryR),
    route: Array.isArray(routeOut)
      ? { ok: true, entries: routeOut }
      : { ok: false, reason: cli ? `${why(routeR)}.` : "improve’s adapter was not found." },
    routed: decisionsR.ok
      ? parseRouted(json(decisionsR))
      : parseLedger(await ctx.readFile(".harness/firstmate/routed.json", { root: "home", maxBytes: 64 * 1024 })),
    proposals: files.map((file, i) => ({ file, text: texts[i] })),
    checks: checkR ? parseChecks(checkR.stdout) : {},
    reviewState,
    due: dueR ? json(dueR) : null,
    tasks: ctx.tasks,
    ui: uiState,
    problems,
    now: Date.now()
  };
  return {
    available: true,
    value: buildHarness(raw),
    source: "improve’s Firstmate adapter",
    observedAt: new Date().toISOString()
  };
}

/** @param {ProviderContext} ctx @returns {Promise<Available>} */
async function proposal(ctx) {
  /** @param {string} reason @returns {Available} */
  const none = (reason) => ({ available: false, reason });
  const task = ctx.task;
  if (!task?.id.startsWith("improve-")) return none("This task is not an improve proposal.");
  const config = await ctx.readFile(".harness/improve.json", { root: "home", maxBytes: 64 * 1024 });
  if (!adapterEnabled(config)) return none("improve’s Firstmate adapter is off in this home.");
  const ledger = parseLedger(
    await ctx.readFile(".harness/firstmate/routed.json", { root: "home", maxBytes: 64 * 1024 })
  );
  const routed = ledger.find((r) => r.taskId === task.id);
  if (!routed) return none("improve has no proposal filed as this task.");
  const rel = `.harness/proposals/${routed.file}`;
  const cli = await findAdapter(ctx);
  const [text, checkR, uiState] = await Promise.all([
    ctx.readFile(rel, { root: "home", maxBytes: 64 * 1024 }),
    cli
      ? ctx.exec({
          argv: [process.execPath, path.join(improveRoot(cli), CHECK), rel],
          cwd: "home",
          timeoutMs: RUN_MS,
          maxBytes: MAX_OUT
        })
      : Promise.resolve(null),
    ui(ctx, cli, await homeOf(ctx, cli))
  ]);
  const item = proposalItem(readProposal(routed.file, text), {
    check: checkR ? (parseChecks(checkR.stdout)[routed.file] ?? null) : null,
    routed,
    route: null,
    tasks: [task],
    ui: uiState
  });
  /** @type {ProposalSection} */
  const value = {
    schema: "wheelhouse-improve-proposal.v1",
    proposal: item,
    improvementsHref: proposalHref(routed.file),
    ui: uiState
  };
  return { available: true, value, source: "improve’s proposal file", observedAt: new Date().toISOString() };
}

export default {
  services: [{ id: "ui", title: "improve’s review UI", scope: "fleet", resolve: uiService }],
  providers: [
    { id: "harness", scope: "fleet", ttlMs: 30_000, timeoutMs: 10_000, fetch: harness },
    { id: "proposal", scope: "task", ttlMs: 30_000, timeoutMs: 9_000, fetch: proposal }
  ],
  contributions: [
    {
      slot: "nav.page",
      id: "improvements",
      title: "Improvements",
      provider: "harness",
      when: "provider-available",
      render: { element: "improve-improvements" }
    },
    {
      slot: "home.card",
      id: "health",
      title: "Harness",
      provider: "harness",
      when: "provider-available",
      /** @param {unknown} v */
      badge: (v) => /** @type {HarnessView} */ (v).waiting,
      render: { element: "improve-health" }
    },
    {
      slot: "header.indicator",
      id: "indicator",
      title: "Harness",
      provider: "harness",
      when: "provider-available",
      render: { element: "improve-indicator" }
    },
    {
      slot: "task.section",
      id: "proposal",
      title: "Improvement",
      provider: "proposal",
      when: "provider-available",
      placement: { order: 10 },
      render: { element: "improve-proposal" }
    }
  ]
};
