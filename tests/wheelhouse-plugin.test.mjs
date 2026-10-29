import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

// improve's Wheelhouse plugin, as Wheelhouse loads it: the committed server
// bundle, called through a read-only context like Wheelhouse's, against a fake
// improve checkout. Its adapter CLI prints canned output for each command and
// logs how it was called, so the tests can check that the plugin only reads.

const pluginRoot = path.resolve(import.meta.dirname, "..");
const bundle = path.join(pluginRoot, "wheelhouse", "server", "index.js");
const manifest = JSON.parse(fs.readFileSync(path.join(pluginRoot, ".wheelhouse-plugin", "plugin.json"), "utf8"));

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "improve-wheelhouse-"));
const home = path.join(dir, "home");
const improveDir = path.join(dir, "improve");
const log = path.join(dir, "calls.log");
// No installed improve on this machine leaks in as the fallback adapter.
process.env.CLAUDE_CONFIG_DIR = path.join(dir, "claude-config");

const OUT = {
  detect: {
    detected: true,
    enabled: true,
    via: "AGENTS.md",
    home,
    code_root: "",
    route_reviews: true,
    periodic_review: { enabled: true, every_tasks: 20, every_days: 7 }
  },
  import: {
    imported_at: "2026-10-26T10:00:00.000Z",
    counts: { tasks: 42, ask_user_findings: 12, decisions: 30, blockers: 2, open: 1, captain_preferences: 9, learnings: 14 },
    repeated: {
      ask_user_findings: [
        {
          kind: "repeated-ask-user",
          count: 3,
          tasks: ["a", "b", "c"],
          example: "Should a missing config file be an error or use defaults?",
          decided_answers: ["use defaults"]
        }
      ],
      decisions: [
        { kind: "repeated-decision", count: 2, tasks: ["a", "d"], example: "Keep the legacy endpoint for one release?", answers: ["keep it"] }
      ]
    }
  },
  inventory: {
    contract: { file: "AGENTS.md", estimated_tokens: 5200, startup_memory_budget_tokens: 7500, share_of_budget: 0.69 },
    skills: { count: 11, largest: [{ skill: "firstmate-review" }] }
  },
  route: [
    { file: "IMP-1.yaml", action: "skip", why: "already filed as improve-imp-1", delivery: "local-apply" },
    { file: "IMP-2.yaml", action: "hold", delivery: "upstream-pr", visibility: "shared-tracked", surfaces: ["contract"], outcome: "dry-run" },
    { file: "IMP-3.yaml", action: "skip", why: "status is draft, not proposed" }
  ],
  decisions: [
    { file: "IMP-1.yaml", proposal: "IMP-1", task_id: "improve-imp-1", delivery: "local-apply", routed_at: "2026-10-25T09:00:00.000Z", outcome: "dry-run" }
  ],
  due: { due: true, reasons: ["21 Firstmate tasks dispatched since the last harness review"] }
};

const PROPOSALS = {
  "IMP-1.yaml": `id: IMP-1
title: Tell workers a missing config file falls back to defaults
layer: instructions
status: proposed
created_at: 2026-10-24T09:00:00Z
hypothesis: Workers stop asking the same question.
evidence:
  - source: firstmate import
    observation: The same review question came up in 3 tasks.
scope:
  files: [data/captain.md]
intervention:
  summary: >
    Workers ask each time.
    Add one line to captain.md.
`,
  "IMP-2.yaml": `id: IMP-2
title: Shorten the always-loaded contract
status: proposed
created_at: 2026-10-25T09:00:00Z
scope:
  files: [AGENTS.md]
intervention:
  summary: Move the review rules into a skill.
`,
  "IMP-3.yaml": `id: IMP-3
title: A draft
status: draft
scope:
  files: [bin/fm-brief.sh]
`
};

const CHECKS = {
  "IMP-1.yaml": { visibility: "captain-private", surfaces: ["captain-preferences"], delivery: "local-apply", findings: [] },
  "IMP-2.yaml": { visibility: "shared-tracked", surfaces: ["contract"], delivery: "upstream-pr", findings: [] },
  "IMP-3.yaml": { visibility: "shared-tracked", surfaces: ["brief-scaffold"], delivery: "upstream-pr", findings: [] }
};

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

