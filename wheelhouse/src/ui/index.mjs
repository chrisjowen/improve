import { IMPROVEMENTS } from "../urls.mjs";
import { chipText, GROUPS, since } from "../words.mjs";
import { h, icon } from "./dom.mjs";
import { ArrowRight, GitPullRequest, Hand, Info, Lock, MessageSquareText, Wrench } from "./icons.mjs";
import { evidenceBar, proposalCard, reviewBadge } from "./parts.mjs";
import { STYLE } from "./style.mjs";
import { APP_STYLE } from "./app/theme.mjs";
import { mountApp } from "./app/mount.svelte.js";

/**
 * improve's panels in Wheelhouse, as custom elements. Wheelhouse imports this
 * bundle, creates the element a contribution names and sets the provider's
 * value on it as `data` (and the slot entry as `entry`) each time it changes.
 * Each element draws in its own shadow root with Wheelhouse's CSS variables,
 * so it follows the page's light and dark themes.
 *
 *   <improve-improvements>  the Improvements page (nav.page): improve's review UI, in tabs
 *   <improve-health>        the Harness tab on the home page's rail (home.card)
 *   <improve-indicator>     the header pill (header.indicator)
 *   <improve-proposal>      the Improvement section on a proposal's task (task.section)
 *
 * and, inside the Improvements page, <improve-firstmate-view>, its Firstmate tab.
 *
 * @typedef {import("../types.mjs").HarnessView} HarnessView
 * @typedef {import("../types.mjs").ImproveUi} ImproveUi
 * @typedef {import("../types.mjs").ProposalSection} ProposalSection
 */

