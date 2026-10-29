import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Window } from "happy-dom";

// improve's custom elements, from the committed UI bundle, in a DOM: what each
// draws from the provider's value, that plugin text stays text and links stay
// http(s) or same-origin, and that a new value redraws the same element
// without closing what the captain opened. The Improvements page is improve's
// own review UI: it is driven here against a stand-in for that UI's server,
// through every view and action, as Wheelhouse's page would drive it.

const window = new Window({ url: "http://127.0.0.1:4000/plugins/improve/improvements" });
// Everything the DOM has that Node does not, plus the DOM's own events and page objects.
const OWN = ["document", "location", "history", "navigator", "Event", "CustomEvent", "EventTarget", "KeyboardEvent", "MouseEvent"];
for (const k of Object.getOwnPropertyNames(window)) {
  if (k in globalThis && !OWN.includes(k)) continue;
  try {
    Object.defineProperty(globalThis, k, { value: window[k], configurable: true, writable: true });
  } catch {
    // read-only on this side: Node's own stays
  }
}
for (const k of ["addEventListener", "removeEventListener", "dispatchEvent"]) {
  Object.defineProperty(globalThis, k, { value: window[k].bind(window), configurable: true, writable: true });
}
Object.defineProperty(globalThis, "window", { value: window, configurable: true, writable: true });

