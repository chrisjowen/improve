import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Window } from "happy-dom";

// improve's custom elements, from the committed UI bundle, in a DOM: what each
// draws from the provider's value, that plugin text stays text and links stay
// http(s) or same-origin, and that a new value redraws the same element
// without closing what the captain opened.

const window = new Window({ url: "http://127.0.0.1:4000/plugins/improve/improvements" });
for (const k of ["document", "HTMLElement", "customElements", "Node", "location", "addEventListener", "removeEventListener"]) {
  Object.defineProperty(globalThis, k, { value: window[k], configurable: true, writable: true });
}
Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });

let serviceView = null;
const fetched = [];
globalThis.fetch = async (url) => {
  fetched.push(String(url));
  return { ok: !!serviceView, json: async () => serviceView };
};

await import(pathToFileURL(path.resolve(import.meta.dirname, "..", "ui", "index.js")).href);

const ui = { url: "http://127.0.0.1:5173", running: true, deepLinks: true, start: null };
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

/** Create the element the way Wheelhouse does: data and entry first, then into the page. */
function mount(tag, data) {
  const el = document.createElement(tag);
  el.entry = { key: `improve/${tag}`, pluginId: "improve" };
  el.data = data;
  document.body.append(el);
  return el;
}
/** What the element shows, one text node after another, without its stylesheet. */
const text = (el) => {
  const out = [];
  const walk = (n) => {
    if (n.nodeType === 3) out.push(n.textContent);
    else if (n.nodeName !== "STYLE") for (const c of n.childNodes) walk(c);
  };
  walk(el.shadowRoot);
  return out.join(" ").replace(/\s+/g, " ");
};
const links = (el) => [...el.shadowRoot.querySelectorAll("a")].map((a) => [a.textContent.trim(), a.getAttribute("href")]);
const settle = () => new Promise((r) => setTimeout(r, 0));

// The Improvements page.
{
  serviceView = { state: "running", url: "http://127.0.0.1:5173", launchable: true, hint: null, title: "improve’s review UI" };
  const el = mount("improve-improvements", harness());
  await settle();
  const t = text(el);
  for (const s of ["Review due", "Last review 3 days ago", "Waiting for you", "What improve read", "42 tasks", "1 private", "Repeated patterns", "Harness size", "5,200 tokens", "69% of the startup budget", "Waiting for your call 2", "Being drafted 1", "Open improve’s review UI"]) {
    assert.ok(t.includes(s), `the page says ${s}: ${t}`);
  }
  assert.ok(fetched.includes("/api/services?plugin=improve&service=ui"));
  // Plugin text is text, and a link that is not http(s) or same-origin is dropped.
  assert.equal(el.shadowRoot.querySelector("img"), null);
  assert.ok(t.includes("<img src=x onerror=alert(1)>"));
  const hrefs = links(el).map(([, h]) => h);
  assert.ok(!hrefs.some((h) => h && h.startsWith("javascript:")));
  assert.ok(hrefs.includes("http://127.0.0.1:5173/proposals?p=IMP-1.yaml"));
  assert.ok(hrefs.includes("/tasks/improve-imp-1"));
  // A card's id is its file, so a link to /plugins/improve/improvements#IMP-1.yaml can find it.
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
  const el = mount("improve-improvements", harness({ proposals: [], waiting: 0, problems: ["improve could not be read: boom."] }));
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
    links(el).map(([, h]) => h),
    ["/plugins/improve/improvements", "/plugins/improve/improvements"]
  );
  assert.ok(el.shadowRoot.querySelector('[role="img"]').getAttribute("aria-label").includes("30 decisions, 12 review questions"));
  el.remove();
}

// The header pill: only while a review is due or proposals wait.
{
  const el = mount("improve-indicator", harness());
  assert.deepEqual(links(el), [["Review due · 2 to decide", "/plugins/improve/improvements"]]);
  el.data = harness({ waiting: 0, review: { ...harness().review, due: false } });
  assert.equal(el.shadowRoot.querySelector("a"), null);
  el.remove();
}

// The Improvement section on a proposal's task: the card open, how to start improve's UI, the way back.
{
  serviceView = {
    state: "stopped",
    url: "http://127.0.0.1:5173",
    reason: null,
    launchable: true,
    hint: "cd /improve/ui && npm install && IMPROVE_PROJECT_DIR=/home npx vite dev --host 127.0.0.1 --port 5173",
    title: "improve’s review UI"
  };
  const down = { ...ui, running: false, start: serviceView.hint };
  const el = mount("improve-proposal", {
    schema: "wheelhouse-improve-proposal.v1",
    proposal: proposal({ openUrl: null }),
    improvementsHref: "/plugins/improve/improvements#IMP-1.yaml",
    ui: down
  });
  await settle();
  const t = text(el);
  assert.ok(t.includes("Workers stop asking the same question."), "the card is open");
  assert.ok(t.includes("improve’s review UI is not running."));
  assert.equal(el.shadowRoot.querySelector(".hint code").textContent, serviceView.hint);
  // On its own task the decision is a chip, not a link to itself.
  assert.deepEqual(links(el), [
    ["Open improve’s review UI once it runs", "http://127.0.0.1:5173/proposals?p=IMP-1.yaml"],
    ["Every improvement", "/plugins/improve/improvements#IMP-1.yaml"]
  ]);
  el.remove();
}

await window.happyDOM.close();
console.log("wheelhouse ui tests passed");