class ImproveElement extends HTMLElement {
  /** @type {unknown} */
  #data = null;
  /** @type {unknown} */
  #entry = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  set data(value) {
    this.#data = value;
    this.render();
  }

  get data() {
    return this.#data;
  }

  set entry(value) {
    this.#entry = value;
  }

  get entry() {
    return this.#entry;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (!this.#data || !this.shadowRoot) return;
    const style = document.createElement("style");
    style.textContent = STYLE + this.extraStyle();
    this.shadowRoot.replaceChildren(style, ...[this.view(this.#data)].flat());
  }

  extraStyle() {
    return "";
  }

  /** @param {unknown} _data @returns {Node | Node[]} */
  view(_data) {
    return [];
  }
}

/**
 * The Improvements page's Firstmate tab, what Wheelhouse's provider read
 * about this home, visual first: three tiles (the review, what waits for you,
 * what improve read), then the proposals as cards grouped by where they
 * stand, beside the patterns that repeat and the harness's size. Detail opens
 * on a card's Details; its title opens it on the Proposals tab.
 */
class ImproveFirstmateView extends ImproveElement {
  /** Cards whose Details are open, by file. */
  open = new Set();
  /** Repeated patterns opened, by their question. */
  patternsOpen = new Set();

  /** @param {HarnessView} v */
  view(v) {
    const now = Date.now();
    const groups = GROUPS.map((g) => ({ ...g, items: v.proposals.filter((p) => p.group === g.id) })).filter((g) => g.items.length);
    const waiting = v.proposals.filter((p) => p.waiting);
    const privateWaiting = waiting.filter((p) => p.visibility === "captain-private").length;
    const sharedWaiting = waiting.filter((p) => p.visibility === "shared-tracked").length;
    const tasksRead = v.evidence.counts.find((c) => c.label === "Tasks")?.value ?? null;

    const tiles = h(
      "div",
      { class: "tiles" },
      h(
        "section",
        { class: "card tile", "aria-label": "Review" },
        h("h2", { class: "section-label small" }, "Review"),
        h("div", { class: "mt3" }, reviewBadge(v.review)),
        h("p", { class: "mt2 clamp2 xs relaxed muted" }, v.review.due ? (v.review.reasons[0] ?? v.review.headline) : v.review.headline),
        h("p", { class: "mt1 xs muted" }, v.review.lastReviewedAt ? `Last review ${since(v.review.lastReviewedAt, now)}` : "No review yet")
      ),
      h(
        "section",
        { class: "card tile", "aria-label": "Waiting for you" },
        h("h2", { class: "section-label small" }, "Waiting for you"),
        h(
          "p",
          { class: "mt2 row", style: "align-items:baseline;gap:0.5rem" },
          h("span", { class: "big" }, v.waiting),
          h("span", { class: "sm muted" }, v.waiting === 1 ? "proposal" : "proposals")
        ),
        v.waiting
          ? h(
              "p",
              { class: "mt3 row wrap xs muted", style: "gap:0.75rem" },
              h("span", { class: "row", style: "gap:0.25rem" }, icon(Lock, "icon i35"), h("span", { class: "tabular medium fg" }, privateWaiting), " private"),
              h("span", { class: "row", style: "gap:0.25rem" }, icon(GitPullRequest, "icon i35 sea"), h("span", { class: "tabular medium fg" }, sharedWaiting), " shared")
            )
          : null
      ),
      h(
        "section",
        { class: "card tile", "aria-label": "What improve read" },
        h("h2", { class: "section-label small" }, "What improve read"),
        tasksRead !== null
          ? [
              h(
                "p",
                { class: "mt2 row", style: "align-items:baseline;gap:0.5rem" },
                h("span", { class: "big" }, tasksRead),
                h("span", { class: "sm muted" }, tasksRead === 1 ? "task" : "tasks")
              ),
              h("div", { class: "mt3" }, evidenceBar(v.evidence.mix, true))
            ]
          : h("p", { class: "mt2 sm muted" }, "improve’s import could not be read.")
      )
    );

    const proposals = groups.length
      ? groups.map((g) =>
          h(
            "section",
            { "aria-label": g.label },
            h("h2", { class: "section-label" }, g.label, h("span", { class: "count" }, g.items.length)),
            h(
              "div",
              { class: "cards" },
              g.items.map((p) =>
                proposalCard(p, {
                  open: this.open.has(p.file),
                  onToggle: (o) => {
                    if (o) this.open.add(p.file);
                    else this.open.delete(p.file);
                    this.render();
                  }
                })
              )
            )
          )
        )
      : h(
          "p",
          { class: "empty sm muted" },
          "improve has not proposed anything yet. Run /improve propose in Firstmate’s session to draft a change."
        );

    return [
      h("p", { class: "lede sm muted" }, "Changes improve proposes to Firstmate’s harness from what it has seen go wrong. Nothing changes until you approve."),
      tiles,
      v.problems.length
        ? h("ul", { class: "problems" }, v.problems.map((p) => h("li", null, icon(Info, "icon i4"), p)))
        : [],
      h("div", { class: "layout" }, h("div", { class: "column" }, proposals), h("aside", { class: "column" }, this.patterns(v), this.size(v)))
    ].flat();
  }

  /** @param {HarnessView} v */
  patterns(v) {
    if (!v.evidence.patterns.length) return null;
    return h(
      "section",
      null,
      h("h2", { class: "section-label" }, "Repeated patterns"),
      h(
        "ul",
        { class: "patterns" },
        v.evidence.patterns.map((p) => {
          const d = h(
            "details",
            { class: "card", open: this.patternsOpen.has(p.example) },
            h(
              "summary",
              { title: p.sentence },
              icon(p.kind === "review" ? MessageSquareText : Hand, "icon i35 muted"),
              h("span", { class: "grow truncate" }, chipText(p.example, 80)),
              h("span", { class: "times", "aria-label": `${p.count} times` }, `×${p.count}`)
            ),
            h(
              "div",
              { class: "more xs relaxed" },
              h("p", null, p.sentence),
              p.answers.length ? h("p", { class: "mt1 muted" }, `Answered: ${p.answers.join("; ")}`) : null
            )
          );
          d.addEventListener("toggle", () => {
            if (/** @type {HTMLDetailsElement} */ (d).open) this.patternsOpen.add(p.example);
            else this.patternsOpen.delete(p.example);
          });
          return h("li", null, d);
        })
      )
    );
  }

  /** @param {HarnessView} v */
  size(v) {
    const s = v.size;
    if (!s) return null;
    /** @type {Node[]} */
    const budget = [];
    if (s.budgetShare !== null) {
      const pct = Math.round(s.budgetShare * 100);
      const fill = h("span", { class: s.budgetShare > 0.8 ? "over" : null });
      fill.style.width = `${Math.min(100, s.budgetShare * 100)}%`;
      budget.push(
        h("div", { class: "meter", role: "img", "aria-label": `${pct}% of the startup budget` }, fill),
        h("p", { class: "mt1 muted" }, `${pct}% of the startup budget`)
      );
    }
    return h(
      "section",
      null,
      h("h2", { class: "section-label" }, "Harness size"),
      h(
        "div",
        { class: "card size" },
        h(
          "p",
          { class: "head" },
          h("span", { class: "medium" }, s.contractFile),
          h("span", { class: "tabular muted" }, `${s.contractTokens.toLocaleString("en")} tokens`)
        ),
        budget,
        s.skills !== null
          ? h(
              "p",
              { class: "mt2 muted" },
              h("span", { class: "tabular medium fg" }, s.skills),
              ` ${s.skills === 1 ? "skill" : "skills"}${s.largestSkill ? `, the largest ${s.largestSkill}` : ""}`
            )
          : null
      )
    );
  }
}

/**
 * The Improvements page: improve's review UI, its own pages in tabs, with a
 * Firstmate tab for what Wheelhouse read about this home. The pages are
 * Svelte, mounted in this element's shadow root (src/ui/app/), and talk to
 * improve's review UI's server, which Wheelhouse launches as the plugin's
 * `ui` service; `host` is how they ask Wheelhouse to.
 */
class ImproveImprovements extends HTMLElement {
  /** @type {ReturnType<typeof mountApp> | null} */
  #app = null;
  /** @type {unknown} */
  #data = null;
  /** @type {unknown} */
  #host = null;
  /** @type {unknown} */
  #entry = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  set data(value) {
    this.#data = value;
    this.#app?.setData(value);
  }

  get data() {
    return this.#data;
  }

  set host(value) {
    this.#host = value;
    this.#app?.setHost(value);
  }

  get host() {
    return this.#host;
  }

  set entry(value) {
    this.#entry = value;
  }

  get entry() {
    return this.#entry;
  }

  connectedCallback() {
    const root = /** @type {ShadowRoot} */ (this.shadowRoot);
    if (this.#app) return;
    const style = document.createElement("style");
    style.textContent = APP_STYLE;
    root.replaceChildren(style);
    this.#app = mountApp(root, { data: this.#data, host: this.#host });
  }

  disconnectedCallback() {
    this.#app?.destroy();
    this.#app = null;
  }
}

/**
 * Harness health, on the home page's rail, at a glance: the review as a
 * badge, the number of proposals waiting (private and shared), what improve
 * read as one bar, and the patterns that repeat most as chips. Everything
 * else is on the Improvements page.
 */
class ImproveHealth extends ImproveElement {
  /** @param {HarnessView} v */
  view(v) {
    const now = Date.now();
    const waiting = v.proposals.filter((p) => p.waiting);
    const priv = waiting.filter((p) => p.visibility === "captain-private").length;
    const shared = waiting.filter((p) => p.visibility === "shared-tracked").length;
    return h(
      "div",
      { class: "card health" },
      h(
        "div",
        { class: "head" },
        reviewBadge(v.review),
        h("span", { class: "xs muted" }, v.review.lastReviewedAt ? `Last ${since(v.review.lastReviewedAt, now)}` : "No review yet")
      ),
      h(
        "a",
        { class: "waits", href: `${IMPROVEMENTS}#/proposals` },
        h("span", { class: "big" }, v.waiting),
        h(
          "span",
          { class: "sm", style: "padding-bottom:0.125rem;line-height:1.25" },
          v.waiting === 1 ? "proposal waits" : "proposals wait",
          h("br"),
          h("span", { class: "muted" }, "for your call")
        ),
        v.waiting
          ? h(
              "span",
              { class: "split xs muted" },
              h("span", { class: "row", style: "gap:0.25rem" }, icon(Lock, "icon i3"), `${priv} private`),
              h("span", { class: "row", style: "gap:0.25rem" }, icon(GitPullRequest, "icon i3 sea"), `${shared} shared`)
            )
          : null
      ),
      v.evidence.mix.length ? h("div", { class: "mt3" }, evidenceBar(v.evidence.mix, true)) : null,
      v.evidence.patterns.length
        ? h(
            "ul",
            { class: "chips" },
            v.evidence.patterns.slice(0, 3).map((p) =>
              h(
                "li",
                { title: p.sentence },
                icon(p.kind === "review" ? MessageSquareText : Hand, "icon i3 muted"),
                h("span", { class: "grow truncate" }, chipText(p.example, 64)),
                h("span", { class: "tabular strong sea shrink0", "aria-label": `${p.count} times` }, `×${p.count}`)
              )
            )
          )
        : null,
      v.problems.length
        ? h("p", { class: "mt2 row xs warn", style: "align-items:flex-start;gap:0.375rem" }, icon(Info, "icon i35"), h("span", { class: "clamp2" }, v.problems[0]))
        : null,
      h("a", { class: "more-link", href: IMPROVEMENTS }, "Open Improvements", icon(ArrowRight, "icon i35"))
    );
  }
}

/** A small header pill, only while a harness review is due or proposals wait. */
class ImproveIndicator extends ImproveElement {
  extraStyle() {
    return ":host { display: contents; }";
  }

  /** @param {HarnessView} v */
  view(v) {
    const label = [v.review.due ? "Review due" : null, v.waiting ? `${v.waiting} to decide` : null].filter(Boolean).join(" · ");
    if (!label) return [];
    const title = [v.review.due ? v.review.headline : null, v.waiting ? `${v.waiting} harness improvements wait for your call.` : null]
      .filter(Boolean)
      .join(" ");
    return h("a", { class: "pill", href: IMPROVEMENTS, title, "aria-label": `Harness: ${label}` }, icon(Wrench, "icon i35"), label);
  }
}

/**
 * On the task improve filed a proposal as: the proposal's card, opened, and a
 * link to the proposal on the Improvements page, where it is decided as in
 * improve's own UI; answering through Firstmate works as for any other call.
 */
class ImproveProposal extends ImproveElement {
  open = true;

  /** @param {ProposalSection} v */
  view(v) {
    return h(
      "div",
      { class: "section" },
      proposalCard(v.proposal, {
        open: this.open,
        showDecisionLink: false,
        onToggle: (o) => {
          this.open = o;
          this.render();
        }
      }),
      h("a", { class: "more-link", href: v.improvementsHref }, "Decide it on the Improvements page", icon(ArrowRight, "icon i35"))
    );
  }
}

for (const [tag, cls] of /** @type {[string, CustomElementConstructor][]} */ ([
  ["improve-improvements", ImproveImprovements],
  ["improve-health", ImproveHealth],
  ["improve-indicator", ImproveIndicator],
  ["improve-proposal", ImproveProposal],
  ["improve-firstmate-view", ImproveFirstmateView]
])) {
  if (!customElements.get(tag)) customElements.define(tag, cls);
}
