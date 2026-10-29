/**
 * Where the Improvements page is, for improve's own pages. They read
 * SvelteKit's `page.url` and call its `goto`; inside Wheelhouse they share one
 * page, so their address is the part of Wheelhouse's after `#`:
 * `/plugins/improve/improvements#/proposals?p=IMP-1.yaml`. The build points
 * `$app/state` and `$app/navigation` here, and turns their `href="/…"` links
 * into `href="#/…"` (see build.mjs).
 *
 * Moving is a link click, `<a href="#/…">`, which Wheelhouse's own router
 * records in its history as it does for any link to a place on the page, so
 * Back and Forward walk the views; `goto` clicks such a link.
 */

const BASE = "http://improve.invalid";

/** The views, in the order the tabs show them. */
export const VIEWS = ["/", "/proposals", "/findings", "/evals", "/objectives", "/runs", "/firstmate"];

/**
 * The view an address after `#` names. `#IMP-1.yaml`, how earlier versions
 * linked to a proposal's card, opens that proposal.
 * @param {string} hash
 * @returns {URL | null} null when it names none
 */
export function fromHash(hash) {
  let h = hash.replace(/^#/, "");
  if (!h) return null;
  if (!h.startsWith("/")) {
    try {
      h = decodeURIComponent(h);
    } catch {
      // not encoded: as it is
    }
    return new URL(`/proposals?view=all&p=${encodeURIComponent(h)}`, BASE);
  }
  try {
    const url = new URL(h, BASE);
    return url.origin === BASE && VIEWS.includes(url.pathname) ? url : null;
  } catch {
    return null;
  }
}

/** @param {URL} url */
export const toHash = (url) => `#${url.pathname}${url.search}${url.hash}`;

const start = typeof location === "undefined" ? null : fromHash(location.hash);
const here = $state({ url: start ?? new URL("/", BASE), chosen: start !== null });

/** What `$app/state` gives a page. */
export const page = {
  get url() {
    return here.url;
  }
};

/** Whether the address names a view, rather than the page opening on its default. */
export const chosen = () => here.chosen;

/** Read the address again, after Wheelhouse's router or the browser moved it. */
export function sync() {
  const url = fromHash(location.hash);
  here.chosen = url !== null;
  const next = url ?? new URL("/", BASE);
  if (next.href !== here.url.href) here.url = next;
}

/** Where a click handler puts its link, so the click happens inside the page. @type {Node | null} */
let anchorHome = null;

/** @param {Node | null} node */
export function setAnchorHome(node) {
  anchorHome = node;
}

/**
 * Move to another view, as SvelteKit's `goto` does.
 * @param {string | URL} to an address of improve's own UI: `/evals?run=…`
 * @param {{ replaceState?: boolean }} [o]
 */
export function goto(to, o = {}) {
  const url = new URL(String(to), here.url);
  const hash = toHash(url);
  if (o.replaceState) {
    history.replaceState(history.state, "", hash);
  } else if (location.hash !== hash) {
    const a = document.createElement("a");
    a.href = hash;
    a.hidden = true;
    (anchorHome ?? document.body).appendChild(a);
    a.click();
    a.remove();
    // Nothing followed the link (no router, or a test's DOM): move the address itself.
    if (location.hash !== hash) location.hash = hash;
  }
  sync();
  return Promise.resolve();
}

/** SvelteKit's `afterNavigate`; only improve's own frame uses it, which this page replaces. */
export function afterNavigate() {}