// The stand-in for improve's review UI: its API, answering only with this token.
const UI = "http://127.0.0.1:5173";
const TOKEN = "a".repeat(48);
const api = { up: true, token: TOKEN, requests: [], state: null };
const ago = (days) => new Date(Date.now() - days * 86400_000).toISOString();
function freshState() {
  const base = { evidence: [], reasons_to_reject: [], risks: [], check: null, scope: { files: [] } };
  return {
    proposals: [
      {
        ...base,
        file: "IMP-1.yaml",
        id: "IMP-1",
        title: "Tell workers a missing config file falls back to defaults",
        status: "proposed",
        created_at: ago(2),
        hypothesis: "Workers stop asking the same question.",
        intervention: { summary: "Add one line to captain.md." },
        scope: { files: ["data/captain.md"] },
        evidence: [{ source: "firstmate import", observation: "The same review question came up in 3 tasks." }]
      },
      { ...base, file: "IMP-9.yaml", id: "IMP-9", title: "Note the release checklist", status: "approved", created_at: ago(5), scope: { files: ["data/learnings.md"] } }
    ],
    dreams: [
      {
        file: "dream-1.json",
        status: "completed",
        produced_at: ago(1),
        findings: [{ index: 0, title: "Workers re-read AGENTS.md", hypothesis: "It is long.", intervention: "Split it.", evidence: [], reasons_to_reject: [] }]
      }
    ],
    jobs: [{ id: "job-1", kind: "evaluate", title: "Evaluate smoke", status: "running", started_at: ago(0), progress: { message: "Step 1 of 2" }, detail: { suite: "smoke.yaml" } }]
  };
}
const ROUTES = {
  "GET /api/status": () => ({
    project: "/fm/home",
    harness_initialized: true,
    review_due_reasons: ["21 sessions since the last review"],
    state: { sessions_since_review: 21, tool_calls_since_review: 400 },
    data_location: "/data",
    transcripts: { count: 2, oldest_age_days: 4 },
    eval_rig: { installed: "1.0.0", available: "1.1.0", drifted: true },
    background_dreaming_enabled: false
  }),
  "GET /api/proposals": () => ({ proposals: api.state.proposals }),
  "GET /api/dreams": () => ({ dreams: api.state.dreams }),
  "GET /api/jobs": () => ({ jobs: api.state.jobs }),
  "GET /api/objectives": () => ({
    objectives: [
      {
        id: "verify-before-done",
        description: "Workers run the checks before they say done.",
        covered: true,
        encountered: true,
        registered: true,
        regime: "observed",
        history: [{ score: 0.5, occurred_at: ago(3) }, { score: 1, occurred_at: ago(1) }],
        latest: { score: 1, success: true, occurred_at: ago(1) },
        trend: 0.5,
        suites: ["smoke"],
        success_criteria: []
      }
    ]
  }),
  "GET /api/skills": () => ({ skills: [{ name: "fm-review", use: 3, view: 5, patch: 1, archived_versions: 0, proposal: "IMP-0.yaml", use_last_at: ago(1) }] }),
  "GET /api/coverage": () => ({ uncovered: [] }),
  "GET /api/decisions": () => ({ decisions: [] }),
  "GET /api/suites": () => ({ suites: [{ file: "smoke.yaml", id: "smoke", objective_id: "verify-before-done", steps: 2, threshold: 0.8 }] }),
  "GET /api/runs": () => ({ runs: [] }),
  "GET /api/transcripts": () => ({ transcripts: [] }),
  "GET /api/jobs/job-1/log": () => ({ text: "2026-10-29T10:00:00.000Z step one\n" }),
  "GET /api/proposals/IMP-9.yaml/apply-run": () => ({
    mode: "local-apply",
    action: "Apply",
    files: ["data/learnings.md"],
    commands: ["node scripts/proposal-check-cli.mjs"],
    outputs: [],
    explanation: "The run applies it as /improve apply does.",
    digest: "digest-9",
    branch: null
  }),
  "POST /api/proposals/IMP-1.yaml/approve": () => ({ ok: true, next: "Apply it when you are ready." }),
  "POST /api/proposals/IMP-1.yaml/reject": () => ({ ok: true }),
  "POST /api/proposals/IMP-9.yaml/apply-run": () => job({ id: "job-apply", kind: "apply", title: "Apply IMP-9", detail: { proposal: "IMP-9.yaml" } }),
  "POST /api/dreams": () => job({ id: "job-dream", kind: "dream", title: "Background review" }),
  "POST /api/dreams/dream-1.json/import": () => ({ ok: true, proposal: "IMP-1.yaml" }),
  "POST /api/dreams/dream-1.json/dismiss": () => ({ ok: true }),
  "POST /api/runs": () => job({ id: "job-eval", kind: "evaluate", title: "Evaluate smoke" }),
  "POST /api/jobs/job-1/cancel": () => {
    api.state.jobs.find((j) => j.id === "job-1").status = "cancelled";
    return { ok: true };
  }
};
/** A job the stand-in starts and finishes at once. */
function job(o) {
  const j = { status: "completed", started_at: ago(0), finished_at: ago(0), progress: {}, result: {}, ...o };
  api.state.jobs.unshift(j);
  return { ok: true, job: j };
}
globalThis.fetch = async (input, o = {}) => {
  const url = new URL(String(input));
  const method = o.method ?? "GET";
  const token = o.headers?.["x-improve-token"] ?? null;
  api.requests.push({ method, path: url.pathname + url.search, token, mode: o.mode, body: o.body ? JSON.parse(o.body) : undefined });
  if (url.origin !== UI || !api.up) throw new TypeError("Failed to fetch");
  const answer = (status, body) => ({ ok: status < 400, status, json: async () => body });
  if (token !== api.token) return answer(403, { error: "This request does not carry this improve UI's token. Reload the page that sent it." });
  const route = ROUTES[`${method} ${url.pathname}`];
  return route ? answer(200, route()) : answer(404, { error: `no route ${method} ${url.pathname}` });
};

await import(pathToFileURL(path.resolve(import.meta.dirname, "..", "ui", "index.js")).href);