write(path.join(dir, "out.json"), JSON.stringify(OUT));
write(path.join(dir, "checks.json"), JSON.stringify(CHECKS));
write(
  path.join(improveDir, "adapters", "firstmate", "cli.mjs"),
  `import fs from "node:fs";
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ cwd: process.cwd(), args }) + "\\n");
const out = JSON.parse(fs.readFileSync(${JSON.stringify(path.join(dir, "out.json"))}, "utf8"))[args[0]];
process.stdout.write(JSON.stringify(out, null, 2) + "\\n");
`
);
write(
  path.join(improveDir, "scripts", "proposal-check-cli.mjs"),
  `import fs from "node:fs";
const checks = JSON.parse(fs.readFileSync(${JSON.stringify(path.join(dir, "checks.json"))}, "utf8"));
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ cwd: process.cwd(), args: ["check", ...process.argv.slice(2)] }) + "\\n");
for (const f of process.argv.slice(2)) {
  process.stdout.write(JSON.stringify({ file: f, scope: "harness", firstmate: checks[f.split("/").pop()] }, null, 2) + "\\n");
}
`
);
write(path.join(improveDir, "ui", "package.json"), '{"name":"improve-ui"}');

function setHome(o = {}) {
  fs.rmSync(home, { recursive: true, force: true });
  write(path.join(home, ".harness", "improve.json"), JSON.stringify(o.config ?? { adapters: { firstmate: { enabled: true } } }));
  for (const [f, text] of Object.entries(PROPOSALS)) write(path.join(home, ".harness", "proposals", f), text);
  write(
    path.join(home, ".harness", "firstmate", "routed.json"),
    JSON.stringify({
      schema_version: 1,
      proposals: {
        "IMP-1.yaml": { proposal: "IMP-1", task_id: "improve-imp-1", delivery: "local-apply", routed_at: "2026-10-25T09:00:00.000Z" }
      }
    })
  );
  if (o.reviewState !== null)
    write(
      path.join(home, ".harness", "firstmate", "review-state.json"),
      JSON.stringify(o.reviewState ?? { last_reviewed_at: "2026-10-20T09:00:00.000Z" })
    );
  write(log, "");
}

const calls = () =>
  fs
    .readFileSync(log, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));

const tasks = [
  {
    id: "improve-imp-1",
    projectId: "unassigned",
    title: "Improve: Tell workers…",
    status: "needs-decision",
    statusLabel: "Needs your call",
    attention: { kind: "decision", owner: "captain", text: "Approve, reject, or defer", url: null },
    pr: null
  },
  { id: "lumen-1", projectId: "lumen", title: "Lumen", status: "working", pr: null }
];