const ui = { url: UI, running: true, deepLinks: true, start: null, token: TOKEN, project: "/fm/home", servesHome: true, connects: true };
const proposal = (o) => ({
  file: "IMP-1.yaml",
  id: "IMP-1",
  title: "Tell workers a missing config file falls back to defaults",
  status: "proposed",
  statusLabel: "Waiting for your call",
  statusShort: "Your call",
  group: "waiting",
  kind: "preference",
  kindLabel: "Preference",
  summary: "Workers ask each time.",
  waiting: true,
  layer: "instructions",
  changes: "Workers ask each time. Add one line to captain.md.",
  why: "Workers stop asking the same question.",
  files: ["data/captain.md"],
  surfaces: ["your preferences"],
  visibility: "captain-private",
  visibilityLabel: "Private to you",
  visibilityShort: "Private",
  deliveryLabel: "Once you approve it, improve edits your home’s own files.",
  evidence: [{ source: "firstmate import", observation: "The same review question came up in 3 tasks." }],
  confidence: "medium",
  createdAt: "2026-10-24T09:00:00Z",
  decision: { taskId: "improve-imp-1", href: "/tasks/improve-imp-1", state: "Waiting for your call", routedAt: null, changedSinceFiling: false },
  routing: null,
  reviewHref: "/plugins/improve/improvements#/proposals?view=all&p=IMP-1.yaml",
  openUrl: "http://127.0.0.1:5173/proposals?p=IMP-1.yaml",
  ...o
});
const harness = (o = {}) => ({
  schema: "wheelhouse-improve.v1",
  review: {
    due: true,
    headline: "A harness review is due: 21 tasks since the last review.",
    reasons: ["21 tasks since the last review"],
    lastReviewedAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
    periodic: "Periodic review comes after 20 tasks or 7 days, whichever is first."
  },
  waiting: 2,
  proposals: [
    proposal(),
    proposal({
      file: "IMP-2.yaml",
      title: "<img src=x onerror=alert(1)>",
      kind: "instructions",
      kindLabel: "Instructions",
      visibility: "shared-tracked",
      visibilityShort: "Shared",
      decision: null,
      routing: "Not filed yet: the next /improve review files it as a decision for you.",
      reviewHref: "/plugins/improve/improvements#/proposals?view=all&p=IMP-2.yaml",
      openUrl: "javascript:alert(1)"
    }),
    proposal({ file: "IMP-3.yaml", title: "A draft", status: "draft", statusShort: "Draft", group: "drafting", waiting: false, decision: null, openUrl: null })
  ],
  evidence: {
    importedAt: null,
    summary: "improve has read 42 tasks.",
    counts: [{ label: "Tasks", value: 42 }],
    mix: [
      { key: "ask_user_findings", label: "Review questions", value: 12 },
      { key: "decisions", label: "Decisions", value: 30 }
    ],
    patterns: [
      {
        sentence: "The automated review asked the same question in 3 tasks: “Should a missing config file be an error?”",
        example: "Should a missing config file be an error?",
        kind: "review",
        count: 3,
        tasks: 3,
        answers: ["use defaults"]
      }
    ]
  },
  inventory: [],
  size: { contractFile: "AGENTS.md", contractTokens: 5200, budgetShare: 0.69, skills: 11, largestSkill: "firstmate-review" },
  problems: [],
  ui,
  ...o
});