// The parts of Wheelhouse's read-only context the plugin uses, confined to the home.
const inHome = (rel) => {
  const file = path.resolve(home, rel);
  if (!file.startsWith(home + path.sep)) throw new Error(`${rel} leads outside the home`);
  return file;
};
function context(settings = {}, task = null) {
  return {
    settings: { adapter: improveDir, uiUrl, ...settings },
    signal: AbortSignal.timeout(10_000),
    tasks,
    task,
    project: null,
    async readFile(rel, o) {
      assert.equal(o.root, "home");
      try {
        return fs.readFileSync(inHome(rel), "utf8").slice(0, o.maxBytes);
      } catch {
        return null;
      }
    },
    async listDir(rel, o) {
      assert.equal(o.root, "home");
      try {
        return fs.readdirSync(inHome(rel));
      } catch {
        return null;
      }
    },
    async exec(o) {
      assert.equal(o.cwd, "home");
      const r = spawnSync(o.argv[0], o.argv.slice(1), {
        cwd: home,
        encoding: "utf8",
        timeout: o.timeoutMs,
        maxBuffer: o.maxBytes,
        env: { PATH: process.env.PATH, HOME: process.env.HOME }
      });
      const ok = r.status === 0;
      return { ok, reason: ok ? "" : `exited ${r.status}`, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
    }
  };
}

const serve = (handler) =>
  new Promise((resolve) => {
    const s = createServer(handler);
    s.listen(0, "127.0.0.1", () => resolve({ server: s, url: `http://127.0.0.1:${s.address().port}` }));
  });
// improve's own UI (which says its token, for this home), one from before it did, one still compiling
// /api/embed, one for another repository, and another app on a port that answers 2xx without improve's status report.
const improveUi = (embed) => (req, res) => {
  res.setHeader("content-type", "application/json");
  if (req.url === "/api/status") res.end('{"schema_version":1,"harness_initialized":true}');
  else if (req.url === "/api/health") res.end('{"ok":true}');
  else if (req.url === "/api/embed" && embed) res.end(JSON.stringify(embed()));
  else {
    res.statusCode = 404;
    res.end("{}");
  }
};
const ui = await serve(improveUi(() => ({ token: "running-token", project: home })));
const oldUi = await serve(improveUi(null));
const slowUi = await serve((req, res) => {
  if (req.url === "/api/embed") setTimeout(() => res.end("{}"), 1500);
  else improveUi(null)(req, res);
});
const elsewhereUi = await serve(improveUi(() => ({ token: "elsewhere-token", project: path.join(dir, "another-repo") })));
const other = await serve((req, res) => {
  res.statusCode = req.url === "/api/health" || req.url === "/api/status" ? 200 : 404;
  res.end('{"ok":true}');
});
const uiUrl = ui.url;

const mod = await import(pathToFileURL(bundle).href);
const plugin = mod.default;
const { adapterCandidates, adapterEnabled, dueIsReadOnly, startCommand } = mod;
const provider = (id) => plugin.providers.find((p) => p.id === id).fetch;
const service = (id) => plugin.services.find((s) => s.id === id).resolve;

try {
  // The server entry contributes exactly what the manifest declares, as Wheelhouse requires.
  const declared = (list) => list.map((c) => `${c.id}:${c.slot ?? c.scope}`).sort();
  assert.deepEqual(declared(plugin.contributions), declared(manifest.wheelhouse.contributions));
  assert.deepEqual(declared(plugin.services), declared(manifest.wheelhouse.services));
  assert.equal(plugin.id, undefined, "the id, version and contract come from the manifest");
  for (const c of plugin.contributions) {
    assert.ok(c.render.element.startsWith(`${manifest.name}-`), `${c.id} is drawn by one of the plugin's own elements`);
    assert.equal(c.when, "provider-available");
  }
  assert.equal(manifest.wheelhouse.enabledWhenHomeFile, ".harness/improve.json");
  assert.equal(manifest.version, JSON.parse(fs.readFileSync(path.join(pluginRoot, ".claude-plugin", "plugin.json"), "utf8")).version);

  // One read fills the menu page, the rail card and the header indicator.
  setHome();
  const r = await provider("harness")(context());
  assert.equal(r.available, true);
  assert.equal(r.source, "improve’s Firstmate adapter");
  const v = r.value;
  assert.equal(v.schema, "wheelhouse-improve.v1");
  assert.deepEqual(
    { due: v.review.due, headline: v.review.headline, lastReviewedAt: v.review.lastReviewedAt },
    {
      due: true,
      headline: "A harness review is due: 21 Firstmate tasks dispatched since the last harness review.",
      lastReviewedAt: "2026-10-20T09:00:00.000Z"
    }
  );
  assert.equal(v.waiting, 2);
  // The rail's Harness tab counts what waits for the captain.
  assert.equal(plugin.contributions.find((c) => c.slot === "home.card").badge(v), 2);
  assert.equal(
    v.evidence.summary,
    "improve has read 42 tasks with 12 review questions, 30 decisions and 2 blockers, and 9 preferences of yours and 14 learnings."
  );
  assert.deepEqual(
    v.evidence.patterns.map((p) => p.sentence),
    [
      "The automated review asked the same question in 3 tasks: “Should a missing config file be an error or use defaults?”",
      "Firstmate asked you the same thing in 2 tasks: “Keep the legacy endpoint for one release?”"
    ]
  );
  assert.deepEqual(v.inventory, ["AGENTS.md is about 5,200 tokens, 69% of the startup budget.", "11 skills; the largest is firstmate-review."]);
  assert.deepEqual(v.problems, []);
  assert.deepEqual(v.evidence.mix, [
    { key: "ask_user_findings", label: "Review questions", value: 12 },
    { key: "decisions", label: "Decisions", value: 30 },
    { key: "blockers", label: "Blockers", value: 2 },
    { key: "captain_preferences", label: "Your preferences", value: 9 },
    { key: "learnings", label: "Learnings", value: 14 }
  ]);
  assert.deepEqual(
    { kind: v.evidence.patterns[0].kind, count: v.evidence.patterns[0].count, tasks: v.evidence.patterns[0].tasks },
    { kind: "review", count: 3, tasks: 3 }
  );
  assert.deepEqual(v.evidence.patterns[0].answers, ["use defaults"]);
  assert.deepEqual(v.size, { contractFile: "AGENTS.md", contractTokens: 5200, budgetShare: 0.69, skills: 11, largestSkill: "firstmate-review" });

  const [p2, p1, p3] = v.proposals;
  assert.deepEqual(
    {
      file: p1.file,
      kind: p1.kind,
      kindLabel: p1.kindLabel,
      group: p1.group,
      statusShort: p1.statusShort,
      visibilityShort: p1.visibilityShort,
      summary: p1.summary,
      title: p1.title,
      statusLabel: p1.statusLabel,
      changes: p1.changes,
      visibility: p1.visibility,
      visibilityLabel: p1.visibilityLabel,
      surfaces: p1.surfaces,
      evidence: p1.evidence,
      routing: p1.routing,
      reviewHref: p1.reviewHref,
      openUrl: p1.openUrl
    },
    {
      file: "IMP-1.yaml",
      kind: "preference",
      kindLabel: "Preference",
      group: "waiting",
      statusShort: "Your call",
      visibilityShort: "Private",
      summary: "Workers ask each time.",
      title: "Tell workers a missing config file falls back to defaults",
      statusLabel: "Waiting for your call",
      changes: "Workers ask each time. Add one line to captain.md.",
      visibility: "captain-private",
      visibilityLabel: "Private to you",
      surfaces: ["your preferences"],
      evidence: [{ source: "firstmate import", observation: "The same review question came up in 3 tasks." }],
      routing: null,
      reviewHref: "/plugins/improve/improvements#/proposals?view=all&p=IMP-1.yaml",
      openUrl: `${uiUrl}/proposals?p=IMP-1.yaml`
    }
  );
  assert.deepEqual(
    { taskId: p1.decision.taskId, href: p1.decision.href, state: p1.decision.state },
    { taskId: "improve-imp-1", href: "/tasks/improve-imp-1", state: "Waiting for your call" }
  );
  assert.equal(p1.createdAt, "2026-10-24T09:00:00Z");
  assert.deepEqual(
    { file: p2.file, kind: p2.kind, visibilityShort: p2.visibilityShort, visibilityLabel: p2.visibilityLabel, decision: p2.decision, routing: p2.routing },
    {
      file: "IMP-2.yaml",
      kind: "instructions",
      visibilityShort: "Shared",
      visibilityLabel: "Shared Firstmate code",
      decision: null,
      routing: "Not filed yet: the next /improve review files it as a decision for you."
    }
  );
  assert.deepEqual(
    { kind: p3.kind, group: p3.group, statusShort: p3.statusShort, file: p3.file, waiting: p3.waiting, statusLabel: p3.statusLabel, routing: p3.routing },
    { kind: "script", group: "drafting", statusShort: "Draft", file: "IMP-3.yaml", waiting: false, statusLabel: "Being drafted", routing: null }
  );
  assert.deepEqual({ running: v.ui.running, deepLinks: v.ui.deepLinks, start: v.ui.start }, { running: true, deepLinks: true, start: null });
  // The running UI's own token, read back from it, for the Improvements page to drive it with.
  assert.deepEqual(
    { token: v.ui.token, project: v.ui.project, servesHome: v.ui.servesHome, connects: v.ui.connects },
    { token: "running-token", project: home, servesHome: true, connects: true }
  );
  // Plain JSON, as Wheelhouse requires of a provider's value.
  assert.deepEqual(JSON.parse(JSON.stringify(v)), v);

  // It only reads: no --apply or --save, every command in the home.
  {
    const c = calls();
    assert.deepEqual(c.map((x) => x.args[0]).sort(), ["check", "decisions", "detect", "due", "import", "inventory", "route"].sort());
    for (const x of c) {
      assert.ok(!x.args.includes("--apply"));
      assert.ok(!x.args.includes("--save"));
      assert.equal(fs.realpathSync(x.cwd), fs.realpathSync(home));
    }
    assert.deepEqual(
      c.find((x) => x.args[0] === "check").args.slice(1),
      Object.keys(PROPOSALS).map((f) => `.harness/proposals/${f}`)
    );
  }

  // It does not run due while it could still write the start of the count.
  setHome({ reviewState: null });
  {
    const review = (await provider("harness")(context())).value.review;
    assert.ok(!calls().map((x) => x.args[0]).includes("due"));
    assert.deepEqual(
      { due: review.due, headline: review.headline, lastReviewedAt: review.lastReviewedAt },
      { due: null, headline: "Periodic review is on; improve starts counting at its next Claude Code session.", lastReviewedAt: null }
    );
  }

  // It is silent when the adapter is off, and when the home has no improve.json.
  setHome({ config: { adapters: { firstmate: { enabled: false } } } });
  assert.deepEqual(await provider("harness")(context()), { available: false, reason: "improve’s Firstmate adapter is off in this home." });
  assert.deepEqual(calls(), []);
  fs.rmSync(path.join(home, ".harness", "improve.json"));
  assert.equal((await provider("harness")(context())).available, false);

  // It says how to start the UI when it is down, and hands the page the token Wheelhouse launches it with.
  setHome();
  let launchToken;
  {
    const down = (await provider("harness")(context({ uiUrl: "http://127.0.0.1:1" }))).value.ui;
    assert.equal(down.start, startCommand(improveDir, home, "http://127.0.0.1:1"));
    assert.match(down.start, /--host 127\.0\.0\.1 --port 1$/);
    assert.match(down.token, /^[0-9a-f]{48}$/);
    assert.deepEqual({ project: down.project, servesHome: down.servesHome, connects: down.connects }, { project: null, servesHome: null, connects: true });
    launchToken = down.token;
  }

  // A UI too old to say its token runs, but the page cannot drive it; one for another repository is not this home's.
  {
    const old = (await provider("harness")(context({ uiUrl: oldUi.url }))).value.ui;
    assert.deepEqual({ running: old.running, token: old.token, connects: old.connects, servesHome: old.servesHome }, { running: true, token: null, connects: false, servesHome: null });
    const slow = (await provider("harness")(context({ uiUrl: slowUi.url }))).value.ui;
    assert.deepEqual({ running: slow.running, token: slow.token, connects: slow.connects, servesHome: slow.servesHome }, { running: true, token: launchToken, connects: true, servesHome: null });
    const away = (await provider("harness")(context({ uiUrl: elsewhereUi.url }))).value.ui;
    assert.deepEqual({ running: away.running, servesHome: away.servesHome, project: away.project }, { running: true, servesHome: false, project: path.join(dir, "another-repo") });
  }

  // It does not take another app on improve's port for improve's UI.
  {
    const o = (await provider("harness")(context({ uiUrl: other.url }))).value.ui;
    assert.equal(o.running, false);
    assert.equal(o.start, startCommand(improveDir, home, other.url));
  }

  // The proposal on its Firstmate task, linking back to Improvements; any other task gets nothing.
  {
    const s = await provider("proposal")(context({}, tasks[0]));
    assert.equal(s.available, true);
    assert.equal(s.value.schema, "wheelhouse-improve-proposal.v1");
    assert.equal(s.value.improvementsHref, "/plugins/improve/improvements#/proposals?view=all&p=IMP-1.yaml");
    assert.deepEqual(Object.keys(s.value).sort(), ["improvementsHref", "proposal", "schema"]);
    assert.doesNotMatch(JSON.stringify(s.value), /running-token/);
    assert.deepEqual(
      { id: s.value.proposal.id, visibility: s.value.proposal.visibility, state: s.value.proposal.decision.state },
      { id: "IMP-1", visibility: "captain-private", state: "Waiting for your call" }
    );
    assert.equal((await provider("proposal")(context({}, tasks[1]))).available, false);
    assert.equal((await provider("proposal")(context({}, null))).available, false);
  }

  // improve's review UI as a service: improve's own Vite on 127.0.0.1 for this home, installing its dependencies first.
  {
    assert.equal(plugin.services[0].title, "improve’s review UI");
    assert.equal(plugin.services[0].scope, "fleet");
    const sv = await service("ui")(context({ uiUrl: "http://127.0.0.1:5199" }));
    assert.equal(sv.available, true);
    const uiDir = path.join(improveDir, "ui");
    assert.deepEqual(sv.spec, {
      url: "http://127.0.0.1:5199",
      health: "http://127.0.0.1:5199/api/status",
      identity: { url: "http://127.0.0.1:5199/api/status", path: ["harness_initialized"] },
      argv: [process.execPath, path.join(uiDir, "node_modules", "vite", "bin", "vite.js"), "dev", "--host", "127.0.0.1", "--port", "5199", "--strictPort"],
      cwd: uiDir,
      env: { IMPROVE_PROJECT_DIR: home, IMPROVE_LAUNCH_TOKEN: launchToken },
      binds: "loopback",
      readyTimeoutMs: 60_000,
      setup: [{ label: "Installing the UI’s dependencies", argv: ["npm", "install", "--no-audit", "--no-fund"], timeoutMs: 300_000 }]
    });
    assert.match(sv.hint, /--host 127\.0\.0\.1 --port 5199/);
  }

  // Its identity check tells improve's UI from another app on the port.
  {
    const identity = async (url) => {
      const sv = await service("ui")(context({ uiUrl: url }));
      const body = await (await fetch(sv.spec.identity.url)).json();
      return sv.spec.identity.path.every((k) => k in body);
    };
    assert.equal(await identity(uiUrl), true);
    assert.equal(await identity(other.url), false);
  }

  // It does not start a UI set to an address off this computer, or with improve off.
  assert.equal((await service("ui")(context({ uiUrl: "http://10.0.0.5:5173" }))).available, false);
  setHome({ config: { adapters: { firstmate: { enabled: false } } } });
  assert.deepEqual(await service("ui")(context()), { available: false, reason: "improve’s Firstmate adapter is off in this home." });

  // A copy of the plugin with no improve beside it says plainly that it cannot find the adapter.
  setHome();
  {
    const lone = path.join(dir, "lone", "wheelhouse", "server", "index.js");
    fs.mkdirSync(path.dirname(lone), { recursive: true });
    fs.copyFileSync(bundle, lone);
    const loneMod = await import(pathToFileURL(lone).href);
    const nowhere = context({ adapter: path.join(dir, "nowhere"), uiUrl: "http://127.0.0.1:1" });
    const lv = (await loneMod.default.providers.find((p) => p.id === "harness").fetch(nowhere)).value;
    assert.match(lv.problems[0], /could not find improve’s Firstmate adapter/);
    assert.ok(lv.proposals.map((p) => p.title).includes("Shorten the always-loaded contract"));
    assert.ok(lv.proposals.every((p) => p.openUrl === null));
    assert.deepEqual({ running: lv.ui.running, start: lv.ui.start }, { running: false, start: null });
  }

  // Helpers.
  assert.equal(adapterEnabled('{"adapters":{"firstmate":{"enabled":true}}}'), true);
  assert.equal(adapterEnabled('{"adapters":{"firstmate":{"enabled":"yes"}}}'), false);
  assert.equal(adapterEnabled("not json"), false);
  assert.equal(adapterEnabled(null), false);

  const d = { detected: true, enabled: true, periodic_review: { enabled: true } };
  assert.equal(dueIsReadOnly(d, { enabled_at: "x" }), true);
  assert.equal(dueIsReadOnly(d, { last_reviewed_at: "x" }), true);
  assert.equal(dueIsReadOnly(d, {}), false);
  assert.equal(dueIsReadOnly({ ...d, periodic_review: { enabled: false } }, { enabled_at: "x" }), false);
  assert.equal(dueIsReadOnly(null, { enabled_at: "x" }), false);

  // The adapter is looked for in the setting, the installed copy, the home's clone, then the copy this plugin came with.
  const installed = JSON.stringify({
    plugins: {
      "improve@improve-marketplace": [{ installPath: "/plugins/improve/0.1.0" }],
      "other@x": [{ installPath: "/plugins/other" }]
    }
  });
  const read = (f) => (f === "/cfg/plugins/installed_plugins.json" ? installed : null);
  assert.deepEqual(adapterCandidates({ adapter: "/src/improve" }, { CLAUDE_CONFIG_DIR: "/cfg" }, read, null), [
    "/src/improve/adapters/firstmate/cli.mjs",
    "/plugins/improve/0.1.0/adapters/firstmate/cli.mjs",
    "projects/improve/adapters/firstmate/cli.mjs"
  ]);
  assert.deepEqual(adapterCandidates({}, { HOME: "/h" }, () => null), [
    "projects/improve/adapters/firstmate/cli.mjs",
    path.join(pluginRoot, "adapters", "firstmate", "cli.mjs")
  ]);
  assert.ok(fs.existsSync(path.join(pluginRoot, "adapters", "firstmate", "cli.mjs")));
} finally {
  for (const s of [ui, oldUi, slowUi, elsewhereUi, other]) s.server.close();
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("wheelhouse-plugin tests passed");