/** Create the element the way Wheelhouse does: host, entry and data first, then into the page. */
function mount(tag, data, host = undefined) {
  const el = document.createElement(tag);
  if (host) el.host = host;
  el.entry = { key: `improve/${tag}`, pluginId: "improve" };
  el.data = data;
  document.body.append(el);
  return el;
}
/** What the element shows, one text node after another, without its stylesheets, into nested shadow roots. */
const text = (el) => {
  const out = [];
  const walk = (n) => {
    if (n.nodeType === 3) out.push(n.textContent);
    else if (n.nodeName !== "STYLE") {
      if (n.shadowRoot) walk(n.shadowRoot);
      for (const c of n.childNodes) walk(c);
    }
  };
  walk(el.shadowRoot);
  return out.join(" ").replace(/\s+/g, " ");
};
const links = (root) => [...root.querySelectorAll("a")].map((a) => [a.textContent.trim(), a.getAttribute("href")]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** Wait until `test` holds, failing with `what` after a few seconds. */
async function until(test, what) {
  for (let i = 0; i < 400; i++) {
    if (test()) return;
    await sleep(10);
  }
  assert.fail(`timed out: ${what}`);
}
const button = (root, label) => {
  const all = [...root.querySelectorAll("button")];
  const b = all.find((x) => x.textContent.trim() === label) ?? all.find((x) => x.textContent.trim().includes(label));
  assert.ok(b, `a button "${label}" among ${all.map((x) => `"${x.textContent.trim()}"`).join(", ")}`);
  return b;
};
const link = (root, href) => {
  const a = root.querySelector(`a[href="${href}"]`);
  assert.ok(a, `a link to ${href}`);
  return a;
};
const posts = () => api.requests.filter((r) => r.method === "POST");
const type = (field, value) => {
  field.value = value;
  field.dispatchEvent(new window.Event("input", { bubbles: true }));
};
const go = async (hash) => {
  location.hash = hash;
  window.dispatchEvent(new window.HashChangeEvent("hashchange"));
  await sleep(0);
};

// The Firstmate tab: what Wheelhouse's provider read about the home.
{
  const el = mount("improve-firstmate-view", harness());
  const t = text(el);
  for (const s of ["Review due", "Last review 3 days ago", "Waiting for you", "What improve read", "42 tasks", "1 private", "Repeated patterns", "Harness size", "5,200 tokens", "69% of the startup budget", "Waiting for your call 2", "Being drafted 1"]) {
    assert.ok(t.includes(s), `the tab says ${s}: ${t}`);
  }
  // Plugin text is text, and a link that is not http(s) or same-origin is dropped.
  assert.equal(el.shadowRoot.querySelector("img"), null);
  assert.ok(t.includes("<img src=x onerror=alert(1)>"));
  const hrefs = links(el.shadowRoot).map(([, h]) => h);
  assert.ok(!hrefs.some((h) => h && h.startsWith("javascript:")));
  // A card's title opens it on the Proposals tab; the arrow beside it, in improve's own UI.
  assert.ok(hrefs.includes("/plugins/improve/improvements#/proposals?view=all&p=IMP-1.yaml"));
  assert.ok(hrefs.includes("http://127.0.0.1:5173/proposals?p=IMP-1.yaml"));
  assert.ok(hrefs.includes("/tasks/improve-imp-1"));
  assert.ok(el.shadowRoot.getElementById("IMP-1.yaml"));
  // Details opens on click, and stays open when the provider's value changes.
  const toggle = el.shadowRoot.getElementById("IMP-1.yaml").querySelector("button.details-toggle");
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  toggle.click();
  const card = () => el.shadowRoot.getElementById("IMP-1.yaml");
  assert.ok(text(el).includes("Workers stop asking the same question. (confidence medium)"));
  assert.ok(card().querySelector("code").textContent === "data/captain.md");
  el.data = harness({ waiting: 3 });
  assert.equal(card().querySelector("button.details-toggle").getAttribute("aria-expanded"), "true");
  assert.ok(el.shadowRoot.querySelector(".tiles").textContent.includes("3"));
  el.remove();
}

// Nothing proposed yet, and problems said plainly.
{
  const el = mount("improve-firstmate-view", harness({ proposals: [], waiting: 0, problems: ["improve could not be read: boom."] }));
  assert.ok(text(el).includes("improve has not proposed anything yet."));
  assert.ok(text(el).includes("improve could not be read: boom."));
  el.remove();
}

// The Harness card on the home page's rail.
{
  const el = mount("improve-health", harness());
  const t = text(el);
  assert.ok(t.includes("Review due"));
  assert.ok(t.includes("proposals wait"));
  assert.ok(t.includes("×3"));
  assert.deepEqual(
    links(el.shadowRoot).map(([, h]) => h),
    ["/plugins/improve/improvements#/proposals", "/plugins/improve/improvements"]
  );
  assert.ok(el.shadowRoot.querySelector('[role="img"]').getAttribute("aria-label").includes("30 decisions, 12 review questions"));
  el.remove();
}

// The header pill: only while a review is due or proposals wait.
{
  const el = mount("improve-indicator", harness());
  assert.deepEqual(links(el.shadowRoot), [["Review due · 2 to decide", "/plugins/improve/improvements"]]);
  el.data = harness({ waiting: 0, review: { ...harness().review, due: false } });
  assert.equal(el.shadowRoot.querySelector("a"), null);
  el.remove();
}

// The Improvement section on a proposal's task: the card open, and the way to decide it.
{
  const el = mount("improve-proposal", {
    schema: "wheelhouse-improve-proposal.v1",
    proposal: proposal({ openUrl: null }),
    improvementsHref: "/plugins/improve/improvements#/proposals?view=all&p=IMP-1.yaml",
    ui: { ...ui, running: false }
  });
  const t = text(el);
  assert.ok(t.includes("Workers stop asking the same question."), "the card is open");
  // On its own task the decision is a chip, not a link to itself.
  assert.deepEqual(links(el.shadowRoot), [
    ["Tell workers a missing config file falls back to defaults", "/plugins/improve/improvements#/proposals?view=all&p=IMP-1.yaml"],
    ["Decide it on the Improvements page", "/plugins/improve/improvements#/proposals?view=all&p=IMP-1.yaml"]
  ]);
  el.remove();
}

// The Improvements page: improve's review UI, down, then launched from Wheelhouse.
const title = document.title;
const launches = [];
const host = (view = { state: "stopped", url: UI, reason: null, launchable: true, hint: "cd /improve/ui && npx vite dev" }) => ({
  pluginId: "improve",
  service: async () => view,
  launch: async (service, o) => {
    launches.push({ service, ...o });
    api.up = true;
    return { ...view, state: "running" };
  }
});
api.state = freshState();
api.up = false;
const page = mount("improve-improvements", harness({ ui: { ...ui, running: false, start: "cd /improve/ui && npx vite dev", project: null, servesHome: null } }), host());
const root = page.shadowRoot;
{
  await until(() => text(page).includes("Launch improve’s review UI"), "the Launch button");
  // With improve's UI down it opens on Firstmate, which needs none.
  const t = text(page);
  assert.ok(t.includes("improve’s review UI is not running, so only what Wheelhouse read about this home shows."));
  assert.ok(t.includes("Waiting for your call 2"), "the Firstmate tab draws inside");
  // improve's sidebar, as tabs; Proposals counts what waits even before the UI answers.
  assert.deepEqual(
    links(root.querySelector("nav.tabs")),
    [
      ["Overview", "#/"],
      ["Proposals 2", "#/proposals"],
      ["Background findings", "#/findings"],
      ["Evaluations", "#/evals"],
      ["Objectives", "#/objectives"],
      ["Runs", "#/runs"],
      ["Firstmate", "#/firstmate"]
    ]
  );
  assert.equal(root.querySelector('nav.tabs a[aria-current="page"]').textContent.trim(), "Firstmate");

  // Another tab says why it is empty and offers Launch, which opens that view in the new tab.
  link(root, "#/proposals").click();
  await until(() => text(page).includes("improve’s review UI is not running Proposals"), "the full Launch panel");
  assert.ok(posts().length === 0);
  button(root, "Launch improve’s review UI").click();
  await until(() => text(page).includes("Changes to the harness, waiting for a decision."), "the Proposals page once it answers");
  assert.deepEqual(launches, [{ service: "ui", open: `${UI}/proposals` }]);
  // Every request goes to improve's UI with its token, as CORS.
  assert.ok(api.requests.filter((r) => r.path.startsWith("/api/")).every((r) => r.token === TOKEN && r.mode === "cors"));
  assert.ok(text(page).includes("improve’s review UI for /fm/home"));
  assert.ok(text(page).includes("This repository's eval rig is 1.0.0; the plugin has 1.1.0."));
  assert.equal(document.title, title, "improve's pages leave Wheelhouse's title alone");
}

// Proposals: the first waiting one opens; reject needs a reason; approve records it.
{
  await until(() => text(page).includes("Add one line to captain.md."), "the first proposal, open");
  assert.equal(location.hash, "#/proposals?p=IMP-1.yaml");
  assert.ok(text(page).includes("The same review question came up in 3 tasks."));
  button(root, "Reject").click();
  await until(() => text(page).includes("Say why."), "the reason is asked for");
  assert.equal(posts().length, 0);
  type(root.querySelector("textarea#reason"), "Defaults are documented already.");
  button(root, "Approve").click();
  await until(() => posts().length === 1, "the approval");
  assert.deepEqual(
    { path: posts()[0].path, token: posts()[0].token, rationale: posts()[0].body.rationale },
    { path: "/api/proposals/IMP-1.yaml/approve", token: TOKEN, rationale: "Defaults are documented already." }
  );
  await until(() => text(page).includes("Approved. Apply it when you are ready."), "the approval notice");
}

// An approved proposal: Apply lists exactly what the run may change, then starts it with what was confirmed.
{
  await go("#/proposals?view=approved&p=IMP-9.yaml");
  await until(() => text(page).includes("Apply…"), "the Apply button");
  button(root, "Apply…").click();
  await until(() => text(page).includes("Apply this proposal?"), "the confirm");
  assert.ok(text(page).includes("node scripts/proposal-check-cli.mjs"));
  button(root, "Confirm and apply").click();
  await until(() => posts().some((r) => r.path.endsWith("/apply-run")), "the apply run");
  const run = posts().find((r) => r.path.endsWith("/apply-run"));
  assert.deepEqual(run.body, { digest: "digest-9", files: ["data/learnings.md"], commands: ["node scripts/proposal-check-cli.mjs"], branch: null });
  assert.equal(run.token, TOKEN);
}

// Background findings: run a review, import a finding as a proposal, dismiss a report.
{
  await go("#/findings");
  await until(() => text(page).includes("Workers re-read AGENTS.md"), "the finding");
  button(root, "Run a background review").click();
  await until(() => posts().some((r) => r.path === "/api/dreams"), "a background review");
  button(root, "Dismiss report").click();
  await until(() => posts().some((r) => r.path === "/api/dreams/dream-1.json/dismiss"), "the dismissal");
  button(root, "Review as a proposal").click();
  await until(() => location.hash === "#/proposals?view=waiting&p=IMP-1.yaml", "the imported proposal, open");
  assert.deepEqual(posts().find((r) => r.path === "/api/dreams/dream-1.json/import").body, { index: 0 });
}

// Runs: the list, a run's log, and Cancel.
{
  await go("#/runs");
  await until(() => text(page).includes("Evaluate smoke"), "the run list");
  assert.ok(link(root, "#/runs?job=job-1"));
  link(root, "#/runs?job=job-1").click();
  await until(() => text(page).includes("step one"), "the run's log");
  button(root, "Cancel").click();
  await until(() => posts().some((r) => r.path === "/api/jobs/job-1/cancel"), "the cancel");
}

// Evaluations: run a suite, once the running one is cancelled.
{
  await go("#/evals");
  await until(() => text(page).includes("Run a suite"), "the run form");
  button(root, "Run evaluation").click();
  await until(() => posts().some((r) => r.path === "/api/runs"), "the evaluation");
  assert.equal(posts().find((r) => r.path === "/api/runs").body.suite, "smoke.yaml");
}

// Objectives, with the skills applied from improve.
{
  await go("#/objectives");
  await until(() => text(page).includes("Workers run the checks before they say done."), "the objective");
  assert.ok(text(page).includes("fm-review"));
}

// Overview, and its links to the other views stay on this page.
{
  await go("#/");
  await until(() => text(page).includes("Harness health"), "the overview");
  assert.ok(text(page).includes("21 sessions since the last review"));
  assert.ok(link(root, "#/proposals"));
  assert.ok(link(root, "#/objectives#verify-before-done"));
  // The way back from a link the earlier version made: #IMP-1.yaml opens the proposal.
  await go("#IMP-1.yaml");
  assert.equal(root.querySelector('nav.tabs a[aria-current="page"]').textContent.trim().startsWith("Proposals"), true);
}

// improve's UI restarted under another token: the page says so instead of failing silently.
{
  api.token = "b".repeat(48);
  await go("#/runs");
  await until(() => text(page).includes("refused Wheelhouse’s token"), "the refused token");
  api.token = TOKEN;
  button(root, "Try again").click();
  await until(() => text(page).includes("Evaluations, skill drafts and background reviews"), "the Runs page again");
  page.remove();
}

// A UI that serves another repository is not driven; one too old to say its token neither.
{
  api.requests = [];
  const away = mount("improve-improvements", harness({ ui: { ...ui, servesHome: false, project: "/elsewhere" } }), host());
  await go("#/proposals");
  await until(() => /serves \/elsewhere ?, not this Firstmate home/.test(text(away)), "the other repository");
  away.remove();
  const old = mount("improve-improvements", harness({ ui: { ...ui, token: null, connects: false } }), host());
  await until(() => text(old).includes("from a copy of improve that Wheelhouse cannot drive"), "the old UI");
  old.remove();
  assert.equal(api.requests.length, 0, "neither is sent anything");
}

await window.happyDOM.close();
console.log("wheelhouse ui tests passed");
